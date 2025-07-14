import React, { useState, useCallback, useEffect } from 'react';
// アイコンライブラリをインポート
import { MdHistory, MdDeleteOutline } from 'react-icons/md';

// データ保存用のキー
const PROFILE_STORAGE_KEY = '@user_profile_v1';
const HIGH_SCORE_IDT_KEY = '@high_score_idt_v4';
const IDT_HISTORY_KEY = '@idt_history_v1';

export default function IDTScreen() {
  const [min, setMin] = useState('');
  const [sec, setSec] = useState('');
  const [secd, setSecd] = useState('');
  const [idt, setIdt] = useState(null);
  const [idtHistory, setIdtHistory] = useState([]);

  // useFocusEffect -> useEffect に変更し、localStorage からデータを読み込む
  useEffect(() => {
    const loadIdtHistory = () => {
      try {
        const historyJson = window.localStorage.getItem(IDT_HISTORY_KEY);
        const history = historyJson ? JSON.parse(historyJson) : [];
        history.sort((a, b) => new Date(b.date) - new Date(a.date));
        setIdtHistory(history);
      } catch (e) {
        console.error("Failed to load IDT history.", e);
      }
    };
    loadIdtHistory();
  }, []); // 初回レンダリング時にのみ実行

  const calculateIdt = async () => {
    let profile = {};
    try {
      const json = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (json) profile = JSON.parse(json);
    } catch (e) {
      console.error("Failed to load profile for calculation.", e);
      window.alert("エラー", "プロフィール情報の読み込みに失敗しました。");
      return;
    }

    if (!profile.weight || !profile.gender) {
      window.alert("プロフィール未設定\nIDTを計算するには、まずプロフィール画面で体重と性別を設定してください。");
      return;
    }

    const ergoSeconds = parseFloat(min) * 60 + parseFloat(sec) + parseFloat(secd) * 0.1;
    const wei = parseFloat(profile.weight);
    const gend = profile.gender === '男子' ? 0 : 1;

    if (isNaN(ergoSeconds) || ergoSeconds <= 0) {
      window.alert('エルゴタイムを正しく入力してください。');
      return;
    }

    const idtm = ((101 - wei) * (20.9 / 23) + 333.07) / ergoSeconds * 100;
    const idtw = ((100 - wei) * 1.4 + 357.8) / ergoSeconds * 100;
    const result = idtm * (1 - gend) + idtw * gend;
    
    const newIdtRecord = { 
      id: Date.now().toString(), 
      idtScore: result, 
      ergoTimeSeconds: ergoSeconds, 
      ergoTimeString: `${min}:${String(sec).padStart(2, '0')}.${secd}`, 
      weight: profile.weight, 
      date: new Date().toISOString() 
    };
    
    try {
      const historyJson = window.localStorage.getItem(IDT_HISTORY_KEY);
      const history = historyJson ? JSON.parse(historyJson) : [];
      const updatedHistory = [newIdtRecord, ...history];
      updatedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setIdtHistory(updatedHistory);
      window.localStorage.setItem(IDT_HISTORY_KEY, JSON.stringify(updatedHistory));
      
      const highScoreJson = window.localStorage.getItem(HIGH_SCORE_IDT_KEY);
      const currentHighScore = highScoreJson ? JSON.parse(highScoreJson) : { score: 0 };
      if (result > currentHighScore.score) {
        const newHighScore = { score: result, time: newIdtRecord.ergoTimeString, weight: profile.weight };
        window.localStorage.setItem(HIGH_SCORE_IDT_KEY, JSON.stringify(newHighScore));
      }
    } catch (e) { 
      console.error('Failed to save IDT data.', e); 
      window.alert('エラー', 'データの保存に失敗しました。'); 
    }
    
    setIdt(result.toFixed(2));
  };
  
  const handleDeleteIdt = async (idToDelete) => {
    // Alert.alert -> window.confirm に変更
    if (window.confirm("この計算履歴を本当に削除しますか？")) {
      const updatedHistory = idtHistory.filter(item => item.id !== idToDelete);
      setIdtHistory(updatedHistory);
      window.localStorage.setItem(IDT_HISTORY_KEY, JSON.stringify(updatedHistory));
    }
  };

  // JSXをHTML要素とインラインスタイルに変換
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardContent}>
          <p style={styles.cardLabel}>IDT</p>
          <p style={styles.cardValue}>
            {idt ? idt : '--'}
          </p>
        </div>
      </div>

      <div style={styles.card}>
        <div style={{...styles.cardContent, borderBottom: '1px solid #eee'}}>
            <h3 style={styles.formCardTitle}>IDT 計算フォーム</h3>
        </div>
        <div style={styles.cardContent}>
          <label style={styles.label}>エルゴタイム</label>
          <div style={styles.row}>
            <input style={styles.inputSmall} type="number" placeholder="分" value={min} onChange={e => setMin(e.target.value)} />
            <span style={styles.unit}>分</span>
            <input style={styles.inputSmall} type="number" placeholder="秒" value={sec} onChange={e => setSec(e.target.value)} />
            <span style={styles.unit}>秒</span>
            <input style={styles.inputSmall} type="number" placeholder="1/10" value={secd} onChange={e => setSecd(e.target.value)} />
            <span style={styles.unit}>0.1秒</span>
          </div>
        </div>
        <div style={styles.cardActions}>
          <button style={styles.button} onClick={calculateIdt}>計算する</button>
        </div>
      </div>

      <h2 style={styles.listTitle}>2000tt履歴</h2>
      {/* FlatList -> .map() に変更 */}
      <div>
        {idtHistory.map(item => (
          <div key={item.id} style={{...styles.card, ...styles.recordCard}}>
            <div style={styles.recordCardContent}>
              <div style={styles.iconAndData}>
                <MdHistory size={30} color="#1e88e5" />
                <div style={styles.textData}>
                  <p style={styles.mainText}>{item.ergoTimeString}</p>
                  <p style={styles.detailText}>IDT: {item.idtScore.toFixed(2)}</p>
                  <p style={styles.detailText}>{new Date(item.date).toLocaleDateString('ja-JP')}</p>
                </div>
              </div>
              <button onClick={() => handleDeleteIdt(item.id)} style={styles.deleteButton}>
                <MdDeleteOutline color="#ff4d4d" size={24} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// StyleSheet -> JavaScriptオブジェクト に変更
const styles = {
  container: { padding: 20, backgroundColor: '#f0f4f8' },
  label: { fontWeight: '600', marginBottom: 5, display: 'block' },
  inputSmall: { flex: 1, padding: 10, border: '1px solid #ccc', borderRadius: 6, backgroundColor: '#fff', textAlign: 'center', width: '20%' },
  unit: { alignSelf: 'center', margin: '0 8px' },
  row: { display: 'flex', alignItems: 'center', marginBottom: 10 },
  button: { flex: 1, padding: '10px 15px', backgroundColor: '#1e88e5', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 16 },
  card: { 
    marginBottom: 20, 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
  },
  cardContent: { padding: 16 },
  cardLabel: { textAlign: 'center', fontSize: 16, color: '#666' },
  cardValue: { textAlign: 'center', fontSize: 48, fontWeight: 'bold', color: '#1e88e5', margin: '10px 0' },
  formCardTitle: { fontWeight: 'bold', margin: 0, fontSize: 18 },
  cardActions: { padding: '0 16px 16px 16px' },
  listTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 30, marginBottom: 10, borderTop: '1px solid #ddd', paddingTop: 20 },
  recordCard: { marginBottom: 10 },
  recordCardContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  iconAndData: { display: 'flex', alignItems: 'center', flex: 1 },
  textData: { marginLeft: 15 },
  mainText: { fontSize: 18, fontWeight: 'bold', margin: '0 0 4px 0' },
  detailText: { fontSize: 14, color: '#666', margin: 0 },
  deleteButton: { background: 'none', border: 'none', cursor: 'pointer', padding: 5 }
};