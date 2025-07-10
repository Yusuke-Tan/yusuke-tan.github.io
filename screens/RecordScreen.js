import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TextInput, FlatList, Keyboard, ScrollView, StyleSheet, Modal, Pressable, Alert } from 'react-native';
import { Button, IconButton, Card, Title } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';

// カレンダーの日本語化設定
LocaleConfig.locales['jp'] = { monthNames:['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],monthNamesShort:['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],dayNames:['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'],dayNamesShort:['日','月','火','水','木','金','土'],today:'今日'};
LocaleConfig.defaultLocale = 'jp';

const STORAGE_KEY = '@rowing_records_v1';

// グラフ描画用の自作コンポーネント
const SimpleStackedBarChart = ({ chartData }) => {
  if (!chartData || !chartData.data || chartData.data.length === 0) {
    return <Text style={{textAlign: 'center', paddingVertical: 20, color: '#888'}}>過去7日間の記録がありません。</Text>;
  }
  const maxValue = Math.max(...chartData.data.map(dayData => dayData[0] + dayData[1]));
  if (maxValue === 0) {
    return <Text style={{textAlign: 'center', paddingVertical: 20, color: '#888'}}>過去7日間の練習記録はありません。</Text>;
  }
  return (
    <View style={styles.chartRoot}>
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}><View style={[styles.legendColorBox, { backgroundColor: chartData.barColors[0] }]} /><Text>{chartData.legend[0]}</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendColorBox, { backgroundColor: chartData.barColors[1] }]} /><Text>{chartData.legend[1]}</Text></View>
      </View>
      <View style={styles.chartBody}>
        {chartData.data.map((dayData, index) => {
          const totalHeight = (dayData[0] + dayData[1]) / maxValue * 150;
          const ergoHeight = totalHeight > 0 ? (dayData[1] / (dayData[0] + dayData[1])) * totalHeight : 0;
          const jouteiHeight = totalHeight > 0 ? (dayData[0] / (dayData[0] + dayData[1])) * totalHeight : 0;
          return (<View key={index} style={styles.dayColumn}><View style={styles.barContainer}><View style={{ height: jouteiHeight, backgroundColor: chartData.barColors[0], width: '100%' }} /><View style={{ height: ergoHeight, backgroundColor: chartData.barColors[1], width: '100%' }} /></View><Text style={styles.barLabel}>{chartData.labels[index]}</Text></View>);
        })}
      </View>
    </View>
  );
};


export default function RecordScreen() {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [memo, setMemo] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      const loadExpenses = async () => {
        try {
          const json = await AsyncStorage.getItem(STORAGE_KEY);
          if (json) {
            const parsedExpenses = JSON.parse(json);
            parsedExpenses.sort((a, b) => new Date(b.dateForSort) - new Date(a.dateForSort));
            setExpenses(parsedExpenses);
          } else {
            setExpenses([]);
          }
        } catch (e) {
          console.error("Failed to load records.", e);
        }
      };
      loadExpenses();
    }, [])
  );

  const chartData = useMemo(() => {
    const labels = [];
    const dataMap = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = `${d.getMonth() + 1}/${d.getDate()}`;
      labels.push(dateString);
      dataMap.set(d.toLocaleDateString('ja-JP'), [0, 0]);
    }
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.dateForSort);
      if (expenseDate >= sevenDaysAgo) {
        const dateString = expenseDate.toLocaleDateString('ja-JP');
        if (dataMap.has(dateString)) {
          const dailyData = dataMap.get(dateString);
          if (expense.category === '乗艇') {
            dailyData[0] += Number(expense.amount);
          } else if (expense.category === 'エルゴ') {
            dailyData[1] += Number(expense.amount);
          }
        }
      }
    });
    const data = Array.from(dataMap.values());
    return {
      labels,
      legend: ['乗艇', 'エルゴ'],
      data,
      barColors: ['#1e88e5', '#ffa726'],
    };
  }, [expenses]);

  const openDatePicker = () => {
    setTempDate(date);
    setShowDatePicker(true);
  };

  const onConfirmDate = () => {
    setDate(tempDate);
    setShowDatePicker(false);
  };

  const addExpense = async () => {
    if (!amount || !category) {
        Alert.alert('入力エラー', '距離とカテゴリの両方を入力してください。');
        return;
    }
    const newExpense = {
      id: Date.now().toString(),
      amount,
      category,
      memo: memo.trim(),
      date: date.toLocaleDateString('ja-JP'),
      dateForSort: date.toISOString(),
    };
    const updated = [newExpense, ...expenses];
    updated.sort((a, b) => new Date(b.dateForSort) - new Date(a.dateForSort));
    setExpenses(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setAmount('');
    setCategory('');
    setMemo('');
    Keyboard.dismiss();
  };

  const handleDeleteExpense = (idToDelete) => {
    Alert.alert("記録の削除", "この記録を本当に削除しますか？",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          onPress: async () => {
            const updatedExpenses = expenses.filter(expense => expense.id !== idToDelete);
            setExpenses(updatedExpenses);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedExpenses));
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <View style={{flex: 1}}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.formCard}>
          <Card.Title title="記録の追加" titleStyle={styles.formCardTitle}/>
          <Card.Content>
            <Text style={styles.label}>日付</Text>
            <Button icon="calendar" mode="outlined" onPress={openDatePicker} style={styles.dateButton}>
              {date.toLocaleDateString('ja-JP')}
            </Button>
            
            <Text style={styles.label}>距離 (m)</Text>
            <TextInput style={styles.input} placeholder="距離（m）" value={amount} onChangeText={setAmount} keyboardType="numeric" />
            
            <Text style={styles.label}>カテゴリ</Text>
            <View style={styles.categoryButtonContainer}>
              <Button mode={category === '乗艇' ? 'contained' : 'outlined'} onPress={() => setCategory('乗艇')} style={styles.categoryButton}>乗艇</Button>
              <Button mode={category === 'エルゴ' ? 'contained' : 'outlined'} onPress={() => setCategory('エルゴ')} style={styles.categoryButton}>エルゴ</Button>
            </View>

            <Text style={styles.label}>メモ</Text>
            <TextInput
              style={styles.input}
              placeholder="今日の調子、練習内容など"
              value={memo}
              onChangeText={setMemo}
              multiline={true}
              numberOfLines={3}
            />
          </Card.Content>
          <Card.Actions style={styles.cardActions}>
            <Button mode="contained" onPress={addExpense} style={styles.button}>追加</Button>
          </Card.Actions>
        </Card>
        
        <View style={styles.chartWrapper}>
          <Text style={styles.chartTitle}>直近7日間の練習量</Text>
          <SimpleStackedBarChart chartData={chartData} />
        </View>
        
        <Text style={styles.listTitle}>全記録一覧</Text>
        <FlatList
          data={expenses}
          keyExtractor={i => i.id}
          renderItem={({ item }) => {
            const iconName = item.category === '乗艇' ? 'rowing' : 'dumbbell';
            return (
              <Card style={styles.recordCard}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.iconAndData}>
                    <MaterialCommunityIcons name={iconName} size={30} color="#1e88e5" />
                    <View style={styles.textData}>
                      <Text style={styles.amountText}>{Number(item.amount).toLocaleString()} m</Text>
                      <Text style={styles.detailText}>{item.date} {item.category}</Text>
                      {item.memo ? <Text style={styles.memoText}>{item.memo}</Text> : null}
                    </View>
                  </View>
                  <IconButton icon="delete-outline" iconColor="#ff4d4d" size={24} onPress={() => handleDeleteExpense(item.id)} />
                </Card.Content>
              </Card>
            );
          }}
          style={{ marginTop: 10 }}
        />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDatePicker(false)}>
          <View style={styles.modalContainer}>
            <Calendar
              current={date.toISOString().substring(0, 10)}
              onDayPress={(day) => {
                const selected = new Date(day.timestamp + new Date().getTimezoneOffset() * -60 * 1000);
                setTempDate(selected);
              }}
              markedDates={{
                [tempDate.toISOString().substring(0, 10)]: { selected: true, selectedColor: '#1e88e5' },
              }}
              monthFormat={'yyyy年 M月'}
            />
            <Button mode="contained" onPress={onConfirmDate} style={styles.confirmButton}>
              決定
            </Button>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f0f4f8', flexGrow: 1 },
  label: { fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6, backgroundColor: '#fff', marginBottom: 15 },
  button: { flex: 1, paddingVertical: 5, backgroundColor: '#1e88e5' },
  dateButton: { backgroundColor: 'white', borderColor: '#ccc', borderWidth: 1, justifyContent: 'center', height: 50, marginBottom: 15 },
  listTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 30, borderTopWidth: 1, borderColor: '#ddd', paddingTop: 20 },
  recordCard: { marginBottom: 10, backgroundColor: '#fff', elevation: 2 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconAndData: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  textData: { marginLeft: 15, flex: 1 },
  amountText: { fontSize: 18, fontWeight: 'bold' },
  detailText: { fontSize: 14, color: '#666' },
  memoText: { fontSize: 14, color: '#333', marginTop: 4, fontStyle: 'italic' },
  categoryButtonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryButton: { flex: 1, marginHorizontal: 5 },
  formCard: { elevation: 2, marginBottom: 30 },
  formCardTitle: { fontWeight: 'bold' },
  cardActions: { paddingHorizontal: 16, paddingBottom: 16 },
  chartWrapper: { backgroundColor: '#fff', borderRadius: 10, padding: 15, elevation: 3, },
  chartTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', },
  chartRoot: { alignItems: 'center', },
  chartBody: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', height: 150, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#ccc', },
  dayColumn: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 5, },
  barContainer: { width: '100%', justifyContent: 'flex-end', },
  barLabel: { marginTop: 5, fontSize: 12, },
  legendContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10, },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, },
  legendColorBox: { width: 12, height: 12, marginRight: 5, },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', },
  modalContainer: { backgroundColor: 'white', borderRadius: 16, padding: 20, width: '90%', alignItems: 'stretch', },
  confirmButton: { marginTop: 15, },
});