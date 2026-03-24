export type AuthStackParamList = {
  LoginScreen: undefined;
  RegisterScreen: undefined;
  ProfileScreen:
    | {
        firstName?: string;
        lastName?: string;
        email?: string;
        profileId?: string;
      }
    | undefined;
  AnalyseScreen: undefined;
};
