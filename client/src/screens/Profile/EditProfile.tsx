import React from "react";
import { Alert, Image, TextInput } from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  NavigationProp,
  RouteProp,
  useNavigation,
  useFocusEffect,
  useRoute,
} from "@react-navigation/native";
import Feather from "@expo/vector-icons/Feather";
import { Box, Pressable, ScrollView, Text } from "@gluestack-ui/themed";
import BackButton from "../../components/Buttons/BackButton";
import CreateButton from "../../components/Buttons/CreateButton";
import NavBarTop from "../../components/general/NavBarTop";
import ProfileEditBadge from "../../components/profile/ProfileEditBadge";
import PreferencesOverview from "../../components/preferences/AllPreferences";
import profileService, { ProfileImageUploadFile } from "../../services/profileService";
import { AuthStackParamList } from "../../types/navigation";

export default function EditProfileScreen() {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, "EditProfileScreen">>();
  const profileId = route.params?.profileId;
  const profileName = route.params?.profileName?.trim() ?? "";
  const initialProfileAge = route.params?.profileAge?.trim() ?? "";
  const initialProfileImageUri = route.params?.profileImageUri?.trim();
  const profilePreferenceNames = route.params?.profilePreferenceNames;
  const [livePreferenceNames, setLivePreferenceNames] = React.useState<string[]>(
    profilePreferenceNames ?? [],
  );
  const [profileImageUri, setProfileImageUri] = React.useState(initialProfileImageUri);
  const [originalNameValue, setOriginalNameValue] = React.useState(profileName);
  const [nameValue, setNameValue] = React.useState(profileName);
  const [originalAgeValue, setOriginalAgeValue] = React.useState(initialProfileAge);
  const [ageValue, setAgeValue] = React.useState(initialProfileAge);
  const [profileImage, setProfileImage] = React.useState<
    ProfileImageUploadFile | undefined
  >(undefined);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const profileFirstName = nameValue.trim().split(" ")[0]?.trim();
  const previewImageUri = profileImage?.uri ?? profileImageUri;
  const hasNameChanges = nameValue.trim() !== originalNameValue;
  const hasAgeChanges = ageValue.trim() !== originalAgeValue;
  const hasPendingChanges = Boolean(profileImage) || hasNameChanges || hasAgeChanges;

  const handlePickProfileImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to select a profile image.",
      );
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (picked.canceled || !picked.assets.length) {
      return;
    }

    const asset = picked.assets[0];
    const inferredName = asset.fileName ?? `profile-${Date.now()}.jpg`;
    const inferredType = asset.mimeType ?? "image/jpeg";

    setProfileImage({
      uri: asset.uri,
      name: inferredName,
      type: inferredType,
    });
  };

  const handleHeaderBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;

      const refreshPreferences = async () => {
        if (!profileId) {
          if (isMounted) {
            setLivePreferenceNames(profilePreferenceNames ?? []);
          }
          return;
        }

        try {
          const profiles = await profileService.getMyProfile();
          if (!isMounted) {
            return;
          }

          const activeProfile = profiles.find((item) => item.id === profileId);
          setLivePreferenceNames(activeProfile?.preferences?.map((item) => item.name) ?? []);
        } catch {
          if (isMounted) {
            setLivePreferenceNames(profilePreferenceNames ?? []);
          }
        }
      };

      void refreshPreferences();

      return () => {
        isMounted = false;
      };
    }, [profileId, profilePreferenceNames]),
  );

  const handleSaveChanges = React.useCallback(async () => {
    if (!profileId) {
      Alert.alert("Unable to save", "Missing profile id for this edit session.");
      return;
    }

    if (!hasPendingChanges) {
      Alert.alert("No changes", "There are no new changes to save.");
      return;
    }

    if (hasNameChanges && !nameValue.trim()) {
      Alert.alert("Missing info", "Please enter a profile name.");
      return;
    }

    const trimmedName = nameValue.trim();
    const [firstNamePart, ...lastNameParts] = trimmedName.split(/\s+/);
    const parsedFirstName = firstNamePart ?? "";
    const parsedLastName = lastNameParts.join(" ");

    try {
      setIsSaving(true);
      const updatedProfile = await profileService.updateProfile(profileId, {
        ...(profileImage ? { profile_image: profileImage } : {}),
        ...(hasNameChanges
          ? {
              first_name: parsedFirstName,
              last_name: parsedLastName,
            }
          : {}),
        ...(hasAgeChanges ? { age: ageValue.trim() || undefined } : {}),
      });

      setProfileImage(undefined);
      const savedFullName = [updatedProfile.first_name?.trim(), updatedProfile.last_name?.trim()]
        .filter(Boolean)
        .join(" ");
      setNameValue(savedFullName);
      setOriginalNameValue(savedFullName);
      const savedAge = updatedProfile.age?.toString() ?? "";
      setAgeValue(savedAge);
      setOriginalAgeValue(savedAge);
      setProfileImageUri(updatedProfile.profile_image ?? profileImageUri);
      Alert.alert("Success", "Changes saved.");
    } catch {
      Alert.alert("Save failed", "Unable to save changes right now. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [
    ageValue,
    hasAgeChanges,
    hasNameChanges,
    hasPendingChanges,
    nameValue,
    profileId,
    profileImage,
    profileImageUri,
  ]);

  const handleDeleteProfile = React.useCallback(() => {
    if (!profileId) {
      Alert.alert("Unable to remove", "Missing profile id for this edit session.");
      return;
    }

    Alert.alert(
      "Remove Profile",
      "Are you sure you want to remove this profile? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              await profileService.deleteProfile(profileId);
              Alert.alert("Profile removed", "The profile has been deleted.", [
                {
                  text: "OK",
                  onPress: () => navigation.navigate("LandingScreen"),
                },
              ]);
            } catch {
              Alert.alert("Remove failed", "Unable to remove profile right now. Please try again.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  }, [navigation, profileId]);

  return (
    <Box flex={1} bg="#F2F6FA">
      <NavBarTop notificationCount={2} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 190,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Box
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <BackButton onPress={handleHeaderBack} />
          <Text fontSize={24} lineHeight={28} color="#0F172A" fontFamily="RobotoMedium">
            Edit Profile
          </Text>
        </Box>

        <Box
          style={{
            borderRadius: 24,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#E4ECF3",
            paddingVertical: 24,
            paddingHorizontal: 16,
            shadowColor: "#0F172A",
            shadowOpacity: 0.06,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
          }}
          alignItems="center"
          mt="$1"
        >
          <Box style={{ width: 148, height: 148, position: "relative" }}>
            <Pressable
              onPress={handlePickProfileImage}
              style={{
                width: 148,
                height: 148,
                borderRadius: 74,
                backgroundColor: "#D7DEE6",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderWidth: 2,
                borderColor: "#F0F6FC",
              }}
            >
              {previewImageUri ? (
                <Image source={{ uri: previewImageUri }} style={{ width: 148, height: 148 }} />
              ) : null}
            </Pressable>

            <ProfileEditBadge
              sizePreset="large"
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
              }}
            />
          </Box>

          <Box style={{ flexDirection: "row", alignItems: "center", marginTop: 16, gap: 8 }}>
            <Text fontSize={26} lineHeight={30} color="#0F172A" fontFamily="RobotoMedium">
              Name:
            </Text>
            <TextInput
              value={nameValue}
              onChangeText={setNameValue}
              keyboardType="default"
              placeholder="Enter full name"
              placeholderTextColor="#8FA3B8"
              style={{
                minWidth: 180,
                height: 42,
                fontSize: 22,
                fontFamily: "Roboto",
                color: "#0F172A",
                backgroundColor: "#F7FAFD",
                borderWidth: 1,
                borderColor: "#D6E2ED",
                borderRadius: 18,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            />
            <ProfileEditBadge sizePreset="small" />
          </Box>

          <Box style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 }}>
            <Text fontSize={20} lineHeight={30} color="#0F172A" fontFamily="RobotoMedium">
              Age:
            </Text>
            <TextInput
              value={ageValue}
              onChangeText={setAgeValue}
              keyboardType="number-pad"
              placeholder="Enter age"
              placeholderTextColor="#8FA3B8"
              style={{
                minWidth: 120,
                height: 35,
                fontSize: 20,
                fontFamily: "Roboto",
                color: "#0F172A",
                backgroundColor: "#F7FAFD",
                borderWidth: 1,
                borderColor: "#D6E2ED",
                borderRadius: 18,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            />
            <ProfileEditBadge sizePreset="small" />
          </Box>

          <Box w="$full" mt="$4" px="$2">
            <CreateButton
              label={isSaving ? "Saving..." : "Save Changes"}
              onPress={handleSaveChanges}
              disabled={isSaving || !hasPendingChanges}
              isPulsing={false}
            />
          </Box>
        </Box>

        <Box style={{ marginTop: 18 }}>
          <Pressable
            onPress={() => {
              // Conditions editor can be connected here.
            }}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 16,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E4ECF3",
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text fontSize={28} lineHeight={31} color="#111111" fontFamily="RobotoMedium">
              Conditions
            </Text>
            <Feather name="chevron-right" size={22} color="#7B8794" />
          </Pressable>

          <Pressable
            onPress={() => {
              // Allergens editor can be connected here.
            }}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 16,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E4ECF3",
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text fontSize={28} lineHeight={31} color="#111111" fontFamily="RobotoMedium">
              Allergens
            </Text>
            <Feather name="chevron-right" size={22} color="#7B8794" />
          </Pressable>

          <Box style={{ marginTop: 8, marginBottom: 10 }}>
            <PreferencesOverview
              profilePreferenceNames={livePreferenceNames}
              profileFirstName={profileFirstName}
              onAddPreference={() =>
                navigation.navigate("PreferenceScreen", {
                  profileId: route.params?.profileId,
                })
              }
            />
          </Box>
        </Box>
      </ScrollView>

      {/* Full-width bottom banners for account-level actions */}
      <Box position="absolute" left={0} right={0} bottom={0}>
        <Pressable
          onPress={handleDeleteProfile}
          disabled={isDeleting}
          style={{
            height: 58,
            backgroundColor: "#D64545",
            alignItems: "center",
            justifyContent: "center",
            opacity: isDeleting ? 0.7 : 1,
          }}
        >
          <Text
            fontSize={17}
            lineHeight={19}
            color="#FFFFFF"
            fontFamily="RobotoMedium"
          >
            {isDeleting ? "Removing..." : "Remove Profile"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            navigation.navigate("LandingScreen");
          }}
          style={{
            height: 58,
            backgroundColor: "#5BAEDB",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            fontSize={17}
            lineHeight={19}
            color="#FFFFFF"
            fontFamily="RobotoMedium"
          >
            User Account Settings
          </Text>
        </Pressable>
      </Box>
    </Box>
  );
}
