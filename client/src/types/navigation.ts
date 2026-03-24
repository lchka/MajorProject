export type AuthStackParamList = {
  WelcomeScreen: undefined;
  LandingScreen: undefined;
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
