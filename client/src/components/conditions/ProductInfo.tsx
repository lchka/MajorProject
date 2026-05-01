import React from "react";
import { Box, Text } from "@gluestack-ui/themed";
import type { EvaluationStatus } from "../../types/evaluationContext.type";
// Component for displaying product information, including the product name, a summary of the evaluation results, and an overall status indicator. The component accepts props for the product name, a summary text, the evaluation status (which can be "safe", "caution", or "avoid"), and a flag indicating whether the evaluation is still processing. Based on the evaluation status, the component displays a colored card with corresponding text to indicate the overall safety of the product, and it adjusts the styling of the summary text if the evaluation is still in progress.
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
