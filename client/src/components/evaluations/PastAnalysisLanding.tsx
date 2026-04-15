import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { Box, Text } from "@gluestack-ui/themed";
import { styles } from "../../style/LandingPageStyle";
import PastAnalysis from "./PastAnalysis";

type PastAnalysisLandingProps = {
	profileId?: string | null;
	title?: string;
};

export default function PastAnalysisLanding({
	profileId,
	title = "Past Analysis",
}: PastAnalysisLandingProps) {
	const [selectedProfileId, setSelectedProfileId] = React.useState<string | null>(
		profileId ?? null,
	);

	React.useEffect(() => {
		setSelectedProfileId(profileId ?? null);
	}, [profileId]);

	return (
		<>
			<Box my="$2" style={styles.sectionHeader}>
				<Text
					fontSize={22}
					pt="$2"
					lineHeight={22}
					fontFamily="RobotoMedium"
					color="#151515"
				>
					{title}
				</Text>
				<Feather name="more-horizontal" size={28} color="#111111" />
			</Box>

			<PastAnalysis
				key={selectedProfileId ?? "past-analysis-no-profile"}
				profileId={selectedProfileId}
			/>
		</>
	);
}
