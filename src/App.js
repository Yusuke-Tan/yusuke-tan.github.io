import React, { useState, useEffect, useCallback } from 'react';
// ウェブ用のナビゲーションライブラリとフックをインポート
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
// アイコンライブラリをインポート
import { MdDashboard, MdCalculate, MdList, MdAccountCircle } from 'react-icons/md';
// デフォルトアイコンをインポート
import defaultIcon from './assets/icon.png';

const PROFILE_STORAGE_KEY = '@user_profile_v1';

// --- Placeholder Screen Components ---
// 本来は別ファイルにしますが、わかりやすさのためここに記述します。
const HomeScreen = () => <div><h1>ホーム</h1></div>;
const IDTScreen = () => <div><h1>2000tt</h1></div>;
const RecordScreen = () => <div><h1>練習記録</h1></div>;
const ProfileScreen = () => <div><h1>プロフィール</h1><p>ここでアイコンなどを編集できます。</p></div>;


// --- ウェブ用に書き換えたヘッダーアイコン ---
const ProfileHeaderIcon = () => {
  const navigate = useNavigate(); // react-router-domのナビゲーションフック
  const location = useLocation(); // 現在のURL情報を取得するフック
  const [iconUri, setIconUri] = useState(null);

  // useFocusEffectの代わりにuseEffectを使用
  // location.pathnameが変わるたびに実行され、画面遷移時にアイコンを再読み込みする
  useEffect(() => {
    const loadIcon = async () => {
      try {
        // AsyncStorageの代わりにlocalStorageを使用
        const json = window.localStorage.getItem(PROFILE_STORAGE_KEY);
        if (json) {
          const profile = JSON.parse(json);
          setIconUri(profile.iconUri);
        } else {
          setIconUri(null);
        }
      } catch (e) {
        console.error("Failed to load profile icon for header.", e);
      }
    };
    loadIcon();
  }, [location.pathname]); // ページが切り替わるたびに実行

  return (
    // Pressableの代わりにbutton要素を使用
    <button onClick={() => navigate('/profile')} style={styles.headerButton}>
      {/* Avatar.Imageの代わりにimg要素を使用 */}
      <img
        src={iconUri ? iconUri : defaultIcon}
        alt="Profile Icon"
        style={styles.headerIcon}
      />
    </button>
  );
};

// --- アプリ全体のレイアウトを定義するコンポーネント ---
const AppLayout = () => {
  const location = useLocation();

  // タブのリンクを定義
  const navLinks = [
    { path: '/', label: 'ホーム', icon: <MdDashboard /> },
    { path: '/idt', label: '2000tt', icon: <MdCalculate /> },
    { path: '/record', label: '練習記録', icon: <MdList /> },
    { path: '/profile', label: 'プロフィール', icon: <MdAccountCircle /> },
  ];

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <header style={styles.header}>
        <div style={styles.headerTitle}>Rowing Recorder</div>
        <ProfileHeaderIcon />
      </header>

      {/* メインコンテンツ (各スクリーンが表示される場所) */}
      <main style={styles.mainContent}>
        <Outlet /> {/* ここにRouteで指定されたコンポーネントが描画される */}
      </main>

      {/* 下部のタブナビゲーション */}
      <footer style={styles.tabBar}>
        {navLinks.map(link => (
          <Link to={link.path} key={link.path} style={{
            ...styles.tabItem,
            color: location.pathname === link.path ? '#1e88e5' : 'gray' // アクティブなタブの色を変更
          }}>
            <div style={styles.tabIcon}>{link.icon}</div>
            <div style={styles.tabLabel}>{link.label}</div>
          </Link>
        ))}
      </footer>
    </div>
  );
};


// --- アプリケーションのメインエントリーポイント ---
export default function App() {
  return (
    // NavigationContainerの代わりにBrowserRouterを使用
    <BrowserRouter>
      {/* Routesでページの経路を定義 */}
      <Routes>
        {/* AppLayoutを共通のレイアウトとして使用 */}
        <Route path="/" element={<AppLayout />}>
          {/* Outletに表示するコンポーネントを定義 */}
          <Route index element={<HomeScreen />} />
          <Route path="idt" element={<IDTScreen />} />
          <Route path="record" element={<RecordScreen />} />
          <Route path="profile" element={<ProfileScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// --- スタイル定義 ---
// StyleSheet.createの代わりに通常のJavaScriptオブジェクトを使用
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    fontFamily: 'sans-serif',
  },
  header: {
    backgroundColor: '#1e88e5',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
  },
  headerButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: '50%', // 円形にする
  },
  mainContent: {
    flex: 1, // 残りの高さをすべて使用する
    padding: '20px',
    overflowY: 'auto', // 内容が多い場合にスクロール
  },
  tabBar: {
    display: 'flex',
    justifyContent: 'space-around',
    borderTop: '1px solid #e0e0e0',
    backgroundColor: '#fff',
    padding: '5px 0',
  },
  tabItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textDecoration: 'none',
    fontSize: 12,
    flex: 1,
    padding: '5px 0',
  },
  tabIcon: {
    fontSize: 24,
  },
  tabLabel: {
    marginTop: 2,
  },
};