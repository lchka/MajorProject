import React from "react";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import {
  Box,
  Pressable,
  ScrollView,
  Text,
  Button,
  ButtonText,
  ButtonGroup,
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  VStack,
  HStack
} from "@gluestack-ui/themed";
import Banner from "../../components/banners/GenBanner";
import NavBarTop from "../../components/general/NavBarTop";
import BackButton from "../../components/Buttons/BackButton";
import ChangeEmail from "../../components/actions/ChangeEmail";
import ChangePassword from "../../components/actions/ChangePassword";
import { AuthStackParamList } from "../../types/navigation";
import { clearAuthToken } from "../../utils/authStorage";
import authSvc from "../../services/authService";
import userSrc from "../../services/userService";
import ChangeName from "../../components/actions/ChangeName";
export default function AccountSettings() {
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isChangeEmailOpen, setIsChangeEmailOpen] = React.useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [isChangeNameOpen, setIsChangeNameOpen] = React.useState(false);
const [banner, setBanner] = React.useState<{
  visible: boolean;
  message: string;
  type?: "success" | "error" | "info" | "warning";
}>({
  visible: false,
  message: "",
  type: "success",
});
const [profileCount, setProfileCount] = React.useState<number | null>(null);
React.useEffect(() => {
  const loadUser = async () => {
    try {
      const res = await authSvc.getCurrentUser();

      const user = res.user;

      setUserEmail(user.email);

      const profile =
        user.profiles?.find((p: any) => p.main_profile) ||
        user.profiles?.[0];

      setFirstName(
        user.first_name || profile?.first_name || ""
      );

      setLastName(
        user.last_name || profile?.last_name || ""
      );

      setProfileCount(user.profiles?.length || 0);
    } catch (e) {
      console.log("Failed to fetch user", e);
    }
  };

  loadUser();
}, []);
const handleEmailSubmit = React.useCallback(async (newEmail: string) => {
  try {
    const res = await authSvc.getCurrentUser();

    await userSrc.updateUser(res.user.id, {
      email: newEmail,
    });

    setUserEmail(newEmail);

    setBanner({
      visible: true,
      message: "Email updated successfully",
      type: "success",
    });

    setIsChangeEmailOpen(false);
  } catch (error: any) {
    setBanner({
      visible: true,
      message: "Failed to update email",
      type: "error",
    });

    throw new Error(
      error?.response?.data?.message || "Failed to update email",
    );
  }
}, []);


 const handleNameSubmit = React.useCallback(
  async (firstName: string, lastName: string) => {
    try {
      const res = await authSvc.getCurrentUser();

      await userSrc.updateUser(res.user.id, {
        first_name: firstName,
        last_name: lastName,
      });

      setFirstName(firstName);
      setLastName(lastName);

      setBanner({
        visible: true,
        message: "Name updated successfully",
        type: "success",
      });

      setIsChangeNameOpen(false);
    } catch (error: any) {
      setBanner({
        visible: true,
        message: "Failed to update name",
        type: "error",
      });

      throw new Error(
        error?.response?.data?.message || "Failed to update name",
      );
    }
  },
  [],
);



  const handlePasswordSubmit = React.useCallback(
    async (
      currentPassword: string,
      newPassword: string,
      confirmPassword: string,
    ) => {
      try {
        await authSvc.updatePassword(currentPassword, newPassword);
        setIsChangePasswordOpen(false);
      } catch (error: any) {
        throw new Error(
          error?.response?.data?.message || "Failed to update password",
        );
      }
    },
    [],
  );

  const handleLogout = React.useCallback(async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      await clearAuthToken();
      navigation.reset({
        index: 0,
        routes: [{ name: "LoginScreen" as any }],
      });
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, navigation]);

  const confirmDeleteAccount = async () => {
  try {
    setIsDeleting(true);
    const res = await authSvc.getCurrentUser();
    await userSrc.deleteUser(res.user.id);
    await clearAuthToken();

    setBanner({
      visible: true,
      message: "Account deleted successfully",
      type: "success",
    });

    setIsDeleteModalOpen(false);

    navigation.reset({
      index: 0,
      routes: [
        {
          name: "LoginScreen" as any,
          params: { deleteSuccessAt: Date.now() },
        },
      ],
    });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    setBanner({
      visible: true,
      message: "Failed to delete account",
      type: "error",
    });
  } finally {
    setIsDeleting(false);
  }
};

  return (
  <Box flex={1} bg="#F2F6FA">
    <NavBarTop notificationCount={0} />
<Banner
  isOpen={banner.visible}
  message={banner.message}
  type={banner.type}
  onDismiss={() =>
    setBanner((prev) => ({ ...prev, visible: false }))
  }
/>
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 120,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Box
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 18,
        }}
      >
        <BackButton onPress={() => navigation.goBack()} />
        <Text
          fontSize={24}
          lineHeight={28}
          color="#0F172A"
          fontFamily="RobotoMedium"
        >
          Account Settings
        </Text>
      </Box>

      {/* ✅ USER INFO CARD */}
      <Box
        style={{
          borderRadius: 18,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "#E4ECF3",
          padding: 16,
          marginBottom: 14,
        }}
      >
        <VStack space="xs">
          <Text
            fontSize={18}
            lineHeight={22}
            color="#0F172A"
            fontFamily="RobotoMedium"
          >
            {firstName || lastName
              ? `${firstName} ${lastName}`.trim()
              : "No name set"}
          </Text>

          <Text
            fontSize={13}
            lineHeight={18}
            color="#64748B"
            fontFamily="Roboto"
          >
            {userEmail}
          </Text>
        </VStack>

        <Box
          style={{
            height: 1,
            backgroundColor: "#EEF3F8",
            marginVertical: 12,
          }}
        />

        <HStack justifyContent="space-between">
          <VStack>
            <Text fontSize={12} color="#94A3B8" fontFamily="Roboto">
              Profiles
            </Text>
            <Text
              fontSize={15}
              fontFamily="RobotoMedium"
              color="#0F172A"
            >
              {profileCount ?? "—"}
            </Text>
          </VStack>

          <VStack alignItems="flex-end">
            <Text fontSize={12} color="#94A3B8" fontFamily="Roboto">
              Account
            </Text>
            <Text
              fontSize={15}
              fontFamily="RobotoMedium"
              color="#0F172A"
            >
              Active
            </Text>
          </VStack>
        </HStack>
      </Box>

      {/* Account Actions */}
      <Box
        style={{
          borderRadius: 18,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "#E4ECF3",
          paddingHorizontal: 16,
          paddingVertical: 8,
          marginBottom: 14,
        }}
      >
        <Text
          fontSize={16}
          lineHeight={20}
          color="#0F172A"
          fontFamily="RobotoMedium"
        >
          Account
        </Text>
        <Text
          fontSize={13}
          lineHeight={18}
          color="#64748B"
          fontFamily="Roboto"
          mt="$2"
        >
          Manage your account access and session from here.
        </Text>

        <Pressable
          onPress={() => setIsChangeEmailOpen(true)}
          style={{
            marginTop: 14,
            paddingVertical: 14,
            borderTopWidth: 1,
            borderTopColor: "#EEF3F8",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text fontSize={15} color="#0F172A" fontFamily="RobotoMedium">
            Change Email
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setIsChangePasswordOpen(true)}
          style={{
            paddingVertical: 14,
            borderTopWidth: 1,
            borderTopColor: "#EEF3F8",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text fontSize={15} color="#0F172A" fontFamily="RobotoMedium">
            Change Password
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setIsChangeNameOpen(true)}
          style={{
            paddingVertical: 14,
            borderTopWidth: 1,
            borderTopColor: "#EEF3F8",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text fontSize={15} color="#0F172A" fontFamily="RobotoMedium">
            Change Name
          </Text>
        </Pressable>
      </Box>

      {/* Delete Account */}
      <Box
        style={{
          borderRadius: 18,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "#FEE2E2",
          paddingHorizontal: 16,
          paddingVertical: 8,
          marginBottom: 14,
        }}
      >
        <Text
          fontSize={16}
          lineHeight={20}
          color="#991B1B"
          fontFamily="RobotoMedium"
        >
          Delete Account
        </Text>
        <Text
          fontSize={13}
          lineHeight={18}
          color="#64748B"
          fontFamily="Roboto"
          mt="$2"
        >
          Permanently remove your account and all associated data.
        </Text>

        <Pressable
          onPress={() => setIsDeleteModalOpen(true)}
          style={{
            marginTop: 14,
            paddingVertical: 14,
            borderTopWidth: 1,
            borderTopColor: "#FEE2E2",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text fontSize={15} color="#D64545" fontFamily="RobotoMedium">
            Delete Account
          </Text>
        </Pressable>
      </Box>
    </ScrollView>

    {/* Modals */}
    <ChangeEmail
      isOpen={isChangeEmailOpen}
      onClose={() => setIsChangeEmailOpen(false)}
      onSubmit={handleEmailSubmit}
      currentEmail={userEmail}
	  
	  
    />

    <ChangePassword
      isOpen={isChangePasswordOpen}
      onClose={() => setIsChangePasswordOpen(false)}
      onSubmit={handlePasswordSubmit}
    />

  <ChangeName
  isOpen={isChangeNameOpen}
  onClose={() => setIsChangeNameOpen(false)}
  onSubmit={handleNameSubmit}
  currentFirstName={isChangeNameOpen ? firstName : undefined}
  currentLastName={isChangeNameOpen ? lastName : undefined}
/>

    {/* Delete Dialog */}
    <AlertDialog
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
    >
      <AlertDialogBackdrop />
      <AlertDialogContent>
        <AlertDialogHeader>
          <Text size="lg" fontWeight="$bold">
            Delete Account?
          </Text>
        </AlertDialogHeader>
        <AlertDialogBody>
          <Text size="sm">
            This action is permanent and cannot be undone.
          </Text>
        </AlertDialogBody>
        <AlertDialogFooter>
          <ButtonGroup space="md">
            <Button
              variant="outline"
              action="secondary"
              onPress={() => setIsDeleteModalOpen(false)}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
              action="negative"
              onPress={confirmDeleteAccount}
              disabled={isDeleting}
            >
              <ButtonText>
                {isDeleting ? "Deleting..." : "Delete"}
              </ButtonText>
            </Button>
          </ButtonGroup>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Logout */}
    <Box position="absolute" left={0} right={0} bottom={0}>
      <Pressable
        onPress={handleLogout}
        disabled={isLoggingOut}
        style={{
          height: 58,
          backgroundColor: "#D64545",
          alignItems: "center",
          justifyContent: "center",
          opacity: isLoggingOut ? 0.7 : 1,
        }}
      >
        <Text
          fontSize={17}
          color="#FFFFFF"
          fontFamily="RobotoMedium"
        >
          {isLoggingOut ? "Logging out..." : "Log Out"}
        </Text>
      </Pressable>
    </Box>
  </Box>
);
}
