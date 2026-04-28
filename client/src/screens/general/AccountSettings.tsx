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
    AlertDialogFooter 
} from "@gluestack-ui/themed";
import NavBarTop from "../../components/general/NavBarTop";
import BackButton from "../../components/Buttons/BackButton";
import ChangeEmail from "../../components/actions/ChangeEmail";
import ChangePassword from "../../components/actions/ChangePassword";
import { AuthStackParamList } from "../../types/navigation";
import { clearAuthToken } from "../../utils/authStorage";
import authSvc from "../../services/authService";
import userService from "../../services/userService";

export default function AccountSettings() {
    const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isChangeEmailOpen, setIsChangeEmailOpen] = React.useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [userEmail, setUserEmail] = React.useState("");

    React.useEffect(() => {
        const loadUser = async () => {
            try {
                const res = await authSvc.getCurrentUser();
                setUserEmail(res.user.email);
            } catch (e) {
                console.log("Failed to fetch user", e);
            }
        };
        loadUser();
    }, []);

    const handleEmailSubmit = React.useCallback(
        async (currentEmail: string, newEmail: string, password: string) => {
            try {
                await authSvc.updateEmail(currentEmail, newEmail, password);
                setUserEmail(newEmail);
                setIsChangeEmailOpen(false);
            } catch (error: any) {
                throw new Error(error?.response?.data?.message || "Failed to update email");
            }
        },
        []
    );

    const handlePasswordSubmit = React.useCallback(
        async (currentPassword: string, newPassword: string, confirmPassword: string) => {
            try {
                await authSvc.updatePassword(currentPassword, newPassword);
                setIsChangePasswordOpen(false);
            } catch (error: any) {
                throw new Error(error?.response?.data?.message || "Failed to update password");
            }
        },
        []
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
            await userService.deleteUser(res.user.id);
            await clearAuthToken();
            setIsDeleteModalOpen(false);
            navigation.reset({
                index: 0,
                routes: [{ name: "LoginScreen" as any, params: { deleteSuccessAt: Date.now() } }],
            });
        } catch (error) {
            console.error("Delete failed", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Box flex={1} bg="#F2F6FA">
            <NavBarTop notificationCount={0} />

            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingTop: 8,
                    paddingBottom: 120,
                }}
                showsVerticalScrollIndicator={false}
            >
                <Box
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 18,
                    }}
                >
                    <BackButton onPress={() => navigation.goBack()} />
                    <Text fontSize={24} lineHeight={28} color="#0F172A" fontFamily="RobotoMedium">
                        Account Settings
                    </Text>
                </Box>

                {/* Account Actions Box */}
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
                    <Text fontSize={16} lineHeight={20} color="#0F172A" fontFamily="RobotoMedium">
                        Account
                    </Text>
                    <Text fontSize={13} lineHeight={18} color="#64748B" fontFamily="Roboto" mt="$2">
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
                        <Text fontSize={15} lineHeight={20} color="#0F172A" fontFamily="RobotoMedium">
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
                        <Text fontSize={15} lineHeight={20} color="#0F172A" fontFamily="RobotoMedium">
                            Change Password
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => {}}
                        style={{
                            paddingVertical: 14,
                            borderTopWidth: 1,
                            borderTopColor: "#EEF3F8",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Text fontSize={15} lineHeight={20} color="#0F172A" fontFamily="RobotoMedium">
                            Change Name
                        </Text>
                    </Pressable>
                </Box>

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
                    <Text fontSize={16} lineHeight={20} color="#991B1B" fontFamily="RobotoMedium">
                        Delete Account
                    </Text>
                    <Text fontSize={13} lineHeight={18} color="#64748B" fontFamily="Roboto" mt="$2">
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
                        <Text fontSize={15} lineHeight={20} color="#D64545" fontFamily="RobotoMedium">
                            Delete Account
                        </Text>
                    </Pressable>
                </Box>
            </ScrollView>

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

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
            >
                <AlertDialogBackdrop />
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <Text size="lg" fontWeight="$bold">Delete Account?</Text>
                    </AlertDialogHeader>
                    <AlertDialogBody>
                        <Text size="sm">
                            This action is permanent and cannot be undone. You will be redirected to the registration screen.
                        </Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <ButtonGroup space="md">
                            <Button variant="outline" action="secondary" onPress={() => setIsDeleteModalOpen(false)}>
                                <ButtonText>Cancel</ButtonText>
                            </Button>
                            <Button action="negative" onPress={confirmDeleteAccount} disabled={isDeleting}>
                                <ButtonText>{isDeleting ? "Deleting..." : "Delete"}</ButtonText>
                            </Button>
                        </ButtonGroup>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
                    <Text fontSize={17} lineHeight={19} color="#FFFFFF" fontFamily="RobotoMedium">
                        {isLoggingOut ? "Logging out..." : "Log Out"}
                    </Text>
                </Pressable>
            </Box>
        </Box>
    );
}