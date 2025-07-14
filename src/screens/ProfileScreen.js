import React, { useState, useEffect, useRef } from 'react';
// react-router-domからuseNavigateをインポート
import { useNavigate } from 'react-router-dom';
// アイコンをインポート
import { MdWarning } from 'react-icons/md';

// データ保存用のキー
const PROFILE_STORAGE_KEY = '@user_profile_v1';
const IDT_HISTORY_KEY = '@idt_history_v1';
const HIGH_SCORE_IDT_KEY = '@high_score_idt_v4';
const RECORDS_STORAGE_KEY = '@rowing_records_v1';
const defaultIcon = require('../assets/icon.png'); // デフォルトアイコンをインポート

export default function ProfileScreen() {
  // Stateの定義 (変更なし)
  const [name, setName] = useState('ユーザー名');
  const [affiliation, setAffiliation] = useState('所属');
  const [iconUri, setIconUri] = useState(null);
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('');

  const [isEditing, setIsEditing] = useState(false);

  const [tempName, setTempName] = useState('');
  const [tempAffiliation, setTempAffiliation] = useState('');
  const [tempIconUri, setTempIconUri] = useState(null);
  const [tempWeight, setTempWeight] = useState('');
  const [tempGender, setTempGender] = useState('');
  
  const navigate = useNavigate(); // Web用のナビゲーションフック
  const fileInputRef = useRef(null); // ファイル入力を参照するためのref

  // プロフィール読み込み (AsyncStorage -> localStorage)
  useEffect(() => {
    const loadProfile = () => {
      try {
        const json = window.localStorage.getItem(PROFILE_STORAGE_KEY);
        if (json) {
          const profile = JSON.parse(json);
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

  // Web用に書き換えた画像選択ロジック
  const pickImage = () => {
    // 隠されたファイル入力をクリックする
    fileInputRef.current.click();
  };
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // 画像をbase64形式のデータURIとしてstateに保存
        setTempIconUri(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 編集開始処理 (変更なし)
  const handleEdit = () => {
    setTempName(name);
    setTempAffiliation(affiliation);
    setTempIconUri(iconUri);
    setTempWeight(weight);
    setTempGender(gender);
    setIsEditing(true);
  };

  // 保存処理 (AsyncStorage -> localStorage, Alert -> window.alert)
  const handleSave = async () => {
    const newProfile = {
      name: tempName,
      affiliation: tempAffiliation,
      iconUri: tempIconUri,
      weight: tempWeight,
      gender: tempGender,
    };
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
      setName(tempName);
      setAffiliation(tempAffiliation);
      setIconUri(tempIconUri);
      setWeight(tempWeight);
      setGender(tempGender);
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to save profile.", e);
      window.alert("エラー: プロフィールの保存に失敗しました。");
    }
  };

  // リセット処理 (Alert -> window.confirm, AsyncStorage -> localStorage)
  const handleResetAllData = () => {
    if (window.confirm("本当にすべてのデータをリセットしますか？この操作は元に戻せません。")) {
      if (window.confirm("最終確認: 練習記録、IDT履歴、プロフィールを含むすべてのデータが完全に削除されます。よろしいですか？")) {
        try {
          const keys = [PROFILE_STORAGE_KEY, IDT_HISTORY_KEY, HIGH_SCORE_IDT_KEY, RECORDS_STORAGE_KEY];
          keys.forEach(key => window.localStorage.removeItem(key));
          
          setName('ユーザー名');
          setAffiliation('所属');
          setIconUri(null);
          setWeight('');
          setGender('');
          
          window.alert("完了: すべてのデータがリセットされました。");
          navigate('/'); // ホーム画面に戻る
        } catch (e) {
          console.error("Failed to reset all data.", e);
          window.alert("エラー: データのリセットに失敗しました。");
        }
      }
    }
  };

  // ★ 表示モードのUI (Web用に変換)
  const renderDisplayView = () => (
    <div style={styles.container}>
      <img
        src={iconUri || defaultIcon}
        alt="Profile Avatar"
        style={styles.avatar}
      />
      <h1 style={styles.name}>{name}</h1>
      <p style={styles.affiliation}>{affiliation}</p>
      
      <div style={styles.infoCard}>
        <div style={styles.infoRow}>
          <p style={styles.infoLabel}>性別</p>
          <p style={styles.infoValue}>{gender || '未設定'}</p>
        </div>
        <hr style={styles.divider} />
        <div style={styles.infoRow}>
          <p style={styles.infoLabel}>体重</p>
          <p style={styles.infoValue}>{weight ? `${weight} kg` : '未設定'}</p>
        </div>
      </div>
      
      <button onClick={handleEdit} style={{...styles.button, ...styles.buttonContained}}>
        プロフィールを編集
      </button>
      <hr style={{...styles.divider, width: '100%', margin: '20px 0'}} />
      <button onClick={handleResetAllData} style={{...styles.button, ...styles.resetButton}}>
        <MdWarning style={{ verticalAlign: 'middle', marginRight: 8 }} />
        全データをリセット
      </button>
    </div>
  );

  // ★ 編集モードのUI (Web用に変換)
  const renderEditView = () => (
    <div style={styles.container}>
      <div style={styles.formCard}>
          <h2 style={styles.editTitle}>プロフィール編集</h2>
          
          <div onClick={pickImage} style={styles.avatarContainer}>
            <img 
              src={tempIconUri || iconUri || defaultIcon} 
              alt="Avatar Preview"
              style={styles.avatar}
            />
            {/* 隠されたファイル入力 */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }}
              accept="image/*"
            />
            <p style={styles.avatarEditText}>画像をタップして変更</p>
          </div>

          <div style={styles.inputGroup}>
            <label>ユーザー名</label>
            <input value={tempName} onChange={e => setTempName(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label>所属（学校・団体名など）</label>
            <input value={tempAffiliation} onChange={e => setTempAffiliation(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label>体重 (kg)</label>
            <input value={tempWeight} onChange={e => setTempWeight(e.target.value)} style={styles.input} type="number" />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>性別</label>
            <div style={styles.genderButtonContainer}>
              <button 
                onClick={() => setTempGender('男子')} 
                style={tempGender === '男子' ? {...styles.genderButton, ...styles.buttonContained} : {...styles.genderButton, ...styles.buttonOutlined}}
              >男子</button>
              <button 
                onClick={() => setTempGender('女子')} 
                style={tempGender === '女子' ? {...styles.genderButton, ...styles.buttonContained} : {...styles.genderButton, ...styles.buttonOutlined}}
              >女子</button>
            </div>
          </div>

          <div style={styles.buttonGroup}>
            <button onClick={() => setIsEditing(false)} style={{...styles.editButton, ...styles.buttonOutlined}}>キャンセル</button>
            <button onClick={handleSave} style={{...styles.editButton, ...styles.buttonContained}}>保存する</button>
          </div>
      </div>
    </div>
  );

  return isEditing ? renderEditView() : renderDisplayView();
}

// スタイル定義 (Web用に調整)
const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#f0f4f8', width: '100%', boxSizing: 'border-box' },
  avatar: { width: 120, height: 120, borderRadius: '50%', marginBottom: 20, backgroundColor: '#ddd', objectFit: 'cover' },
  name: { fontSize: 24, fontWeight: 'bold', margin: 0 },
  affiliation: { fontSize: 18, color: 'gray', marginBottom: 20, margin: 0 },
  button: { width: '100%', marginTop: 10, padding: '12px 0', fontSize: 16, borderRadius: 5, border: '1px solid transparent', cursor: 'pointer' },
  buttonContained: { backgroundColor: '#1e88e5', color: 'white' },
  buttonOutlined: { backgroundColor: 'white', color: '#1e88e5', border: '1px solid #1e88e5'},
  divider: { border: 'none', borderTop: '1px solid #e0e0e0', width: '100%' },
  resetButton: { width: '100%', borderColor: '#d32f2f', color: '#d32f2f', backgroundColor: 'white' },
  formCard: { width: '100%', maxWidth: 500, backgroundColor: 'white', borderRadius: 8, padding: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  editTitle: { textAlign: 'center', marginBottom: 20, margin: 0 },
  avatarContainer: { alignItems: 'center', marginBottom: 20, cursor: 'pointer' },
  avatarEditText: { color: '#1e88e5', marginTop: 10 },
  inputGroup: { marginBottom: 15, width: '100%' },
  input: { width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box', marginTop: 4 },
  label: { fontWeight: '600', fontSize: 14, color: '#333' },
  genderButtonContainer: { display: 'flex', justifyContent: 'space-between', gap: 10 },
  genderButton: { flex: 1, padding: '10px 0', borderRadius: 5, border: '1px solid #1e88e5', cursor: 'pointer' },
  buttonGroup: { display: 'flex', justifyContent: 'space-around', gap: 16, marginTop: 20 },
  editButton: { flex: 1 },
  infoCard: { width: '100%', marginBottom: 20, backgroundColor: 'white', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '12px 16px', alignItems: 'center' },
  infoLabel: { fontSize: 16, color: 'gray', margin: 0 },
  infoValue: { fontSize: 16, fontWeight: 'bold', margin: 0 },
};