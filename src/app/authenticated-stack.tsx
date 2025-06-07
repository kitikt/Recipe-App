import { Stack } from "expo-router";

export default function AuthenticatedStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="landing/index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(auth)/register" />
      <Stack.Screen name="recipe/[id]" />
    </Stack>
  );
}
