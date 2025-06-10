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
        tabBarActiveTintColor: "#CB410B",
        tabBarInactiveTintColor: "#44362F",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#333",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang Chủ",
          tabBarLabel: "Trang Chủ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
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
          tabBarItemStyle: user ? {} : { display: "none" },
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
              : { display: "none" },
        }}
      />
      <Tabs.Screen
        name="recipe-management"
        options={{
          title: "Edit Recipes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add" color={color} size={size} />
          ),
          tabBarItemStyle:
            user && user.role === "admin" && typeof user.role === "string"
              ? {}
              : { display: "none" },
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          title: "AI Chat",
          tabBarLabel: "AI Chat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" color={color} size={size} />
          ),
          tabBarItemStyle: user ? {} : { display: "none" },
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
