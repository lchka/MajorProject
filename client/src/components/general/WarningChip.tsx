import React from "react";
import { Box, Text } from "@gluestack-ui/themed";
import type { EvaluationStatus } from "../../types/evaluationContext.type";
//	Component for displaying a warning chip that indicates the risk level of an ingredient or product based on its evaluation status. The component accepts props for the status and an optional label, and it normalizes the status value to ensure it falls within expected categories (safe, caution, avoid, unknown). The chip is styled with specific colors for text and background based on the status, providing a clear visual indication of the risk level. If the status is unknown or not provided, it defaults to a neutral styling to indicate that the risk level cannot be determined.
const statusColorByValue: Record<EvaluationStatus, string> = {
	safe: "#2F8451",
	caution: "#8A6200",
	avoid: "#AF2E2E",
};

const statusBgByValue: Record<EvaluationStatus, string> = {
	safe: "#EAF7EF",
	caution: "#FFF5DE",
	avoid: "#FDEBEC",
};

export type WarningChipStatus = EvaluationStatus | "unknown";

type WarningChipProps = {
	status?: string | null;
	label?: string;
};

export const normalizeWarningStatus = (value?: string | null): WarningChipStatus => {
	if (!value) {
		return "unknown";
	}

	const normalized = value.toLowerCase();
	if (normalized === "safe" || normalized === "caution" || normalized === "avoid") {
		return normalized;
	}

	return "unknown";
};

export default function WarningChip({ status, label }: WarningChipProps) {
	const normalizedStatus = normalizeWarningStatus(status);
	const color = normalizedStatus === "unknown" ? "#617386" : statusColorByValue[normalizedStatus];
	const backgroundColor = normalizedStatus === "unknown" ? "#EEF3F8" : statusBgByValue[normalizedStatus];

	return (
		<Box px="$2" py="$0.5" borderRadius={999} bg={backgroundColor}>
			<Text fontSize={11} lineHeight={14} color={color} fontFamily="RobotoMedium">
				{(label ?? normalizedStatus).toUpperCase()}
			</Text>
		</Box>
	);
}
