# 💕 MATCH — ポーカー好きのためのマッチングアプリ

> ポーカーを共通の趣味で繋がる、スワイプ型恋愛マッチングアプリ。  
> フレームワーク不使用のVanilla JSで構築し、Firebase + PWAで実動するプロダクトとして公開中。

https://careerfighterrrrr-bot.github.io/match-app/
---

## 主な機能

| 機能 | 説明 |
|------|------|
| 会員登録 / ログイン | Firebase Authenticationによるメール認証 |
| スワイプマッチング | タッチ / マウスドラッグで Like・Nope を判定 |
| 相互いいね制 | 両者がいいねした場合のみマッチ成立（Firestoreで管理） |
| プロフィール編集 | 名前・年齢・自己紹介・写真（最大3枚）を設定 |
| 写真アップロード | Canvasで画像をリサイズ圧縮してFirestoreに保存 |
| いいね！一覧 | 自分にいいねしたユーザーを一覧表示、プロフィールを確認してマッチ可能 |
| チャット | マッチ相手とリアルタイムメッセージ |
| ポーカーミニゲーム | 5枚ドロー方式のカードゲームでアイスブレイク |
| ポーカーAIボット | キーワードマッチングによるポーカー知識Q&Aボット |
| PWA対応 | ホーム画面への追加、オフラインキャッシュ対応 |

---

## 技術スタック

```
フロントエンド  Vanilla JavaScript (ES2020+) / HTML5 / CSS3
バックエンド    Firebase Authentication / Cloud Firestore
インフラ        GitHub Pages（静的ホスティング）
PWA            Service Worker / Web App Manifest
```

**ライブラリ・フレームワーク：ゼロ依存**  
React・Vue・jQueryを一切使用せず、ブラウザ標準APIのみで実装。

---

## アーキテクチャ

```
match-app/
├── index.html        # シングルページ（全画面をdivで切り替え）
├── style.css         # 全スタイル（CSS変数 / アニメーション）
├── script.js         # アプリロジック全体（Firebase連携・画面遷移）
├── profiles.js       # ランダムプロフィール生成データ
├── sw.js             # Service Worker（オフラインキャッシュ）
├── manifest.json     # PWAマニフェスト
└── icon.svg          # アプリアイコン
```

### 画面遷移

```
認証画面
 └─ スワイプ画面 ──┬─ いいね！一覧 ─── ユーザープロフィール ──┐
                   ├─ マッチ一覧 ──── チャット               │
                   └─ マッチ演出 ─────────────────────────── ┘
                         ↕
                   ポーカーゲームモーダル（オーバーレイ）
                         ↕
                   プロフィールドロワー（スライドイン）
```

---

## 実装上のポイント

### スワイプ判定
マウス / タッチイベントを共通ハンドラで処理し、移動量が画面幅の25%を超えるとLike/Nopeを発火。  
ドラッグと「タップして自己紹介を見る」の誤検知をフラグで排除。

### 相互いいねマッチング
いいね時に `likes/{senderUid}_{receiverUid}` ドキュメントを作成し、  
逆方向のドキュメントが存在するか確認してマッチを判定。

### 写真のクライアントサイド圧縮
`FileReader → Image → Canvas.drawImage → toDataURL(jpeg, 0.75)` の流れで  
アップロード前にブラウザ側でリサイズ・圧縮し、Firestoreの書き込みサイズを削減。

### ポーカーミニゲーム
52枚デッキをシャッフルし5枚配布、役判定ロジック（ロイヤルフラッシュ〜ハイカード）を  
スコア値に変換して大小比較。結果に関わらずいいね・パスの選択に誘導するUX設計。

### PWA（Progressive Web App）
Service Workerでアプリシェルをキャッシュ。Androidではインストールバナーを自動表示、  
iOSではSafari向けの手動追加ガイドをバナーで案内。

---

## セットアップ

```bash
git clone https://github.com/your-username/match-app.git
cd match-app
```

サーバー不要。`index.html` をブラウザで開くだけでローカル動作します。  
（Firebaseの接続情報は `script.js` に直接記載済み）

---

## 今後の拡張候補

- [ ] プッシュ通知（新しいいいね・メッセージの通知）
- [ ] Firestoreリアルタイムリスナーによるメッセージの即時反映
- [ ] 写真をFirebase Storageへ移行（Firestoreドキュメントサイズの削減）
- [ ] 年齢・ポーカー経験によるフィルタリング機能
- [ ] TypeScript化・テスト追加

---

## ライセンス

MIT
