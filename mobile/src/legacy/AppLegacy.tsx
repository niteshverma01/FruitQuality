import "../../global.css";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, SafeAreaView, Text, TextInput, View } from "react-native";

import { getDefaultApiBaseUrl, pingApi, predictImage } from "../api";

type Picked = {
  uri: string;
  mimeType?: string;
  filename?: string;
};

type Mode = "main" | "camera";

type NativeWindStatus =
  | { state: "ok" }
  | { state: "error"; message: string }
  | { state: "unknown" };

export default function App() {
  const defaultBaseUrl = useMemo(() => getDefaultApiBaseUrl(), []);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(defaultBaseUrl);
  const [apiCheckState, setApiCheckState] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [apiCheckMessage, setApiCheckMessage] = useState<string>("");

  const [mode, setMode] = useState<Mode>("main");
  const cameraRef = useRef<any>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [image, setImage] = useState<Picked | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ prediction: string; confidence: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nativewindStatus, setNativewindStatus] = useState<NativeWindStatus>({ state: "unknown" });

  useEffect(() => {
    if (!__DEV__) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("nativewind").verifyInstallation?.();
      setNativewindStatus({ state: "ok" });
    } catch (e: any) {
      setNativewindStatus({ state: "error", message: e?.message ?? String(e) });
      console.warn("NativeWind verifyInstallation failed:", e?.message ?? e);
    }
  }, []);

  async function pickImage() {
    setError(null);
    setResult(null);

    const perms = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perms.granted) {
      setError("Media permission denied.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1
    });

    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset?.uri) {
      setError("Failed to read selected image.");
      return;
    }

    setImage({
      uri: asset.uri,
      mimeType: asset.mimeType ?? undefined,
      filename: asset.fileName ?? undefined
    });
  }

  async function openCamera() {
    setError(null);
    setResult(null);

    if (!cameraPermission?.granted) {
      const next = await requestCameraPermission();
      if (!next.granted) {
        setError("Camera permission denied.");
        return;
      }
    }

    setMode("camera");
  }

  async function takePhoto() {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 1 });
      if (!photo?.uri) {
        setError("Failed to capture photo.");
        return;
      }

      setImage({ uri: photo.uri, mimeType: "image/jpeg", filename: "scan.jpg" });
      setMode("main");
    } catch (e: any) {
      setError(e?.message ?? "Failed to capture photo.");
    }
  }

  async function testApi() {
    setApiCheckState("checking");
    setApiCheckMessage("");
    try {
      await pingApi(apiBaseUrl);
      setApiCheckState("ok");
      setApiCheckMessage("API OK");
    } catch (e: any) {
      setApiCheckState("error");
      setApiCheckMessage(e?.message ?? "Cannot reach API");
    }
  }

  async function runPredict() {
    if (!image) {
      setError("Pick or scan an image first.");
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const data = await predictImage({ ...image, baseUrl: apiBaseUrl });
      setResult(data);
    } catch (e: any) {
      setError(e?.message ?? "Prediction failed.");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "camera") {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <StatusBar style="light" />

        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
          <View className="flex-1 items-center justify-center">
            <View className="w-[280px] h-[280px] border-2 border-white/80 rounded-3xl" />
            <Text className="mt-3 text-white/90">Align the fruit inside the box</Text>
          </View>
        </CameraView>

        <View className="px-5 py-4 flex-row gap-3 bg-black">
          <Pressable onPress={() => setMode("main")} className="flex-1 rounded-2xl bg-white/15 px-4 py-3">
            <Text className="text-white text-center font-semibold">Cancel</Text>
          </Pressable>
          <Pressable onPress={takePhoto} className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3">
            <Text className="text-white text-center font-semibold">Scan</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <StatusBar style="light" />

      <View className="flex-1 px-5 py-6 gap-4">
        {nativewindStatus.state !== "ok" ? (
          <View className="rounded-2xl bg-amber-500/15 border border-amber-400/30 px-4 py-3">
            <Text className="text-amber-200 text-xs">NATIVEWIND NOT ACTIVE</Text>
            <Text className="mt-1 text-amber-50">
              {nativewindStatus.state === "error"
                ? nativewindStatus.message
                : "NativeWind styles are not applying yet. Restart Expo with cache clear."}
            </Text>
            <Text className="mt-1 text-amber-200/80 text-[11px]">Run: npx expo start -c --lan</Text>
          </View>
        ) : null}

        <View className="rounded-3xl bg-zinc-900 border border-white/10 px-5 py-5">
          <Text className="text-3xl font-semibold text-white">Fruit Scanner</Text>
          <Text className="mt-2 text-zinc-300">Scan or pick a photo, then get Apple/Banana prediction.</Text>
        </View>

        <View className="rounded-3xl bg-zinc-900 border border-white/10 px-4 py-4">
          <Text className="text-xs text-zinc-400 mb-2">API base URL</Text>
          <TextInput
            value={apiBaseUrl}
            onChangeText={(v) => {
              setApiBaseUrl(v);
              setApiCheckState("idle");
              setApiCheckMessage("");
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            className="text-white"
            placeholderTextColor="#A1A1AA"
            placeholder="http://192.168.x.x:5000"
          />

          <View className="mt-3 flex-row items-center gap-3">
            <Pressable onPress={testApi} className="rounded-xl bg-white/10 px-3 py-2">
              <Text className="text-white font-semibold">{apiCheckState === "checking" ? "Testing..." : "Test API"}</Text>
            </Pressable>
            {apiCheckState === "ok" ? <Text className="text-emerald-300">{apiCheckMessage}</Text> : null}
            {apiCheckState === "error" ? <Text className="text-rose-300">{apiCheckMessage}</Text> : null}
          </View>

          <Text className="mt-2 text-[11px] text-zinc-400">
            On Android phone use your PC LAN IP (not localhost). Example: http://192.168.1.10:5000
          </Text>
        </View>

        <View className="flex-row gap-3">
          <Pressable onPress={pickImage} className="flex-1 rounded-2xl bg-white px-4 py-4">
            <Text className="text-zinc-950 text-center font-semibold">Pick Image</Text>
          </Pressable>
          <Pressable onPress={openCamera} className="flex-1 rounded-2xl bg-indigo-500 px-4 py-4">
            <Text className="text-white text-center font-semibold">Scan</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={runPredict}
          disabled={!image || busy}
          className={`rounded-2xl px-4 py-4 ${!image || busy ? "bg-zinc-700" : "bg-emerald-500"}`}
        >
          <Text className="text-white text-center font-semibold">{busy ? "Predicting..." : "Predict"}</Text>
        </Pressable>

        <View className="rounded-3xl border border-white/10 overflow-hidden bg-zinc-900">
          {image ? (
            <Image source={{ uri: image.uri }} style={{ width: "100%", height: 280 }} resizeMode="cover" />
          ) : (
            <View className="h-[280px] items-center justify-center">
              <Text className="text-zinc-400">No image selected</Text>
            </View>
          )}
        </View>

        {busy ? (
          <View className="flex-row items-center gap-3">
            <ActivityIndicator />
            <Text className="text-zinc-200">Calling API...</Text>
          </View>
        ) : null}

        {result ? (
          <View className="rounded-3xl bg-emerald-500/15 border border-emerald-400/30 px-5 py-4">
            <Text className="text-emerald-200 text-xs">RESULT</Text>
            <Text className="mt-1 text-white text-2xl font-semibold">{result.prediction}</Text>
            <Text className="mt-1 text-emerald-100">Confidence: {result.confidence.toFixed(4)}</Text>

            <View className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
              <View
                className="h-2 bg-emerald-400"
                style={{ width: `${Math.max(0, Math.min(1, result.confidence)) * 100}%` }}
              />
            </View>
          </View>
        ) : null}

        {error ? (
          <View className="rounded-3xl bg-rose-500/15 border border-rose-400/30 px-5 py-4">
            <Text className="text-rose-200 text-xs">ERROR</Text>
            <Text className="mt-1 text-rose-50">{error}</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

