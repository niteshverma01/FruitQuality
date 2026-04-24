import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Text, TextInput, View, TouchableOpacity, Appearance } from "react-native";
import { useColorScheme } from "nativewind";

import { getDefaultApiBaseUrl, pingApi } from "../api";
import { Screen } from "../ui/Screen";

export function SettingsScreen(props: { apiBaseUrl: string; onChangeApiBaseUrl: (v: string) => void }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const normalized = useMemo(() => props.apiBaseUrl.trim().replace(/\/$/, ""), [props.apiBaseUrl]);
  const [apiCheckState, setApiCheckState] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [apiCheckMessage, setApiCheckMessage] = useState<string>("");
  const [lastMs, setLastMs] = useState<number | null>(null);

  async function testApi() {
    setApiCheckState("checking");
    setApiCheckMessage("");
    setLastMs(null);
    const start = Date.now();
    try {
      await pingApi(normalized);
      const ms = Date.now() - start;
      setLastMs(ms);
      setApiCheckState("ok");
      setApiCheckMessage("API connection successful");
    } catch (e: any) {
      setApiCheckState("error");
      setApiCheckMessage(e?.message ?? "Cannot reach API");
    }
  }

  const statusPill =
    apiCheckState === "ok"
      ? { bg: "bg-fruit-leaf/20 border-fruit-leaf/30", txt: "text-fruit-leaf", label: "CONNECTED" }
      : apiCheckState === "error"
        ? { bg: "bg-fruit-berry/20 border-fruit-berry/30", txt: "text-fruit-berry", label: "FAILED" }
        : { bg: "bg-zinc-200/50 dark:bg-white/10 border-zinc-300 dark:border-white/10", txt: "text-zinc-600 dark:text-zinc-400", label: "STANDBY" };

  return (
    <Screen className="bg-zinc-50 dark:bg-[#09090B]" contentClassName="gap-6 pt-10 pb-32">
      {/* Immersive Background Orbs */}
      <View className="absolute top-[-10%] right-[-10%] w-80 h-80 rounded-full bg-fruit-grape/10 dark:bg-fruit-grape/20 blur-3xl" pointerEvents="none" />
      <View className="absolute bottom-[20%] left-[-20%] w-96 h-96 rounded-full bg-fruit-mango/5 dark:bg-fruit-mango/10 blur-3xl" pointerEvents="none" />

      {/* Header */}
      <View className="mt-2 mb-2 z-10">
        <Text className="text-[11px] font-bold text-fruit-grape tracking-[0.2em] uppercase mb-2">Configuration</Text>
        <Text className="text-[36px] font-black text-zinc-900 dark:text-white leading-[42px]">
          Settings &{'\n'}Preferences.
        </Text>
        <Text className="text-sm text-zinc-600 dark:text-zinc-400 mt-4 leading-relaxed pr-4">
          Customize your experience and configure server connection for local edge inference.
        </Text>
      </View>

      {/* Theme Selection Widget */}
      <View className="z-10 bg-white/70 dark:bg-zinc-900/70 p-6 rounded-[32px] shadow-sm border border-zinc-200 dark:border-white/5 backdrop-blur-xl">
        <View className="flex-row items-center justify-between mb-5">
           <Text className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 tracking-[0.15em] uppercase">Appearance</Text>
           <TouchableOpacity onPress={() => setColorScheme("system")} activeOpacity={0.7} className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-white/10">
             <Text className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300">AUTO (SYSTEM)</Text>
           </TouchableOpacity>
        </View>
        
        <View className="flex-row gap-3">
          {(["light", "dark"] as const).map((theme) => {
            const isActive = colorScheme === theme;
            const icons = { light: "sunny", dark: "moon" };
            
            return (
              <TouchableOpacity
                key={theme}
                activeOpacity={0.8}
                onPress={() => setColorScheme(theme)}
                className={`flex-1 items-center justify-center py-4 rounded-[20px] border ${
                  isActive 
                    ? "bg-zinc-900 dark:bg-white border-transparent shadow-md" 
                    : "bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-white/5"
                }`}
              >
                <Ionicons 
                  name={icons[theme] as any} 
                  size={20} 
                  color={isActive ? (theme === "dark" ? "#18181B" : "#FFFFFF") : "#A1A1AA"} 
                />
                <Text className={`mt-2 text-[11px] font-bold capitalize ${
                  isActive ? "text-white dark:text-zinc-900" : "text-zinc-500 dark:text-zinc-400"
                }`}>
                  {theme} Mode
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* API Configuration Widget */}
      <View className="z-10 bg-white/70 dark:bg-zinc-900/70 p-6 rounded-[32px] shadow-sm border border-zinc-200 dark:border-white/5 backdrop-blur-xl">
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 tracking-[0.15em] uppercase">API Connection</Text>
          <View className={`px-3 py-1 rounded-full border ${statusPill.bg} flex-row items-center gap-1.5`}>
            {apiCheckState === "checking" && <Ionicons name="sync" size={10} color="#A1A1AA" />}
            <Text className={`text-[9px] font-black tracking-widest ${statusPill.txt}`}>{statusPill.label}</Text>
          </View>
        </View>

        <View className="bg-zinc-100 dark:bg-zinc-950/50 rounded-[20px] border border-zinc-200 dark:border-white/5 overflow-hidden mb-4">
          <View className="flex-row items-center px-4 py-3 border-b border-zinc-200 dark:border-white/5">
            <Ionicons name="link" size={16} color="#71717A" />
            <Text className="ml-2 text-[11px] text-zinc-500 font-medium">Server Endpoint</Text>
          </View>
          <TextInput
            value={props.apiBaseUrl}
            onChangeText={(v) => {
              props.onChangeApiBaseUrl(v);
              setApiCheckState("idle");
              setApiCheckMessage("");
              setLastMs(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            className="px-4 py-4 text-zinc-900 dark:text-white font-medium text-[15px]"
            placeholderTextColor="#71717A"
            placeholder="http://192.168.x.x:5000"
          />
        </View>

        <View className="flex-row gap-3 mb-5">
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={testApi}
            disabled={apiCheckState === "checking" || !normalized}
            className={`flex-[2] items-center justify-center py-4 rounded-[20px] shadow-sm ${
              apiCheckState === "checking" || !normalized ? "bg-zinc-200 dark:bg-zinc-800" : "bg-fruit-grape"
            }`}
          >
            <Text className={`font-bold text-[13px] ${apiCheckState === "checking" || !normalized ? "text-zinc-400" : "text-white"}`}>
              {apiCheckState === "checking" ? "Verifying..." : "Ping Server"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => {
              props.onChangeApiBaseUrl(getDefaultApiBaseUrl());
              setApiCheckState("idle");
            }}
            className="flex-1 items-center justify-center py-4 rounded-[20px] bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/5"
          >
            <Ionicons name="refresh" size={18} color="#71717A" />
          </TouchableOpacity>
        </View>

        {/* Status Message Area */}
        {(apiCheckMessage || lastMs !== null) && (
          <View className={`p-4 rounded-[20px] border ${
            apiCheckState === "ok" ? "bg-fruit-leaf/10 border-fruit-leaf/20" : "bg-fruit-berry/10 border-fruit-berry/20"
          }`}>
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name={apiCheckState === "ok" ? "checkmark-circle" : "warning"} size={16} color={apiCheckState === "ok" ? "#22C55E" : "#EC4899"} />
              <Text className={`text-[12px] font-bold ${apiCheckState === "ok" ? "text-fruit-leaf" : "text-fruit-berry"}`}>
                {apiCheckState === "ok" ? "Connection Successful" : "Connection Failed"}
              </Text>
            </View>
            <Text className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
              {apiCheckMessage}
            </Text>
            {lastMs != null && (
              <Text className="text-[10px] text-zinc-500 font-medium mt-2 tracking-wider">
                LATENCY: {lastMs}ms
              </Text>
            )}
          </View>
        )}

      </View>

      {/* Help Card */}
      <View className="z-10 bg-fruit-mango/10 p-6 rounded-[32px] border border-fruit-mango/20 mb-8">
        <View className="w-10 h-10 rounded-full bg-fruit-mango/20 items-center justify-center mb-4">
          <Ionicons name="information" size={20} color="#F59E0B" />
        </View>
        <Text className="text-zinc-900 dark:text-white font-bold mb-2">Troubleshooting Setup</Text>
        <Text className="text-zinc-700 dark:text-zinc-300 text-[12px] leading-relaxed mb-3">
          On a real Android device, <Text className="font-bold">localhost</Text> will not work because the phone is not running the server.
        </Text>
        <View className="gap-2">
          <Text className="text-zinc-600 dark:text-zinc-400 text-[11px] font-medium">• Flask server must be running (`python app.py`)</Text>
          <Text className="text-zinc-600 dark:text-zinc-400 text-[11px] font-medium">• Phone and PC must be on the same Wi-Fi/LAN</Text>
          <Text className="text-zinc-600 dark:text-zinc-400 text-[11px] font-medium">• Windows Firewall must allow port 5000</Text>
        </View>
      </View>

    </Screen>
  );
}
