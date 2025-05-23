import { Link } from "expo-router";
import { Button, Text, View } from "react-native";

const Login = () => {
  return (
    <View style={{ marginTop: 20 }}>
      <Text>this is login page</Text>
      <Link href={"/"} asChild>
        <Button title="go to home"></Button>
      </Link>
    </View>
  );
};
export default Login;
