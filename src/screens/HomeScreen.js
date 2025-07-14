import React, { useState, useCallback, useEffect } from 'react';

// --- Web用ライブラリのインポート ---
import Calendar from 'react-calendar'; // Web用のカレンダー
import 'react-calendar/dist/Calendar.css'; // カレンダーの基本スタイル
// アイコンライブラリ
import { FaGlobeAsia, FaStar, FaRocket, FaRunning, FaTrain, FaRegSmile, FaRegMeh } from 'react-icons/fa';
import { MdRowing, MdFitnessCenter } from 'react-icons/md';

// --- データ保存用のキー ---
const IDT_HISTORY_KEY = '@idt_history_v1';
const RECORDS_STORAGE_KEY = '@rowing_records_v1';

// ★★★ Web用に書き換えたキャラクターコンポーネント ★★★
const CharacterComment = ({ totalDistance }) => {
  const getComment = () => {
    const distanceKm = totalDistance / 1000;

    // アイコンをReact Iconsのものに変更
    if (distanceKm >= 3200) {
      const earthCircumference = 40000;
      const percentage = (distanceKm / earthCircumference) * 100;
      return { text: `これは地球一周の約${percentage.toFixed(2)}%です`, Icon: FaGlobeAsia };
    }
    if (distanceKm >= 3000) {
      return { text: "これはおおよそ日本列島を縦断するくらいの距離です！", Icon: FaStar };
    }
    if (distanceKm >= 100) {
      return { text: "100km漕破！これは地上から宇宙まで届く距離です！！", Icon: FaRocket };
    }
    if (distanceKm >= 42.195) {
      return { text: "フルマラソンを漕ぎ切りましたね！", Icon: FaRunning };
    }
    if (distanceKm >= 35) {
      return { text: "あなたが漕いだ距離はおおよそ山手線一周分にあたります！", Icon: FaTrain };
    }
    if (distanceKm >= 1) {
      return { text: `すごい！もう${distanceKm.toFixed(1)}kmも漕いだんだね！`, Icon: FaRegSmile };
    }
    return { text: "さあ、練習を始めよう！", Icon: FaRegMeh };
  };

  const { text, Icon } = getComment();

  // View -> div, Text -> p, MaterialCommunityIcons -> React Iconsコンポーネント
  return (
    <div style={styles.characterContainer}>
      <Icon size={80} color="#555" />
      <div style={styles.balloon}>
        <p style={styles.balloonText}>{text}</p>
      </div>
    </div>
  );
};


export default function HomeScreen() {
  const [bestErgoRecord, setBestErgoRecord] = useState({ ergoTimeString: '--', idtScore: 0 });
  const [totalDistance, setTotalDistance] = useState(0);
  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null); // Dateオブジェクト or null
  const [recordsForSelectedDate, setRecordsForSelectedDate] = useState([]);

  // useFocusEffectの代わりにuseEffectを使用
  useEffect(() => {
    const fetchData = async () => {
      try {
        // AsyncStorageの代わりにlocalStorageを使用
        const idtHistoryJSON = window.localStorage.getItem(IDT_HISTORY_KEY);
        if (idtHistoryJSON) {
          const idtHistory = JSON.parse(idtHistoryJSON);
          if (idtHistory.length > 0) {
            const bestRecord = idtHistory.reduce((best, current) => current.ergoTimeSeconds < best.ergoTimeSeconds ? current : best);
            setBestErgoRecord(bestRecord);
          }
        } else {
          setBestErgoRecord({ ergoTimeString: '--', idtScore: 0 });
        }

        const recordsJSON = window.localStorage.getItem(RECORDS_STORAGE_KEY);
        if (recordsJSON) {
          const loadedRecords = JSON.parse(recordsJSON);
          setRecords(loadedRecords);
          const total = loadedRecords.reduce((sum, record) => sum + Number(record.amount || 0), 0);
          setTotalDistance(total);
        } else {
          setRecords([]);
          setTotalDistance(0);
        }
      } catch (e) {
        console.error("Failed to fetch data for home screen.", e);
      }
    };
    fetchData();
  }, []); // 空の配列で初回マウント時にのみ実行

  // 選択された日付の記録をフィルタリング
  useEffect(() => {
    if (selectedDate) {
      const dateString = selectedDate.toISOString().substring(0, 10);
      const filteredRecords = records.filter(record => record.dateForSort.startsWith(dateString));
      setRecordsForSelectedDate(filteredRecords);
    } else {
      setRecordsForSelectedDate([]);
    }
  }, [selectedDate, records]);

  // 日付がクリックされたときの処理
  const onDayClick = (date) => {
    // 同じ日をクリックしたら選択解除、違う日なら選択
    if (selectedDate && date.getTime() === selectedDate.getTime()) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  // 記録がある日にドットを表示するための関数
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateString = date.toISOString().substring(0, 10);
      const hasRecord = records.some(record => record.dateForSort.startsWith(dateString));
      return hasRecord ? <div style={styles.calendarDot}></div> : null;
    }
  };

  // ScrollView -> div
  return (
    <div style={styles.container}>
      {/* Card -> div */}
      <div style={styles.card}>
        <div style={styles.cardContent}>
          <p style={styles.summaryCardTitle}>2000ttベストタイム</p>
          <p style={styles.summaryMainValue}>{bestErgoRecord.ergoTimeString}</p>
          <div style={styles.summarySubValueContainer}>
            <p style={styles.summarySubValueText}>IDT: {bestErgoRecord.idtScore.toFixed(2)}</p>
          </div>
        </div>
      </div>
      <div style={styles.card}>
        <div style={styles.cardContent}>
          <p style={styles.summaryCardTitle}>練習合計距離</p>
          <p style={styles.summaryMainValue}>
            {totalDistance.toLocaleString()} <span style={styles.summaryUnit}>m</span>
          </p>
        </div>
      </div>

      <div style={styles.card}>
        <Calendar
          locale="ja-JP" // ブラウザ設定に依存するが明示的に指定
          onClickDay={onDayClick}
          value={selectedDate}
          tileContent={tileContent}
        />
      </div>

      {selectedDate && (
        <div style={styles.card}>
          <div style={{...styles.cardContent, ...styles.selectedDateHeader}}>
            <h3>{selectedDate.toLocaleDateString('ja-JP')} の記録</h3>
            <button onClick={() => setSelectedDate(null)} style={styles.closeButton}>閉じる</button>
          </div>
          <div style={styles.cardContent}>
            {recordsForSelectedDate.length > 0 ? (
              recordsForSelectedDate.map(record => (
                <div key={record.id} style={styles.recordItem}>
                  {record.category === '乗艇' ? <MdRowing color="#555" size={24} /> : <MdFitnessCenter color="#555" size={24} />}
                  <p style={styles.recordText}>{record.category}: {Number(record.amount).toLocaleString()} m</p>
                </div>
              ))
            ) : (
              <p style={styles.noDataText}>この日の記録はありません。</p>
            )}
          </div>
        </div>
      )}

      <CharacterComment totalDistance={totalDistance} />
    </div>
  );
}

// StyleSheet -> 通常のJavaScriptオブジェクト
const styles = {
  container: { flex: 1, padding: 20, backgroundColor: '#f0f4f8', paddingBottom: 50 },
  card: { 
    marginBottom: 20, 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  cardContent: {
    padding: 15,
  },
  selectedDateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #eee',
  },
  closeButton: {
    background: '#eee',
    border: 'none',
    padding: '5px 10px',
    borderRadius: 5,
    cursor: 'pointer',
  },
  noDataText: { textAlign: 'center', padding: '10px 0', color: '#888' },
  summaryCardTitle: { textAlign: 'center', fontSize: 18, color: '#666', marginBottom: 10, fontWeight: 'bold' },
  summaryMainValue: { textAlign: 'center', fontSize: 40, fontWeight: 'bold', color: '#1e88e5', margin: 0 },
  summaryUnit: { fontSize: 20, fontWeight: 'normal', color: '#666' },
  summarySubValueContainer: { marginTop: 15, alignItems: 'center' },
  summarySubValueText: { fontSize: 16, color: '#333' },
  recordItem: { display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' },
  recordText: { marginLeft: 10, fontSize: 16, margin: 0 },
  characterContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 20 },
  balloon: { backgroundColor: '#fff', padding: '10px 15px', borderRadius: 15, marginTop: 10, maxWidth: '90%', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  balloonText: { fontSize: 16, textAlign: 'center', margin: 0 },
  calendarDot: {
    height: 6,
    width: 6,
    backgroundColor: '#1e88e5',
    borderRadius: '50%',
    margin: 'auto',
    marginTop: 2,
  }
};