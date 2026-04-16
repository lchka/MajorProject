import React from "react";
import LottieView from "lottie-react-native";
import { AnimatePresence, MotiView, MotiText } from "moti";
import { Box } from "@gluestack-ui/themed";

type LoadingStage = {
	key: "ai" | "files" | "hourglass";
	message: string;
	durationMs: number | null;
};

const STAGES: LoadingStage[] = [
	{
		key: "ai",
		message: "Analyzing your skin profile",
		durationMs: 4000,
	},
	{
		key: "files",
		message: "Matching ingredients with trusted research",
		durationMs: 4000,
	},
	{
		key: "hourglass",
		message: "Finalising your results",
		durationMs: null,
	},
];

const getStageSource = (stageKey: LoadingStage["key"]) => {
	if (stageKey === "ai") {
		return require("../../../assets/animations/loading_ai.json");
	}
	if (stageKey === "files") {
		return require("../../../assets/animations/loading_Files.json");
	}
	return require("../../../assets/animations/hourglass_loading.json");
};

export default function EvaluationLoading() {
	const [stageIndex, setStageIndex] = React.useState(0);

	React.useEffect(() => {
		const stage = STAGES[stageIndex];
		if (stage.durationMs === null) return;

		const timer = setTimeout(() => {
			setStageIndex((current) =>
				current >= STAGES.length - 1 ? current : current + 1
			);
		}, stage.durationMs);

		return () => clearTimeout(timer);
	}, [stageIndex]);

	const currentStage = STAGES[Math.min(stageIndex, STAGES.length - 1)];
	const currentSource = getStageSource(currentStage.key);
	const animationSize = currentStage.key === "files" ? 390 : 270;
	const animationBoxSize = currentStage.key === "files" ? 360 : 300;

	const progress = ((stageIndex + 1) / STAGES.length) * 100;

	return (
		<Box flex={1} bg="#F8FBFF" alignItems="center" justifyContent="center" px="$6">
			<Box
				w="$full"
				maxWidth={390}
				bg="#FFFFFF"
				borderRadius={20}
				borderWidth={1}
				borderColor="#E3ECF5"
				alignItems="center"
				py="$7"
				px="$5"
			>
				{/* Animation */}
				<Box
					alignItems="center"
					justifyContent="center"
					style={{ width: animationBoxSize, height: animationBoxSize }}
				>
					<AnimatePresence exitBeforeEnter>
						<MotiView
							key={currentStage.key}
							from={{ opacity: 0, scale: 0.92 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.92 }}
							transition={{ type: "timing", duration: 500 }}
						>
							<LottieView
								source={currentSource}
								autoPlay
								loop
								style={{ width: animationSize, height: animationSize }}
							/>
						</MotiView>
					</AnimatePresence>
				</Box>

				{/* Message */}
				<MotiText
					key={currentStage.message}
					from={{ opacity: 0, translateY: 6 }}
					animate={{ opacity: 1, translateY: 0 }}
					transition={{ type: "timing", duration: 400 }}
					style={{
						marginTop: 18,
						textAlign: "center",
						fontSize: 16,
						lineHeight: 22,
						color: "#223446",
						fontFamily: "RobotoMedium",
					}}
				>
					{currentStage.message}
				</MotiText>

				{/* Progress bar */}
				<Box mt="$4" w="$full">
					<Box h={6} bg="#E6ECF2" borderRadius={999} overflow="hidden">
						<MotiView
							from={{ width: "0%" }}
							animate={{ width: `${progress}%` }}
							transition={{ type: "timing", duration: 600 }}
							style={{
								height: 6,
								backgroundColor: "#58CCED",
								borderRadius: 999,
							}}
						/>
					</Box>
				</Box>

				{/* Step indicators */}
				<Box flexDirection="row" mt="$3" style={{ gap: 6 }}>
					{STAGES.map((_, i) => (
						<Box
							key={i}
							width={6}
							height={6}
							borderRadius={3}
							bg={i <= stageIndex ? "#58CCED" : "#D6E3EF"}
						/>
					))}
				</Box>
			</Box>
		</Box>
	);
}