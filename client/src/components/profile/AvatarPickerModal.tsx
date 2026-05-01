import React from "react";
import {
  Box,
  HStack,
  Image,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalHeader,
  Pressable,
  ScrollView,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import CreateButton from "../Buttons/CreateButton";
// Component for an avatar picker modal that allows users to choose from a selection of built-in avatars or continue without selecting an image. The component accepts props for controlling the open state of the modal, a list of avatar options with their IDs and image sources, the currently selected avatar ID, and callback functions for handling avatar selection, continuing without an image, and closing the modal. The modal displays a header with instructions, a scrollable grid of avatar options that users can select from, and buttons for proceeding without an avatar or closing the modal. The selected avatar is visually highlighted, and the component provides a user-friendly interface for customizing the user's profile with an avatar image.
export type AvatarOption = {
  id: string;
  source: number;
};

type AvatarPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  avatarOptions: AvatarOption[];
  selectedAvatarId: string | null;
  onSelectAvatar: (avatar: AvatarOption) => void;
  onContinueWithoutImage: () => void;
  loading?: boolean;
};

export default function AvatarPickerModal({
  isOpen,
  onClose,
  avatarOptions,
  selectedAvatarId,
  onSelectAvatar,
  onContinueWithoutImage,
  loading = false,
}: AvatarPickerModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent
        bg="#FFFFFF"
        borderRadius={20}
        px="$4"
        pt="$3"
        pb="$4"
        w="$full"
        maxWidth={560}
      >
        <ModalHeader px="$1" pt="$1" pb="$2">
          <VStack>
            <Text fontSize={22} lineHeight={26} color="#111827" fontFamily="RobotoMedium">
              Choose an avatar
            </Text>
            <Text mt="$1" fontSize={13} lineHeight={18} color="#6B7280">
              Pick one of the built-in avatars, or continue without an image.
            </Text>
          </VStack>
        </ModalHeader>

        <ModalBody p="$0">
          <ScrollView
            horizontal={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              paddingBottom: 8,
              rowGap: 12,
            }}
          >
            {avatarOptions.map((avatar) => {
              const isSelected = avatar.id === selectedAvatarId;
              return (
                <Pressable
                  key={avatar.id}
                  onPress={() => {
                    onSelectAvatar(avatar);
                  }}
                  style={{
                    width: "31%",
                    alignItems: "center",
                    paddingVertical: 8,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: isSelected ? "#58CCED" : "#D8E1EA",
                    backgroundColor: isSelected ? "#F2FAFF" : "#FFFFFF",
                  }}
                >
                  <Image
                    source={avatar.source}
                    alt="Avatar option"
                    style={{ width: 58, height: 58, borderRadius: 29 }}
                  />
                </Pressable>
              );
            })}
          </ScrollView>

          <HStack mt="$4" space="md">
            <Box flex={1}>
              <CreateButton
                preset="outline"
                label="No Avatar"
                onPress={onContinueWithoutImage}
                disabled={loading}
                isPulsing={false}
              />
            </Box>
            <Box flex={1}>
              <CreateButton
                label="Choose later"
                onPress={onClose}
                disabled={loading}
                isPulsing={false}
              />
            </Box>
          </HStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}