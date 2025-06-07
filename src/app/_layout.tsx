import { AuthProvider } from "../context/AuthContext";
import AuthenticatedStack from "./authenticated-stack";

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthenticatedStack />
    </AuthProvider>
  );
}
