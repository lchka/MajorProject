import React, { useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dimensions, Image } from "react-native";
import LottieView from "lottie-react-native";
import { MotiView } from "moti";
import { Easing } from "react-native-reanimated";
import {
  Box,
  Center,
  Divider,
  HStack,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import AntDesign from "@expo/vector-icons/AntDesign";
import CreateButton from "../components/Buttons/CreateButton";
import { AuthStackParamList } from "../types/navigation";

// AsyncStorage key used to detect an existing signed-in session.
const AUTH_TOKEN_KEY = "authToken";

// Device height used for full-screen intro + welcome panel slide animation.
const SCREEN_HEIGHT = Dimensions.get("window").height;

// Sentence that gets rendered with the typewriter effect on the welcome card.
const WELCOME_SUBTITLE =
  "Stay ahead of flare-ups with personalised skincare guidance - you can trust.";

// Delay after entering the welcome panel before typewriter starts.
const TYPEWRITER_START_DELAY_MS = 1500;

// Milliseconds per character for the typewriter speed.
const TYPEWRITER_CHAR_INTERVAL_MS = 40;

// Welcome card title fade timing.
const TITLE_FADE_IN_START_DELAY_MS = 700;
const TITLE_FADE_IN_DURATION_MS = 420;

// How long to wait after typing finishes before showing the first checklist row.
const CHECK_FADE_IN_START_DELAY_MS = 260;

// Gap between each checklist row animation.
const CHECK_FADE_IN_STAGGER_MS = 820;

// How long each checklist row fade/slide animation lasts.
const CHECK_FADE_IN_DURATION_MS = 620;

// Total time for the 3 checklist rows to fully finish after typewriter is done.
const CHECKLIST_SEQUENCE_TOTAL_MS =
  CHECK_FADE_IN_START_DELAY_MS +
  CHECK_FADE_IN_STAGGER_MS * 2 +
  CHECK_FADE_IN_DURATION_MS;

// first button waits until checklist sequence is done (relative to typewriter completion)
const CTA_FADE_IN_START_DELAY_MS =
  CHECK_FADE_IN_START_DELAY_MS +
  CHECK_FADE_IN_STAGGER_MS * 2 +
  CHECK_FADE_IN_DURATION_MS +
  400;

// How long each CTA button fade/slide animation lasts.
const CTA_FADE_IN_DURATION_MS = 1200;

// second button comes in this much later than the first
const CTA_FADE_IN_STAGGER_MS = 2000;

// Post-check sequence: reveal logo, then show CTA buttons.
const POST_CHECKS_LOGO_START_DELAY_MS = 300;
const POST_CHECKS_LOGO_TYPEWRITER_DURATION_MS = 1000;
const POST_CHECKS_CTA_START_DELAY_MS = 250;

// Dev helper: keep the intro JSON page visible and prevent slide to next panel.
const FREEZE_ON_INTRO_JSON_PAGE = false;

// Delay before showing the intro "to + image" row.
const INTRO_TO_LOGO_DELAY_MS = 2000;

export default function WelcomeScreen() {
  // Typed navigation helper for moving between auth stack screens.
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  // Timeout ref for delaying panel switch after lottie animation ends.
  const scrollDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introToLogoDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Timeout ref for delaying the typewriter kickoff.
  const typewriterStartRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Interval ref for character-by-character subtitle rendering.
  const typewriterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  // Controls whether we are showing intro panel or welcome card panel.
  const [shouldShowWelcomeCard, setShouldShowWelcomeCard] = useState(false);
  const [showIntroToLogo, setShowIntroToLogo] = useState(false);
  const [isChecklistSequenceDone, setIsChecklistSequenceDone] = useState(false);
  const [showPostChecksLogo, setShowPostChecksLogo] = useState(false);
  const [isPostChecksLogoDone, setIsPostChecksLogoDone] = useState(false);
  // Current visible substring for the typewriter subtitle.
  const [typedSubtitle, setTypedSubtitle] = useState("");
  // True only when full subtitle has finished typing.
  const isTypewriterDone =
    shouldShowWelcomeCard && typedSubtitle.length >= WELCOME_SUBTITLE.length;

  useEffect(() => {
    // If user is already signed in, skip this intro and go straight to landing.
    // Checks storage once on mount and redirects if token exists.
    const redirectAuthorizedUsers = async () => {
      // Session token fetched from async storage.
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        navigation.replace("LandingScreen");
      }
    };

    void redirectAuthorizedUsers();

    return () => {
      if (scrollDelayRef.current) {
        clearTimeout(scrollDelayRef.current);
      }
      if (introToLogoDelayRef.current) {
        clearTimeout(introToLogoDelayRef.current);
      }
    };
  }, [navigation]);

  useEffect(() => {
    setShowIntroToLogo(false);
    introToLogoDelayRef.current = setTimeout(() => {
      setShowIntroToLogo(true);
    }, INTRO_TO_LOGO_DELAY_MS);

    return () => {
      if (introToLogoDelayRef.current) {
        clearTimeout(introToLogoDelayRef.current);
      }
    };
  }, []);

  // Called by the second lottie animation when it completes.
  const handleLiveChatAnimationFinished = () => {
    if (shouldShowWelcomeCard || FREEZE_ON_INTRO_JSON_PAGE) {
      return;
    }

    // After live chat animation ends, wait a bit, then slide to the welcome card.
    scrollDelayRef.current = setTimeout(() => {
      setShouldShowWelcomeCard(true);
    }, 200);
  };

  useEffect(() => {
    if (!shouldShowWelcomeCard) {
      if (typewriterStartRef.current) {
        clearTimeout(typewriterStartRef.current);
      }
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
      }
      setTypedSubtitle("");
      return;
    }

    typewriterStartRef.current = setTimeout(() => {
      let index = 0;
      setTypedSubtitle("");

      typewriterIntervalRef.current = setInterval(() => {
        index += 1;
        setTypedSubtitle(WELCOME_SUBTITLE.slice(0, index));

        if (index >= WELCOME_SUBTITLE.length && typewriterIntervalRef.current) {
          clearInterval(typewriterIntervalRef.current);
          typewriterIntervalRef.current = null;
        }
      }, TYPEWRITER_CHAR_INTERVAL_MS);
    }, TYPEWRITER_START_DELAY_MS);

    return () => {
      if (typewriterStartRef.current) {
        clearTimeout(typewriterStartRef.current);
        typewriterStartRef.current = null;
      }
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
        typewriterIntervalRef.current = null;
      }
    };
  }, [shouldShowWelcomeCard]);

  useEffect(() => {
    if (!isTypewriterDone) {
      setIsChecklistSequenceDone(false);
      return;
    }

    const checklistDoneTimer = setTimeout(() => {
      setIsChecklistSequenceDone(true);
    }, CHECKLIST_SEQUENCE_TOTAL_MS);

    return () => {
      clearTimeout(checklistDoneTimer);
    };
  }, [isTypewriterDone]);

  useEffect(() => {
    if (!isChecklistSequenceDone) {
      setShowPostChecksLogo(false);
      setIsPostChecksLogoDone(false);
      return;
    }

    const logoStartTimer = setTimeout(() => {
      setShowPostChecksLogo(true);
    }, POST_CHECKS_LOGO_START_DELAY_MS);

    const ctaStartTimer = setTimeout(() => {
      setIsPostChecksLogoDone(true);
    },
    POST_CHECKS_LOGO_START_DELAY_MS +
      POST_CHECKS_LOGO_TYPEWRITER_DURATION_MS +
      POST_CHECKS_CTA_START_DELAY_MS,
    );

    return () => {
      clearTimeout(logoStartTimer);
      clearTimeout(ctaStartTimer);
    };
  }, [isChecklistSequenceDone]);

  return (
    <Box h={SCREEN_HEIGHT} overflow="hidden">
      {/* Keep intro and welcome page stacked, then animate the whole screen upward. */}
      <MotiView
        animate={{
          translateY: FREEZE_ON_INTRO_JSON_PAGE
            ? 0
            : shouldShowWelcomeCard
              ? -SCREEN_HEIGHT
              : 0,
        }}
        transition={{
          type: "timing",
          // this is how long the full screen slide takes
          duration: FREEZE_ON_INTRO_JSON_PAGE ? 0 : 1000,
          easing: Easing.bezier(0.75, 0.0, 0.25, 1.0),
        }}
        style={{ height: SCREEN_HEIGHT * 2 }}
      >
        <Center h={SCREEN_HEIGHT} bg="#F2F8FF" px="$6">
          <VStack space="lg" alignItems="center" w="$full">
            <VStack
              w="$full"
              alignItems="center"
              space="xs"
              style={{ marginTop: -14 }}
            >
              <LottieView
                source={require("../../assets/animations/Welcome.json")}
                autoPlay
                loop={false}
                style={{
                  width: "100%",
                  height: SCREEN_HEIGHT * 0.32,
                  marginTop: -16,
                }}
              />
              <MotiView
                animate={{ opacity: showIntroToLogo ? 1 : 0 }}
                transition={{ type: "timing", duration: 320 }}
                style={{ width: "100%", marginTop: -14, marginBottom: -10 }}
              >
                <HStack alignItems="center" justifyContent="center" w="$full" space="xs">
                  <Text
                    size="3xl"
                    color="#2E5F8A"
                    style={{
                      fontFamily: "RobotoMedium",

                    }}
                  >
                    to
                  </Text>

                  <Image
                    source={require("../../assets/logo/6.png")}
                    style={{ width: 200, height: 200, marginLeft: 0, marginTop: -60 }}
                    resizeMode="contain"
                  />
                </HStack>
              </MotiView>
              <LottieView
                source={require("../../assets/animations/Live chatbot.json")}
                autoPlay
                loop={false}
                onAnimationFinish={handleLiveChatAnimationFinished}
                style={{
                  width: "100%",
                  height: SCREEN_HEIGHT * 0.32,
                  marginTop: -10,
                }}
              />
            </VStack>
          </VStack>
        </Center>

        <Center h={SCREEN_HEIGHT} bg="#F2F8FF">
          <Box
            position="absolute"
            top={-80}
            right={-40}
            w={220}
            h={220}
            borderRadius={999}
            bg="#D8ECFF"
            opacity={0.9}
          />
          <Box
            position="absolute"
            bottom={-70}
            left={-35}
            w={180}
            h={180}
            borderRadius={999}
            bg="#BFDFFF"
            opacity={0.35}
          />

          <Box w="$full" px="$6" py="$8" style={{ marginTop: -28 }}>
            <VStack space="4xl">
              <VStack space="sm">
                <HStack
                  alignItems="center"
                  space="sm"
                  style={{ marginLeft: -25 }}
                >
                 
                </HStack>
              </VStack>

              <VStack space="2xl">
                <VStack space="md">
                  <MotiView
                    animate={{ opacity: shouldShowWelcomeCard ? 1 : 0 }}
                    transition={{
                      type: "timing",
                      duration: TITLE_FADE_IN_DURATION_MS,
                      delay: TITLE_FADE_IN_START_DELAY_MS,
                    }}
                  ></MotiView>
                  <Text
                    size="2xl"
                    color="#466785"
                    style={{ fontFamily: "Roboto" }}
                  >
                    {typedSubtitle}
                    {shouldShowWelcomeCard &&
                    typedSubtitle.length < WELCOME_SUBTITLE.length
                      ? "|"
                      : ""}
                  </Text>
                </VStack>

                <VStack space="md">
                  <MotiView
                    animate={{
                      opacity: isTypewriterDone ? 1 : 0,
                      translateY: isTypewriterDone ? 0 : 8,
                    }}
                    transition={{
                      type: "timing",
                      duration: CHECK_FADE_IN_DURATION_MS,
                      delay: CHECK_FADE_IN_START_DELAY_MS,
                    }}
                  >
                    <HStack alignItems="center" space="sm">
                      <AntDesign
                        name="check-circle"
                        size={18}
                        color="#4A90D9"
                      />
                      <Text
                        size="lg"
                        color="#2E5F8A"
                        style={{ fontFamily: "Roboto" }}
                      >
                        Spot potential triggers earlier
                      </Text>
                    </HStack>
                  </MotiView>
                  <MotiView
                    animate={{
                      opacity: isTypewriterDone ? 1 : 0,
                      translateY: isTypewriterDone ? 0 : 8,
                    }}
                    transition={{
                      type: "timing",
                      duration: CHECK_FADE_IN_DURATION_MS,
                      delay:
                        CHECK_FADE_IN_START_DELAY_MS + CHECK_FADE_IN_STAGGER_MS,
                    }}
                  >
                    <HStack alignItems="center" space="sm">
                      <AntDesign
                        name="check-circle"
                        size={18}
                        color="#4A90D9"
                      />
                      <Text
                        size="lg"
                        color="#2E5F8A"
                        style={{ fontFamily: "Roboto" }}
                      >
                        Understand irritants before reactions
                      </Text>
                    </HStack>
                  </MotiView>
                  <MotiView
                    animate={{
                      opacity: isTypewriterDone ? 1 : 0,
                      translateY: isTypewriterDone ? 0 : 8,
                    }}
                    transition={{
                      type: "timing",
                      duration: CHECK_FADE_IN_DURATION_MS,
                      delay:
                        CHECK_FADE_IN_START_DELAY_MS +
                        CHECK_FADE_IN_STAGGER_MS * 2,
                    }}
                  >
                    <HStack alignItems="center" space="sm">
                      <AntDesign
                        name="check-circle"
                        size={18}
                        color="#4A90D9"
                      />
                      <Text
                        size="lg"
                        color="#2E5F8A"
                        style={{ fontFamily: "Roboto" }}
                      >
                        Understand cosmetic ingredients
                      </Text>
					  
                    </HStack>
					
                  </MotiView>
                  <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{
                      opacity: showPostChecksLogo ? 1 : 0,
                      scale: showPostChecksLogo ? 1 : 0.9,
                    }}
                    transition={{
                      type: "timing",
                      duration: 520,
                      delay: 120,
                    }}
                    style={{ alignSelf: "center" }}
                  >
                    <Image
                      source={require("../../assets/logo/6.png")}
                      style={{ width: 310, height: 200, marginLeft: -30, marginTop: 0 }}
                      resizeMode="contain"
                    />
                  </MotiView>
                </VStack>
              </VStack>

              <VStack space="xl">
                {/* button 1: fades/slides in first */}
                <MotiView
                  animate={{
                    opacity: isPostChecksLogoDone ? 1 : 0,
                    translateY: isPostChecksLogoDone ? 0 : 10,
                  }}
                  // tweak duration for speed, tweak delay for when it starts
                  transition={{
                    type: "timing",
                    duration: CTA_FADE_IN_DURATION_MS,
                    delay: 0,
                  }}
                >
                  <CreateButton
                    isPulsing={isPostChecksLogoDone}
                    pulseStartDelayMs={0}
                    onPress={() => navigation.navigate("RegisterScreen")}
                  />
                </MotiView>

                {/* button 2: same animation, but delayed so it comes after button 1 */}
                <MotiView
                  animate={{
                    opacity: isPostChecksLogoDone ? 1 : 0,
                    translateY: isPostChecksLogoDone ? 0 : 10,
                  }}
                  transition={{
                    type: "timing",
                    duration: CTA_FADE_IN_DURATION_MS,
                    delay: CTA_FADE_IN_STAGGER_MS,
                  }}
                >
                  <CreateButton
                    preset="outline"
                    label="I already have an account"
                    isPulsing={isPostChecksLogoDone}
                    pulseStartDelayMs={CTA_FADE_IN_STAGGER_MS}
                    onPress={() => navigation.navigate("LoginScreen")}
                  />
                </MotiView>
              </VStack>
            </VStack>
          </Box>
        </Center>
      </MotiView>
    </Box>
  );
}
