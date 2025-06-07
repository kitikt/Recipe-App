// src/app/(tabs)/profile.tsx
import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { router } from "expo-router";

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/login");
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Lỗi", "Đăng xuất thất bại. Vui lòng thử lại.");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hồ Sơ</Text>
      </View>
      <View style={styles.profileContainer}>
        <Text style={styles.label}>Tên: {user.username}</Text>
        <Text style={styles.label}>Email: {user.email}</Text>
        <Text style={styles.label}>
          Vai trò: {user.role === "admin" ? "Admin" : "Người dùng"}
        </Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng Xuất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    marginTop: 50,
    padding: 20,
    backgroundColor: "#ff8c00",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  profileContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: "#ff4757",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
