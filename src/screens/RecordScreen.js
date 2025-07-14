import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- Web-specific library imports ---
import Calendar from 'react-calendar'; // Web calendar component
import 'react-calendar/dist/Calendar.css'; // Default styling for the calendar
import { MdDeleteOutline, MdCalendarToday, MdRowing, MdFitnessCenter } from 'react-icons/md'; // Web icons

// --- Storage key ---
const STORAGE_KEY = '@rowing_records_v1';

// ★★★ Web-compatible Stacked Bar Chart component ★★★
const SimpleStackedBarChart = ({ chartData }) => {
  if (!chartData || !chartData.data || chartData.data.length === 0) {
    return <p style={{ textAlign: 'center', padding: '20px 0', color: '#888' }}>過去7日間の記録がありません。</p>;
  }
  // Find the max total value for scaling the bars
  const maxValue = Math.max(...chartData.data.map(dayData => dayData[0] + dayData[1]));
  if (maxValue === 0) {
    return <p style={{ textAlign: 'center', padding: '20px 0', color: '#888' }}>過去7日間の練習記録はありません。</p>;
  }

  return (
    <div style={styles.chartRoot}>
      {/* Legend */}
      <div style={styles.legendContainer}>
        {chartData.legend.map((item, index) => (
          <div key={item} style={styles.legendItem}>
            <div style={{ ...styles.legendColorBox, backgroundColor: chartData.barColors[index] }} />
            <span>{item}</span>
          </div>
        ))}
      </div>
      {/* Chart Body */}
      <div style={styles.chartBody}>
        {chartData.data.map((dayData, index) => {
          const totalValue = dayData[0] + dayData[1];
          const totalHeight = totalValue > 0 ? (totalValue / maxValue) * 150 : 0; // max height of 150px
          
          return (
            <div key={index} style={styles.dayColumn}>
              <div style={{ ...styles.barContainer, height: `${totalHeight}px` }}>
                <div style={{ height: `${(dayData[0] / totalValue) * 100}%`, backgroundColor: chartData.barColors[0] }} />
                <div style={{ height: `${(dayData[1] / totalValue) * 100}%`, backgroundColor: chartData.barColors[1] }} />
              </div>
              <span style={styles.barLabel}>{chartData.labels[index]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function RecordScreen() {
  // State hooks remain the same
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [memo, setMemo] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // useFocusEffect -> useEffect. AsyncStorage -> localStorage
  useEffect(() => {
    const loadExpenses = () => {
      try {
        const json = window.localStorage.getItem(STORAGE_KEY);
        if (json) {
          const parsedExpenses = JSON.parse(json);
          parsedExpenses.sort((a, b) => new Date(b.dateForSort) - new Date(a.dateForSort));
          setExpenses(parsedExpenses);
        }
      } catch (e) { console.error("Failed to load records.", e); }
    };
    loadExpenses();
  }, []);

  // useMemo for chart data (logic is unchanged)
  const chartData = useMemo(() => {
    const labels = [];
    const dataMap = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
      dataMap.set(d.toLocaleDateString('ja-JP'), [0, 0]); // [Joutei, Ergo]
    }

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.dateForSort);
      const dateString = expenseDate.toLocaleDateString('ja-JP');
      if (dataMap.has(dateString)) {
        const dailyData = dataMap.get(dateString);
        if (expense.category === '乗艇') dailyData[0] += Number(expense.amount);
        else if (expense.category === 'エルゴ') dailyData[1] += Number(expense.amount);
      }
    });
    
    return {
      labels,
      legend: ['乗艇', 'エルゴ'],
      data: Array.from(dataMap.values()),
      barColors: ['#1e88e5', '#ffa726'],
    };
  }, [expenses]);

  // addExpense function (Alert -> window.alert, AsyncStorage -> localStorage)
  const addExpense = async () => {
    if (!amount || !category) {
      window.alert('入力エラー: 距離とカテゴリの両方を入力してください。');
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Reset form
    setAmount('');
    setCategory('');
    setMemo('');
  };

  // handleDeleteExpense function (Alert -> window.confirm, AsyncStorage -> localStorage)
  const handleDeleteExpense = async (idToDelete) => {
    if (window.confirm("この記録を本当に削除しますか？")) {
      const updatedExpenses = expenses.filter(expense => expense.id !== idToDelete);
      setExpenses(updatedExpenses);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedExpenses));
    }
  };

  return (
    <div style={styles.container}>
      {/* Form Card */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3>記録の追加</h3>
        </div>
        <div style={styles.cardContent}>
          <label style={styles.label}>日付</label>
          <button onClick={() => setShowDatePicker(true)} style={styles.dateButton}>
            <MdCalendarToday style={{ marginRight: 8 }} />
            {date.toLocaleDateString('ja-JP')}
          </button>
          
          <label style={styles.label}>距離 (m)</label>
          <input style={styles.input} placeholder="例: 10000" value={amount} onChange={e => setAmount(e.target.value)} type="number" />
          
          <label style={styles.label}>カテゴリ</label>
          <div style={styles.categoryButtonContainer}>
            <button onClick={() => setCategory('乗艇')} style={category === '乗艇' ? {...styles.categoryButton, ...styles.activeButton} : styles.categoryButton}>乗艇</button>
            <button onClick={() => setCategory('エルゴ')} style={category === 'エルゴ' ? {...styles.categoryButton, ...styles.activeButton} : styles.categoryButton}>エルゴ</button>
          </div>

          <label style={styles.label}>メモ</label>
          <textarea
            style={{...styles.input, ...styles.textarea}}
            placeholder="今日の調子、練習内容など"
            value={memo}
            onChange={e => setMemo(e.target.value)}
          />
          <div style={styles.cardActions}>
            <button onClick={addExpense} style={styles.button}>追加</button>
          </div>
        </div>
      </div>
      
      {/* Chart Section */}
      <div style={{ ...styles.card, marginTop: 30 }}>
        <div style={styles.cardHeader}>
          <h3>直近7日間の練習量</h3>
        </div>
        <div style={styles.cardContent}>
          <SimpleStackedBarChart chartData={chartData} />
        </div>
      </div>
      
      {/* Records List */}
      <h2 style={styles.listTitle}>全記録一覧</h2>
      <div>
        {expenses.map(item => {
          const Icon = item.category === '乗艇' ? MdRowing : MdFitnessCenter;
          return (
            <div key={item.id} style={styles.card}>
              <div style={styles.recordCardContent}>
                <div style={styles.iconAndData}>
                  <Icon size={30} color="#1e88e5" />
                  <div style={styles.textData}>
                    <p style={styles.amountText}>{Number(item.amount).toLocaleString()} m</p>
                    <p style={styles.detailText}>{item.date} {item.category}</p>
                    {item.memo ? <p style={styles.memoText}>"{item.memo}"</p> : null}
                  </div>
                </div>
                <button onClick={() => handleDeleteExpense(item.id)} style={styles.deleteButton}>
                    <MdDeleteOutline size={24} color="#ff4d4d" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div style={styles.modalBackdrop} onClick={() => setShowDatePicker(false)}>
          <div style={styles.modalContainer} onClick={e => e.stopPropagation()}>
            <Calendar
              onChange={setDate}
              value={date}
              locale="ja-JP"
            />
            <button onClick={() => setShowDatePicker(false)} style={{...styles.button, marginTop: 15}}>決定</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Web-compatible Styles ---
const styles = {
  container: { padding: 20, backgroundColor: '#f0f4f8' },
  label: { fontWeight: '600', marginBottom: 8, display: 'block' },
  input: { width: '100%', boxSizing: 'border-box', border: '1px solid #ccc', padding: 10, borderRadius: 6, backgroundColor: '#fff', marginBottom: 15 },
  textarea: { minHeight: 80, resize: 'vertical' },
  button: { width: '100%', padding: '12px 0', backgroundColor: '#1e88e5', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 16 },
  dateButton: { width: '100%', boxSizing: 'border-box', backgroundColor: 'white', border: '1px solid #ccc', padding: 10, borderRadius: 6, marginBottom: 15, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center' },
  listTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 30, borderTop: '1px solid #ddd', paddingTop: 20 },
  card: { marginBottom: 10, backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  cardHeader: { padding: '16px', borderBottom: '1px solid #eee' },
  cardContent: { padding: '16px' },
  recordCardContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' },
  iconAndData: { display: 'flex', alignItems: 'center', flex: 1 },
  textData: { marginLeft: 15, flex: 1 },
  amountText: { fontSize: 18, fontWeight: 'bold', margin: 0 },
  detailText: { fontSize: 14, color: '#666', margin: '4px 0 0 0' },
  memoText: { fontSize: 14, color: '#333', marginTop: 4, fontStyle: 'italic', margin: '4px 0 0 0' },
  categoryButtonContainer: { display: 'flex', gap: 10, marginBottom: 15 },
  categoryButton: { flex: 1, padding: '10px 0', borderRadius: 5, border: '1px solid #ccc', backgroundColor: 'white', cursor: 'pointer' },
  activeButton: { backgroundColor: '#1e88e5', color: 'white', border: '1px solid #1e88e5' },
  cardActions: { paddingTop: 16, borderTop: '1px solid #eee' },
  chartWrapper: { backgroundColor: '#fff', borderRadius: 10, padding: 15, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', },
  chartTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  chartRoot: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  chartBody: { display: 'flex', justifyContent: 'space-around', width: '100%', height: 150, borderLeft: '1px solid #ccc', borderBottom: '1px solid #ccc' },
  dayColumn: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', padding: '0 5px' },
  barContainer: { width: '100%', display: 'flex', flexDirection: 'column-reverse' },
  barLabel: { marginTop: 5, fontSize: 12 },
  legendContainer: { display: 'flex', justifyContent: 'center', marginBottom: 10, gap: '20px' },
  legendItem: { display: 'flex', alignItems: 'center' },
  legendColorBox: { width: 12, height: 12, marginRight: 5 },
  modalBackdrop: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContainer: { backgroundColor: 'white', borderRadius: 16, padding: 20, width: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
  deleteButton: { background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: '50%' }
};