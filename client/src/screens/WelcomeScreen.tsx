import React, { useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dimensions } from "react-native";
import LottieView from "lottie-react-native";
import { MotiView } from "moti";
import { Easing } from "react-native-reanimated";
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
const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function WelcomeScreen() {
	const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
	const scrollDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [shouldShowWelcomeCard, setShouldShowWelcomeCard] = useState(false);

	useEffect(() => {
		// If user is already signed in, skip this intro and go straight to landing.
		const redirectAuthorizedUsers = async () => {
			const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
			if (token) {
				navigation.replace("LandingScreen");
			}
		};

		void redirectAuthorizedUsers();

		return () => {
			if (scrollDelayRef.current) {
				clearTimeout(scrollDelayRef.current);
			}
		};
	}, [navigation]);

	const handleLiveChatAnimationFinished = () => {
		if (shouldShowWelcomeCard) {
			return;
		}

		// After live chat animation ends, wait a bit, then slide to the welcome card.
		scrollDelayRef.current = setTimeout(() => {
			setShouldShowWelcomeCard(true);
		}, 1000);
	};

	return (
		<Box h={SCREEN_HEIGHT} overflow="hidden">
			{/* Keep intro and welcome page stacked, then animate the whole screen upward. */}
			<MotiView
				animate={{ translateY: shouldShowWelcomeCard ? -SCREEN_HEIGHT : 0 }}
				transition={{
					type: "timing",
					duration: 1250,
					easing: Easing.bezier(0.75, 0.0, 0.25, 1.0),
				}}
				style={{ height: SCREEN_HEIGHT * 2 }}
			>
				<Center h={SCREEN_HEIGHT} bg="#F2F8FF" px="$6">
					<VStack space="lg" alignItems="center" w="$full">
						<Text size="2xl" textAlign="center" color="#2E5F8A" style={{ fontFamily: "RobotoMedium" }}>
							Welcome to Lumière
						</Text>
						<VStack w="$full" alignItems="center" space="md">
							<LottieView
								source={require("../../assets/animations/Welcome.json")}
								autoPlay
								loop={false}
								style={{ width: "100%", height: SCREEN_HEIGHT * 0.32 }}
							/>
							<LottieView
								source={require("../../assets/animations/Live chatbot.json")}
								autoPlay
								loop={false}
								onAnimationFinish={handleLiveChatAnimationFinished}
								style={{ width: "100%", height: SCREEN_HEIGHT * 0.32 }}
							/>
						</VStack>
						<Text size="lg" textAlign="center" color="#2E5F8A" style={{ fontFamily: "RobotoMedium" }}>
							Analysing cosmetic ingredients with AI.
						</Text>
					</VStack>
				</Center>

				<Center h={SCREEN_HEIGHT} bg="#F2F8FF">
					<Box
						position="absolute"
						top={-80}
						right={-40}
						w={220}
						h={220}
						borderRadius={999}
						bg="#D8ECFF"
						opacity={0.9}
					/>
					<Box
						position="absolute"
						bottom={-70}
						left={-35}
						w={180}
						h={180}
						borderRadius={999}
						bg="#BFDFFF"
						opacity={0.35}
					/>

					<Box w="$full" px="$6" py="$10">
						<VStack space="2xl">
							<VStack space="xs">
								<HStack justifyContent="space-between" alignItems="center">
									<Text pl="$1" size="6xl" style={{ fontFamily: "DancingScript", color: "#204C78" }}>
										Lumière
									</Text>

									<Box
										w="$9"
										h="$9"
										alignItems="center"
										justifyContent="center"
										borderRadius={999}
										bg="#E6F2FF"
									>
										<AntDesign name="star" size={18} color="#4A90D9" />
									</Box>
								</HStack>
								<Divider mt={-6} bg="#C8E0F8" />
							</VStack>

							<Box
								bg="#F9FCFF"
								borderRadius="$2xl"
								p="$5"
								style={{
									shadowColor: "#4A90D9",
									shadowOpacity: 0.12,
									shadowOffset: { width: 0, height: 12 },
									shadowRadius: 18,
									elevation: 5,
								}}
							>
								<VStack space="lg">
									<VStack space="sm">
										<Text size="4xl" style={{ fontFamily: "Roboto", color: "#261A10" }}>
											Welcome to Lumière
										</Text>
										<Text size="md" color="#57799B" style={{ fontFamily: "Roboto" }}>
											Stay ahead of flare-ups with prevention-first skincare guidance.
										</Text>
									</VStack>

									<VStack space="sm">
										<HStack alignItems="center" space="sm">
											<AntDesign name="check-circle" size={18} color="#4A90D9" />
											<Text size="sm" color="#2E5F8A" style={{ fontFamily: "Roboto" }}>
												Spot potential triggers earlier
											</Text>
										</HStack>
										<HStack alignItems="center" space="sm">
											<AntDesign name="check-circle" size={18} color="#4A90D9" />
											<Text size="sm" color="#2E5F8A" style={{ fontFamily: "Roboto" }}>
												Understand irritants before reactions
											</Text>
										</HStack>
										<HStack alignItems="center" space="sm">
											<AntDesign name="check-circle" size={18} color="#4A90D9" />
											<Text size="sm" color="#2E5F8A" style={{ fontFamily: "Roboto" }}>
												Understand cosmetic ingredients
											</Text>
										</HStack>
									</VStack>
								</VStack>
							</Box>

							<VStack space="md">
								<Button
									size="lg"
									bg="#4A90D9"
									borderRadius="$xl"
									onPress={() => navigation.navigate("RegisterScreen")}
								>
									<ButtonText color="#F7FBFF" style={{ fontFamily: "Roboto" }}>
										Create my account
									</ButtonText>
								</Button>

								<Button
									size="lg"
									variant="outline"
									borderRadius="$xl"
									borderColor="#A8CFF5"
									onPress={() => navigation.navigate("LoginScreen")}
								>
									<ButtonText color="#2E5F8A" style={{ fontFamily: "Roboto" }}>
										I already have an account
									</ButtonText>
								</Button>
							</VStack>
						</VStack>
					</Box>
				</Center>
			</MotiView>
		</Box>
	);
}
