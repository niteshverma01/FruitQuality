import type { PropsWithChildren } from "react";
import { View } from "react-native";

import { cn } from "./cn";

export function Card(
  props: PropsWithChildren<{
    className?: string;
  }>
) {
  return (
    <View
      className={cn(
        "rounded-3xl px-5 py-5",
        "bg-white/90 border border-zinc-200 shadow-sm shadow-black/10",
        "dark:bg-zinc-900 dark:border-white/10 dark:shadow-black/40",
        props.className
      )}
    >
      {props.children}
    </View>
  );
}
