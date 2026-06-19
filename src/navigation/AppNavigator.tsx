// src/navigation/AppNavigator.tsx
import React from 'react';
import {Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useTheme} from '../context/ThemeContext';
import {CameraScreen} from '../screens/CameraScreen';
import {GalleryScreen} from '../screens/GalleryScreen';
import {UploadScreen} from '../screens/UploadScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {MainTabParamList} from '../types';
import {FontSizes} from '../constants/fonts';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, string> = {
  Camera: '📷',
  Gallery: '🖼',
  Upload: '⬆️',
  Settings: '⚙️',
};

export function AppNavigator() {
  const {colors, isDark} = useTheme();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({route}) => ({
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.surface,
            shadowColor: colors.shadow,
            elevation: 2,
          },
          headerTitleStyle: {
            color: colors.textPrimary,
            fontSize: FontSizes.lg,
            fontWeight: '700',
          },
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.border,
            height: 62,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: colors.tabBarActive,
          tabBarInactiveTintColor: colors.tabBarInactive,
          tabBarLabelStyle: {fontSize: FontSizes.xs},
          tabBarIcon: ({focused}) => (
            <Text style={{fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.6}}>
              {TAB_ICONS[route.name]}
            </Text>
          ),
        })}>
        <Tab.Screen
          name="Camera"
          component={CameraScreen}
          options={{
            title: 'Camera',
            headerTitle: '📍 GeoProof',
          }}
        />
        <Tab.Screen
          name="Gallery"
          component={GalleryScreen}
          options={{title: 'Gallery'}}
        />
        <Tab.Screen
          name="Upload"
          component={UploadScreen}
          options={{title: 'Upload'}}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{title: 'Settings'}}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
