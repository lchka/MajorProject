export type AuthStackParamList = {
  WelcomeScreen: undefined;
  LandingScreen: undefined;
  PreferenceScreen:
    | {
        profileId?: string;
      }
    | undefined;
  AllergenScreen:
    | {
        profileId?: string;
      }
    | undefined;
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
  EditProfileScreen:
    | {
        profileId?: string;
        profileName?: string;
        profileImageUri?: string;
        profilePreferenceNames?: string[];
        profileAge?: string;
        profileIsMain?: boolean;
      }
    | undefined;
  AnalyseScreen: undefined;
  AccountSettingsScreen: undefined;
  CameraScreen: undefined;
  HistoryScreen:
    | {
        profileId?: string;
      }
    | undefined;
  EvaluationResultScreen: {
    evaluationContextId: string;
  };
};
