import CustomTabBar from "@/components/CustomTabBar";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarLabel: "Home" }} />
      <Tabs.Screen name="scanner" options={{ title: "Scanner", tabBarLabel: "Scanner" }} />
      <Tabs.Screen name="cart" options={{ title: "Cart", tabBarLabel: "Cart" }} />
      <Tabs.Screen name="budget" options={{ title: "Budget", tabBarLabel: "Budget" }} />
      <Tabs.Screen name="account" options={{ title: "Profile", tabBarLabel: "Profile" }} />

      {/* Hidden from the tab bar but still accessible as screens */}
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="favorites" options={{ href: null }} />
      {/* Reserved for a future feature. Re-enable when Explore is ready. */}
      {/* <Tabs.Screen name="explore" options={{ href: null, title: "Explore", tabBarLabel: "Explore" }} /> */}
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}
