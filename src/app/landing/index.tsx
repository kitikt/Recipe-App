import { useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import LottieView from "lottie-react-native";
import { useRouter } from "expo-router";

const LandingPage = () => {
  const animation = useRef(null);
  const router = useRouter();

  const handleExplore = () => {
    router.push("/(tabs)");
  };

  return (
    <ImageBackground
      source={require("@assets/background.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <LottieView
          ref={animation}
          source={require("@assets/animations/animation.json")}
          autoPlay
          loop
          style={{ width: 500, height: 300 }}
        />
        <TouchableOpacity style={styles.button} onPress={handleExplore}>
          <Text style={styles.buttonText}>Explore</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  button: {
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "black",
    borderRadius: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default LandingPage;
