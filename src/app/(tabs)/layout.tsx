import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="like" options={{ title: "Like" }} />
      <Tabs.Screen name="user" options={{ title: "User" }} />
    </Tabs>
  );
}
