import React from "react";
import { BlurView } from "expo-blur";
import { Box, Pressable, Text, Image } from "@gluestack-ui/themed";

type ImagePreviewProps = {
  imageUri: string;
  onApprove: () => void;
  onRetake: () => void;
};

export default function ImagePreview({
  imageUri,
  onApprove,
  onRetake,
}: ImagePreviewProps) {
  const frameTop = "16%";
  const frameBottom = "30%";
  const frameSide = "14%";

  return (
    <Box flex={1} bg="#000000" justifyContent="flex-end">
      {/* Full image in the background */}
      <Box position="absolute" top={0} left={0} right={0} bottom={0}>
        <Image
          source={{ uri: imageUri }}
          alt="Captured image preview"
          style={{ width: "100%", height: "100%", resizeMode: "cover" }}
        />
      </Box>

      {/* Blur outside the preview frame to match camera treatment */}
      <Box pointerEvents="none" position="absolute" top={0} left={0} right={0} bottom={0}>
        <BlurView intensity={46} tint="default" style={{ position: "absolute", top: 0, left: 0, right: 0, height: frameTop }} />
        <BlurView intensity={46} tint="default" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: frameBottom }} />
        <BlurView intensity={46} tint="default" style={{ position: "absolute", top: frameTop, bottom: frameBottom, left: 0, width: frameSide }} />
        <BlurView intensity={46} tint="default" style={{ position: "absolute", top: frameTop, bottom: frameBottom, right: 0, width: frameSide }} />
      </Box>

      {/* Clear, smaller preview window */}
      <Box
        position="absolute"
        top={frameTop}
        left={frameSide}
        right={frameSide}
        bottom={frameBottom}
        borderRadius={28}
        overflow="hidden"
        borderWidth={1}
        borderColor="rgba(255,255,255,0.24)"
        bg="rgba(0,0,0,0.18)"
      >
        <Image
          source={{ uri: imageUri }}
          alt="Captured image preview"
          style={{ width: "100%", height: "100%", resizeMode: "contain" }}
        />
      </Box>

      {/* Corner markers for visual consistency with camera */}
      <Box pointerEvents="none" position="absolute" top={frameTop} left={frameSide} right={frameSide} bottom={frameBottom} borderRadius={28}>
        <Box position="absolute" top={10} left={10} w={28} h={28} borderTopWidth={3} borderLeftWidth={3} borderColor="rgba(255,255,255,0.9)" borderTopLeftRadius={16} />
        <Box position="absolute" top={10} right={10} w={28} h={28} borderTopWidth={3} borderRightWidth={3} borderColor="rgba(255,255,255,0.9)" borderTopRightRadius={16} />
        <Box position="absolute" bottom={10} left={10} w={28} h={28} borderBottomWidth={3} borderLeftWidth={3} borderColor="rgba(255,255,255,0.9)" borderBottomLeftRadius={16} />
        <Box position="absolute" bottom={10} right={10} w={28} h={28} borderBottomWidth={3} borderRightWidth={3} borderColor="rgba(255,255,255,0.9)" borderBottomRightRadius={16} />
      </Box>

      {/* Action Buttons */}
      <Box
        px="$4"
        pb="$6"
        pt="$4"
        bg="rgba(7, 16, 24, 0.82)"
      >
        <Text fontSize={16} color="#FFFFFF" fontFamily="RobotoMedium" textAlign="center" mb="$3">
          Looks good?
        </Text>

        <Pressable
          onPress={onApprove}
          height={54}
          borderRadius={16}
          bg="#4D9FD8"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize={16} color="#FFFFFF" fontFamily="RobotoMedium">
            Approve & Analyze
          </Text>
        </Pressable>

        <Pressable
          onPress={onRetake}
          height={54}
          borderRadius={16}
          bg="transparent"
          borderWidth={1}
          borderColor="#E2E8F0"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize={16} color="#94A3B8" fontFamily="RobotoMedium">
            Retake Photo
          </Text>
        </Pressable>
      </Box>
    </Box>
  );
}
