import React from "react";
import { TextInput } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Box, Pressable, Text } from "@gluestack-ui/themed";
// NOT USED ANYWHERE
export type UniversalSearchResult = {
	key: string;
	title: string;
	subtitle?: string;
	tag?: string;
	meta?: {
		type: "profile" | "evaluation" | "product";
		profileId?: string;
		evaluationContextId?: string;
		productId?: string;
	};
};

type UniversalSearchProps = {
	isOpen: boolean;
	query: string;
	results: UniversalSearchResult[];
	placeholder?: string;
	emptyLabel?: string;
	onQueryChange: (value: string) => void;
	onClear?: () => void;
	onClose?: () => void;
	onSelectResult?: (result: UniversalSearchResult) => void;
};

export default function UniversalSearch({
	isOpen,
	query,
	results,
	placeholder = "Search products, profiles, evaluations",
	emptyLabel = "No matches yet",
	onQueryChange,
	onClear,
	onClose,
	onSelectResult,
}: UniversalSearchProps) {
	return (
		<Box position="relative" flex={1} w="100%">
			<Box
				flexDirection="row"
				alignItems="center"
				bg="#F4F7FB"
				borderRadius={18}
				px="$3"
				py="$2"
				minHeight={48}
				borderWidth={1}
				borderColor="#DDE6F0"
			>
				<Feather name="search" size={16} color="#64748B" />
				<TextInput
					value={query}
					onChangeText={onQueryChange}
					placeholder={placeholder}
					placeholderTextColor="#94A3B8"
					style={{
						flex: 1,
						marginLeft: 10,
						fontSize: 14,
						color: "#111827",
						paddingVertical: 0,
					}}
					returnKeyType="search"
					autoCapitalize="none"
					autoCorrect={false}
					clearButtonMode="never"
					autoFocus={isOpen}
					onBlur={onClose}
				/>
				{query.length > 0 ? (
					<Pressable onPress={onClear} px="$1">
						<Feather name="x" size={16} color="#64748B" />
					</Pressable>
				) : null}
				{onClose ? (
					<Pressable onPress={onClose} px="$1">
						<Feather name="chevron-up" size={16} color="#64748B" />
					</Pressable>
				) : null}
			</Box>

			{isOpen ? (
				<Box
					position="absolute"
					top={56}
					left={0}
					right={0}
					bg="white"
					borderRadius={16}
					borderWidth={1}
					borderColor="#E2E8F0"
					shadowColor="#000"
					shadowOpacity={0.08}
					shadowRadius={12}
					elevation={3}
					zIndex={20}
				>
					{results.length === 0 ? (
						<Text px="$4" py="$4" fontSize={13} color="#94A3B8">
							{emptyLabel}
						</Text>
					) : (
						results.map((result, index) => (
							<Pressable
								key={result.key}
								onPress={() => onSelectResult?.(result)}
								px="$4"
								py="$3"
								borderBottomWidth={index === results.length - 1 ? 0 : 1}
								borderBottomColor="#EEF2F7"
							>
								<Text fontSize={14} color="#0F172A" fontFamily="RobotoMedium">
									{result.title}
								</Text>
								{result.subtitle ? (
									<Text fontSize={12} color="#64748B">
										{result.subtitle}
									</Text>
								) : null}
								{result.tag ? (
									<Text fontSize={11} color="#94A3B8" mt="$1">
										{result.tag}
									</Text>
								) : null}
							</Pressable>
						))
					)}
				</Box>
			) : null}
		</Box>
	);
}
