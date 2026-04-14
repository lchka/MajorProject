import React from "react";
import type { ImageSourcePropType } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import {
	Box,
	Image,
	Pressable,
} from "@gluestack-ui/themed";
import NavLogo from "./NavLogo";
import NotificationBadge from "./NotificationBadge";

type NavBarTopProps = {
	notificationCount?: number;
	avatarSource?: ImageSourcePropType;
	isFirstProfileSetup?: boolean;
	showSearch?: boolean;
	showNotifications?: boolean;
	showAvatar?: boolean;
	showDivider?: boolean;
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
	onPressSearch,
	onPressNotifications,
	onPressAvatar,
}: NavBarTopProps) {
	const shouldShowSearch = showSearch && !isFirstProfileSetup;
	const shouldShowNotifications = showNotifications && !isFirstProfileSetup;

	return (
		<Box>
			<Box
				pt="$7"
				pb="$2"
				mb="$0"
                px="$1.5"
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<NavLogo width={170} height={78} marginBottom={0} marginLeft={-14} />

				<Box
					style={{
						flexDirection: "row",
						alignItems: "center",
						alignSelf: "flex-end",
						gap: 14,
					}}
				>
					{shouldShowSearch ? (
						<Pressable px="$1" onPress={onPressSearch}>
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
			</Box>

			{showDivider ? <Box style={{ height: 1, backgroundColor: "#DDDDDD" }} /> : null}
		</Box>
	);
}
