import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { Box, Pressable, ScrollView, Text } from "@gluestack-ui/themed";
import NavBarTop from "../../components/general/NavBarTop";
import BackButton from "../../components/Buttons/BackButton";
import { AuthStackParamList } from "../../types/navigation";

const AUTH_TOKEN_KEY = "authToken";

export default function AccountSettings() {
	const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
	const [isLoggingOut, setIsLoggingOut] = React.useState(false);

	const handleLogout = React.useCallback(async () => {
		if (isLoggingOut) {
			return;
		}

		try {
			setIsLoggingOut(true);
			await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
			navigation.reset({
				index: 0,
				routes: [{ name: "LoginScreen" }],
			});
		} finally {
			setIsLoggingOut(false);
		}
	}, [isLoggingOut, navigation]);

	return (
		<Box flex={1} bg="#F2F6FA">
			<NavBarTop notificationCount={0} />

			<ScrollView
				contentContainerStyle={{
					paddingHorizontal: 20,
					paddingTop: 8,
					paddingBottom: 120,
				}}
				showsVerticalScrollIndicator={false}
			>
				<Box
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 8,
						marginBottom: 18,
					}}
				>
					<BackButton onPress={() => navigation.goBack()} />
					<Text fontSize={24} lineHeight={28} color="#0F172A" fontFamily="RobotoMedium">
						Account Settings
					</Text>
				</Box>

				<Box
					style={{
						borderRadius: 18,
						backgroundColor: "#FFFFFF",
						borderWidth: 1,
						borderColor: "#E4ECF3",
						paddingHorizontal: 16,
						paddingVertical: 16,
						marginBottom: 14,
					}}
				>
					<Text fontSize={16} lineHeight={20} color="#0F172A" fontFamily="RobotoMedium">
						Account
					</Text>
					<Text fontSize={13} lineHeight={18} color="#64748B" fontFamily="Roboto" mt="$2">
						Manage your account access and session from here.
					</Text>
				</Box>
			</ScrollView>

			<Box position="absolute" left={0} right={0} bottom={0}>
				<Pressable
					onPress={handleLogout}
					disabled={isLoggingOut}
					style={{
						height: 58,
						backgroundColor: "#D64545",
						alignItems: "center",
						justifyContent: "center",
						opacity: isLoggingOut ? 0.7 : 1,
					}}
				>
					<Text fontSize={17} lineHeight={19} color="#FFFFFF" fontFamily="RobotoMedium">
						{isLoggingOut ? "Logging out..." : "Log Out"}
					</Text>
				</Pressable>
			</Box>
		</Box>
	);
}
