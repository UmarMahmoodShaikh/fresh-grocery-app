import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { CustomSplashScreen } from "@/components/CustomSplashScreen";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { BudgetProvider } from '@/context/BudgetContext';
import { CartProvider } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { NetworkProvider } from '@/context/NetworkContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as SplashScreen from "expo-splash-screen";
import { useState } from "react";

// Prevent the native splash screen from hiding forcefully. We'll hide it inside `CustomSplashScreen`.
SplashScreen.preventAutoHideAsync().catch(() => { });

export const unstable_settings = {
  anchor: "(auth)/login",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appIsReady, setAppIsReady] = useState(false);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <NetworkProvider>
        <FavoritesProvider>
          <BudgetProvider>
            <CartProvider>
              <OfflineIndicator />
              {!appIsReady && <CustomSplashScreen onComplete={() => setAppIsReady(true)} />}
              <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(admin)" options={{ headerShown: false }} />

              {/* Stand-alone screens */}
              <Stack.Screen
                name="product/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="brand/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="category/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="addresses"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="add-address"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="profile"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="checkout"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="order-confirmation"
                options={{ headerShown: false, gestureEnabled: false }}
              />
              <Stack.Screen
                name="order/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="payment-methods"
                options={{ headerShown: false }}
              />

              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
          </CartProvider>
        </BudgetProvider>
        </FavoritesProvider>
      </NetworkProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
