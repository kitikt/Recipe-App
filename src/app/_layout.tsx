import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import AuthenticatedStack from "./authenticated-stack";
import { useRouter } from "expo-router";

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/landing");
    }
  }, [user, isLoading]);

  if (isLoading) {
    return null; // Trả về null trong khi đang tải
  }

  return <AuthenticatedStack />;
}
