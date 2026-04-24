import base64
import io
import json
import os
import threading
from typing import Any, Optional

import numpy as np
from flask import Flask, jsonify, request

try:
    from flask_cors import CORS
except Exception:  # pragma: no cover
    CORS = None

# NOTE: `fruit_quality_model.h5` is a legacy Keras H5 model that needs the
# TF-Keras compatible loader. We load it via `tf_keras` for compatibility.
import tf_keras

from PIL import Image
from PIL import ImageOps


MODEL_PATH = os.environ.get("MODEL_PATH", "fruit_quality_model.h5")
LABELS_PATH = os.environ.get("LABELS_PATH", "labels.json")
LABELS_ENV = os.environ.get("FRUIT_QUALITY_LABELS", "")
INPUT_SCALE = os.environ.get("INPUT_SCALE", "raw255").strip().lower()
CROP_MODE = os.environ.get("CROP_MODE", "center_square").strip().lower()
TTA = os.environ.get("TTA", "1").strip().lower() in {"1", "true", "yes", "on"}
MIN_CONFIDENCE = float(os.environ.get("MIN_CONFIDENCE", "0.95"))
MIN_MARGIN = float(os.environ.get("MIN_MARGIN", "0.10"))
MIN_FRUIT_CONFIDENCE = float(os.environ.get("MIN_FRUIT_CONFIDENCE", "0.70"))
MIN_FRUIT_MARGIN = float(os.environ.get("MIN_FRUIT_MARGIN", "0.15"))
MIN_QUALITY_MARGIN = float(os.environ.get("MIN_QUALITY_MARGIN", "0.10"))
VIEW_ENSEMBLE = os.environ.get("VIEW_ENSEMBLE", "1").strip().lower() in {"1", "true", "yes", "on"}
UNRECOGNIZED_MESSAGE = os.environ.get("UNRECOGNIZED_MESSAGE", "Sorry, this is not acceptable").strip()


_model_lock = threading.Lock()
_model: Optional[Any] = None
_labels: Optional[list[str]] = None


def _split_label(label: Optional[str]) -> dict[str, Optional[str]]:
    if not label:
        return {"fruit": None, "quality": None}
    parts = [p for p in label.split("_") if p]
    if len(parts) >= 2 and parts[-1] in {"Good", "Bad"}:
        return {"fruit": " ".join(parts[:-1]), "quality": parts[-1]}
    return {"fruit": label, "quality": None}


def _find_class_indices(labels: Optional[list[str]], prefix: str) -> list[int]:
    if not labels:
        return []
    out: list[int] = []
    for i, l in enumerate(labels):
        if isinstance(l, str) and l.lower().startswith(prefix.lower() + "_"):
            out.append(i)
    return out


def _infer_fruit_quality_from_probs(
    probs: np.ndarray, labels: Optional[list[str]]
) -> dict[str, Any]:
    """
    Prefer a stable "fruit vs not" confidence by summing class probabilities:
      fruit_confidence = P(Apple_*) or P(Banana_*)
    Then choose Good/Bad within that fruit using the two relevant logits.
    This works better than using only argmax when real camera images have background noise.
    """
    apple_idx = _find_class_indices(labels, "Apple")
    banana_idx = _find_class_indices(labels, "Banana")
    if probs.size == 0 or (not apple_idx and not banana_idx):
        return {
            "fruit": None,
            "quality": None,
            "fruit_confidence": 0.0,
            "fruit_margin": 0.0,
            "apple_score": 0.0,
            "banana_score": 0.0,
            "quality_margin": 0.0,
            "quality_confidence": 0.0,
            "pred_label": None,
        }

    apple_score = float(np.sum(probs[apple_idx])) if apple_idx else 0.0
    banana_score = float(np.sum(probs[banana_idx])) if banana_idx else 0.0
    fruit = "Apple" if apple_score >= banana_score else "Banana"
    fruit_confidence = max(apple_score, banana_score)
    fruit_margin = abs(apple_score - banana_score)
    idxs = apple_idx if fruit == "Apple" else banana_idx

    # Identify Good/Bad indices if possible
    good_i = next((i for i in idxs if labels and labels[i].endswith("_Good")), None)
    bad_i = next((i for i in idxs if labels and labels[i].endswith("_Bad")), None)
    if good_i is None or bad_i is None:
        # fallback: within-fruit argmax
        within = idxs[int(np.argmax(probs[idxs]))]
        pred_label = labels[within] if labels else None
        split = _split_label(pred_label)
        within_p = float(probs[int(within)]) if probs.size else 0.0
        return {
            "fruit": split["fruit"],
            "quality": split["quality"],
            "fruit_confidence": fruit_confidence,
            "fruit_margin": fruit_margin,
            "apple_score": apple_score,
            "banana_score": banana_score,
            "quality_margin": 0.0,
            "quality_confidence": within_p,
            "pred_label": pred_label,
        }

    good_p = float(probs[int(good_i)])
    bad_p = float(probs[int(bad_i)])
    quality = "Good" if good_p >= bad_p else "Bad"
    quality_margin = abs(good_p - bad_p)
    pred_label = f"{fruit}_{quality}"
    return {
        "fruit": fruit,
        "quality": quality,
        "fruit_confidence": fruit_confidence,
        "fruit_margin": fruit_margin,
        "apple_score": apple_score,
        "banana_score": banana_score,
        "quality_margin": quality_margin,
        "quality_confidence": max(good_p, bad_p),
        "pred_label": pred_label,
    }


def _load_labels() -> Optional[list[str]]:
    global _labels
    if _labels is not None:
        return _labels

    labels: Optional[list[str]] = None
    if LABELS_ENV.strip():
        labels = [x.strip() for x in LABELS_ENV.split(",") if x.strip()]

    if labels is None and os.path.exists(LABELS_PATH):
        with open(LABELS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list) and all(isinstance(x, str) for x in data):
            labels = data
        elif isinstance(data, dict):
            # Allow {"0":"good","1":"bad",...}
            try:
                labels = [data[str(i)] for i in range(len(data))]
            except Exception:
                labels = None

    _labels = labels
    return _labels


def _get_model():
    global _model
    if _model is not None:
        return _model
    with _model_lock:
        if _model is not None:
            return _model
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model not found at '{MODEL_PATH}'. Set MODEL_PATH env var if needed."
            )
        _model = tf_keras.models.load_model(MODEL_PATH, compile=False)
        return _model


def _decode_image(image_bytes: bytes) -> tuple[Image.Image, dict[str, Any]]:
    with Image.open(io.BytesIO(image_bytes)) as img:
        img = ImageOps.exif_transpose(img)
        meta: dict[str, Any] = {
            "format": img.format,
            "mode": img.mode,
            "original_width": int(img.size[0]),
            "original_height": int(img.size[1]),
        }
        img = img.convert("RGB")
        return img, meta


def _center_square(img: Image.Image) -> tuple[Image.Image, dict[str, Any]]:
    w, h = img.size
    s = min(w, h)
    left = int((w - s) / 2)
    top = int((h - s) / 2)
    cropped = img.crop((left, top, left + s, top + s))
    return cropped, {"mode": "center_square", "width": int(s), "height": int(s)}


def _resize_for_model(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    return img.resize(size, resample=Image.Resampling.LANCZOS)


def _to_tensor(img: Image.Image) -> np.ndarray:
    arr = np.asarray(img, dtype=np.float32)
    # Model may include preprocessing inside (MobileNetV2 style). Default keeps 0..255.
    if INPUT_SCALE in {"0_1", "0-1", "01"}:
        arr = arr / 255.0
    return np.expand_dims(arr, axis=0)


def _prepare_views(image_bytes: bytes, size: tuple[int, int]) -> tuple[list[np.ndarray], dict[str, Any]]:
    img, meta = _decode_image(image_bytes)
    view_meta: list[dict[str, Any]] = []
    views: list[np.ndarray] = []

    # View A: crop then resize (works well for "fruit in the middle").
    if CROP_MODE in {"center_square", "center-crop", "square"}:
        crop_img, crop_info = _center_square(img)
    else:
        crop_img, crop_info = img, {"mode": "none"}
    crop_img = _resize_for_model(crop_img, size)
    views.append(_to_tensor(crop_img))
    view_meta.append({"kind": "crop", "crop": crop_info, "resized": {"w": int(size[0]), "h": int(size[1])}})

    # View B: fit-pad then resize (helps when fruit isn't centered / extra background).
    if VIEW_ENSEMBLE:
        # Cap pad size to avoid huge intermediate images from high-res camera photos.
        side = int(min(max(img.size), 1024))
        try:
            fit_img = ImageOps.pad(img, (side, side), color=(0, 0, 0), centering=(0.5, 0.5))
            fit_kind = "fit_pad"
        except Exception:
            fit_img, _ = _center_square(img)
            fit_kind = "fit_fallback_crop"
        fit_img = _resize_for_model(fit_img, size)
        views.append(_to_tensor(fit_img))
        view_meta.append({"kind": fit_kind, "resized": {"w": int(size[0]), "h": int(size[1])}})

    meta["views"] = view_meta
    return views, meta


def _predict_with_views(model, views: list[np.ndarray]) -> np.ndarray:
    probs_sum: Optional[np.ndarray] = None
    for x in views:
        p = np.asarray(model.predict(x, verbose=0))[0].astype(float)
        if TTA:
            x_flip = np.flip(x, axis=2)  # horizontal flip
            p_flip = np.asarray(model.predict(x_flip, verbose=0))[0].astype(float)
            p = (p + p_flip) / 2.0
        probs_sum = p if probs_sum is None else (probs_sum + p)
    if probs_sum is None:
        return np.asarray([])
    return probs_sum / float(len(views))


def _parse_image_request() -> bytes:
    """
    Accept either:
      - multipart/form-data with file field `image` (or `file` for RN/Expo clients)
      - JSON with {"image_base64": "..."} (optionally with data URL prefix)
    """
    if "image" in request.files:
        return request.files["image"].read()
    if "file" in request.files:
        return request.files["file"].read()

    if request.is_json:
        payload = request.get_json(silent=True) or {}
        b64 = payload.get("image_base64")
        if not b64 or not isinstance(b64, str):
            raise ValueError("Missing JSON field 'image_base64'.")
        if b64.startswith("data:") and "," in b64:
            b64 = b64.split(",", 1)[1]
        return base64.b64decode(b64)

    raise ValueError(
        "Provide an image via form-data field 'image' (or 'file') or JSON 'image_base64'."
    )


app = Flask(__name__)
if CORS is not None and os.environ.get("CORS_ALLOW_ALL", "1") == "1":
    CORS(app)


@app.get("/")
def root():
    return jsonify({"ok": True, "service": "fruit-quality-api"})


@app.get("/healthz")
def healthz():
    return jsonify({"ok": True})


@app.get("/model")
def model_info():
    model = _get_model()
    labels = _load_labels()
    return jsonify(
        {
            "model_path": MODEL_PATH,
            "input_shape": getattr(model, "input_shape", None),
            "output_shape": getattr(model, "output_shape", None),
            "labels": labels,
            "input_scale": INPUT_SCALE,
            "crop_mode": CROP_MODE,
            "tta": TTA,
            "view_ensemble": VIEW_ENSEMBLE,
            "min_confidence": MIN_CONFIDENCE,
            "min_margin": MIN_MARGIN,
            "min_fruit_confidence": MIN_FRUIT_CONFIDENCE,
            "min_fruit_margin": MIN_FRUIT_MARGIN,
            "min_quality_margin": MIN_QUALITY_MARGIN,
        }
    )


@app.post("/predict")
def predict():
    model = _get_model()
    labels = _load_labels()

    try:
        image_bytes = _parse_image_request()
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    input_shape = getattr(model, "input_shape", None)
    if not input_shape or len(input_shape) != 4:
        return jsonify({"error": f"Unexpected model input shape: {input_shape}"}), 500

    height, width = int(input_shape[1]), int(input_shape[2])
    try:
        views, image_meta = _prepare_views(image_bytes, (width, height))
    except Exception as e:
        return jsonify({"error": f"Invalid image: {e}"}), 400

    probs = _predict_with_views(model, views).astype(float)

    pred_idx = int(np.argmax(probs)) if probs.size else 0
    max_label = labels[pred_idx] if labels and 0 <= pred_idx < len(labels) else None
    max_confidence = float(probs[pred_idx]) if probs.size else 0.0

    top2 = np.argsort(-probs)[:2] if probs.size else np.asarray([], dtype=int)
    margin = float(probs[int(top2[0])] - probs[int(top2[1])]) if top2.size >= 2 else 0.0

    inferred = _infer_fruit_quality_from_probs(probs, labels)
    fruit_name = inferred["fruit"]
    fruit_confidence = float(inferred["fruit_confidence"])
    fruit_margin = float(inferred["fruit_margin"])
    quality_margin = float(inferred["quality_margin"])
    quality_confidence = float(inferred["quality_confidence"])
    pred_label = inferred["pred_label"]

    # Recognition logic:
    # - "recognized" means we are confident it's Apple or Banana
    # - quality can be "Uncertain" if Good/Bad margin is low
    fruit_recognized = (
        fruit_confidence >= MIN_FRUIT_CONFIDENCE
        and fruit_margin >= MIN_FRUIT_MARGIN
    )
    quality_recognized = quality_margin >= MIN_QUALITY_MARGIN

    if not fruit_recognized:
        pred_label = None
        split = {"fruit": "Unrecognized", "quality": "Unrecognized"}
        message = UNRECOGNIZED_MESSAGE
    else:
        # Fruit is recognized but Good/Bad may be uncertain.
        if not quality_recognized and fruit_name:
            pred_label = f"{fruit_name}_Uncertain"
            split = {"fruit": fruit_name, "quality": "Uncertain"}
            message = None
        else:
            split = _split_label(pred_label)
            # If we couldn't infer label, fall back to argmax label
            if split["fruit"] is None and max_label:
                split = _split_label(max_label)
                pred_label = max_label
            message = None

    recognized = fruit_recognized
    confidence = fruit_confidence if fruit_recognized else max_confidence

    # Top-k (useful to verify label ordering)
    k = int(os.environ.get("TOP_K", "4"))
    k = max(1, min(k, int(probs.size) if probs.size else 1))
    order = np.argsort(-probs)[:k].tolist()
    top_k = []
    for i in order:
        i = int(i)
        top_k.append(
            {
                "index": i,
                "label": labels[i] if labels and 0 <= i < len(labels) else None,
                "prob": float(probs[i]),
            }
        )

    return jsonify(
        {
            # Frontend-friendly fields
            "prediction": pred_label if pred_label is not None else ("Unrecognized" if not recognized else f"class_{pred_idx}"),
            "confidence": confidence,
            "fruit": split["fruit"],
            "quality": split["quality"],
            "recognized": recognized,
            "recognized_quality": bool(quality_recognized) if recognized else False,
            "quality_confidence": quality_confidence,
            "message": message,
            # Detailed fields
            "predicted_index": pred_idx,
            "predicted_label": pred_label,
            "probabilities": probs.tolist(),
            "labels": labels,
            "top_k": top_k,
            "debug": {
                "received_bytes": int(len(image_bytes)),
                "image": image_meta,
                "tta": TTA,
                "min_confidence": MIN_CONFIDENCE,
                "min_margin": MIN_MARGIN,
                "margin": margin,
                "max_label": max_label,
                "max_confidence": max_confidence,
                "min_fruit_confidence": MIN_FRUIT_CONFIDENCE,
                "min_fruit_margin": MIN_FRUIT_MARGIN,
                "min_quality_margin": MIN_QUALITY_MARGIN,
                "fruit_confidence": fruit_confidence,
                "fruit_margin": fruit_margin,
                "apple_score": float(inferred.get("apple_score", 0.0)),
                "banana_score": float(inferred.get("banana_score", 0.0)),
                "quality_margin": quality_margin,
                "view_ensemble": VIEW_ENSEMBLE,
            },
        }
    )


if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "5000"))
    app.run(host=host, port=port, debug=os.environ.get("FLASK_DEBUG", "0") == "1")
