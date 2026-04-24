import "./global.css";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { View, Text, Platform } from "react-native";
import { useColorScheme } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getDefaultApiBaseUrl } from "./src/api";
import { HomeScreen } from "./src/screens/HomeScreen";
import { ScanScreen, type LastScan } from "./src/screens/ScanScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { BottomTabs, type TabKey } from "./src/ui/BottomTabs";

type NativeWindStatus =
  | { state: "ok" }
  | { state: "error"; message: string }
  | { state: "unknown" };

export default function App() {
  const { colorScheme } = useColorScheme();
  const defaultBaseUrl = useMemo(() => getDefaultApiBaseUrl(), []);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(defaultBaseUrl);
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [lastScan, setLastScan] = useState<LastScan | null>(null);
  const [nativewindStatus, setNativewindStatus] = useState<NativeWindStatus>({ state: "unknown" });
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("has_seen_onboarding").then((val) => {
      setHasSeenOnboarding(val === "true");
    });
  }, []);

  const completeOnboarding = () => {
    AsyncStorage.setItem("has_seen_onboarding", "true");
    setHasSeenOnboarding(true);
  };

  useEffect(() => {
    if (!__DEV__) return;
    try {
      require("nativewind").verifyInstallation?.();
      setNativewindStatus({ state: "ok" });
    } catch (e: any) {
      setNativewindStatus({ state: "error", message: e?.message ?? String(e) });
    }
  }, []);

  const tabs = useMemo(() => [
    {
      key: "home" as TabKey,
      title: "Home",
      icon: "home-outline" as any,
      content: (
        <HomeScreen
          apiBaseUrl={apiBaseUrl}
          lastScan={lastScan}
          onGoScan={() => setActiveTab("scan")}
          onGoSettings={() => setActiveTab("settings")}
        />
      )
    },
    {
      key: "scan" as TabKey,
      title: "Scan",
      icon: "scan-outline" as any,
      content: (
        <ScanScreen
          apiBaseUrl={apiBaseUrl}
          onUpdateLastScan={(scan) => setLastScan(scan)}
          onEditApi={() => setActiveTab("settings")}
        />
      )
    },
    {
      key: "settings" as TabKey,
      title: "Settings",
      icon: "settings-outline" as any,
      content: <SettingsScreen apiBaseUrl={apiBaseUrl} onChangeApiBaseUrl={setApiBaseUrl} />
    }
  ], [apiBaseUrl, lastScan]);

  if (hasSeenOnboarding === null) {
    return null; // wait for storage
  }

  if (hasSeenOnboarding === false) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colorScheme === "dark" ? "#09090B" : "#FAFAFA", paddingTop: Platform.OS === 'android' ? 36 : 48 }}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} backgroundColor="transparent" translucent />

      {nativewindStatus.state !== "ok" ? (
        <View style={{ padding: 20 }}>
          <View style={{ backgroundColor: "#FEF3C7", padding: 16, borderRadius: 12 }}>
            <Text style={{ color: "#92400E", fontWeight: "bold" }}>NATIVEWIND NOT ACTIVE</Text>
            <Text style={{ color: "#B45309", marginTop: 4 }}>Restart Expo with cache clear.</Text>
          </View>
        </View>
      ) : null}

      <BottomTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={tabs}
      />
    </View>
  );
}
