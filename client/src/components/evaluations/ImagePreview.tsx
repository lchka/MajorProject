import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { Box, Pressable, Text, Image } from "@gluestack-ui/themed";
// Component for displaying a preview of an image taken by the user, allowing them to either approve the image for analysis or retake it. The component accepts props for the image URI, callback functions for approving and retaking the image, and an optional callback for going back to the previous screen. The layout includes a darkened background with the image displayed in a focus frame, and camera-style controls at the bottom for user actions. The component is designed to provide a clear and intuitive interface for users to review their captured image before proceeding with the evaluation process.
type ImagePreviewProps = {
  imageUri: string;
  onApprove: () => void;
  onRetake: () => void;
  onBack?: () => void; 
};

export default function ImagePreview({
  imageUri,
  onApprove,
  onRetake,
  onBack,
}: ImagePreviewProps) {
  const frameTop = "16%";
  const frameBottom = "26%";
  const frameSide = "10%";

  return (
    <Box flex={1} bg="#000">
      {/* Background */}
      <Image
        source={{ uri: imageUri }}
        alt="Preview"
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          resizeMode: "cover",
        }}
      />

      {/* Dark overlay */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="rgba(0,0,0,0.45)"
      />

      {/* ✅ BACK BUTTON (THIS WAS MISSING) */}
      <Pressable
        onPress={onBack}
        position="absolute"
        top={60}
        left={20}
        w={40}
        h={40}
        borderRadius={999}
        bg="rgba(0,0,0,0.5)"
        alignItems="center"
        justifyContent="center"
      >
        <Feather name="arrow-left" size={20} color="#fff" />
      </Pressable>

      {/* Focus frame */}
      <Box
        position="absolute"
        top={frameTop}
        left={frameSide}
        right={frameSide}
        bottom={frameBottom}
        borderRadius={24}
        overflow="hidden"
      >
        <Image
          source={{ uri: imageUri }}
          alt="Preview"
          style={{ width: "100%", height: "100%", resizeMode: "contain" }}
        />

        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          borderRadius={24}
          borderWidth={1}
          borderColor="rgba(255,255,255,0.6)"
        />
      </Box>

      {/* ✅ BOTTOM CAMERA-STYLE CONTROLS */}
      <Box
        position="absolute"
        bottom={40}
        left={0}
        right={0}
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        px="$6"
      >
        {/* Retake (left) */}
        <Pressable
          onPress={onRetake}
          alignItems="center"
          justifyContent="center"
        >
          <Feather name="rotate-ccw" size={26} color="#fff" />
          <Text fontSize={12} color="#CBD5F5" mt="$1">
            Retake
          </Text>
        </Pressable>

        {/* Analyse (center - main action) */}
        <Pressable
          onPress={onApprove}
          w={70}
          h={70}
          borderRadius={999}
          bg="#fff"
          alignItems="center"
          justifyContent="center"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <Feather name="check" size={28} color="#0F172A" />
        </Pressable>

        {/* Spacer (right for balance) */}
        <Box w={40} />
      </Box>
    </Box>
  );
}