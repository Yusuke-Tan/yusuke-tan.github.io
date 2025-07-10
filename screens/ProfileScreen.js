import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, Pressable } from 'react-native';
import { Button, TextInput, Avatar, Text, Title, Card, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

const PROFILE_STORAGE_KEY = '@user_profile_v1';
const IDT_HISTORY_KEY = '@idt_history_v1';
const HIGH_SCORE_IDT_KEY = '@high_score_idt_v4';
const RECORDS_STORAGE_KEY = '@rowing_records_v1';


export default function ProfileScreen() {
  // ★ 1. 表示用のStateにweightとgenderを追加
  const [name, setName] = useState('ユーザー名');
  const [affiliation, setAffiliation] = useState('所属');
  const [iconUri, setIconUri] = useState(null);
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('');

  const [isEditing, setIsEditing] = useState(false);

  // ★ 2. 編集用にtempWeightとtempGenderを追加
  const [tempName, setTempName] = useState('');
  const [tempAffiliation, setTempAffiliation] = useState('');
  const [tempIconUri, setTempIconUri] = useState(null);
  const [tempWeight, setTempWeight] = useState('');
  const [tempGender, setTempGender] = useState('');
  
  const navigation = useNavigation();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const json = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (json) {
          const profile = JSON.parse(json);
          // ★ 3. 読み込み処理にweightとgenderを追加
          setName(profile.name || 'ユーザー名');
          setAffiliation(profile.affiliation || '所属');
          setIconUri(profile.iconUri || null);
          setWeight(profile.weight || '');
          setGender(profile.gender || '');
        }
      } catch (e) {
        console.error("Failed to load profile.", e);
      }
    };
    loadProfile();
  }, []);

  const pickImage = async () => { /* ... 変更なし ... */ };

  // ★ 4. 編集開始処理にweightとgenderを追加
  const handleEdit = () => {
    setTempName(name);
    setTempAffiliation(affiliation);
    setTempIconUri(iconUri);
    setTempWeight(weight);
    setTempGender(gender);
    setIsEditing(true);
  };

  // ★ 5. 保存処理にweightとgenderを追加
  const handleSave = async () => {
    const newProfile = {
      name: tempName,
      affiliation: tempAffiliation,
      iconUri: tempIconUri,
      weight: tempWeight,
      gender: tempGender,
    };
    try {
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
      setName(tempName);
      setAffiliation(tempAffiliation);
      setIconUri(tempIconUri);
      setWeight(tempWeight);
      setGender(tempGender);
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to save profile.", e);
      Alert.alert("エラー", "プロフィールの保存に失敗しました。");
    }
  };

  // ★ 6. リセット処理にweightとgenderを追加
  const handleResetAllData = () => {
    Alert.alert( "データの完全リセット", "本当にすべてのデータをリセットしますか？この操作は元に戻せません。",
      [
        { text: "キャンセル", style: "cancel" },
        { text: "リセットする", style: "destructive", onPress: () => {
            Alert.alert( "最終確認", "練習記録、IDT履歴、プロフィールを含むすべてのデータが完全に削除されます。よろしいですか？",
              [
                { text: "キャンセル", style: "cancel" },
                { text: "すべて削除", style: "destructive", onPress: async () => {
                    try {
                      const keys = [PROFILE_STORAGE_KEY, IDT_HISTORY_KEY, HIGH_SCORE_IDT_KEY, RECORDS_STORAGE_KEY];
                      await AsyncStorage.multiRemove(keys);
                      
                      setName('ユーザー名');
                      setAffiliation('所属');
                      setIconUri(null);
                      setWeight('');
                      setGender('');
                      
                      Alert.alert("完了", "すべてのデータがリセットされました。");
                      navigation.navigate('Home');
                    } catch (e) {
                      console.error("Failed to reset all data.", e);
                      Alert.alert("エラー", "データのリセットに失敗しました。");
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  // ★★★ 7. 表示モードのUIに体重と性別を追加 ★★★
  const renderDisplayView = () => (
    <View style={styles.container}>
      <Avatar.Image
        size={120}
        source={iconUri ? { uri: iconUri } : require('../assets/icon.png')}
        style={styles.avatar}
      />
      <Title style={styles.name}>{name}</Title>
      <Text style={styles.affiliation}>{affiliation}</Text>
      
      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>性別</Text>
          <Text style={styles.infoValue}>{gender || '未設定'}</Text>
        </View>
        <Divider />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>体重</Text>
          <Text style={styles.infoValue}>{weight ? `${weight} kg` : '未設定'}</Text>
        </View>
      </Card>
      
      <Button mode="contained" onPress={handleEdit} style={styles.button}>
        プロフィールを編集
      </Button>
      <Divider style={styles.divider} />
      <Button mode="outlined" onPress={handleResetAllData} style={styles.resetButton} labelStyle={styles.resetButtonLabel} icon="alert-circle-outline">
        全データをリセット
      </Button>
    </View>
  );

  // ★★★ 8. 編集モードのUIに体重と性別の入力を追加 ★★★
  const renderEditView = () => (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.formCard}>
        <Card.Content>
          <Title style={styles.editTitle}>プロフィール編集</Title>
          <Pressable onPress={pickImage} style={styles.avatarContainer}>
            <Avatar.Image size={120} source={tempIconUri ? { uri: tempIconUri } : (iconUri ? { uri: iconUri } : require('../assets/icon.png'))} />
            <Text style={styles.avatarEditText}>画像をタップして変更</Text>
          </Pressable>

          <TextInput label="ユーザー名" value={tempName} onChangeText={setTempName} style={styles.input} />
          <TextInput label="所属（学校・団体名など）" value={tempAffiliation} onChangeText={setTempAffiliation} style={styles.input} />
          <TextInput label="体重 (kg)" value={tempWeight} onChangeText={setTempWeight} style={styles.input} keyboardType="numeric" />
          
          <Text style={styles.label}>性別</Text>
          <View style={styles.genderButtonContainer}>
            <Button mode={tempGender === '男子' ? 'contained' : 'outlined'} onPress={() => setTempGender('男子')} style={styles.genderButton}>男子</Button>
            <Button mode={tempGender === '女子' ? 'contained' : 'outlined'} onPress={() => setTempGender('女子')} style={styles.genderButton}>女子</Button>
          </View>
        </Card.Content>
        <Card.Actions style={styles.buttonGroup}>
          <Button onPress={() => setIsEditing(false)} style={styles.editButton}>キャンセル</Button>
          <Button mode="contained" onPress={handleSave} style={styles.editButton}>保存する</Button>
        </Card.Actions>
      </Card>
    </ScrollView>
  );

  return isEditing ? renderEditView() : renderDisplayView();
}

const styles = StyleSheet.create({
  // (既存のスタイルは変更なし)
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#f0f4f8' },
  avatar: { marginBottom: 20, backgroundColor: '#ddd' },
  name: { fontSize: 24, fontWeight: 'bold' },
  affiliation: { fontSize: 18, color: 'gray', marginBottom: 20 },
  button: { width: '100%', marginTop: 10, },
  divider: { width: '100%', marginVertical: 20 },
  resetButton: { width: '100%', borderColor: '#d32f2f' },
  resetButtonLabel: { color: '#d32f2f' },
  formCard: { width: '100%' },
  editTitle: { textAlign: 'center', marginBottom: 20 },
  avatarContainer: { alignItems: 'center', marginBottom: 20 },
  avatarEditText: { color: '#1e88e5', marginTop: 10 },
  input: { marginBottom: 15 },
  label: { fontWeight: '600', marginBottom: 5, fontSize: 14, color: '#333' },
  genderButtonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  genderButton: { flex: 1, marginHorizontal: 5 },
  buttonGroup: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 8, paddingBottom: 16 },
  editButton: { flex: 1, marginHorizontal: 8 },

  // ★ 表示モード用の新しいスタイル
  infoCard: {
    width: '100%',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    color: 'gray',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});