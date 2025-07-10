import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Keyboard, ScrollView, StyleSheet, Alert, FlatList } from 'react-native';
import { Button, Card, IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PROFILE_STORAGE_KEY = '@user_profile_v1';
const HIGH_SCORE_IDT_KEY = '@high_score_idt_v4';
const IDT_HISTORY_KEY = '@idt_history_v1';

export default function IDTScreen() {
  const [min, setMin] = useState('');
  const [sec, setSec] = useState('');
  const [secd, setSecd] = useState('');
  const [idt, setIdt] = useState(null);
  const [idtHistory, setIdtHistory] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const loadIdtHistory = async () => {
        try {
          const historyJson = await AsyncStorage.getItem(IDT_HISTORY_KEY);
          const history = historyJson ? JSON.parse(historyJson) : [];
          history.sort((a, b) => new Date(b.date) - new Date(a.date));
          setIdtHistory(history);
        } catch (e) {
          console.error("Failed to load IDT history.", e);
        }
      };
      loadIdtHistory();
    }, [])
  );

  const calculateIdt = async () => {
    let profile = {};
    try {
      const json = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (json) {
        profile = JSON.parse(json);
      }
    } catch (e) {
      console.error("Failed to load profile for calculation.", e);
      Alert.alert("エラー", "プロフィール情報の読み込みに失敗しました。");
      return;
    }

    if (!profile.weight || !profile.gender) {
      Alert.alert("プロフィール未設定", "IDTを計算するには、まずプロフィール画面で体重と性別を設定してください。");
      return;
    }

    const ergoSeconds = parseFloat(min) * 60 + parseFloat(sec) + parseFloat(secd) * 0.1;
    const wei = parseFloat(profile.weight);
    const gend = profile.gender === '男子' ? 0 : 1;

    if (!ergoSeconds) {
      alert('エルゴタイムを正しく入力してください。');
      return;
    }

    const idtm = ((101 - wei) * (20.9 / 23) + 333.07) / ergoSeconds * 100;
    const idtw = ((100 - wei) * 1.4 + 357.8) / ergoSeconds * 100;
    const result = idtm * (1 - gend) + idtw * gend;
    
    const newIdtRecord = { 
      id: Date.now().toString(), 
      idtScore: result, 
      ergoTimeSeconds: ergoSeconds, 
      ergoTimeString: `${min}:${sec.padStart(2, '0')}.${secd}`, 
      weight: profile.weight, 
      date: new Date().toISOString() 
    };
    
    try {
      const historyJson = await AsyncStorage.getItem(IDT_HISTORY_KEY);
      const history = historyJson ? JSON.parse(historyJson) : [];
      const updatedHistory = [newIdtRecord, ...history];
      updatedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setIdtHistory(updatedHistory);
      await AsyncStorage.setItem(IDT_HISTORY_KEY, JSON.stringify(updatedHistory));
      
      const highScoreJson = await AsyncStorage.getItem(HIGH_SCORE_IDT_KEY);
      const currentHighScore = highScoreJson ? JSON.parse(highScoreJson) : { score: 0 };
      if (result > currentHighScore.score) {
        const newHighScore = { score: result, time: newIdtRecord.ergoTimeString, weight: profile.weight };
        await AsyncStorage.setItem(HIGH_SCORE_IDT_KEY, JSON.stringify(newHighScore));
      }
    } catch (e) { 
      console.error('Failed to save IDT data.', e); 
      Alert.alert('エラー', 'データの保存に失敗しました。'); 
    }
    
    setIdt(result.toFixed(2));
    Keyboard.dismiss();
  };
  
  const handleDeleteIdt = (idToDelete) => {
    Alert.alert("履歴の削除", "この計算履歴を本当に削除しますか？",
      [
        { text: "キャンセル", style: "cancel" },
        { 
          text: "削除", 
          onPress: async () => {
            const updatedHistory = idtHistory.filter(item => item.id !== idToDelete);
            setIdtHistory(updatedHistory);
            await AsyncStorage.setItem(IDT_HISTORY_KEY, JSON.stringify(updatedHistory));
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.resultCard}>
        <Card.Content>
          <Text style={styles.cardLabel}>IDT</Text>
          <Text style={styles.cardValue}>
            {idt ? idt : '--'}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.formCard}>
        <Card.Title title="IDT 計算フォーム" titleStyle={styles.formCardTitle} />
        <Card.Content>
          <Text style={styles.label}>エルゴタイム</Text>
          <View style={styles.row}>
            <TextInput style={styles.inputSmall} keyboardType="numeric" placeholder="分" value={min} onChangeText={setMin} />
            <Text style={styles.unit}>分</Text>
            <TextInput style={styles.inputSmall} keyboardType="numeric" placeholder="秒" value={sec} onChangeText={setSec} />
            <Text style={styles.unit}>秒</Text>
            <TextInput style={styles.inputSmall} keyboardType="numeric" placeholder="1/10" value={secd} onChangeText={setSecd} />
            <Text style={styles.unit}>0.1秒</Text>
          </View>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button mode="contained" onPress={calculateIdt} style={styles.button}>計算する</Button>
        </Card.Actions>
      </Card>

      <Text style={styles.listTitle}>2000tt履歴</Text>
      <FlatList
        data={idtHistory}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card style={styles.recordCard}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.iconAndData}>
                <MaterialCommunityIcons name="history" size={30} color="#1e88e5" />
                <View style={styles.textData}>
                  <Text style={styles.mainText}>{item.ergoTimeString} </Text>
                  <Text style={styles.detailText}>
                    IDT: {item.idtScore.toFixed(2)}
                  </Text>
                  <Text style={styles.detailText}>
                  {new Date(item.date).toLocaleDateString('ja-JP')}
                  </Text>
                </View>
              </View>
              <IconButton
                icon="delete-outline"
                iconColor="#ff4d4d"
                size={24}
                onPress={() => handleDeleteIdt(item.id)}
              />
            </Card.Content>
          </Card>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f0f4f8', flexGrow: 1 },
  label: { fontWeight: '600', marginBottom: 5 },
  inputSmall: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, backgroundColor: '#fff', textAlign: 'center' },
  unit: { alignSelf: 'center', marginHorizontal: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  button: { flex: 1, paddingVertical: 4, backgroundColor: '#1e88e5' },
  resultCard: { marginBottom: 20, backgroundColor: '#fff', elevation: 4 },
  cardLabel: { textAlign: 'center', fontSize: 16, color: '#666' },
  cardValue: { textAlign: 'center', fontSize: 48, fontWeight: 'bold', color: '#1e88e5', marginVertical: 10 },
  formCard: { elevation: 2 },
  formCardTitle: { fontWeight: 'bold' },
  cardActions: { paddingHorizontal: 16, paddingBottom: 16 },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingTop: 20,
  },
  recordCard: {
    marginBottom: 10,
    backgroundColor: '#fff',
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconAndData: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textData: {
    marginLeft: 15,
  },
  mainText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
});