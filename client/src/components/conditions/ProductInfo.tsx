import React from "react";
import { Box, Text } from "@gluestack-ui/themed";
import type { EvaluationStatus } from "../../services/evaluationContextService";

type ProductInfoProps = {
	productName: string;
	summary: string;
	status?: EvaluationStatus | null;
	isProcessing?: boolean;
};

const statusCardColor: Record<EvaluationStatus, string> = {
	safe: "#E6F5EC",
	caution: "#FFF6E5",
	avoid: "#FDEAEA",
};

const statusTextColor: Record<EvaluationStatus, string> = {
	safe: "#1C6D3F",
	caution: "#8A5A00",
	avoid: "#A22626",
};

export default function ProdouctInfo({
	productName,
	summary,
	status,
	isProcessing = false,
}: ProductInfoProps) {
	return (
		<Box mt="$3" alignItems="center" px="$1">
			<Text
				fontSize={20}
				lineHeight={24}
				color="#152433"
				fontFamily="RobotoMedium"
				textAlign="center"
			>
				{productName}
			</Text>

			{status ? (
				<Box mt="$2" bg={statusCardColor[status]} borderRadius={12} px="$3" py="$2">
					<Text
						fontFamily="RobotoMedium"
						fontSize={13}
						lineHeight={18}
						color={statusTextColor[status]}
					>
						{`Overall status: ${status.toUpperCase()}`}
					</Text>
				</Box>
			) : null}

			<Text
				mt={status ? "$2" : "$1"}
				fontSize={12}
				lineHeight={16}
				color={isProcessing ? "#4F6E8C" : "#637384"}
				fontFamily="Roboto"
				textAlign="center"
			>
				{summary}
			</Text>
		</Box>
	);
}
