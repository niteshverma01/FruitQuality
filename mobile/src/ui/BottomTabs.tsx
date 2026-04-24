import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, Text, View, Platform } from "react-native";
import { useColorScheme } from "nativewind";

export type TabKey = "home" | "scan" | "settings";

type Tab = {
  key: TabKey;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  content: ReactNode;
};

export function BottomTabs(props: {
  activeTab: TabKey;
  onTabChange: (key: TabKey) => void;
  tabs: Tab[];
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const active = props.tabs.find((t) => t.key === props.activeTab) ?? props.tabs[0];

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      {/* Content Layer */}
      <View style={{ flex: 1 }}>{active?.content}</View>

      {/* Floating Dock Layer */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 0,
          right: 0,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          elevation: 20,
        }}
      >
        <View 
          className="flex-row items-center justify-center p-2 rounded-[32px] border bg-white/90 border-zinc-200/80 dark:bg-zinc-900/90 dark:border-white/10"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.4 : 0.1,
            shadowRadius: 16,
            elevation: 10,
            backdropFilter: 'blur(20px)',
            width: '90%',
            maxWidth: 400
          }}
        >
          {props.tabs.map((tab) => {
            const isActive = tab.key === props.activeTab;
            return (
              <Pressable
                key={tab.key}
                onPress={() => props.onTabChange(tab.key)}
                className={`flex-1 items-center justify-center rounded-[24px] py-3 ${
                  isActive ? "bg-black/5 dark:bg-white/10" : "bg-transparent"
                }`}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Ionicons
                  name={tab.icon}
                  size={22}
                  color={isActive ? "#F59E0B" : isDark ? "#A1A1AA" : "#71717A"}
                  style={{ marginBottom: 4 }}
                />
                <Text
                  className={`text-[10px] font-bold tracking-wide ${
                    isActive ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {tab.title}
                </Text>
                {isActive && (
                  <View className="absolute bottom-1 w-8 h-1 rounded-full bg-fruit-mango opacity-80" />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
