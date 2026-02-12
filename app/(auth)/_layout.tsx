import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function AuthLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
            title: "Sign In",
          }}
        />
        <Stack.Screen
          name="signup"
          options={{
            headerShown: false,
            title: "Sign Up",
          }}
        />
        <Stack.Screen
          name="forgot-password"
          options={{
            headerShown: false,
            title: "Reset Password",
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
