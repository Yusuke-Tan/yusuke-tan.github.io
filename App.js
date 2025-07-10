import React, { useState, useCallback } from 'react';
import { Pressable } from 'react-native';
import { NavigationContainer, useNavigation, useFocusEffect } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// スクリーンコンポーネントのインポート
import HomeScreen from './screens/HomeScreen';
import IDTScreen from './screens/IDTScreen';
import RecordScreen from './screens/RecordScreen';
import ProfileScreen from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const PROFILE_STORAGE_KEY = '@user_profile_v1';


// ★★★ 1. ヘッダー専用のアイコンコンポーネントを定義 ★★★
const ProfileHeaderIcon = () => {
  const navigation = useNavigation();
  const [iconUri, setIconUri] = useState(null);

  // 画面が表示されるたびにアイコンを更新するためのフック
  useFocusEffect(
    useCallback(() => {
      const loadIcon = async () => {
        try {
          const json = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
          if (json) {
            const profile = JSON.parse(json);
            setIconUri(profile.iconUri);
          } else {
            setIconUri(null); // プロフィールがリセットされた場合
          }
        } catch (e) {
          console.error("Failed to load profile icon for header.", e);
        }
      };
      loadIcon();
    }, [])
  );

  return (
    // アイコンをタップするとプロフィール画面に移動する
    <Pressable
      onPress={() => navigation.navigate('Profile')}
      style={{ marginRight: 15 }}
    >
      <Avatar.Image
        size={34}
        source={iconUri ? { uri: iconUri } : require('./assets/icon.png')}
      />
    </Pressable>
  );
};


export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#1e88e5' },
          headerTintColor: '#fff',
          tabBarActiveTintColor: '#1e88e5',
          tabBarInactiveTintColor: 'gray',
          // ★★★ 2. screenOptionsにheaderRightを追加し、全画面にアイコンを適用 ★★★
          headerRight: () => <ProfileHeaderIcon />,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'ホーム',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="IDT"
          component={IDTScreen}
          options={{
            title: '2000tt',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="calculator" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Record"
          component={RecordScreen}
          options={{
            title: '練習記録',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="clipboard-list" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: 'プロフィール',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account-circle" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}