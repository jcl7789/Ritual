// src/components/Navigation.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import HomeScreen from '../../screens/HomeScreen';
import HistoryScreen from '../../screens/HistoryScreen';
import AddEntryScreen from '../../screens/AddEntryScreen';
import SettingsScreen from '../../screens/SettingsScreen';

import { TabParamList, RootStackParamList, TabBarIconProps } from '../../types/Navigation';
import FirstLoad from '../../screens/FirstLoadScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Iconos para las tabs
const getTabBarIcon = (routeName: keyof TabParamList) => {
  return ({ focused, color, size }: TabBarIconProps) => {
    let iconName: keyof typeof Ionicons.glyphMap;

    switch (routeName) {
      case 'Home':
        iconName = focused ? 'home' : 'home-outline';
        break;
      case 'History':
        iconName = focused ? 'calendar' : 'calendar-outline';
        break;
      default:
        iconName = 'ellipse';
    }

    return <Ionicons name={iconName} size={size} color={color} />;
  };
};

// Navegación por tabs
function TabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: getTabBarIcon(route.name),
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t('navigation.home') }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarLabel: t('navigation.history') }}
      />
    </Tab.Navigator>
  );
}

// Navegación principal con stack
export default function Navigation() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddEntry"
        component={AddEntryScreen}
        options={{
          title: t('addEntry.title'),
          presentation: 'modal',
          headerStyle: {
            backgroundColor: '#6366f1',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen} // Assuming you have a SettingsScreen component
        options={{
          title: t('settings.title'),
          headerStyle: {
            backgroundColor: '#6366f1',
          },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
}