import React from "react";
import { MotiView, AnimatePresence } from "moti";
import { Box, Text, Pressable, HStack } from "@gluestack-ui/themed";
import Feather from "@expo/vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BannerType = "success" | "error" | "info" | "warning";
// Component for displaying a temporary banner notification at the top of the screen, with different styles based on the type of message (success, error, info, warning). The banner includes an icon, message text, and a close button, and it automatically dismisses after a specified duration. The component uses Moti for animations and respects safe area insets to avoid overlapping with device notches or status bars.
type Props = {
  isOpen: boolean;
  message: string;
  onDismiss: () => void;
  autoDismissMs?: number;
  type?: BannerType;
  icon?: keyof typeof Feather.glyphMap; // optional override
};

const TYPE_CONFIG: Record<
  BannerType,
  { bg: string; icon: string; iconColor: string }
> = {
  success: {
    bg: "#1E293B",
    icon: "check-circle",
    iconColor: "#10B981",
  },
  error: {
    bg: "#1E293B",
    icon: "x-circle",
    iconColor: "#EF4444",
  },
  warning: {
    bg: "#1E293B",
    icon: "alert-circle",
    iconColor: "#F59E0B",
  },
  info: {
    bg: "#1E293B",
    icon: "info",
    iconColor: "#3B82F6",
  },
};

export default function Banner({
  isOpen,
  message,
  onDismiss,
  autoDismissMs = 1500,
  type = "success",
  icon,
}: Props) {
  const insets = useSafeAreaInsets();

  const config = TYPE_CONFIG[type];
// Set up auto-dismissal of the banner when it becomes visible, using a timer that calls the onDismiss callback after the specified duration. The timer is cleared if the component unmounts or if the banner is dismissed manually to prevent memory leaks.
  React.useEffect(() => {
    if (isOpen && autoDismissMs > 0) {
      const timer = setTimeout(onDismiss, autoDismissMs);
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
            top: insets.top + 20,
            left: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <Box
            bg={config.bg}
            borderRadius={14}
            px="$4"
            py="$3"
            shadowColor="#000"
            shadowOpacity={0.2}
            shadowRadius={10}
            elevation={6}
          >
            <HStack alignItems="center" justifyContent="space-between">
              <HStack alignItems="center" space="sm" flex={1}>
                <Feather
                  name={icon || (config.icon as any)}
                  size={18}
                  color={config.iconColor}
                />
                <Text color="white" fontSize={13} flexShrink={1}>
                  {message}
                </Text>
              </HStack>

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