import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { CustomSplashScreen } from "@/components/CustomSplashScreen";
import { CartProvider } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { StoreProvider, useStore } from '@/context/StoreContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { isSessionValid, clearAuth } from '@/services/api';
import * as SplashScreen from "expo-splash-screen";
import { useState, useEffect } from "react";

// Prevent the native splash screen from hiding forcefully. We'll hide it inside `CustomSplashScreen`.
SplashScreen.preventAutoHideAsync().catch(() => { });

function RootNavigation() {
  const { selectedStore, isLoadingStores } = useStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkNavigation = async () => {
      const valid = await isSessionValid();
      const inAuthGroup = segments[0] === "(auth)";
      const inTabsGroup = segments[0] === "(tabs)";
      const inStoreSelector = segments[0] === "store-selector";

      if (!valid) {
        // Clear everything if invalid session
        await clearAuth();
        if (!inAuthGroup) {
          router.replace("/(auth)/login");
        }
      } else if (!selectedStore) {
        // Valid session but no store selected
        if (!inStoreSelector && !inAuthGroup) {
          router.replace("/store-selector");
        }
      } else if (inAuthGroup || inStoreSelector) {
        // Valid session and store selected, but still in auth or onboarding
        router.replace("/(tabs)");
      }
      setIsReady(true);
    };

    if (!isLoadingStores) {
      checkNavigation();
    }
  }, [selectedStore, segments, isLoadingStores]);

  if (!isReady) return null;

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      <Stack.Screen name="store-selector" options={{ headerShown: false }} />

      {/* Stand-alone screens */}
      <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="brand/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="category/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="addresses" options={{ headerShown: false }} />
      <Stack.Screen name="add-address" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="checkout" options={{ headerShown: false }} />
      <Stack.Screen name="order-confirmation" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="payment-methods" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appIsReady, setAppIsReady] = useState(false);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StoreProvider>
        <FavoritesProvider>
          <CartProvider>
            {!appIsReady && <CustomSplashScreen onComplete={() => setAppIsReady(true)} />}
            <RootNavigation />
          </CartProvider>
        </FavoritesProvider>
      </StoreProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
