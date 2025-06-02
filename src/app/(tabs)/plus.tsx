// src/app/(tabs)/plus.tsx
import { View, Text, StyleSheet } from "react-native";

export default function PlusScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Recipe</Text>
      <Text style={styles.subtitle}>
        This feature is coming soon! Add your own recipes here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
