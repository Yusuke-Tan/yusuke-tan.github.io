import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // App.jsのパスを修正しました

// 1. public/index.htmlにある<div id="root"></div>という要素を取得します
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

// 2. その要素の中に、<App />コンポーネントを描画（表示）します
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);