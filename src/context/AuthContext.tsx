import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Chỉ đặt user nếu có đủ thông tin cần thiết
          if (parsedUser?.id && parsedUser?.token && parsedUser?.role) {
            setUser(parsedUser);
          } else {
            await AsyncStorage.removeItem("user"); // Xóa dữ liệu không hợp lệ
          }
        }
      } catch (error) {
        console.error("Error loading user:", error);
        await AsyncStorage.removeItem("user"); // Xóa nếu có lỗi
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      if (!apiUrl) {
        throw new Error("API base URL is not defined. Check your .env file.");
      }
      const response = await fetch(`${apiUrl}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const text = await response.text();
      console.log("Login response:", text); // Debug response
      const data = text ? JSON.parse(text) : {};
      if (response.ok) {
        const userData: User = {
          id: data.user?.id || data.id || "",
          username: data.user?.username || data.username || "",
          email: data.user?.email || data.email || "",
          role: (data.user?.role || data.role || "user") as "admin" | "user",
          token: data.token || "",
        };
        if (!userData.id || !userData.token) {
          throw new Error("Invalid user data from API");
        }
        setUser(userData);
        await AsyncStorage.setItem("user", JSON.stringify(userData));
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error instanceof Error ? error : new Error("Login failed");
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      if (!apiUrl) {
        throw new Error("API base URL is not defined. Check your .env file.");
      }
      const response = await fetch(`${apiUrl}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
