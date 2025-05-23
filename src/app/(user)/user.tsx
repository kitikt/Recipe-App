import { Link } from "expo-router";
import { Button, Text, View } from "react-native";

const User = () => {
  return (
    <View>
      <Text>this is login page</Text>
      <Link href={"/"} asChild>
        <Button title="go to home"></Button>
      </Link>
    </View>
  );
};
export default User;
