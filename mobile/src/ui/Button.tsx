import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
import { useColorScheme } from "nativewind";

import { cn } from "./cn";

type IconName = ComponentProps<typeof Ionicons>["name"];

type Variant = "primary" | "secondary" | "success" | "neutral" | "ghost" | "danger";

type Size = "lg" | "md";

export function Button(props: {
  title: string;
  onPress?: () => void;
  icon?: IconName;
  disabled?: boolean;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  const { colorScheme } = useColorScheme();
  const variant = props.variant ?? "neutral";
  const size = props.size ?? "lg";

  const base = "rounded-2xl flex-row items-center justify-center gap-2";
  const pad = size === "lg" ? "px-4 py-4" : "px-4 py-3";

  const variantBg: Record<Variant, string> = {
    primary: "bg-fruit-mango",
    secondary: "bg-fruit-grape",
    success: "bg-fruit-leaf",
    neutral: "bg-zinc-900/5 border border-zinc-200 dark:bg-white/10 dark:border-white/10",
    ghost: "bg-transparent border border-zinc-200 dark:border-white/10",
    danger: "bg-fruit-berry"
  };

  const variantText: Record<Variant, string> = {
    primary: "text-zinc-950",
    secondary: "text-white",
    success: "text-white",
    neutral: "text-zinc-900 dark:text-white",
    ghost: "text-zinc-900 dark:text-white",
    danger: "text-white"
  };

  const disabledBg = "bg-zinc-200 dark:bg-zinc-800";
  const disabledText = "text-zinc-400 dark:text-zinc-300";

  const bg = props.disabled ? disabledBg : variantBg[variant];
  const txt = props.disabled ? disabledText : variantText[variant];
  const isDark = colorScheme === "dark";

  return (
    <Pressable
      onPress={props.disabled ? undefined : props.onPress}
      className={cn(base, pad, bg, props.className)}
      style={({ pressed }) => ({ opacity: pressed && !props.disabled ? 0.92 : 1 })}
    >
      {props.icon ? (
        <Ionicons
          name={props.icon}
          size={18}
          color={
            props.disabled
              ? "#A1A1AA"
              : variant === "primary"
                ? "#09090B"
                : variant === "neutral" || variant === "ghost"
                  ? isDark
                    ? "#FFFFFF"
                    : "#0A0A0A"
                  : "#FFFFFF"
          }
        />
      ) : null}
      <Text className={cn("font-semibold", txt)}>{props.title}</Text>
      {variant === "primary" && !props.disabled ? <View className="absolute inset-0 rounded-2xl border border-black/10" /> : null}
    </Pressable>
  );
}
