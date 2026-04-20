import React, { useEffect, useRef } from "react";
import { MotiView, AnimatePresence } from "moti";
import { Box, Text, Pressable, HStack } from "@gluestack-ui/themed";
import Feather from "@expo/vector-icons/Feather";

export type ErrorBannerData = {
  message: string;
  statusCode?: number;
};

type Props = {
  /** Pass a non-null value to show the banner, null to hide it. */
  error: ErrorBannerData | null;
  /** Called when the user taps the X button. */
  onDismiss: () => void;
};

export default function ErrorBanner({ error, onDismiss }: Props) {
  const visible = error !== null;

  return (
    <AnimatePresence>
      {visible && error && (
        <MotiView
          from={{ opacity: 0, translateY: -40 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -40 }}
          transition={{ type: "timing", duration: 250 }}
          style={{
            position: "absolute",
            top: 60,
            left: 16,
            right: 16,
            zIndex: 999,
          }}
        >
          <Box
            bg="#1E293B"
            borderRadius={14}
            px="$4"
            py="$3"
            shadowColor="#000"
            shadowOpacity={0.2}
            shadowRadius={10}
            elevation={6}
          >
            <HStack alignItems="center" justifyContent="space-between">
              {/* LEFT SIDE */}
              <HStack alignItems="center" space="sm" flex={1}>
                <Feather name="alert-circle" size={18} color="#F87171" />
                <Text color="white" fontSize={13} flexShrink={1}>
                  {error.message}
                </Text>
              </HStack>

              {/* CLOSE BUTTON */}
              <Pressable onPress={onDismiss} ml="$3">
                <Feather name="x" size={18} color="#CBD5F5" />
              </Pressable>
            </HStack>
          </Box>
        </MotiView>
      )}
    </AnimatePresence>
  );
}
