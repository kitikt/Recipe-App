import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "../../context/AuthContext";
import { View } from "react-native";

export default function TabsLayout() {
  const { user, isLoading } = useAuth();
  console.log("User in TabsLayout:", user);

  if (isLoading) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#ff8c00",
        tabBarInactiveTintColor: "#999",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#D9D9D9",
          borderTopWidth: 1,
          borderTopColor: "#e0e0e0",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang Chủ",
          tabBarLabel: "Trang Chủ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmark"
        options={{
          title: "Đã Lưu",
          tabBarLabel: "Đã Lưu",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark-outline" color={color} size={size} />
          ),
          tabBarItemStyle: user ? {} : { display: "none" }, // Show if user is logged in
        }}
      />
      <Tabs.Screen
        name="plus"
        options={{
          title: "Thêm",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add" color={color} size={size} />
          ),
          tabBarItemStyle:
            user && user.role === "admin" && typeof user.role === "string"
              ? {}
              : { display: "none" }, // Show if user is admin
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Hồ Sơ",
          tabBarLabel: "Hồ Sơ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
