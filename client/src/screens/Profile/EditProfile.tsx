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
import ProfileEditBadgeComponent from "../../components/profile/ProfileEditBadge";
import AllConditions from "../../components/conditions/AllConditions";
import AllAllergens from "../../components/allergens/AllAllergens";
import AllPreferences from "../../components/preferences/AllPreferences";
import RedBanner from "../../components/banners/RedBanner";
import profileApiService, { ProfileImageUploadFile } from "../../services/profileService";
import { AuthStackParamList } from "../../types/navigation";

export default function EditProfileScreen() {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, "EditProfileScreen">>();
  const profileId = route.params?.profileId;
  const profileIsMain = route.params?.profileIsMain ?? false;
  const profileName = route.params?.profileName?.trim() ?? "";
  const initialProfileAge = route.params?.profileAge?.trim() ?? "";
  const initialProfileImageUri = route.params?.profileImageUri?.trim();
  const profilePreferenceNames = route.params?.profilePreferenceNames;
  const [livePreferenceNames, setLivePreferenceNames] = React.useState<string[]>(
    profilePreferenceNames ?? [],
  );
  const [liveConditionNames, setLiveConditionNames] = React.useState<string[]>([]);
  const [liveAllergenNames, setLiveAllergenNames] = React.useState<string[]>([]);
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
  const [isUpdatingMain, setIsUpdatingMain] = React.useState(false);
  const [isMainStatus, setIsMainStatus] = React.useState(profileIsMain);
  const [showMainWarning, setShowMainWarning] = React.useState(false);
  const mainWarningTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
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

      const refreshProfileOptions = async () => {
        if (!profileId) {
          if (isMounted) {
            setLivePreferenceNames(profilePreferenceNames ?? []);
            setLiveConditionNames([]);
            setLiveAllergenNames([]);
          }
          return;
        }

        try {
          const profiles = await profileApiService.getMyProfile();
          if (!isMounted) {
            return;
          }

          const activeProfile = profiles.find((item) => item.id === profileId);
          setLivePreferenceNames(activeProfile?.preferences?.map((item) => item.name) ?? []);
          setLiveConditionNames(activeProfile?.conditions?.map((item) => item.name) ?? []);
          setLiveAllergenNames(activeProfile?.allergens?.map((item) => item.name) ?? []);
        } catch {
          if (isMounted) {
            setLivePreferenceNames(profilePreferenceNames ?? []);
            setLiveConditionNames([]);
            setLiveAllergenNames([]);
          }
        }
      };

      void refreshProfileOptions();

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
      const updatedProfile = await profileApiService.updateProfile(profileId, {
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
              await profileApiService.deleteProfile(profileId);
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

  const handleMainToggleAttempt = React.useCallback(() => {
    if (isMainStatus) {
      if (mainWarningTimeoutRef.current) {
        clearTimeout(mainWarningTimeoutRef.current);
      }

      setShowMainWarning(true);
      mainWarningTimeoutRef.current = setTimeout(() => {
        setShowMainWarning(false);
        mainWarningTimeoutRef.current = null;
      }, 2600);
      return;
    }

    if (!profileId || isUpdatingMain) {
      return;
    }

    Alert.alert(
      "Set as main profile",
      "Make this your main profile?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Set as main",
          onPress: async () => {
            try {
              setIsUpdatingMain(true);
              await profileApiService.updateProfile(profileId, { main_profile: true });
              setIsMainStatus(true);
              navigation.setParams({ profileIsMain: true });
            } catch {
              Alert.alert("Update failed", "Unable to update main profile right now.");
            } finally {
              setIsUpdatingMain(false);
            }
          },
        },
      ],
    );
  }, [isMainStatus, isUpdatingMain, navigation, profileId]);

  React.useEffect(() => {
    setIsMainStatus(profileIsMain);
  }, [profileIsMain]);

  React.useEffect(() => {
    return () => {
      if (mainWarningTimeoutRef.current) {
        clearTimeout(mainWarningTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Box flex={1} bg="#F2F6FA">
      <NavBarTop notificationCount={2} />

      <Box
        style={{
          position: "absolute",
          top: 86,
          right: 16,
          zIndex: 50,
          elevation: 30,
        }}
      >
        <RedBanner
          visible={showMainWarning}
          message="You must make this change from the designated profile settings."
        />
      </Box>

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

            {isMainStatus ? (
              <Image
                source={require("../../../assets/crown.png")}
                style={{
                  position: "absolute",
                  top: -16,
                  right: 14,
                  width: 42,
                  height: 42,
                  transform: [{ rotate: "25deg" }],
                  zIndex: 3,
                }}
              />
            ) : null}

            <ProfileEditBadgeComponent
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
            <ProfileEditBadgeComponent sizePreset="small" />
          </Box>

          <Box
            style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 }}
            alignSelf="flex-start"
          >
            <Text fontSize={24} pl="$2" lineHeight={30} color="#0F172A" fontFamily="RobotoMedium">
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
            <ProfileEditBadgeComponent sizePreset="small" />
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
          <Text
            fontSize={18}
            lineHeight={22}
            color="#111111"
            fontFamily="RobotoMedium"
            style={{ marginBottom: 8 }}
          >
            Main profile
          </Text>

          <Pressable
            onPress={handleMainToggleAttempt}
            disabled={isUpdatingMain}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 14,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E4ECF3",
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              opacity: isUpdatingMain ? 0.7 : 1,
            }}
          >
            <Feather name={isMainStatus ? "check-square" : "square"} size={20} color="#6F4E37" />
            <Box style={{ flex: 1 }}>
              <Text fontSize={15} lineHeight={18} color="#111111" fontFamily="RobotoMedium">
                {isMainStatus ? "This is the main profile" : "This is not a main profile"}
              </Text>
              <Text fontSize={12} lineHeight={15} color="#7B8794" fontFamily="RobotoRegular">
                {isMainStatus
                  ? "Main profile status cannot be changed here."
                  : isUpdatingMain
                    ? "Setting this profile as main..."
                    : "Click to change here."}
              </Text>
            </Box>
          </Pressable>
          <Text fontSize={24} py="$6" color="black" fontWeight={600}>
            Profile Analysis Options
          </Text>

          <Box
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E4ECF3",
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <AllConditions
              conditionNames={liveConditionNames}
              profileFirstName={profileFirstName}
              variant="visual"
              onPressEdit={() =>
                navigation.navigate("ConditionScreen", {
                  profileId: route.params?.profileId,
                })
              }
              onPressCondition={() =>
                navigation.navigate("ConditionScreen", {
                  profileId: route.params?.profileId,
                })
              }
            />

            <AllAllergens
              allergenNames={liveAllergenNames}
              profileFirstName={profileFirstName}
              variant="visual"
              onToggleEditMode={() =>
                navigation.navigate("AllergenScreen", {
                  profileId: route.params?.profileId,
                })
              }
              onOpenAddAllergen={() =>
                navigation.navigate("AllergenScreen", {
                  profileId: route.params?.profileId,
                })
              }
            />

            <Box style={{ marginTop: 4 }}>
              <AllPreferences
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
            navigation.navigate("AccountSettingsScreen");
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
