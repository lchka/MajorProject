import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import {
  Box,
  Button,
  ButtonText,
  Center,
  Divider,
  HStack,
  Input,
  InputField,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from '@gluestack-ui/themed';
import { authService } from '../services';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    // First name validation
    if (!firstName.trim()) {
      Alert.alert('Validation Error', 'Please enter your first name');
      return false;
    }

    if (firstName.trim().length < 2) {
      Alert.alert('Validation Error', 'First name must be at least 2 characters');
      return false;
    }

    // Last name validation
    if (!lastName.trim()) {
      Alert.alert('Validation Error', 'Please enter your last name');
      return false;
    }

    if (lastName.trim().length < 2) {
      Alert.alert('Validation Error', 'Last name must be at least 2 characters');
      return false;
    }

    // Email validation
    if (!email) {
      Alert.alert('Validation Error', 'Please enter your email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    // Password validation (stronger requirements)
    if (!password) {
      Alert.alert('Validation Error', 'Please enter a password');
      return false;
    }

    if (password.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters long');
      return false;
    }

    // Check for uppercase
    if (!/[A-Z]/.test(password)) {
      Alert.alert('Validation Error', 'Password must contain at least one uppercase letter');
      return false;
    }

    // Check for lowercase
    if (!/[a-z]/.test(password)) {
      Alert.alert('Validation Error', 'Password must contain at least one lowercase letter');
      return false;
    }

    // Check for number
    if (!/[0-9]/.test(password)) {
      Alert.alert('Validation Error', 'Password must contain at least one number');
      return false;
    }

    // Check for special character
    if (!/[#?!@$%^&*-]/.test(password)) {
      Alert.alert('Validation Error', 'Password must contain at least one special character (#?!@$%^&*-)');
      return false;
    }

    // Confirm password validation
    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Send data matching backend schema
      const response = await authService.register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.toLowerCase().trim(),
        password,
        c_password: confirmPassword,
      });

      console.log('Registration successful:', response);

      Alert.alert(
        'Success!',
        'Your account has been created successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear the form
              setFirstName('');
              setLastName('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
            },
          },
        ]
      );

      // TODO: Save token to AsyncStorage
      // await AsyncStorage.setItem('authToken', response.token);
      // Navigate to home screen
    } catch (error: any) {
      console.error('Registration failed:', error);

      let errorMessage = 'Registration failed. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.details) {
        // Handle validation errors from backend
        errorMessage = error.response.data.details.join('\n');
      } else if (error.response?.status === 409) {
        errorMessage = 'Email already exists. Please use a different email.';
      } else if (typeof error.message === 'string' && error.message.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Please check your connection.';
      }

      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Box w="$full" px="$5" py="$8" bg="$backgroundLight0">
          <VStack space="lg">
            <HStack justifyContent="space-between" alignItems="center">
              <Text size="4xl" fontStyle="italic" fontWeight="$light">
                Lumière
              </Text>
              <Box borderWidth={1} borderColor="$borderLight400" borderRadius="$full" px="$3" py="$1">
                <Text size="lg">i</Text>
              </Box>
            </HStack>

            <Divider />

            <VStack space="xs">
              <Text size="3xl" fontWeight="$bold">
                Register your account
              </Text>
              <HStack space="xs">
                <Text size="md">Already have an account?</Text>
                <Pressable disabled={loading}>
                  <Text size="md" fontWeight="$semibold">
                    Sign in
                  </Text>
                </Pressable>
              </HStack>
            </VStack>

            <VStack space="md">
              <VStack space="xs">
                <Text size="md" fontWeight="$semibold">
                  First Name
                </Text>
                <Input variant="outline" size="lg">
                  <InputField
                    placeholder="Enter first name"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    autoComplete="name-given"
                    editable={!loading}
                  />
                </Input>
              </VStack>

              <VStack space="xs">
                <Text size="md" fontWeight="$semibold">
                  Last Name
                </Text>
                <Input variant="outline" size="lg">
                  <InputField
                    placeholder="Enter last name"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    autoComplete="name-family"
                    editable={!loading}
                  />
                </Input>
              </VStack>

              <VStack space="xs">
                <Text size="md" fontWeight="$semibold">
                  Email
                </Text>
                <Input variant="outline" size="lg">
                  <InputField
                    placeholder="abc@gmail.com"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    editable={!loading}
                  />
                </Input>
              </VStack>

              <VStack space="xs">
                <Text size="md" fontWeight="$semibold">
                  Password
                </Text>
                <Input variant="outline" size="lg">
                  <InputField
                    placeholder="Enter password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password-new"
                    editable={!loading}
                  />
                </Input>
                <Text size="xs">
                  Min 8 characters with uppercase, lowercase, number and special character (#?!@$%^&*-)
                </Text>
              </VStack>

              <VStack space="xs">
                <Text size="md" fontWeight="$semibold">
                  Confirm Password
                </Text>
                <Input variant="outline" size="lg">
                  <InputField
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </Input>
              </VStack>
            </VStack>

            <Button size="lg" onPress={handleRegister} isDisabled={loading}>
              {loading ? <Spinner color="$white" /> : <ButtonText>Create Account</ButtonText>}
            </Button>
          </VStack>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
  },
});
