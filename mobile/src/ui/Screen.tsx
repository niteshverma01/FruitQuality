import type { PropsWithChildren } from "react";
import { ScrollView } from "react-native";

import { cn } from "./cn";

export function Screen(
  props: PropsWithChildren<{
    className?: string;
    contentClassName?: string;
  }>
) {
  return (
    <ScrollView
      className={cn("flex-1 bg-white dark:bg-zinc-950", props.className)}
      contentContainerClassName={cn(
        "px-5 py-6 gap-4 w-full self-center max-w-[620px]",
        // leave space for bottom tab bar
        "pb-28",
        props.contentClassName
      )}
    >
      {props.children}
    </ScrollView>
  );
}
