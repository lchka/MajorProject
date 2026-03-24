import React from "react";
import { NavigationProp, useNavigation } from "@react-navigation/native";
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

export default function WelcomeScreen() {
	const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

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
								<AntDesign name="star" size={24} color="#9CA3AF" />
							</Box>
						</HStack>
						<Divider mt={-8} />
					</VStack>

					<VStack space="md">
						<Text size="4xl" style={{ fontFamily: "Roboto" }}>
							Welcome to Lumière
						</Text>
						<Text size="md" color="$textLight600" style={{ fontFamily: "Roboto" }}>
							Discover routines tailored to your profile and preferences.
						</Text>
					</VStack>

					<VStack space="md">
						<Button
							size="lg"
							bg="$black"
							borderRadius="$lg"
							onPress={() => navigation.navigate("RegisterScreen")}
						>
							<ButtonText color="$white">Get Started</ButtonText>
						</Button>

						<Button
							size="lg"
							variant="outline"
							borderRadius="$lg"
							onPress={() => navigation.navigate("LoginScreen")}
						>
							<ButtonText>I already have an account</ButtonText>
						</Button>
					</VStack>
				</VStack>
			</Box>
		</Center>
	);
}
