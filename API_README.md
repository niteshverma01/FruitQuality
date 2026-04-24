# Fruit Quality Flask API

This API loads `fruit_quality_model.h5` and exposes a simple prediction endpoint.

## Setup (Windows / PowerShell)

```powershell
.\setup_venv.ps1
```

## Run

### Option A (recommended): PowerShell script

```powershell
.\run_api.ps1 -Host 0.0.0.0 -Port 5000
```

Important: don’t run the `.ps1` with Python. Run it directly in PowerShell.

### Option B: If venv is already activated

```powershell
python app.py
```

### Option C: Python runner

```powershell
python run_api.py --host 0.0.0.0 --port 5000
```

Note: this model does its own preprocessing internally (MobileNetV2-style). Default is `INPUT_SCALE=raw255`.
If you ever swap models and it expects 0..1 input, run with `INPUT_SCALE=0_1`.

Camera/Upload tip: photos may be rotated (EXIF) or not square. Backend uses `CROP_MODE=center_square` + high-quality resize by default.
Prediction stability: backend also uses simple test-time augmentation by default (`TTA=1`) to reduce random errors from framing/blur.
Low-confidence handling: backend treats predictions as `Unrecognized` when `confidence < 0.95` (configurable via `MIN_CONFIDENCE`).
More robustness: backend can ensemble 2 views (`VIEW_ENSEMBLE=1`) and also uses a margin check (`MIN_MARGIN=0.10`) so non-apple/banana images become `Unrecognized`.
Real camera images: backend also uses fruit-sum confidence (`MIN_FRUIT_CONFIDENCE=0.70`) and within-fruit Good/Bad margin (`MIN_QUALITY_MARGIN=0.10`) so Apple/Banana photos are recognized more reliably.
Also uses a fruit-vs-fruit margin check (`MIN_FRUIT_MARGIN=0.15`). If your real fruit photos become `Unrecognized`, try lowering `MIN_CONFIDENCE` (e.g. 0.85) or `MIN_FRUIT_MARGIN` (e.g. 0.05).
If the image is not Apple/Banana, API returns `prediction=Unrecognized` and `message="Sorry, this is not acceptable"` (customizable via `UNRECOGNIZED_MESSAGE`).

Health check:

```powershell
curl http://127.0.0.1:5000/healthz
```

Root (used by some clients for ping):

```powershell
curl http://127.0.0.1:5000/
```

Model info:

```powershell
curl http://127.0.0.1:5000/model
```

## Predict

### Option A: Multipart file upload

```powershell
curl -X POST http://127.0.0.1:5000/predict -F "image=@path\\to\\fruit.jpg"
```

Expo/RN clients often use `file` as the field name (also supported):

```powershell
curl -X POST http://127.0.0.1:5000/predict -F "file=@path\\to\\fruit.jpg"
```

### Option B: JSON base64

```powershell
$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("path\\to\\fruit.jpg"))
curl -X POST http://127.0.0.1:5000/predict `
  -H "Content-Type: application/json" `
  -d (@{ image_base64 = $b64 } | ConvertTo-Json)
```

## Labels (optional)

By default, the API returns `predicted_index` (0..3) and probabilities.

If you want names, either:
- Create/edit `labels.json` (copy from `labels.example.json`) as a JSON list, or
- Set env var `FRUIT_QUALITY_LABELS="good,bad,..."`.

Important: the order must match the model's class index order (0..3). If labels look swapped, reorder `labels.json`.

Tip: check `top_k` from `POST /predict` to see which indices the model is choosing and confirm your label order.
