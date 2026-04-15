import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { MotiView } from "moti";
import { Box, Text } from "@gluestack-ui/themed";

type WhyThisResultProps = {
	reasons: string[];
	index?: number;
};

const formatReason = (value: string): string => {
	const trimmed = value.trim();
	if (!trimmed) {
		return "";
	}

	const normalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
	return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
};

export default function WhyThisResult({
	reasons,
	index = 3,
}: WhyThisResultProps) {
	const formattedReasons = reasons.map(formatReason).filter(Boolean);

	if (!formattedReasons.length) {
		return null;
	}

	return (
		<MotiView
			from={{ opacity: 0, translateY: 8 }}
			animate={{ opacity: 1, translateY: 0 }}
			transition={{ type: "timing", duration: 260, delay: 70 + index * 50 }}
		>
			<Box
				mt="$3"
				borderWidth={1}
				borderColor="#E4E6EA"
				bg="#FFFFFF"
				borderRadius={14}
				p="$3"
			>
				<Box flexDirection="row" alignItems="center" mb="$2" style={{ gap: 8 }}>
					<Feather name="message-circle" size={16} color="#42586F" />
					<Text fontSize={14} lineHeight={18} color="#202A36" fontFamily="RobotoMedium">
						Why This Result
					</Text>
				</Box>

				{formattedReasons.map((reason, reasonIndex) => (
					<Box
						key={`${reason}-${reasonIndex}`}
						flexDirection="row"
						alignItems="flex-start"
						bg="#F7FAFD"
						borderWidth={1}
						borderColor="#E4EDF6"
						borderRadius={10}
						px="$2"
						py="$2"
						mb={reasonIndex === formattedReasons.length - 1 ? 0 : 8}
					>
						<Box
							w={20}
							h={20}
							borderRadius={999}
							bg="#DCEAF8"
							alignItems="center"
							justifyContent="center"
							mr="$2"
						>
							<Text fontSize={11} lineHeight={14} color="#35516D" fontFamily="RobotoMedium">
								{reasonIndex + 1}
							</Text>
						</Box>
						<Text
							flex={1}
							fontSize={12}
							lineHeight={18}
							color="#34495E"
							fontFamily="Roboto"
						>
							{reason}
						</Text>
					</Box>
				))}
			</Box>
		</MotiView>
	);
}
