import { Ionicons } from "@expo/vector-icons";
import { Text, View, TouchableOpacity, ScrollView, Platform, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";

export function OnboardingScreen(props: { onComplete: () => void }) {
  const { colorScheme } = useColorScheme();
  
  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950" style={{ paddingTop: Platform.OS === 'android' ? 36 : 48 }}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} backgroundColor="transparent" translucent />
      
      {/* Decorative Orbs */}
      <View className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-fruit-leaf/20 blur-3xl" pointerEvents="none" />
      <View className="absolute bottom-[10%] left-[-20%] w-80 h-80 rounded-full bg-fruit-mango/20 blur-3xl" pointerEvents="none" />

      <ScrollView className="flex-1 px-6 pt-10" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="w-24 h-24 rounded-[32px] bg-zinc-100 dark:bg-zinc-800 items-center justify-center mb-8 border border-zinc-200 dark:border-white/10 shadow-lg overflow-hidden">
           <Image source={require('../../assets/icon.png')} style={{ width: 96, height: 96 }} resizeMode="cover" />
        </View>

        <Text className="text-[40px] font-black text-zinc-900 dark:text-white leading-[48px] tracking-tight mb-4">
          Welcome to{'\n'}
          <Text className="text-fruit-leaf">FreshCheck AI</Text>
        </Text>
        <Text className="text-[15px] font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed mb-12">
          Your intelligent assistant for instant fruit quality evaluation. Follow these quick tips to get the best results.
        </Text>

        <View className="gap-8">
          <View className="flex-row items-center gap-5">
            <View className="w-14 h-14 rounded-full bg-fruit-leaf/10 dark:bg-fruit-leaf/20 items-center justify-center border border-fruit-leaf/20">
              <Ionicons name="scan" size={24} color="#16A34A" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Center the Fruit</Text>
              <Text className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">Ensure the apple or banana is fully visible and centered in the frame.</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-5">
            <View className="w-14 h-14 rounded-full bg-fruit-mango/10 dark:bg-fruit-mango/20 items-center justify-center border border-fruit-mango/20">
              <Ionicons name="sunny" size={24} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Good Lighting</Text>
              <Text className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">Avoid dark shadows. Natural light works best for high-accuracy predictions.</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-5">
            <View className="w-14 h-14 rounded-full bg-fruit-grape/10 dark:bg-fruit-grape/20 items-center justify-center border border-fruit-grape/20">
              <Ionicons name="server" size={24} color="#6366F1" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Local Network</Text>
              <Text className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">Ensure your phone is connected to the same Wi-Fi as your API server.</Text>
            </View>
          </View>
        </View>

        <View className="mt-12 mb-6">
          <Text className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 tracking-[0.2em] uppercase mb-4">Navigation Guide</Text>
          <View className="bg-white/60 dark:bg-zinc-900/60 p-5 rounded-[28px] border border-zinc-200 dark:border-white/5 shadow-sm gap-4">
            
            <View className="flex-row items-center gap-4">
              <View className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center">
                 <Ionicons name="home-outline" size={20} color="#71717A" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-zinc-900 dark:text-white text-[15px]">Home</Text>
                <Text className="text-zinc-500 text-[12px] leading-relaxed">View your latest scan results and general app statistics.</Text>
              </View>
            </View>

            <View className="w-full h-[1px] bg-zinc-200 dark:bg-white/5" />

            <View className="flex-row items-center gap-4">
              <View className="w-10 h-10 rounded-full bg-fruit-mango/10 items-center justify-center">
                 <Ionicons name="scan-outline" size={20} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-zinc-900 dark:text-white text-[15px]">Scan</Text>
                <Text className="text-zinc-500 text-[12px] leading-relaxed">Capture or upload photos to instantly evaluate fruit quality.</Text>
              </View>
            </View>

            <View className="w-full h-[1px] bg-zinc-200 dark:bg-white/5" />

            <View className="flex-row items-center gap-4">
              <View className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center">
                 <Ionicons name="settings-outline" size={20} color="#71717A" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-zinc-900 dark:text-white text-[15px]">Settings</Text>
                <Text className="text-zinc-500 text-[12px] leading-relaxed">Change app theme and configure your backend API server.</Text>
              </View>
            </View>

          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View className="absolute bottom-8 left-6 right-6">
        <TouchableOpacity 
          onPress={props.onComplete}
          activeOpacity={0.9}
          className="h-16 rounded-full bg-zinc-900 dark:bg-white items-center justify-center shadow-2xl flex-row gap-3"
          style={{ elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 }}
        >
          <Text className="text-[16px] font-black tracking-wide text-white dark:text-zinc-900">GET STARTED</Text>
          <Ionicons name="arrow-forward" size={20} color={colorScheme === "dark" ? "#09090B" : "#FFFFFF"} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
