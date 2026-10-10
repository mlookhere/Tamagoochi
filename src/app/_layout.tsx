import { Tabs } from 'expo-router';
import { AppErrorBoundary } from '../components/AppErrorBoundary';
import { getPublicConfig } from '../config/public';
import { colors } from '../theme';

function AppTabs() {
  getPublicConfig();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.moss,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.border,
          height: 76,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="adventure" options={{ title: 'Adventure' }} />
      <Tabs.Screen name="memories" options={{ title: 'Memories' }} />
      <Tabs.Screen name="friends" options={{ title: 'Friends' }} />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <AppTabs />
    </AppErrorBoundary>
  );
}
