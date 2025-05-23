import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text } from "react-native";

export default function Index() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsReady(true);
    }, 10);
  }, []);

  useEffect(() => {
    if (isReady) {
      router.replace("/landing");
    }
  }, [isReady]);

  return (
    <View>
      <Text>Redirecting...</Text>
    </View>
  );
}
