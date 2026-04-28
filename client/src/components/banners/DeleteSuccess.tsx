import React from "react";
import { MotiView, AnimatePresence } from "moti";
import { Box, Text, Pressable, HStack } from "@gluestack-ui/themed";
import Feather from "@expo/vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  /** boolean to control visibility. */
  isOpen: boolean;
  /** Optional message, defaults to 'Account deleted successfully.' */
  message?: string;
  /** Called when the user taps the X button or timer expires. */
  onDismiss: () => void;
  /** Optional time in ms to auto-dismiss. Pass 0 to disable. Defaults to 4000 (4s). */
  autoDismissMs?: number;
};

export default function DeletedSuccessfullyBanner({
  isOpen,
  message = "Account deleted successfully.",
  onDismiss,
  autoDismissMs = 4000,
}: Props) {
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (isOpen && autoDismissMs > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismissMs);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoDismissMs, onDismiss]);

  return (
    <AnimatePresence>
      {isOpen && (
        <MotiView
          from={{ opacity: 0, translateY: -40 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -40 }}
          transition={{ type: "timing", duration: 250 }}
          style={{
            position: "absolute",
            top: insets.top + 20, // ✅ fixed positioning
            left: 16,
            right: 16,
            zIndex: 1000,
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
                <Feather name="check-circle" size={18} color="#10B981" />
                <Text color="white" fontSize={13} flexShrink={1}>
                  {message}
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