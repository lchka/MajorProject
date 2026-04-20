import React from "react";
import type { ImageSourcePropType } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Box, Pressable } from "@gluestack-ui/themed";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NavLogo from "./NavLogo";
import NotificationBadge from "./NotificationBadge";

type NavBarTopProps = {
  notificationCount?: number;
  avatarSource?: ImageSourcePropType;
  isFirstProfileSetup?: boolean;
  showNotifications?: boolean;
  showAvatar?: boolean;
  showDivider?: boolean;
  onPressNotifications?: () => void;
  onPressAvatar?: () => void;
};

// Simplified top nav for this screen set: logo + optional notifications,
// while search UI is intentionally not rendered here.
export default function NavBarTop({
  notificationCount = 0,
  avatarSource = require("../../../assets/icon.png"),
  isFirstProfileSetup = false,
  showNotifications = true,
  showAvatar = true,
  showDivider = true,
  onPressNotifications,
  onPressAvatar,
}: NavBarTopProps) {
  const shouldShowNotifications = showNotifications && !isFirstProfileSetup;
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + 22;

  return (
    <Box>
      <Box
        pb="$2"
        mb="$0"
        px="$1.5"
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingTop: topPadding,
        }}
      >
        <Box style={{ flexShrink: 0 }}>
          <NavLogo width={170} height={78} marginBottom={0} marginLeft={-14} />
        </Box>

        <Box style={{ flex: 1 }} />

        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-end",
            gap: 14,
          }}
        >
          {shouldShowNotifications ? (
            <Pressable
              onPress={onPressNotifications}
              mx="$2"
              style={{ position: "relative" }}
            >
              <Feather name="bell" size={32} color="#111111" />
              <NotificationBadge count={notificationCount} />
            </Pressable>
          ) : null}
        </Box>
      </Box>
      <Box px="$4" my="$2"style={{ marginBottom: 0 }}>
        {showDivider ? (
          <Box style={{ height: 1, backgroundColor: "#12798d1e" }} />
        ) : null}
      </Box>
    </Box>
  );
}
