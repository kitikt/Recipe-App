import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";

const { width, height } = Dimensions.get("window");

const RegisterScreen = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  // Refs for TextInput focus
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  // Animation values
  const animation = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous floating animation for logo
    const floatAnimation = () => {
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]).start(() => floatAnimation());
    };
    floatAnimation();

    // Pulse animation for button
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulseAnimation());
    };
    pulseAnimation();
  }, []);

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all information.");
      return;
    }

    setIsLoading(true);

    // Shake animation for loading
    const shakeAnimation = Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]);

    try {
      await register(username, email, password);

      // Success animation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Alert.alert("Success", "Registration successful! Please log in.", [
          { text: "OK", onPress: () => router.replace("/(auth)/login") },
        ]);
      });
    } catch (error) {
      shakeAnimation.start();
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again."
      );
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <LinearGradient
        colors={["#FFE4E1", "#FAD4C0", "#D9A47F"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContainer, { flexGrow: 1 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Animated Background Circles */}
          <Animated.View
            style={[
              styles.backgroundCircle1,
              {
                transform: [{ rotate: spin }],
                opacity: fadeAnim,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.backgroundCircle2,
              {
                transform: [{ rotate: spin }],
                opacity: fadeAnim,
              },
            ]}
          />

          {/* Logo Section */}
          <View style={styles.logoSection}>
            <LottieView
              ref={animation}
              source={require("@assets/animations/animation_register.json")}
              autoPlay
              loop
              style={{
                width: 500,
                height: 300,
              }}
            />
          </View>

          {/* Title */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.title}>Create New Account</Text>
            <Text style={styles.subtitle}>Register to get started</Text>
          </Animated.View>

          {/* Form Section */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="person"
                size={20}
                color="black"
                style={styles.inputIcon}
              />
              <TextInput
                ref={usernameRef}
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail"
                size={20}
                color="black"
                style={styles.inputIcon}
              />
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed"
                size={20}
                color="black"
                style={styles.inputIcon}
              />
              <TextInput
                ref={passwordRef}
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            {/* Register Button */}
            <Animated.View>
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["black", "black"]}
                  style={styles.buttonGradient}
                >
                  {isLoading ? (
                    <Animated.View
                      style={{
                        transform: [{ rotate: spin }],
                      }}
                    >
                      <Ionicons name="refresh" size={20} color="white" />
                    </Animated.View>
                  ) : (
                    <Text style={styles.buttonText}>Register</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Login Link */}
            <Animated.View
              style={[
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => router.push("/(auth)/login")}
                style={styles.linkContainer}
              >
                <Text style={styles.link}>
                  Already have an account?
                  <Text style={styles.linkBold}> Log in now</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    minHeight: height,
  },
  backgroundCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    top: -50,
    right: -50,
  },
  backgroundCircle2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    bottom: -30,
    left: -30,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(0, 0, 0, 0.8)",
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 25,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 15,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 5,
  },
  button: {
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  link: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  linkBold: {
    color: "black",
    fontWeight: "bold",
  },
});

export default RegisterScreen;
