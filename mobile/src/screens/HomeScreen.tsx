import { Ionicons } from "@expo/vector-icons";
import { Image, Text, View, TouchableOpacity } from "react-native";

import { Screen } from "../ui/Screen";
import type { LastScan } from "./ScanScreen";

function formatLabel(label: string): { fruit: string; quality?: "Good" | "Bad" } {
  const parts = label.split("_").filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    if (last === "Good" || last === "Bad") {
      return { fruit: parts.slice(0, -1).join(" "), quality: last };
    }
  }
  return { fruit: label };
}

export function HomeScreen(props: {
  apiBaseUrl: string;
  lastScan: LastScan | null;
  onGoScan: () => void;
  onGoSettings: () => void;
}) {
  const last = props.lastScan ? formatLabel(props.lastScan.prediction) : null;
  const isUnrecognized = props.lastScan?.prediction === "Unrecognized";

  return (
    <Screen className="bg-zinc-50 dark:bg-[#09090B]" contentClassName="gap-6 pt-10">
      {/* Immersive Background Elements - They will scroll, giving a parallax feel */}
      <View className="absolute top-[-5%] left-[-15%] w-72 h-72 rounded-full bg-fruit-grape/10 dark:bg-fruit-grape/20 blur-3xl" pointerEvents="none" />
      <View className="absolute top-[25%] right-[-20%] w-96 h-96 rounded-full bg-fruit-berry/5 dark:bg-fruit-berry/10 blur-3xl" pointerEvents="none" />
      <View className="absolute bottom-[5%] left-[10%] w-80 h-80 rounded-full bg-fruit-mango/10 dark:bg-fruit-mango/15 blur-3xl" pointerEvents="none" />

      {/* Premium Header Widget */}
      <View className="z-10 bg-white/70 dark:bg-zinc-900/70 p-6 rounded-[36px] shadow-sm border border-zinc-200/80 dark:border-white/5 backdrop-blur-xl mb-4 mt-2">
        <View className="flex-row items-center gap-3 mb-4">
          <View className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center overflow-hidden border border-zinc-200 dark:border-white/10">
            <Image source={require('../../assets/icon.png')} style={{ width: 40, height: 40 }} resizeMode="cover" />
          </View>
          <Text className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 tracking-[0.2em] uppercase">Status Ready</Text>
        </View>
        <Text className="text-[34px] font-black text-zinc-900 dark:text-white leading-[40px] tracking-tight">
          Intelligent Fruit{'\n'}
          <Text className="text-fruit-leaf">Quality Evaluator.</Text>
        </Text>
        <Text className="mt-3 text-[14px] text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed max-w-[280px]">
          Leveraging local neural networks for instant, accurate produce classification.
        </Text>
      </View>

      {/* Advanced Quick Action Buttons */}
      <View className="flex-row gap-4 z-10 mb-4">
        <TouchableOpacity 
          onPress={props.onGoScan}
          activeOpacity={0.8}
          className="flex-[3] bg-zinc-900 dark:bg-zinc-800 p-5 rounded-[32px] overflow-hidden shadow-lg"
          style={{ elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15 }}
        >
          <View className="absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full bg-fruit-leaf/20 blur-2xl" />
          <Ionicons name="camera" size={26} color="#FFFFFF" />
          <View className="mt-8">
            <Text className="text-white font-black text-xl mb-1 tracking-wide">New Scan</Text>
            <Text className="text-zinc-400 text-[11px] font-medium tracking-wider">LENS ANALYZER</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={props.onGoSettings}
          activeOpacity={0.8}
          className="flex-[2] bg-white dark:bg-zinc-900/50 p-5 rounded-[32px] border border-zinc-200 dark:border-white/5 shadow-sm"
        >
          <Ionicons name="settings" size={26} color="#A1A1AA" />
          <View className="mt-8">
            <Text className="text-zinc-900 dark:text-white font-bold text-lg mb-1">Config</Text>
            <Text className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium tracking-wider">SYSTEM</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Last Scan Premium Widget */}
      <View className="mt-4 z-10">
        <View className="flex-row items-center justify-between mb-4 px-1">
          <Text className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 tracking-[0.15em] uppercase">Latest Scan</Text>
          {props.lastScan && (
             <Ionicons name="time-outline" size={16} color="#71717A" />
          )}
        </View>
        
        {props.lastScan ? (
          <View className="rounded-[32px] overflow-hidden bg-white dark:bg-zinc-900 shadow-xl border border-zinc-100 dark:border-white/5" style={{ elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 }}>
            {props.lastScan.imageUri && !isUnrecognized ? (
              <View className="h-56 w-full bg-zinc-200 dark:bg-black relative">
                <Image 
                  source={{ uri: props.lastScan.imageUri }} 
                  style={{ width: "100%", height: "100%" }} 
                  resizeMode="cover"
                />
                <View className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                {last?.quality && (
                  <View className={`absolute top-5 right-5 px-4 py-2 rounded-full border border-white/20 shadow-lg ${last.quality === "Good" ? "bg-fruit-lime/90" : "bg-fruit-berry/90"}`}>
                    <Text className={`text-[11px] font-black tracking-widest ${last.quality === "Good" ? "text-zinc-900" : "text-white"}`}>{last.quality.toUpperCase()}</Text>
                  </View>
                )}
              </View>
            ) : (
               <View className="h-40 w-full bg-zinc-50 dark:bg-zinc-950 items-center justify-center border-b border-zinc-100 dark:border-white/5">
                 <View className="w-16 h-16 rounded-full bg-fruit-mango/10 items-center justify-center mb-3 border border-fruit-mango/20">
                   <Ionicons name="help" size={32} color="#F59E0B" />
                 </View>
               </View>
            )}

            <View className="p-6 bg-white dark:bg-zinc-900">
              <View className="flex-row items-end justify-between mb-5">
                <View className="flex-1 pr-4">
                  <Text className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                    {last?.fruit ?? props.lastScan.prediction}
                  </Text>
                  <Text className="text-[11px] text-zinc-500 mt-1 font-medium">
                    {new Date(props.lastScan.timestamp).toLocaleString(undefined, {
                      dateStyle: 'medium', timeStyle: 'short'
                    })}
                  </Text>
                </View>
                
                {!isUnrecognized && (
                  <View className="items-end bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 rounded-2xl border border-zinc-100 dark:border-white/5">
                    <Text className="text-[9px] font-bold text-zinc-400 tracking-[0.2em] mb-1">CONFIDENCE</Text>
                    <Text className="text-lg font-black text-fruit-grape">
                      {(props.lastScan.confidence * 100).toFixed(1)}%
                    </Text>
                  </View>
                )}
              </View>

              {!isUnrecognized ? (
                <View>
                  <View className="flex-row justify-between mb-2 px-1">
                    <Text className="text-[10px] font-bold text-zinc-400">0%</Text>
                    <Text className="text-[10px] font-bold text-zinc-400">100%</Text>
                  </View>
                  <View className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <View 
                      className="h-full bg-fruit-grape rounded-full" 
                      style={{ width: `${Math.max(0, Math.min(1, props.lastScan.confidence)) * 100}%` }}
                    />
                  </View>
                </View>
              ) : (
                <View className="flex-row items-center gap-3 p-4 bg-fruit-mango/10 rounded-2xl border border-fruit-mango/20">
                  <Ionicons name="sad-outline" size={24} color="#F59E0B" />
                  <View className="flex-1">
                    <Text className="text-zinc-900 dark:text-white font-bold mb-0.5">Sorry!</Text>
                    <Text className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      This is not workable. We can only evaluate Apples and Bananas.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View className="rounded-[32px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-8 items-center justify-center bg-white/40 dark:bg-zinc-900/40">
            <View className="w-20 h-20 rounded-full bg-white dark:bg-zinc-800 items-center justify-center mb-5 shadow-sm border border-zinc-100 dark:border-white/5">
               <Ionicons name="camera" size={36} color="#D4D4D8" />
            </View>
            <Text className="text-zinc-900 dark:text-white font-bold text-xl mb-2">No scans yet</Text>
            <Text className="text-zinc-500 text-center text-[13px] leading-relaxed max-w-[200px]">
              Tap the Scan Fruit button above to analyze your first image.
            </Text>
          </View>
        )}
      </View>

      {/* Info/Stats Cards */}
      <View className="flex-row gap-4 mt-2 z-10">
         <View className="flex-1 bg-white dark:bg-zinc-900 p-5 rounded-[28px] border border-zinc-100 dark:border-white/5 shadow-sm">
           <View className="w-12 h-12 rounded-full bg-fruit-leaf/10 dark:bg-fruit-leaf/20 items-center justify-center mb-4 border border-fruit-leaf/20">
             <Ionicons name="flash" size={22} color="#22C55E" />
           </View>
           <Text className="text-zinc-900 dark:text-white font-bold text-[15px] mb-1">Lightning Fast</Text>
           <Text className="text-zinc-500 text-[11px] leading-relaxed">Server models process images in mere milliseconds.</Text>
         </View>

         <View className="flex-1 bg-white dark:bg-zinc-900 p-5 rounded-[28px] border border-zinc-100 dark:border-white/5 shadow-sm">
           <View className="w-12 h-12 rounded-full bg-fruit-mango/10 dark:bg-fruit-mango/20 items-center justify-center mb-4 border border-fruit-mango/20">
             <Ionicons name="shield-checkmark" size={22} color="#F59E0B" />
           </View>
           <Text className="text-zinc-900 dark:text-white font-bold text-[15px] mb-1">High Accuracy</Text>
           <Text className="text-zinc-500 text-[11px] leading-relaxed">Trained on thousands of diverse fresh samples.</Text>
         </View>
      </View>

      {/* Server Info Compact */}
      <View className="mt-2 mb-6 bg-zinc-100/80 dark:bg-zinc-800/50 px-5 py-4 rounded-[24px] flex-row items-center justify-between border border-zinc-200 dark:border-white/5 backdrop-blur-md z-10">
         <View className="flex-1 flex-row items-center gap-3">
            <View className="relative">
              <View className="w-2.5 h-2.5 rounded-full bg-fruit-lime" />
            </View>
            <Text className="text-zinc-600 dark:text-zinc-300 text-[11px] font-bold tracking-wider uppercase" numberOfLines={1}>
               API: {props.apiBaseUrl.replace(/^https?:\/\//, '')}
            </Text>
         </View>
      </View>

    </Screen>
  );
}
