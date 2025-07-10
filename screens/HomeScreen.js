import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// カレンダーの日本語化設定
LocaleConfig.locales['jp'] = { monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'], monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'], dayNames: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'], dayNamesShort: ['日', '月', '火', '水', '木', '金', '土'], today: '今日' };
LocaleConfig.defaultLocale = 'jp';

// データを読み込むためのキー
const IDT_HISTORY_KEY = '@idt_history_v1';
const RECORDS_STORAGE_KEY = '@rowing_records_v1';

// ★★★ キャラクターコンポーネントのコメントロジックを更新 ★★★
const CharacterComment = ({ totalDistance }) => {
  const getComment = () => {
    const distanceKm = totalDistance / 1000;
    
    // 距離の大きい方から順に判定
    if (distanceKm >= 3200) {
      const earthCircumference = 40000; // 地球一周を40000kmと定義
      const percentage = (distanceKm / earthCircumference) * 100;
      return {
        text: `これは地球一周の約${percentage.toFixed(2)}%です`,
        iconName: 'earth',
      };
    }
    if (distanceKm >= 3000) {
      return {
        text: "これはおおよそ日本列島を縦断するくらいの距離です！",
        iconName: 'star',
      };
    }
    if (distanceKm >= 100) {
      return {
        text: "100km漕破！これは地上から宇宙まで届く距離です！！",
        iconName: 'rocket-launch-outline',
      };
    }
    if (distanceKm >= 42.195) {
      return {
        text: "フルマラソンを漕ぎ切りましたね！",
        iconName: 'run',
      };
    }
    if (distanceKm >= 35) {
      return {
        text: "あなたが漕いだ距離はおおよそ山手線一周分にあたります！",
        iconName: 'train-variant',
      };
    }
    if (distanceKm >= 1) {
      return {
        text: `すごい！もう${distanceKm.toFixed(1)}kmも漕いだんだね！`,
        iconName: 'emoticon-happy-outline',
      };
    }
    // デフォルトのコメント
    return {
      text: "さあ、練習を始めよう！",
      iconName: 'emoticon-outline',
    };
  };

  const { text, iconName } = getComment();

  return (
    <View style={styles.characterContainer}>
      <MaterialCommunityIcons name={iconName} size={80} color="#555" />
      <View style={styles.balloon}>
        <Text style={styles.balloonText}>{text}</Text>
      </View>
    </View>
  );
};


export default function HomeScreen() {
  const [bestErgoRecord, setBestErgoRecord] = useState({ ergoTimeString: '--', idtScore: 0 });
  const [totalDistance, setTotalDistance] = useState(0);
  const [records, setRecords] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [recordsForSelectedDate, setRecordsForSelectedDate] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const idtHistoryJSON = await AsyncStorage.getItem(IDT_HISTORY_KEY);
          if (idtHistoryJSON) { const idtHistory = JSON.parse(idtHistoryJSON); if (idtHistory.length > 0) { const bestRecord = idtHistory.reduce((best, current) => current.ergoTimeSeconds < best.ergoTimeSeconds ? current : best); setBestErgoRecord(bestRecord); } } else { setBestErgoRecord({ ergoTimeString: '--', idtScore: 0 }); }
          const recordsJSON = await AsyncStorage.getItem(RECORDS_STORAGE_KEY);
          if (recordsJSON) { const loadedRecords = JSON.parse(recordsJSON); setRecords(loadedRecords); const total = loadedRecords.reduce((sum, record) => sum + Number(record.amount || 0), 0); setTotalDistance(total); } else { setRecords([]); setTotalDistance(0); }
        } catch (e) { console.error("Failed to fetch data for home screen.", e); }
      };
      fetchData();
    }, [])
  );

  useEffect(() => {
    const newMarkedDates = {};
    records.forEach(record => {
      const dateString = record.dateForSort.substring(0, 10);
      newMarkedDates[dateString] = { marked: true, dotColor: '#1e88e5' };
    });
    if (selectedDate) {
      const existingMarking = newMarkedDates[selectedDate] || {};
      newMarkedDates[selectedDate] = {
        ...existingMarking,
        selected: true,
        selectedColor: '#ffa726',
      };
    }
    setMarkedDates(newMarkedDates);
  }, [records, selectedDate]);

  useEffect(() => {
    if (selectedDate) { const filteredRecords = records.filter(record => record.dateForSort.startsWith(selectedDate)); setRecordsForSelectedDate(filteredRecords); }
    else { setRecordsForSelectedDate([]); }
  }, [selectedDate, records]);
  
  const onDayPress = (day) => {
    if (day.dateString === selectedDate) { setSelectedDate(''); }
    else { setSelectedDate(day.dateString); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.summaryCardTitle}>2000ttベストタイム</Text>
          <Text style={styles.summaryMainValue}>{bestErgoRecord.ergoTimeString}</Text>
          <View style={styles.summarySubValueContainer}><Text style={styles.summarySubValueText}>IDT: {bestErgoRecord.idtScore.toFixed(2)}</Text></View>
        </Card.Content>
      </Card>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.summaryCardTitle}>練習合計距離</Text>
          <Text style={styles.summaryMainValue}>{totalDistance.toLocaleString()} <Text style={styles.summaryUnit}>m</Text></Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Calendar 
          markedDates={markedDates} 
          monthFormat={'yyyy年 M月'} 
          onDayPress={onDayPress} 
          theme={{ 
            selectedDayBackgroundColor: '#ffa726', 
            arrowColor: '#1e88e5', 
            todayTextColor: '#1e88e5', 
            dotColor: '#1e88e5', 
          }} 
        />
      </Card>
      
      {selectedDate && (
        <Card style={styles.card}>
          <Card.Title 
            title={`${new Date(selectedDate + 'T00:00:00').toLocaleDateString('ja-JP')} の記録`} 
            right={(props) => <Button compact onPress={() => setSelectedDate('')}>閉じる</Button>} 
          />
          <Card.Content>
            {recordsForSelectedDate.length > 0 ? (
              recordsForSelectedDate.map(record => (
                <View key={record.id} style={styles.recordItem}><MaterialCommunityIcons name={record.category === '乗艇' ? 'rowing' : 'dumbbell'} size={24} color="#555"/><Paragraph style={styles.recordText}>{record.category}: {Number(record.amount).toLocaleString()} m</Paragraph></View>
              ))
            ) : ( <Text style={styles.noDataText}>この日の記録はありません。</Text> )}
          </Card.Content>
        </Card>
      )}

      <CharacterComment totalDistance={totalDistance} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f0f4f8', paddingBottom: 50 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#333' },
  card: { marginBottom: 20, elevation: 3 },
  noDataText: { textAlign: 'center', paddingVertical: 10, color: '#888' },
  summaryCardTitle: { textAlign: 'center', fontSize: 18, color: '#666', marginBottom: 10, fontWeight: 'bold' },
  summaryMainValue: { textAlign: 'center', fontSize: 40, fontWeight: 'bold', color: '#1e88e5' },
  summaryUnit: { fontSize: 20, fontWeight: 'normal', color: '#666' },
  summarySubValueContainer: { marginTop: 15, alignItems: 'center' },
  summarySubValueText: { fontSize: 16, color: '#333' },
  recordItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  recordText: { marginLeft: 10, fontSize: 16 },
  characterContainer: { alignItems: 'center', marginTop: 20 },
  balloon: { backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 15, marginTop: 10, maxWidth: '90%', elevation: 3 },
  balloonText: { fontSize: 16, textAlign: 'center' },
});