import { Tabs } from 'expo-router';
import { AppErrorBoundary } from '../components/AppErrorBoundary';
import { WorldGlyph } from '../components/WorldGlyph';
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <WorldGlyph kind="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="adventure"
        options={{
          title: 'Adventure',
          tabBarIcon: ({ color }) => <WorldGlyph kind="adventure" color={color} />,
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: 'Memories',
          tabBarIcon: ({ color }) => <WorldGlyph kind="memories" color={color} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ color }) => <WorldGlyph kind="friends" color={color} />,
        }}
      />
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
