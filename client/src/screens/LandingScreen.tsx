import React from "react";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	Box,
	Button,
	ButtonText,
	Center,
	Divider,
	HStack,
	Text,
	VStack,
} from "@gluestack-ui/themed";
import AntDesign from "@expo/vector-icons/AntDesign";
import { AuthStackParamList } from "../types/navigation";

const AUTH_TOKEN_KEY = "authToken";

export default function LandingScreen() {
	const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

	const handleSignOut = async () => {
		await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
		navigation.navigate("LoginScreen");
	};

	return (
		<Center flex={1} bg="$backgroundLight0">
			<Box w="$full" px="$5" py="$8" bg="$backgroundLight0">
				<VStack space="2xl">
					<VStack space="xs">
						<HStack justifyContent="space-between" alignItems="center">
							<Text pl="$2" size="6xl" style={{ fontFamily: "DancingScript" }}>
								Lumière
							</Text>

							<Box w="$8" h="$8" alignItems="center" justifyContent="center" mt="$4">
								<AntDesign name="info-circle" size={28} color="gray" />
							</Box>
						</HStack>
						<Divider mt={-8} />
					</VStack>

					<VStack space="md">
						<Text size="4xl" style={{ fontFamily: "Roboto" }}>
							Welcome back
						</Text>
						<Text size="md" color="$textLight600" style={{ fontFamily: "Roboto" }}>
							Your profile is complete. Continue to your personalised workspace.
						</Text>
					</VStack>

					<VStack space="md">
						<Button
							size="lg"
							bg="$black"
							borderRadius="$lg"
							onPress={() => navigation.navigate("AnalyseScreen")}
						>
							<ButtonText color="$white">Go to Analysis</ButtonText>
						</Button>

						<Button
							size="lg"
							variant="outline"
							borderRadius="$lg"
							onPress={handleSignOut}
						>
							<ButtonText>Sign Out</ButtonText>
						</Button>
					</VStack>
				</VStack>
			</Box>
		</Center>
	);
}
