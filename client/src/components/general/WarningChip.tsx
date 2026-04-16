import React from "react";
import { Box, Text } from "@gluestack-ui/themed";
import type { EvaluationStatus } from "../../services/evaluationContextService";

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
