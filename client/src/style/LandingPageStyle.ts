import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	// Page scaffolding
	screen: {
		flex: 1,
		backgroundColor: "#ffffff",//will have to mess around with it more
		
	},
	scrollContent: {
		paddingTop: 28,
		paddingHorizontal: 3,
		paddingBottom: 180,
	},
	// Header
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	brandWrap: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	brandLogoWrap: {
		width: 44,
		height: 44,
		borderRadius: 22,
		borderWidth: 1,
		borderColor: "#CFCFCF",
		overflow: "hidden",
	},
	brandLogo: {
		width: "100%",
		height: "100%",
	},
	headerActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	bellWrap: {
		position: "relative",
	},
	badge: {
		position: "absolute",
		top: -7,
		right: -8,
		width: 18,
		height: 18,
		borderRadius: 9,
		backgroundColor: "#C60000",
		alignItems: "center",
		justifyContent: "center",
	},
	avatar: {
		width: 32,
		height: 32,
		borderRadius: 16,
		opacity: 0.95,
	},
	divider: {
		height: 1,
		backgroundColor: "#DDDDDD",
		marginTop: 0,
		marginBottom: 12,
	},
	// Switch profile card
	switchProfileCard: {
		backgroundColor: "#E7ECF1",
		borderWidth: 1,
		borderColor: "#d1e2f0",
		borderRadius: 18,
		padding: 10,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		marginBottom: 16,
	},
	switchAvatar: {
		width: 42,
		height: 42,
		borderRadius: 21,
	},
	switchCopy: {
		flex: 1,
	},
	// Reusable section heading row
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 10,
	},
	// Past analysis grid
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		rowGap: 8,
		marginBottom: 16,
	},
	analysisPage: {
		paddingTop: 2,
	},
	analysisCard: {
		width: "32.2%",
		height: 132,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#D6D6D6",
		overflow: "hidden",
		backgroundColor: "#F8F8F8",
	},
	analysisImageWrap: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 8,
	},
	analysisImage: {
		width: "100%",
		height: "90%",
		borderRadius: 10,
		opacity: 0.85,
	},
	analysisPlaceholder: {
		backgroundColor: "transparent",
		borderColor: "#88c2ff",
		borderWidth: 1,
	},
	analysisImagePlaceholder: {
		width: "100%",
		height: "90%",
		borderRadius: 10,
		backgroundColor: "#DADADA",
	},
	analysisImagePlaceholderPromptWrap: {
		width: "100%",
		height: "90%",
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 8,
		backgroundColor: "transparent",
		borderWidth: 1.5,
		borderColor: "#9FC1EA",
		borderStyle: "dashed",
		gap: 2,
	},
	analysisPlaceholderIconWrap: {
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: "#6DA7E8",
		alignItems: "center",
		justifyContent: "center",
	},
	cardFooter: {
		paddingHorizontal: 8,
		paddingBottom: 5,
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	cardTitle: {
		flex: 1,
	},
	pageDotsRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		marginTop: 2,
		marginBottom: 16,
	},
	pageDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: "#B8C3CC",
	},
	pageDotActive: {
		width: 14,
		backgroundColor: "#556575",
	},
	editButton: {
		height: 34,
	},
	editText: {
		fontSize: 13,
		lineHeight: 14,
		fontFamily: "RobotoMedium",
	},
	// Preferences badges
	preferenceRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	tagCircle: {
		width: 56,
		height: 56,
		borderRadius: 28,
		borderWidth: 2,
		borderColor: "#111111",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 4,
	},
	tagText: {
		textAlign: "center",
		marginTop: 2,
	},
	// Conditions cards
	conditionsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 8,
	},
	conditionCard: {
		flex: 1,
		borderWidth: 1,
		borderColor: "#D3D3D3",
		borderRadius: 12,
		padding: 9,
		backgroundColor: "#FFFFFF",
	},
	// Bottom navigation bar
	bottomNav: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		height: 92,
		backgroundColor: "#C6D8E5",
		borderTopWidth: 1,
		borderTopColor: "#AEC3D3",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
		paddingHorizontal: 10,
		paddingBottom: 6,
	},
	bottomItem: {
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		minWidth: 70,
	},
	scanWrap: {
		marginTop: -34,
	},
	scanButton: {
		width: 86,
		height: 86,
		borderRadius: 43,
		backgroundColor: "#F8F8F8",
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#88B9E8",
		shadowOpacity: 0.55,
		shadowRadius: 16,
		shadowOffset: { width: 0, height: 8 },
		elevation: 8,
	},
});
