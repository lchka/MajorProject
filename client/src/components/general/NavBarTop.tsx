import React from "react";
import { AnimatePresence, MotiView } from "moti";
import type { ImageSourcePropType } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Box, Pressable } from "@gluestack-ui/themed";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NavLogo from "./NavLogo";
import NotificationBadge from "./NotificationBadge";
import UniversalSearch, { type UniversalSearchResult } from "./UniversalSearch";

type NavBarTopProps = {
  notificationCount?: number;
  avatarSource?: ImageSourcePropType;
  isFirstProfileSetup?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showAvatar?: boolean;
  showDivider?: boolean;
  searchQuery?: string;
  searchResults?: UniversalSearchResult[];
  searchPlaceholder?: string;
  searchEmptyLabel?: string;
  onSearchQueryChange?: (value: string) => void;
  onSearchResultPress?: (result: UniversalSearchResult) => void;
  onPressSearch?: () => void;
  onPressNotifications?: () => void;
  onPressAvatar?: () => void;
};

export default function NavBarTop({
  notificationCount = 0,
  avatarSource = require("../../../assets/icon.png"),
  isFirstProfileSetup = false,
  showSearch = true,
  showNotifications = true,
  showAvatar = true,
  showDivider = true,
  searchQuery = "",
  searchResults = [],
  searchPlaceholder,
  searchEmptyLabel,
  onSearchQueryChange,
  onSearchResultPress,
  onPressSearch,
  onPressNotifications,
  onPressAvatar,
}: NavBarTopProps) {
  const shouldShowSearch = showSearch && !isFirstProfileSetup;
  const shouldShowNotifications = showNotifications && !isFirstProfileSetup;
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (isSearchOpen ? 10 : 22);

  const handleSearchOpen = React.useCallback(() => {
    setIsSearchOpen(true);
    onPressSearch?.();
  }, [onPressSearch]);

  const handleSearchClose = React.useCallback(() => {
    setIsSearchOpen(false);
  }, []);

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
        {shouldShowSearch ? (
          <AnimatePresence>
            {isSearchOpen ? (
              <MotiView
                from={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: "timing", duration: 180 }}
                style={{ flex: 1, alignSelf: "stretch" }}
              >
                <UniversalSearch
                  isOpen
                  query={searchQuery}
                  results={searchResults}
                  placeholder={searchPlaceholder}
                  emptyLabel={searchEmptyLabel}
                  onQueryChange={(value) => onSearchQueryChange?.(value)}
                  onSelectResult={(result) => {
                    onSearchResultPress?.(result);
                    handleSearchClose();
                  }}
                  onClear={() => {
                    onSearchQueryChange?.("");
                    handleSearchClose();
                  }}
                  onClose={handleSearchClose}
                />
              </MotiView>
            ) : null}
          </AnimatePresence>
        ) : null}

        {!isSearchOpen ? (
          <>
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
              {shouldShowSearch ? (
                <Pressable px="$1" onPress={handleSearchOpen}>
                  <Feather name="search" size={32} color="#111111" />
                </Pressable>
              ) : null}

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
          </>
        ) : null}
      </Box>
      <Box px="$4" my="$2"style={{ marginBottom: -15 }}>
        {showDivider ? (
          <Box style={{ height: 1, backgroundColor: "#12798d1e" }} />
        ) : null}
      </Box>
    </Box>
  );
}
