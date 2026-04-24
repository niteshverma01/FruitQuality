import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, SafeAreaView, Text, View, TouchableOpacity } from "react-native";

import { predictImage, type PredictResponse } from "../api";
import { Screen } from "../ui/Screen";

type Picked = {
  uri: string;
  mimeType?: string;
  filename?: string;
};

type Mode = "main" | "camera";

export type LastScan = {
  prediction: string;
  confidence: number;
  timestamp: number;
  imageUri?: string;
};

function formatLabel(label: string): { fruit: string; quality?: "Good" | "Bad" | "Unrecognized" } {
  if (label === "Unrecognized") {
    return { fruit: "Unrecognized", quality: "Unrecognized" };
  }
  const parts = label.split("_").filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    if (last === "Good" || last === "Bad") {
      return { fruit: parts.slice(0, -1).join(" "), quality: last };
    }
    if (last === "Uncertain") {
      return { fruit: parts.slice(0, -1).join(" "), quality: "Unrecognized" };
    }
  }
  return { fruit: label };
}

function getProsCons(params: {
  fruit: string;
  quality: "Good" | "Bad";
}): { pros: string[]; cons: string[] } {
  const fruit = params.fruit.toLowerCase();
  const quality = params.quality;

  if (fruit.includes("banana")) {
    if (quality === "Good") {
      return {
        pros: ["Sweet taste and good texture", "Good for quick snacks and smoothies", "Better shelf life than overripe fruit"],
        cons: ["Still wash/peel properly before eating"]
      };
    }
    return {
      pros: ["Can be used for compost if too ripe/spoiled"],
      cons: ["Mushy texture / bad taste", "Spoils quickly and may attract fruit flies", "Not recommended for eating if smell/texture is off"]
    };
  }

  // Apple (default)
  if (quality === "Good") {
    return {
      pros: ["Crisp texture and better taste", "Usually stores well (longer shelf life)", "Good for eating raw or in salads"],
      cons: ["Still wash properly before eating"]
    };
  }
  return {
    pros: ["Can be used for compost if bruised/rotten"],
    cons: ["Bruised/brown areas and poor taste", "Short shelf life / may be starting to rot", "Not recommended for eating if moldy or smells bad"]
  };
}

export function ScanScreen(props: {
  apiBaseUrl: string;
  onUpdateLastScan: (scan: LastScan) => void;
  onEditApi: () => void;
}) {
  const apiBaseUrl = useMemo(() => props.apiBaseUrl.trim().replace(/\/$/, ""), [props.apiBaseUrl]);

  const [mode, setMode] = useState<Mode>("main");
  const cameraRef = useRef<any>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [image, setImage] = useState<Picked | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [unrecognized, setUnrecognized] = useState<{ confidence: number; message?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pickImage() {
    setError(null);
    setResult(null);
    setUnrecognized(null);

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
    setUnrecognized(null);

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
    if (busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      if (!photo?.uri) {
        setError("Failed to capture photo.");
        setMode("main");
        setBusy(false);
        return;
      }

      setImage({ uri: photo.uri, mimeType: "image/jpeg", filename: "scan.jpg" });
      setMode("main");
    } catch (e: any) {
      setError(e?.message ?? "Failed to capture photo.");
      setMode("main");
    } finally {
      setBusy(false);
    }
  }

  async function runPredict() {
    if (!image) {
      setError("Pick or scan an image first.");
      return;
    }

    if (!apiBaseUrl.trim()) {
      setError("API base URL is empty. Go to Settings tab and set it.");
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);
    setUnrecognized(null);
    try {
      const data = await predictImage({ ...image, baseUrl: apiBaseUrl });
      if (data.recognized === false || data.prediction === "Unrecognized") {
        setUnrecognized({ confidence: data.confidence, message: data.message });
        setImage(null);
        props.onUpdateLastScan({
          prediction: "Unrecognized",
          confidence: data.confidence,
          timestamp: Date.now()
        });
      } else {
        setResult(data);
        props.onUpdateLastScan({
          prediction: data.prediction,
          confidence: data.confidence,
          timestamp: Date.now(),
          imageUri: image.uri
        });
      }
    } catch (e: any) {
      setError(e?.message ?? "Prediction failed.");
    } finally {
      setBusy(false);
    }
  }

  const formatted = result ? formatLabel(result.prediction) : null;

  if (mode === "camera") {
    return (
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'black', zIndex: 99999, elevation: 99999, paddingTop: 48 }}>
        <View style={{ flex: 1, position: 'relative', backgroundColor: 'black' }}>
          <CameraView ref={cameraRef} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} facing="back" />
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }} pointerEvents="none">
            <View className="w-[300px] h-[300px] border-[3px] border-fruit-lime/80 rounded-[40px] relative">
               <View className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-[37px]" />
               <View className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-[37px]" />
               <View className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-[37px]" />
               <View className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-[37px]" />
            </View>
            <Text className="mt-8 text-white font-bold text-lg tracking-wide shadow-black">Align fruit in frame</Text>
            <View className="mt-3 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md">
               <Text className="text-white/80 text-[11px] font-medium tracking-wider">Ensure good lighting for accuracy</Text>
            </View>
          </View>
        </View>

        <View className="px-6 py-8 flex-row items-center justify-center gap-8 bg-black pb-12">
          <TouchableOpacity 
            onPress={() => setMode("main")}
            className="w-16 h-16 rounded-full bg-white/10 items-center justify-center"
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={takePhoto}
            className="w-24 h-24 rounded-full border-4 border-white/30 items-center justify-center"
          >
            <View className="w-20 h-20 rounded-full bg-white" />
          </TouchableOpacity>

          <View className="w-16 h-16" />
        </View>
      </View>
    );
  }

  return (
    <Screen className="bg-zinc-50 dark:bg-[#09090B]" contentClassName="gap-6 pt-10 pb-32">
      {/* Immersive Background */}
      <View className="absolute top-[10%] right-[-20%] w-96 h-96 rounded-full bg-fruit-leaf/10 blur-3xl" pointerEvents="none" />
      <View className="absolute bottom-[30%] left-[-10%] w-72 h-72 rounded-full bg-fruit-berry/5 blur-3xl" pointerEvents="none" />

      {/* Header */}
      <View className="mt-2 mb-2 z-10">
        <Text className="text-[11px] font-bold text-fruit-leaf tracking-[0.2em] uppercase mb-2">Analysis Engine</Text>
        <Text className="text-[40px] font-black text-zinc-900 dark:text-white leading-[46px] tracking-tight">
          Scan &{'\n'}Evaluate.
        </Text>
      </View>

      {/* Media Selection / Display Widget */}
      <View className="z-10 bg-white/70 dark:bg-zinc-900/70 p-4 rounded-[36px] shadow-sm border border-zinc-200/80 dark:border-white/5 backdrop-blur-xl">
        <View className="rounded-[28px] overflow-hidden bg-zinc-100/50 dark:bg-zinc-950/50 relative border border-zinc-200 dark:border-white/5" style={{ height: 340 }}>
          {image ? (
            <Image source={{ uri: image.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-[28px] m-3 bg-white/50 dark:bg-black/20">
              <View className="w-24 h-24 rounded-full bg-white dark:bg-zinc-900 items-center justify-center mb-5 shadow-sm border border-zinc-100 dark:border-zinc-800">
                <Ionicons name="scan" size={36} color="#A1A1AA" />
                <View className="absolute top-0 right-0 w-6 h-6 bg-fruit-mango rounded-full items-center justify-center border-2 border-white dark:border-zinc-900">
                   <Ionicons name="add" size={14} color="#FFF" />
                </View>
              </View>
              <Text className="text-zinc-800 dark:text-zinc-200 font-black text-xl mb-2 tracking-wide">No Subject</Text>
              <Text className="text-zinc-500 dark:text-zinc-400 text-[12px] max-w-[200px] text-center leading-relaxed">
                Capture a photo or upload from your gallery to begin analysis.
              </Text>
            </View>
          )}

          {image && (
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => {
                setImage(null);
                setResult(null);
                setError(null);
                setUnrecognized(null);
              }}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full items-center justify-center border border-white/20"
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {!image && (
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity 
              onPress={openCamera}
              activeOpacity={0.8}
              className="flex-1 h-16 rounded-[20px] bg-zinc-900 dark:bg-zinc-800 items-center justify-center flex-row gap-2"
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" />
              <Text className="font-bold text-[14px] text-white">Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={pickImage}
              activeOpacity={0.8}
              className="flex-1 h-16 rounded-[20px] bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 items-center justify-center flex-row gap-2"
            >
              <Ionicons name="images" size={20} color="#71717A" />
              <Text className="font-bold text-[14px] text-zinc-700 dark:text-zinc-300">Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {image && (
          <TouchableOpacity 
            onPress={runPredict}
            disabled={busy}
            activeOpacity={0.9}
            className={`mt-4 h-16 rounded-[20px] flex-row items-center justify-center gap-3 ${busy ? "bg-zinc-200 dark:bg-zinc-800" : "bg-fruit-leaf"}`}
          >
            {busy ? (
              <ActivityIndicator color="#A1A1AA" />
            ) : (
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            )}
            <Text className={`font-black text-[15px] tracking-wide ${busy ? "text-zinc-500 dark:text-zinc-400" : "text-white"}`}>
              {busy ? "ANALYZING TENSORS..." : "PREDICT QUALITY"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results Section */}
      <View className="z-10">
        {error && (
          <View className="mt-4 bg-fruit-berry/10 p-5 rounded-[24px] border border-fruit-berry/20 flex-row items-start gap-3">
            <Ionicons name="alert-circle" size={24} color="#EC4899" />
            <View className="flex-1">
              <Text className="text-[11px] font-bold text-fruit-berry tracking-wider uppercase mb-1">Error</Text>
              <Text className="text-zinc-900 dark:text-white text-sm font-medium leading-relaxed">{error}</Text>
            </View>
          </View>
        )}

        {unrecognized && (
          <View className="mt-4 bg-fruit-mango/10 p-6 rounded-[32px] border border-fruit-mango/20 shadow-sm">
            <View className="w-12 h-12 rounded-full bg-fruit-mango/20 items-center justify-center mb-4 border border-fruit-mango/30">
              <Ionicons name="sad-outline" size={24} color="#F59E0B" />
            </View>
            <Text className="text-[11px] font-bold text-fruit-mango tracking-[0.15em] uppercase mb-1">Unrecognized Object</Text>
            <Text className="text-3xl font-black text-zinc-900 dark:text-white mb-2">Sorry!</Text>
            <Text className="text-zinc-700 dark:text-zinc-300 text-[14px] leading-relaxed font-medium">
              This is not workable. We can currently only evaluate Apples and Bananas. Please try again with a supported fruit.
            </Text>
          </View>
        )}

        {result && formatted && (
          <View className={`mt-4 p-6 rounded-[32px] border shadow-lg ${
            formatted.quality === "Good" ? "bg-fruit-leaf/10 border-fruit-leaf/20" : 
            formatted.quality === "Bad" ? "bg-fruit-berry/10 border-fruit-berry/20" : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-white/10"
          }`}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className={`text-[11px] font-bold tracking-[0.15em] uppercase ${
                formatted.quality === "Good" ? "text-fruit-leaf" : 
                formatted.quality === "Bad" ? "text-fruit-berry" : "text-zinc-500"
              }`}>Analysis Complete</Text>
              
              {formatted.quality && (
                <View className={`px-4 py-1.5 rounded-full border ${
                  formatted.quality === "Good" ? "bg-fruit-leaf border-fruit-leaf/50 shadow-md" : 
                  formatted.quality === "Bad" ? "bg-fruit-berry border-fruit-berry/50 shadow-md" : "bg-zinc-500 border-zinc-400"
                }`}>
                  <Text className="text-[10px] font-black text-white tracking-widest">{formatted.quality.toUpperCase()}</Text>
                </View>
              )}
            </View>

            <View className="flex-row items-end justify-between mb-5 mt-2">
              <Text className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
                {formatted.fruit}
              </Text>
              <View className="items-end">
                <Text className="text-[9px] font-bold text-zinc-500 tracking-[0.2em] mb-1">CONFIDENCE</Text>
                <Text className="text-xl font-black text-zinc-900 dark:text-white">
                  {(result.confidence * 100).toFixed(1)}%
                </Text>
              </View>
            </View>

            <View className="w-full h-3 bg-white dark:bg-black/40 rounded-full overflow-hidden mb-6">
              <View 
                className={`h-full rounded-full ${
                  formatted.quality === "Good" ? "bg-fruit-leaf" : 
                  formatted.quality === "Bad" ? "bg-fruit-berry" : "bg-fruit-mango"
                }`}
                style={{ width: `${Math.max(0, Math.min(1, result.confidence)) * 100}%` }}
              />
            </View>

            {formatted.quality === "Good" || formatted.quality === "Bad" ? (
              <View className="gap-3 mt-2">
                {(() => {
                  const extra = getProsCons({ fruit: formatted.fruit, quality: formatted.quality as any });
                  return (
                    <>
                      <View className="bg-white/60 dark:bg-black/30 p-4 rounded-[20px] border border-white/40 dark:border-white/5">
                        <View className="flex-row items-center gap-2 mb-3">
                          <Ionicons name="add-circle" size={16} color="#22C55E" />
                          <Text className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider">ADVANTAGES</Text>
                        </View>
                        {extra.pros.map((p, idx) => (
                          <Text key={`pro-${idx}`} className="text-zinc-800 dark:text-zinc-200 text-[13px] font-medium leading-relaxed mb-1.5 ml-6">
                            • {p}
                          </Text>
                        ))}
                      </View>
                      
                      <View className="bg-white/60 dark:bg-black/30 p-4 rounded-[20px] border border-white/40 dark:border-white/5">
                        <View className="flex-row items-center gap-2 mb-3">
                          <Ionicons name="remove-circle" size={16} color="#EC4899" />
                          <Text className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider">CONSIDERATIONS</Text>
                        </View>
                        {extra.cons.map((c, idx) => (
                          <Text key={`con-${idx}`} className="text-zinc-800 dark:text-zinc-200 text-[13px] font-medium leading-relaxed mb-1.5 ml-6">
                            • {c}
                          </Text>
                        ))}
                      </View>
                    </>
                  );
                })()}
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Screen>
  );
}
