import React from "react";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Box, Image, Pressable, ScrollView, Text } from "@gluestack-ui/themed";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import EditButton from "../components/Buttons/EditButton";
import { AuthStackParamList } from "../types/navigation";
import { styles } from "../style/LandingPageStyle";

const AUTH_TOKEN_KEY = "authToken";

// Temporary product cards used to shape the 3-column past analysis grid.
const pastAnalysis = [
	{
		title: "Pantene Grow...",
		image:
			"https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=500&q=60",
	},
	{
		title: "CeraVe Blem...",
		image:
			"https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=500&q=60",
	},
	{
		title: "Sanctuary Sp...",
		image:
			"https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=500&q=60",
	},
	{
		title: "Olaplex N04...",
		image:
			"https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=500&q=60",
	},
	{
		title: "Pantene Pro..",
		image:
			"https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=500&q=60",
	},
	{
		title: "The Ordinary...",
		image:
			"https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=500&q=60",
	},
	{
		title: "Pantene Grow...",
		image:
			"https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=500&q=60",
	},
	{
		title: "CeraVe Ble...",
		image:
			"https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=500&q=60",
	},
	{
		title: "Sanctuary Spa...",
		image:
			"https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=500&q=60",
	},
];

const conditionCards = [
	{ title: "Dermatitis", level: "MODERATE" },
	{ title: "Eczema", level: "SEVERE" },
];

export default function LandingScreen() {
	const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
	const [analysisPage, setAnalysisPage] = React.useState(0);
	const [analysisViewportWidth, setAnalysisViewportWidth] = React.useState(0);

	const analysisPages = React.useMemo(() => {
		const pageSize = 9;
		const pageCount = 3;

		return Array.from({ length: pageCount }, (_, pageIndex) =>
			Array.from({ length: pageSize }, (_, cardIndex) => {
				const sourceIndex = (pageIndex * 3 + cardIndex) % pastAnalysis.length;
				return pastAnalysis[sourceIndex];
			})
		);
	}, []);

	// Clears local auth state and routes back to the login flow.
	const handleSignOut = async () => {
		await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
		navigation.navigate("LoginScreen");
	};

	return (
		<Box style={styles.screen} mt="$3.5">
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				{/* Top brand and utility icons */}
				<Box py="$3.5" mb="$0" style={styles.headerRow}>
					<Box style={styles.brandWrap}>
						
						<Text pl="$1" fontSize={34} lineHeight={34} fontFamily="DancingScript" color="#4E4E4E">
							Lumière
						</Text>
					</Box>

					<Box  style={styles.headerActions}>
						{/* search icon */}
						<Box px="$1" >
						<Feather  name="search" size={28} color="#111111" />
						</Box>
						
						<Box mx="$2" style={styles.bellWrap}>
							 <Feather name="bell" size={28} color="#111111" />
							<Box style={styles.badge}>
								<Text fontSize={10} lineHeight={10} fontWeight="$bold" color="#FFFFFF">2</Text>
							</Box>
						</Box>
						<Pressable onPress={handleSignOut}>
							<Image
								source={require("../../assets/icon.png")}
								style={styles.avatar}
								resizeMode="cover"
							/>
						</Pressable>
					</Box>
				</Box>

				<Box style={styles.divider} />

				{/* Profile quick switch card */}
				<Pressable my="$2" style={styles.switchProfileCard}>
					<Image source={require("../../assets/icon.png")} style={styles.switchAvatar} />
					<Box style={styles.switchCopy}>
						<Text fontSize={13} fontFamily="Roboto" color="#6D7073">HI, ICHKA!</Text>
						<Text pt="$2"fontSize={22} lineHeight={18} fontFamily="Roboto" fontWeight="semibold" color="#151515">Switch Profile</Text>
					</Box>
					<AntDesign name="right" size={16} color="#111111" />
				</Pressable>

				{/* Past analysis cards */}
				<Box my="$2"style={styles.sectionHeader}>
					<Text fontSize={22} pt="$2" lineHeight={22} fontFamily="RobotoMedium" color="#151515">Past Analysis</Text>
					<EntypoDots  />
				</Box>

				{/* Product cards are rendered from fixture data until API wiring is ready. */}
				<Box
					onLayout={(event) => {
						setAnalysisViewportWidth(event.nativeEvent.layout.width);
					}}
				>
					<ScrollView
						horizontal
						pagingEnabled
						showsHorizontalScrollIndicator={false}
						onMomentumScrollEnd={(event) => {
							if (!analysisViewportWidth) {
								return;
							}

							const pageIndex = Math.round(event.nativeEvent.contentOffset.x / analysisViewportWidth);
							setAnalysisPage(pageIndex);
						}}
					>
						{analysisPages.map((pageItems, pageIndex) => (
							<Box
								key={`analysis-page-${pageIndex}`}
								style={[
									styles.analysisPage,
									analysisViewportWidth ? { width: analysisViewportWidth } : null,
								]}
							>
								<Box style={styles.grid}>
									{pageItems.map((item, cardIndex) => (
										<Pressable key={`${item.title}-${pageIndex}-${cardIndex}`} style={styles.analysisCard}>
											<Box style={styles.analysisImageWrap}>
												<Image
													source={{ uri: item.image }}
													style={styles.analysisImage}
													resizeMode="cover"
												/>
											</Box>
											<Box style={styles.cardFooter}>
												<Text numberOfLines={1} style={styles.cardTitle} pt="$1" fontWeight={600} fontSize={14} lineHeight={12} fontFamily="Roboto" color="#121212">
													{item.title}
												</Text>
												<AntDesign name="right" size={14} color="#111111" />
											</Box>
										</Pressable>
									))}
								</Box>
							</Box>
						))}
					</ScrollView>
					<PageDots total={analysisPages.length} activeIndex={analysisPage} />
				</Box>

				{/* Preferences summary with editable badges */}
				<Box style={styles.sectionHeader}>
					<Text fontSize={17} lineHeight={22} fontFamily="RobotoMedium" color="#151515">Preferences Overview</Text>
					<EditButton width={100} textStyle={styles.editText} style={styles.editButton} />
				</Box>

				<Box style={styles.preferenceRow}>
					<CircleTag text="VEGAN" icon="leaf" />
					<CircleTag text="3% alc" icon="water" />
					<CircleTag text="ORGANIC" icon="flower-tulip" />
					<CircleTag text="PARABIN FREE" icon="rabbit" />
					<CircleTag text="" icon="plus" />
				</Box>

				{/* Conditions summary cards */}
				<Box style={styles.sectionHeader}>
					<Text fontSize={17} lineHeight={22} fontFamily="RobotoMedium" color="#151515">Conditions Overview</Text>
					<EditButton width={100} textStyle={styles.editText} style={styles.editButton} />
				</Box>

				{/* Conditions share a compact card layout for consistent scanning. */}
				<Box style={styles.conditionsRow}>
					{conditionCards.map((item) => (
						<Box key={item.title} style={styles.conditionCard}>
							<Text fontSize={11} fontFamily="RobotoMedium" color="#111111" mb="$0.5">{item.title}</Text>
							<Text fontSize={8} fontFamily="RobotoMedium" color="#222222">{item.level}</Text>
							<Text mt="$0.5" fontSize={7} fontFamily="Roboto" color="#666666">DATED ADDED: 30.3.2026</Text>
						</Box>
					))}
				</Box>
			</ScrollView>

			{/* Sticky bottom navigation */}
			<Box style={styles.bottomNav}>
				<BottomIcon label="HOME" icon={<Feather name="home" size={22} color="#66707A" />} />
				<BottomIcon label="UPLOAD" icon={<Feather name="upload-cloud" size={22} color="#66707A" />} />
				<Box style={styles.scanWrap}>
					<Box style={styles.scanButton}>
						<MaterialCommunityIcons name="scan-helper" size={32} color="#4A5562" />
					</Box>
				</Box>
				<BottomIcon label="MY HISTORY" icon={<Ionicons name="bookmark-outline" size={22} color="#66707A" />} />
				<BottomIcon label="MORE" icon={<Feather name="menu" size={24} color="#66707A" />} />
			</Box>
		</Box>
	);
}

function EntypoDots() {
	// Keeps section-header action icon usage consistent across sections.
	return <AntDesign name="ellipsis" size={28} color="#111111" />;
}

function PageDots({ total, activeIndex }: { total: number; activeIndex: number }) {
	return (
		<Box style={styles.pageDotsRow}>
			{Array.from({ length: total }).map((_, index) => (
				<Box
					key={`page-dot-${index}`}
					style={[styles.pageDot, index === activeIndex ? styles.pageDotActive : null]}
				/>
			))}
		</Box>
	);
}

function CircleTag({
	text,
	icon,
}: {
	text: string;
	icon: "leaf" | "water" | "flower-tulip" | "rabbit" | "plus";
}) {
	// Shared preference badge used in the preferences summary row.
	return (
		<Box style={styles.tagCircle}>
			<MaterialCommunityIcons name={icon} size={28} color="#111111" />
			{text ? <Text style={styles.tagText} fontSize={7} lineHeight={8} fontFamily="RobotoMedium">{text}</Text> : null}
		</Box>
	);
}

function BottomIcon({ label, icon }: { label: string; icon: React.ReactNode }) {
	// Single nav item primitive so icon/label spacing stays uniform.
	return (
		<Box style={styles.bottomItem}>
			{icon}
			<Text fontSize={10} fontFamily="RobotoMedium" color="#66707A">{label}</Text>
		</Box>
	);
}
