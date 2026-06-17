const firebaseConfig = {
    apiKey: "AIzaSyBMSmokIU5uuFTq0_e7Kd9lBK8Ve1qwvc4",
    authDomain: "match-app-share.firebaseapp.com",
    projectId: "match-app-share",
    storageBucket: "match-app-share.firebasestorage.app",
    messagingSenderId: "392628264983",
    appId: "1:392628264983:web:144d9a799c43e961bafc52"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let entries = [];
let editingId = null;

const defaultKnowledge = [
    {
        keywords: ['役', 'ハンド', '手札', '強さ', 'ランキング', '順番', 'ロイヤル', 'フラッシュ', 'ストレート', 'フォーカード', 'フルハウス', 'スリーカード', 'ツーペア', 'ワンペア', 'ハイカード'],
        reply: '♠️ ハンドの強さ順：\n①ロイヤルフラッシュ（最強）\n②ストレートフラッシュ\n③フォーカード\n④フルハウス\n⑤フラッシュ\n⑥ストレート\n⑦スリーカード\n⑧ツーペア\n⑨ワンペア\n⑩ハイカード（最弱）🃏'
    },
    {
        keywords: ['ルール', '流れ', '進め方', 'テキサス', 'ホールデム', 'フロップ', 'ターン', 'リバー', 'ショーダウン', 'コミュニティ'],
        reply: '🃏 テキサスホールデムの流れ：\n① プリフロップ：手札2枚を配布\n② フロップ：共通牌3枚を公開\n③ ターン：共通牌4枚目を公開\n④ リバー：共通牌5枚目を公開\n⑤ ショーダウン：手役を比べて勝負！\n合計7枚（手札2枚＋共通牌5枚）から最強の5枚を作ります♣️'
    },
    {
        keywords: ['ポジション', '位置', 'ボタン', 'ディーラー', 'ブラインド', 'SB', 'BB', 'UTG', 'アーリー', 'ミドル', 'レイト'],
        reply: '🎯 ポジションはポーカーで超重要！\n・ディーラーボタン（BTN）：最強ポジション。全員の行動を見てから判断できます\n・アーリーポジション（UTG等）：最弱。情報なしで先に行動しなければならない\n・レイトポジション（CO・BTN）：後から行動でき、相手の情報が分かる\nポジションが良いほど弱いハンドでも参加しやすくなります♠️'
    },
    {
        keywords: ['プリフロップ', 'スターティング', 'AA', 'KK', 'QQ', 'JJ', 'AK', 'AQ', 'どの手', 'どんな手', '参加', 'オープン'],
        reply: '♥️ プリフロップのハンド強度：\n【プレミアム】AA・KK・QQ・AKs → 積極的にレイズ！\n【強いハンド】JJ・TT・AQs・AJs → ほとんどの状況でレイズ\n【中程度】99・88・ATs・KQs → ポジション次第で参加\n【投機的】スモールペア・スーテッドコネクター → 安くフロップを見てセット狙い\n弱い手でも無闇に参加しないのが基本です！'
    },
    {
        keywords: ['ブラフ', 'ブラフィング', 'ハッタリ', '嘘', 'フェイク', '騙'],
        reply: '🎲 ブラフの基本：\n・ブラフが効くのは「自分のレンジが強く見える場面」\n・相手の枚数が少ない（ヘッズアップや3人以下）ときが有効\n・ボード（共通牌）が自分に有利な展開のとき\n⚠️ やりすぎ注意：ブラフが多いとコールされやすくなります\n💡 セミブラフ（フラッシュドロー等でブラフ）がリスク低めでおすすめ😏'
    },
    {
        keywords: ['オッズ', 'ポットオッズ', '確率', 'アウツ', '期待値', 'EV', '数学', '計算'],
        reply: '📊 ポットオッズの使い方：\n例）ポット500円、コール100円の場合\n→ ポットオッズ = 100/(500+100) ≈ 17%\n→ 自分の勝率が17%以上ならコールが正解！\n\nアウツ（勝てるカード枚数）の計算：\nフロップ時のアウツ × 4 ≈ ターン+リバーでの勝率(%)\nターン時のアウツ × 2 ≈ リバーでの勝率(%)📈'
    },
    {
        keywords: ['ベット', 'レイズ', 'コール', 'フォールド', 'チェック', 'オールイン', '賭け', 'アクション'],
        reply: '♣️ ベッティングアクション解説：\n・チェック：ベットしないでパス（先行者のみ）\n・コール：相手のベット額に合わせる\n・レイズ：相手のベットより大きく賭ける\n・フォールド：手札を捨てて降りる\n・オールイン：持ちチップ全部をベット\n\n基本はレイズ or フォールド！コールが多すぎるとルースパッシブになりがちです⚠️'
    },
    {
        keywords: ['Cベット', 'cbet', 'c-bet', 'コンティニュエーション', '継続ベット'],
        reply: '♠️ Cベット（コンティニュエーションベット）：\nプリフロップでレイズした人がフロップでも続けてベットするテクニック。\n\n【使うべき場面】\n・ドライボード（例：K-7-2のような繋がりのない場面）\n・相手が1人（ヘッズアップ）\n・自分のレンジが有利なボード\n\nポット額の33〜50%が一般的なCベットサイズです！'
    },
    {
        keywords: ['スタック', 'チップ', 'ショート', 'ディープ', 'バンクロール', 'バイイン'],
        reply: '💰 スタック管理の基本：\n・ショートスタック（20BB以下）：複雑なプレイより シンプルなプッシュ or フォールド戦略が有効\n・ミドルスタック（20〜50BB）：通常の戦略\n・ディープスタック（100BB以上）：ポストフロップのスキルが重要。小さいポケットペアやスーテッドコネクターの価値が上がります\n\nバンクロール管理：キャッシュゲームは着席額の20倍以上を用意しましょう💪'
    },
    {
        keywords: ['トーナメント', 'MTT', 'SNG', '大会', 'バブル', 'ICM', 'ファイナルテーブル'],
        reply: '🏆 トーナメント戦略のポイント：\n・序盤：チップを守りつつ機会を狙う。無理なリスクは避ける\n・中盤：アンティ導入後はスチール（ブラインドを奪う）が重要に\n・バブル付近：ICM（独立チップモデル）を意識。短スタックはプッシュ or フォールド\n・ファイナルテーブル：スタック差・ポジション・相手の傾向を総合的に判断\n\nキャッシュゲームと違い「生き残ること」も重要です！'
    },
    {
        keywords: ['初心者', '入門', '始め', '基本', '勉強', '覚え', 'コツ', '上達', '練習'],
        reply: '🌟 ポーカー初心者へのアドバイス：\n1. まずはハンドランキングを完全に覚える\n2. タイトアグレッシブ（強い手のみ、積極的にベット）を基本戦略に\n3. ポジションを常に意識する\n4. 感情（チルト）に流されない\n5. セッションの記録をつけて振り返る\n\n無料アプリ（PokerStars Play等）で実戦練習するのがおすすめです♠️'
    },
    {
        keywords: ['チルト', '感情', '負け', 'イライラ', 'メンタル', '精神'],
        reply: '🧘 チルト対策：\nチルト（感情的なプレイ）はポーカーの最大の敵！\n\n【予防法】\n・損失許容額を事前に決めておく\n・1回の負けを引きずらない（バッドビートは誰にでもある）\n・休憩を積極的に取る\n\n【気づいたら】すぐにその場を離れることが大切。感情が落ち着いてから再開しましょう。冷静さを保てるプレイヤーが長期的に勝ちます💪'
    },
    {
        keywords: ['世界大会', 'WSOP', 'ワールドシリーズ', 'WPT', 'EPT', 'ワールドポーカー', '国際大会', 'メインイベント', 'ラスベガス'],
        reply: '🌍 主要ポーカー世界大会：\n\n♠️ WSOP（ワールドシリーズ・オブ・ポーカー）\n毎年5〜7月、ラスベガス（バリーズ/パリスホテル）開催。世界最大の権威ある大会。ブレスレットをかけて数百イベントが行われる。\n\n♣️ WPT（ワールドポーカーツアー）\n世界各地を転戦する国際ツアー。各ストップで賞金総額数億円規模。\n\n♥️ EPT（ヨーロピアンポーカーツアー）\nPokerStars主催。モナコ・バルセロナ等で開催されるヨーロッパ最大のツアー。\n\n♦️ スーパーハイローラーボウル\n参加費$300,000の超ハイステーク大会。世界トップ選手が集結。'
    },
    {
        keywords: ['参加費', 'エントリー費', '費用', '参加料', 'プライズ', '賞金総額', '賞金プール'],
        reply: '💰 主要世界大会の参加費（バイイン）：\n\nWSOP メインイベント：$10,000（約150万円）\nWSOP ハイローラー各種：$25,000〜$111,111\nWPT メインイベント：$3,500〜$10,000\nEPT メインイベント：€5,300（約85万円）\nスーパーハイローラーボウル：$300,000（約4,500万円）\n\n💡 賞金総額はWSOP MEで参加者数×$10,000から算出。2023年は参加者10,043人で総額約100億円超！\n優勝賞金は例年10〜12億円規模になります🏆'
    },
    {
        keywords: ['優勝', '優勝者', '勝者', 'チャンピオン', 'ウィナー', '2021', '2022', '2023', '2024', '歴代'],
        reply: '🏆 WSOP メインイベント近年の優勝者：\n\n2023年：Daniel Weinman（アメリカ）\n　賞金：$12,100,000（約18億円）\n　参加者：10,043人\n\n2022年：Espen Jorstad（ノルウェー）\n　賞金：$10,000,000（約15億円）\n\n2021年：Koray Aldemir（ドイツ）\n　賞金：$8,000,000（約12億円）\n\n2019年：Hossein Ensan（ドイツ/イラン系）\n　賞金：$10,000,000\n\n※2020年はコロナの影響で規模縮小・時期変更\n※最新情報はWSOP公式サイトで確認を！'
    },
    {
        keywords: ['ファインプレー', '名場面', '名シーン', '伝説', '神プレー', '有名なプレー', '名勝負', '歴史的'],
        reply: '✨ ポーカー史に残る伝説の名場面：\n\n🃏【Moneymaker Effect / 2003年WSOP】\nChris Moneymakerがオンライン予選（参加費$86）から出場し、WSOPメインイベントを優勝（$2.5M獲得）。アマチュアの夢を証明しポーカーブームの火付け役に！\n\n🃏【Phil Iveyのブラフ / EPT 2009年】\nボードにペアもフラッシュもない状況でリバーオールイン。相手のトップペアをフォールドさせた完璧な読みのブラフ。\n\n🃏【Isildur1 vs Durrrr / 2009年オンライン】\nViktor BlomとTom Dwanがオンラインで数百万ドルを賭け合った伝説のセッション。1日で数億円が動いた。\n\n📺 名場面はYouTubeで「WSOP highlights」「poker greatest moments」で検索！'
    }
];

// ── Auth ──────────────────────────────────────────────
auth.onAuthStateChanged(async user => {
    if (user) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('userEmail').textContent = user.email;
        await loadEntries();
    } else {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';
    }
});

function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    errorEl.textContent = '';
    auth.signInWithEmailAndPassword(email, password)
        .catch(() => {
            errorEl.textContent = 'メールアドレスまたはパスワードが違います';
        });
}

function logout() {
    auth.signOut();
}

// ── エントリ一覧 ──────────────────────────────────────
async function loadEntries() {
    const snapshot = await db.collection('botKnowledge').get();
    entries = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    renderList();
}

function renderList() {
    const list = document.getElementById('entryList');
    const header = document.getElementById('adminTitle');
    header.innerHTML = `🎴 Bot1 知識ベース管理 <span class="count-badge">${entries.length}</span>`;

    if (entries.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <p>まだ登録がありません</p>
                <p style="margin-top:8px;font-size:13px;">「初期データをインポート」で既定の知識を追加するか、「＋ 新規追加」で作成してください</p>
            </div>`;
        return;
    }

    list.innerHTML = entries.map(entry => {
        const kwStr = entry.keywords.join('・');
        const replyPreview = entry.reply.replace(/\n/g, ' ');
        return `
            <div class="entry-card">
                <div class="entry-keywords">🏷 ${escHtml(kwStr)}</div>
                <div class="entry-reply">${escHtml(replyPreview)}</div>
                <div class="entry-footer">
                    <button class="btn-edit" onclick="openModal('${entry.id}')">編集</button>
                    <button class="btn-delete" onclick="deleteEntry('${entry.id}')">削除</button>
                </div>
            </div>`;
    }).join('');
}

// ── モーダル ──────────────────────────────────────────
function openModal(id = null) {
    editingId = id;
    if (id) {
        const entry = entries.find(e => e.id === id);
        document.getElementById('modalKeywords').value = entry.keywords.join(', ');
        document.getElementById('modalReply').value = entry.reply;
        document.getElementById('modalTitle').textContent = '知識を編集';
    } else {
        document.getElementById('modalKeywords').value = '';
        document.getElementById('modalReply').value = '';
        document.getElementById('modalTitle').textContent = '知識を追加';
    }
    document.getElementById('modal').style.display = 'flex';
    setTimeout(() => document.getElementById('modalKeywords').focus(), 100);
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    editingId = null;
}

async function saveEntry() {
    const keywords = document.getElementById('modalKeywords').value
        .split(',').map(k => k.trim()).filter(Boolean);
    const reply = document.getElementById('modalReply').value.trim();

    if (!keywords.length || !reply) {
        alert('キーワードと返答を入力してください');
        return;
    }

    const btn = document.querySelector('.btn-save');
    btn.disabled = true;
    btn.textContent = '保存中...';

    try {
        if (editingId) {
            await db.collection('botKnowledge').doc(editingId).update({ keywords, reply });
        } else {
            await db.collection('botKnowledge').add({ keywords, reply, order: entries.length });
        }
        closeModal();
        await loadEntries();
    } catch (e) {
        alert('保存に失敗しました: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '保存する';
    }
}

async function deleteEntry(id) {
    if (!confirm('この知識を削除しますか？')) return;
    await db.collection('botKnowledge').doc(id).delete();
    await loadEntries();
}

// ── 初期データのインポート ────────────────────────────
async function seedDefaultData() {
    const msg = entries.length > 0
        ? `既存の ${entries.length} 件を削除して初期データ（${defaultKnowledge.length} 件）をインポートしますか？`
        : `初期データ（${defaultKnowledge.length} 件）をインポートしますか？`;
    if (!confirm(msg)) return;

    try {
        if (entries.length > 0) {
            const batch = db.batch();
            const snapshot = await db.collection('botKnowledge').get();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }

        const batch = db.batch();
        defaultKnowledge.forEach((entry, i) => {
            const ref = db.collection('botKnowledge').doc();
            batch.set(ref, { ...entry, order: i });
        });
        await batch.commit();

        await loadEntries();
        alert(`✅ ${defaultKnowledge.length} 件のデータをインポートしました！`);
    } catch (e) {
        alert('インポートに失敗しました: ' + e.message);
    }
}

// ── ユーティリティ ────────────────────────────────────
function escHtml(t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});
