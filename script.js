// Service Worker登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/match-app/sw.js').catch(() => {});
  });
}

// ホーム画面追加
let installPrompt = null;

function isIos() {
    return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
}
function isInStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e;
    showInstallBanner();
});

function showInstallBanner() {
    const banner = document.getElementById('installBanner');
    if (!banner || isInStandaloneMode()) return;
    banner.style.display = 'block';
    if (isIos()) {
        document.getElementById('installBtn').style.display = 'none';
        document.getElementById('installIosHint').style.display = 'block';
    }
}

async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
        document.getElementById('installBanner').style.display = 'none';
    }
    installPrompt = null;
}

// iOSの場合もバナーを表示
if (isIos() && !isInStandaloneMode()) {
    window.addEventListener('DOMContentLoaded', showInstallBanner);
}

// Firebase 初期化
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

// アプリの状態
let matchCount = 0;
let currentUserName = '';
let currentProfile = null;
let matches = [];
let currentChatPartner = null;
let currentUid = null;
let realProfiles = [];
let swipedUsers = [];
let likedUsers = {};
let currentViewedUser = null;
let profileViewImages = [];
let profileViewImageIndex = 0;

// Firestoreに保存
function saveState() {
    if (!currentUid) return;
    db.collection('userData').doc(currentUid).set({ matchCount, matches, swipedUsers });
}

// 他のユーザーを取得してrealProfilesに格納
async function loadRealProfiles() {
    const snapshot = await db.collection('users').get();
    const all = snapshot.docs
        .filter(doc => doc.id !== currentUid)
        .map(doc => ({ uid: doc.id, ...doc.data() }));

    // シャッフルしてスワイプ済みを除外
    const unswiped = all.filter(u => !swipedUsers.includes(u.uid));
    realProfiles = unswiped.sort(() => Math.random() - 0.5);
}

function getBotRole(name) {
    if (!name) return null;
    return name.toLowerCase().startsWith('bot') ? name.toLowerCase() : null;
}

function userToProfile(user) {
    const role = getBotRole(user.name);
    return {
        uid: user.uid,
        isReal: true,
        role: role,
        name: user.name || '名無し',
        age: user.age || '?',
        bio: user.bio || '',
        pokerHistory: user.pokerHistory || '',
        pokerGame: user.pokerGame || '',
        pokerStyle: user.pokerStyle || '',
        introduction: user.bio ? user.bio.split('\n').filter(Boolean) : ['よろしくお願いします！'],
        images: user.photos && user.photos.length > 0
            ? user.photos
            : [`https://i.pravatar.cc/400?u=${user.uid}`]
    };
}

// Firestoreからユーザーデータを読み込んでアプリ開始
async function loadUserData(uid) {
    currentUid = uid;
    const [userDoc, dataDoc] = await Promise.all([
        db.collection('users').doc(uid).get(),
        db.collection('userData').doc(uid).get()
    ]);

    const user = userDoc.exists ? userDoc.data() : {};
    currentUserName = user.name || '';

    if (dataDoc.exists) {
        const d = dataDoc.data();
        matchCount = d.matchCount || 0;
        matches = d.matches || [];
        swipedUsers = d.swipedUsers || [];
    } else {
        matchCount = 0;
        matches = [];
        swipedUsers = [];
    }
    await loadRealProfiles();
    await loadBotKnowledge();

    const initial = currentUserName.charAt(0) || '?';
    document.getElementById('drawerName').textContent = currentUserName;
    document.getElementById('drawerAge').textContent = user.age ? `${user.age}歳` : '';
    document.getElementById('drawerIdentifier').textContent = maskIdentifier(user.email || '');
    document.getElementById('bioDisplay').textContent = user.bio || '未設定';
    document.getElementById('bioInput').value = user.bio || '';
    document.getElementById('pokerHistory').value = user.pokerHistory || '';
    document.getElementById('pokerGame').value = user.pokerGame || '';
    document.getElementById('pokerStyle').value = user.pokerStyle || '';
    applyProfilePhoto(user.photo || null, initial);
    renderProfilePhotos(user.photos || []);

    document.getElementById('matchCount').textContent = `マッチ: ${matchCount}件`;
    if (matches.length > 0) {
        const badge = document.getElementById('historyBadge');
        badge.textContent = matches.length;
        badge.style.display = 'inline-flex';
    }

    document.getElementById('loadingScreen').classList.remove('active');
    document.getElementById('swipeScreen').classList.add('active');
    loadCard();
    updateLikesBadge();
}

// 認証状態の監視（ページ読み込み時に自動ログイン）
auth.onAuthStateChanged(async (user) => {
    if (user) {
        await loadUserData(user.uid);
    } else {
        document.getElementById('loadingScreen').classList.remove('active');
        document.getElementById('authScreen').classList.add('active');
    }
});

// 認証タブ切り替え
function showAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach((t, i) => {
        t.classList.toggle('active', (i === 0 && tab === 'register') || (i === 1 && tab === 'login'));
    });
    document.getElementById('registerForm').style.display = tab === 'register' ? 'flex' : 'none';
    document.getElementById('loginForm').style.display = tab === 'login' ? 'flex' : 'none';
    document.getElementById('registerError').textContent = '';
    document.getElementById('loginError').textContent = '';
}

// 登録処理
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('regIdentifier').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const name = document.getElementById('regName').value.trim();
    const age = document.getElementById('regAge').value;
    const errorEl = document.getElementById('registerError');
    const btn = this.querySelector('button[type="submit"]');

    if (password !== passwordConfirm) {
        errorEl.textContent = 'パスワードが一致しません';
        return;
    }

    btn.disabled = true;
    btn.textContent = '登録中...';
    try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await db.collection('users').doc(cred.user.uid).set({ name, age, email, photo: null });
    } catch (err) {
        errorEl.textContent = firebaseErrorMessage(err.code);
        btn.disabled = false;
        btn.textContent = '登録する';
    }
});

// ログイン処理
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const btn = this.querySelector('button[type="submit"]');

    btn.disabled = true;
    btn.textContent = 'ログイン中...';
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
        errorEl.textContent = firebaseErrorMessage(err.code);
        btn.disabled = false;
        btn.textContent = 'ログイン';
    }
});

function firebaseErrorMessage(code) {
    const map = {
        'auth/email-already-in-use': 'このメールアドレスはすでに登録されています',
        'auth/invalid-email': 'メールアドレスの形式が正しくありません',
        'auth/weak-password': 'パスワードは6文字以上にしてください',
        'auth/user-not-found': 'メールアドレスまたはパスワードが違います',
        'auth/wrong-password': 'メールアドレスまたはパスワードが違います',
        'auth/invalid-credential': 'メールアドレスまたはパスワードが違います',
        'auth/too-many-requests': 'しばらく待ってから再試行してください',
    };
    return map[code] || `エラーが発生しました (${code})`;
}

function maskIdentifier(id) {
    if (!id) return '';
    const [local, domain] = id.split('@');
    return local.slice(0, 2) + '***@' + domain;
}

function applyProfilePhoto(photo, initial) {
    const btn = document.getElementById('profileBtn');
    const avatar = document.getElementById('drawerAvatar');
    if (photo) {
        btn.style.backgroundImage = `url(${photo})`;
        btn.style.backgroundSize = 'cover';
        btn.style.backgroundPosition = 'center';
        btn.textContent = '';
        avatar.style.backgroundImage = `url(${photo})`;
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
        avatar.textContent = '';
    } else {
        btn.style.backgroundImage = '';
        btn.textContent = initial || '?';
        avatar.style.backgroundImage = '';
        avatar.textContent = initial || '?';
    }
}

function renderProfilePhotos(photos) {
    const grid = document.getElementById('profilePhotosGrid');
    document.getElementById('photoCount').textContent = `${photos.length} / 3`;
    grid.innerHTML = '';

    photos.forEach((photo, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'profile-photo-item';
        wrap.innerHTML = `
            <img src="${photo}" class="profile-photo-thumb">
            <button class="profile-photo-delete" onclick="deleteProfilePhoto(${i})">✕</button>
        `;
        grid.appendChild(wrap);
    });

    if (photos.length < 3) {
        const addBtn = document.createElement('div');
        addBtn.className = 'profile-photo-add';
        addBtn.innerHTML = '<span>＋</span>';
        addBtn.onclick = () => document.getElementById('profilePhotoInput').click();
        grid.appendChild(addBtn);
    }
}

function handleProfilePhotoAdd(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        const img = new Image();
        img.onload = async function() {
            const canvas = document.createElement('canvas');
            const maxW = 400, maxH = 500;
            let w = img.width, h = img.height;
            const ratio = Math.min(maxW / w, maxH / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            const photo = canvas.toDataURL('image/jpeg', 0.75);

            const userDoc = await db.collection('users').doc(currentUid).get();
            const photos = userDoc.data().photos || [];
            if (photos.length >= 3) return;
            photos.push(photo);
            await db.collection('users').doc(currentUid).update({ photos });
            renderProfilePhotos(photos);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

async function deleteProfilePhoto(index) {
    const userDoc = await db.collection('users').doc(currentUid).get();
    const photos = userDoc.data().photos || [];
    photos.splice(index, 1);
    await db.collection('users').doc(currentUid).update({ photos });
    renderProfilePhotos(photos);
}

function toggleBioEdit() {
    document.getElementById('bioDisplay').style.display = 'none';
    document.getElementById('bioEditArea').style.display = 'block';
    document.getElementById('bioEditBtn').style.display = 'none';
    document.getElementById('bioInput').focus();
}

function cancelBioEdit() {
    document.getElementById('bioDisplay').style.display = 'block';
    document.getElementById('bioEditArea').style.display = 'none';
    document.getElementById('bioEditBtn').style.display = 'inline-block';
}

async function saveBio() {
    const bio = document.getElementById('bioInput').value.trim();
    if (currentUid) {
        await db.collection('users').doc(currentUid).update({ bio });
    }
    document.getElementById('bioDisplay').textContent = bio || '未設定';
    cancelBioEdit();
}

function triggerPhotoUpload() {
    document.getElementById('photoInput').click();
}

function handlePhotoChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const maxSize = 200;
            let w = img.width, h = img.height;
            if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize; } }
            else { if (h > maxSize) { w = w * maxSize / h; h = maxSize; } }
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            const photo = canvas.toDataURL('image/jpeg', 0.7);
            if (currentUid) {
                db.collection('users').doc(currentUid).update({ photo });
            }
            applyProfilePhoto(photo, currentUserName.charAt(0));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

function openProfile() {
    document.getElementById('profileDrawer').classList.add('open');
    document.getElementById('profileOverlay').classList.add('open');
}

function closeProfile() {
    document.getElementById('profileDrawer').classList.remove('open');
    document.getElementById('profileOverlay').classList.remove('open');
}

function logout() {
    auth.signOut();
    closeProfile();
    matchCount = 0;
    currentUserName = '';
    matches = [];
    currentChatPartner = null;
    currentUid = null;
    document.getElementById('matchCount').textContent = 'マッチ: 0件';
    document.getElementById('historyBadge').style.display = 'none';
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('authScreen').classList.add('active');
    showAuthTab('login');
}

const autoReplies = [
    "こんにちは！マッチしてくれてありがとう😊",
    "わあ、うれしい！もっと話しかけてね💕",
    "そうなんですね〜！面白いです✨",
    "えー！それ素敵ですね😆",
    "ありがとう、うれしいです🌸",
    "もっと聞かせてください！",
    "本当ですか？すごいですね😊",
    "いいですね〜！私もそう思います✨",
    "一緒にどこかに行けたら嬉しいな💕",
    "そんなことあるんですね〜！かわいい😊",
    "楽しそう！ぜひ誘ってください✨",
    "わかります〜！同じ気持ちです😄"
];

const defaultPokerKnowledge = [
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
let pokerKnowledge = [...defaultPokerKnowledge];

async function loadBotKnowledge() {
    try {
        const snapshot = await db.collection('botKnowledge').get();
        if (!snapshot.empty) {
            pokerKnowledge = snapshot.docs
                .map(doc => doc.data())
                .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        }
    } catch (e) {
        // Firestore取得失敗時はデフォルトを使い続ける
    }
}

// ── ③ ポーカープロフィール保存 ──────────────────────────
async function savePokerProfile() {
    const history = document.getElementById('pokerHistory').value;
    const game = document.getElementById('pokerGame').value;
    const style = document.getElementById('pokerStyle').value;
    if (currentUid) {
        await db.collection('users').doc(currentUid).update({
            pokerHistory: history, pokerGame: game, pokerStyle: style
        });
    }
    showToast('ポーカー情報を保存しました！');
}

// ── ① ポーカーミニゲーム ────────────────────────────────
const CARD_SUITS = ['♠', '♥', '♦', '♣'];
const CARD_RANKS = [2,3,4,5,6,7,8,9,10,11,12,13,14];

function createDeck() {
    const deck = [];
    for (const s of CARD_SUITS) for (const r of CARD_RANKS) deck.push({ suit: s, rank: r });
    return deck;
}

function shuffleDeck(deck) {
    const d = [...deck];
    for (let i = d.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
}

function rankStr(r) {
    return { 14: 'A', 13: 'K', 12: 'Q', 11: 'J' }[r] || String(r);
}

function evaluateHand(cards) {
    const ranks = cards.map(c => c.rank).sort((a, b) => b - a);
    const suits = cards.map(c => c.suit);
    const isFlush = suits.every(s => s === suits[0]);
    const isStraight = new Set(ranks).size === 5 && ranks[0] - ranks[4] === 4;
    const isAceLow = JSON.stringify(ranks) === JSON.stringify([14,5,4,3,2]);
    const counts = {};
    ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);
    const grouped = Object.values(counts).sort((a, b) => b - a);
    if (isFlush && isStraight && ranks[0] === 14) return { score: 900, name: 'ロイヤルフラッシュ！👑' };
    if (isFlush && (isStraight || isAceLow)) return { score: 800 + ranks[0], name: 'ストレートフラッシュ！🔥' };
    if (grouped[0] === 4) return { score: 700 + ranks[0], name: 'フォーカード！💥' };
    if (grouped[0] === 3 && grouped[1] === 2) return { score: 600 + ranks[0], name: 'フルハウス！✨' };
    if (isFlush) return { score: 500 + ranks[0], name: 'フラッシュ！' };
    if (isStraight || isAceLow) return { score: 400 + (isAceLow ? 5 : ranks[0]), name: 'ストレート！' };
    if (grouped[0] === 3) return { score: 300 + ranks[0], name: 'スリーカード！' };
    if (grouped[0] === 2 && grouped[1] === 2) return { score: 200 + ranks[0], name: 'ツーペア' };
    if (grouped[0] === 2) return { score: 100 + ranks[0], name: 'ワンペア' };
    return { score: ranks[0], name: `ハイカード（${rankStr(ranks[0])}）` };
}

function renderCards(containerId, cards) {
    const container = document.getElementById(containerId);
    container.innerHTML = cards.map(c => {
        const red = c.suit === '♥' || c.suit === '♦';
        return `<div class="playing-card${red ? ' red' : ''}"><span>${rankStr(c.rank)}</span><span>${c.suit}</span></div>`;
    }).join('');
}

function openPokerGame() {
    if (!currentProfile) return;
    document.getElementById('gameTitle').textContent = `🃏 ${currentProfile.name}さんと勝負！`;
    document.getElementById('gameDealing').style.display = 'block';
    document.getElementById('gameContent').style.display = 'none';
    document.getElementById('gameResultText').textContent = '';
    document.getElementById('gameActionBtns').style.display = 'none';
    document.getElementById('pokerGameModal').classList.add('active');

    const deck = shuffleDeck(createDeck());
    const playerHand = deck.slice(0, 5);
    const opponentHand = deck.slice(5, 10);

    setTimeout(() => {
        document.getElementById('gameDealing').style.display = 'none';
        document.getElementById('gameContent').style.display = 'block';
        renderCards('playerCards', playerHand);
        const playerResult = evaluateHand(playerHand);
        document.getElementById('playerHandName').textContent = playerResult.name;
        renderCards('opponentCards', opponentHand);
        const opponentResult = evaluateHand(opponentHand);
        document.getElementById('opponentHandName').textContent = opponentResult.name;
        setTimeout(() => {
            const resultEl = document.getElementById('gameResultText');
            if (playerResult.score > opponentResult.score) resultEl.textContent = '🎉 あなたの勝ち！';
            else if (playerResult.score < opponentResult.score) resultEl.textContent = '😢 負けちゃった...';
            else resultEl.textContent = '🤝 引き分け！';
            document.getElementById('gameActionBtns').style.display = 'flex';
        }, 600);
    }, 1200);
}

function closePokerGame() {
    document.getElementById('pokerGameModal').classList.remove('active');
}

function likeFromGame() { closePokerGame(); likeProfile(); }
function nopeFromGame() { closePokerGame(); noProfile(); }

// ── ④ 会話のお題 ─────────────────────────────────────────
const conversationTopics = [
    '💬 今日のお題：あなたの最高のブラフエピソードを教えて！🎭',
    '💬 今日のお題：ポーカーで一番印象に残った勝負は？♠️',
    '💬 今日のお題：あなたのラッキーカードは何？🃏',
    '💬 今日のお題：ポーカーを始めたきっかけは？✨',
    '💬 今日のお題：オールインした経験はある？💰',
    '💬 今日のお題：リアルとオンライン、どっちが好き？🌐',
    '💬 今日のお題：ポーカーで学んだことを人生に活かしてる？🎯',
    '💬 今日のお題：一番好きなハンドは？👑',
];

function getPokerReply(text) {
    const lowerText = text.toLowerCase();
    for (const entry of pokerKnowledge) {
        if (entry.keywords.some(kw => lowerText.includes(kw.toLowerCase()))) {
            return entry.reply;
        }
    }
    return 'ポーカーについて何でも聞いてください！\n例：「役の強さは？」「ブラフのコツは？」「初心者向けのアドバイスが欲しい」など♠️🃏';
}

function loadCard() {
    const profile = realProfiles.length > 0
        ? userToProfile(realProfiles.shift())
        : generateRandomProfile();
    currentProfile = profile;

    const cardStack = document.getElementById('cardStack');
    cardStack.querySelectorAll('.card').forEach(card => card.remove());

    const card = document.createElement('div');
    card.className = 'card active';
    const introHTML = profile.introduction.map(line => `<p>${line}</p>`).join('');
    const dotsHTML = profile.images.map((_, i) =>
        `<span class="dot${i === 0 ? ' active' : ''}"></span>`
    ).join('');
    const badges = [
        profile.pokerHistory ? `🃏 ${profile.pokerHistory}` : '',
        profile.pokerGame ? `♠️ ${profile.pokerGame}` : '',
        profile.pokerStyle ? `🎯 ${profile.pokerStyle}` : ''
    ].filter(Boolean);
    const badgesHTML = badges.length
        ? `<div class="poker-badges">${badges.map(b => `<span class="poker-badge">${b}</span>`).join('')}</div>`
        : '';

    const fallback = `https://i.pravatar.cc/400?img=${Math.floor(Math.random() * 70)}`;
    card.innerHTML = `
        <div class="card-image-wrapper">
            <img src="${profile.images[0]}" class="card-main-image" alt="${profile.name}"
                 onerror="this.src='${fallback}'">
            <button class="img-nav img-nav-prev" style="display:none">&#8249;</button>
            <button class="img-nav img-nav-next">&#8250;</button>
            <div class="img-dots">${dotsHTML}</div>
        </div>
        <div class="card-info">
            <div class="card-name">${profile.name}<span style="font-size: 18px; color: #999;">  ${profile.age}</span></div>
            <div class="card-bio">${profile.bio}</div>
            ${badgesHTML}
            <div class="card-tap-hint">👆 タップして自己紹介を見る</div>
        </div>
        <div class="card-intro-overlay">
            <div class="intro-close">✕</div>
            <div class="intro-name">${profile.name} (${profile.age}歳)</div>
            <div class="intro-text">${introHTML}</div>
        </div>
    `;

    cardStack.appendChild(card);
    setupImageNav(card, profile.images);
    makeCardDraggable(card);
}

function setupImageNav(card, images) {
    let index = 0;
    const img = card.querySelector('.card-main-image');
    const dots = card.querySelectorAll('.dot');
    const prevBtn = card.querySelector('.img-nav-prev');
    const nextBtn = card.querySelector('.img-nav-next');

    [prevBtn, nextBtn].forEach(btn => {
        btn.addEventListener('mousedown', e => e.stopPropagation());
        btn.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
    });

    function showImage(i) {
        index = i;
        img.style.opacity = '0.6';
        img.src = images[index];
        img.onload = () => { img.style.opacity = '1'; };
        img.onerror = () => { img.style.opacity = '1'; };
        dots.forEach((d, di) => d.classList.toggle('active', di === index));
        prevBtn.style.display = index === 0 ? 'none' : 'flex';
        nextBtn.style.display = index === images.length - 1 ? 'none' : 'flex';
    }

    prevBtn.addEventListener('click', e => { e.stopPropagation(); showImage(index - 1); });
    nextBtn.addEventListener('click', e => { e.stopPropagation(); showImage(index + 1); });
}

function makeCardDraggable(card) {
    let startX = 0, startY = 0, currentX = 0;
    let isDragging = false, hasMoved = false;

    const overlay = card.querySelector('.card-intro-overlay');
    const closeBtn = card.querySelector('.intro-close');

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        overlay.classList.remove('active');
    });

    card.addEventListener('mousedown', startDrag);
    card.addEventListener('touchstart', startDrag, { passive: true });

    function startDrag(e) {
        if (overlay.classList.contains('active')) return;
        isDragging = true;
        hasMoved = false;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        card.style.cursor = 'grabbing';
    }

    document.addEventListener('mousemove', moveDrag);
    document.addEventListener('touchmove', moveDrag, { passive: true });

    function moveDrag(e) {
        if (!isDragging) return;
        currentX = (e.type.includes('mouse') ? e.clientX : e.touches[0].clientX) - startX;
        const currentY = (e.type.includes('mouse') ? e.clientY : e.touches[0].clientY) - startY;
        if (Math.abs(currentX) > 8 || Math.abs(currentY) > 8) hasMoved = true;
        if (!hasMoved) return;
        const rotate = (currentX / window.innerWidth) * 20;
        card.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;
        card.style.opacity = 1 - Math.abs(currentX) / window.innerWidth;
    }

    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        card.style.cursor = 'grab';
        if (!hasMoved) {
            overlay.classList.add('active');
            return;
        }
        const threshold = window.innerWidth * 0.25;
        if (currentX > threshold) likeProfile();
        else if (currentX < -threshold) noProfile();
        else {
            card.style.transform = 'translateX(0) rotate(0deg)';
            card.style.opacity = 1;
        }
    }
}

function swipeRight() { likeProfile(); }

async function likeProfile() {
    const name = currentProfile ? currentProfile.name : '?';

    const card = document.querySelector('.card.active');
    if (card) {
        card.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
        card.style.transform = 'translateX(120%) rotate(20deg)';
        card.style.opacity = '0';
    }

    if (!currentProfile.isReal) {
        // ランダムプロフィールは相互いいね判定なし・60%でマッチ
        if (Math.random() < 0.6) {
            showMatch({
                id: Date.now(),
                uid: null,
                role: currentProfile.role || null,
                name: currentProfile.name,
                age: currentProfile.age,
                bio: currentProfile.bio,
                image: currentProfile.images[0],
                messages: []
            });
        } else {
            showToast(`${name}さんには興味を持たれませんでした...`);
            setTimeout(() => loadCard(), 400);
        }
        return;
    }

    swipedUsers.push(currentProfile.uid);
    await db.collection('likes').doc(`${currentUid}_${currentProfile.uid}`).set({
        senderUid: currentUid,
        receiverUid: currentProfile.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // 相手もいいねしていればマッチ成立
    const theirLike = await db.collection('likes').doc(`${currentProfile.uid}_${currentUid}`).get();
    if (theirLike.exists) {
        showMatch({
            id: Date.now(),
            uid: currentProfile.uid,
            role: currentProfile.role || null,
            name: currentProfile.name,
            age: currentProfile.age,
            bio: currentProfile.bio,
            image: currentProfile.images[0],
            messages: []
        });
    } else {
        showToast(`${name}さんにいいね！しました❤️`);
        setTimeout(() => loadCard(), 400);
    }
}

function showMatch(partner) {
    if (matches.find(m => m.uid && m.uid === partner.uid)) {
        setTimeout(() => loadCard(), 400);
        return;
    }
    matchCount++;
    document.getElementById('matchCount').textContent = `マッチ: ${matchCount}件`;
    matches.push(partner);
    saveState();

    const badge = document.getElementById('historyBadge');
    badge.textContent = matches.length;
    badge.style.display = 'inline-flex';

    document.getElementById('matchedPersonImg').src = partner.image;
    document.getElementById('matchMessage').textContent = `${partner.name}さんとマッチしました！`;

    setTimeout(() => {
        showScreen('matchScreen');
        createConfetti();
    }, 350);
}

function swipeLeft() { noProfile(); }

function noProfile() {
    if (currentProfile && currentProfile.isReal) {
        swipedUsers.push(currentProfile.uid);
        saveState();
    }
    const card = document.querySelector('.card.active');
    if (card) {
        card.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
        card.style.transform = 'translateX(-120%) rotate(-20deg)';
        card.style.opacity = '0';
    }
    setTimeout(() => loadCard(), 350);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function goToMessaging() {
    const partner = matches[matches.length - 1];
    if (partner) openChat(partner);
}

function backToSwipe() {
    showScreen('swipeScreen');
    loadCard();
}

function backToMatches() {
    renderMatchesList();
    showScreen('messagingScreen');
}

function backToMatch() {
    showScreen('swipeScreen');
}

async function openLikesScreen() {
    showScreen('likesScreen');
    const list = document.getElementById('likesList');
    list.innerHTML = '<div class="matches-empty"><p>読み込み中...</p></div>';
    likedUsers = {};

    const snapshot = await db.collection('likes')
        .where('receiverUid', '==', currentUid)
        .get();

    if (snapshot.empty) {
        list.innerHTML = `
            <div class="matches-empty">
                <div class="matches-empty-icon">❤️</div>
                <p>まだいいね！されていません</p>
                <p>もっとスワイプしてみよう！</p>
            </div>`;
        return;
    }

    const senderUids = snapshot.docs.map(d => d.data().senderUid);
    const profilePromises = senderUids.map(uid => db.collection('users').doc(uid).get());
    const profileDocs = await Promise.all(profilePromises);

    profileDocs.forEach(doc => {
        if (doc.exists) likedUsers[doc.id] = doc.data();
    });

    list.innerHTML = profileDocs.map(doc => {
        if (!doc.exists) return '';
        const u = doc.data();
        const photo = u.photos && u.photos[0] ? u.photos[0] : `https://i.pravatar.cc/80?u=${doc.id}`;
        return `
            <div class="match-item" onclick="openLikerProfile('${doc.id}')">
                <img src="${photo}" class="match-item-avatar" onerror="this.src='https://i.pravatar.cc/80?img=1'">
                <div class="match-item-info">
                    <div class="match-item-header">
                        <span class="match-item-name">${u.name || '名無し'}（${u.age || '?'}歳）</span>
                    </div>
                    <p class="match-item-preview">${u.bio || 'よろしくお願いします！'}</p>
                </div>
            </div>`;
    }).join('');

    document.getElementById('likesBadge').style.display = 'none';
}

function openLikerProfile(uid) {
    const u = likedUsers[uid];
    if (!u) return;
    currentViewedUser = { uid, ...u };
    profileViewImages = u.photos && u.photos.length > 0
        ? u.photos
        : [`https://i.pravatar.cc/400?u=${uid}`];
    profileViewImageIndex = 0;

    document.getElementById('profileViewName').textContent = u.name || '名無し';
    document.getElementById('profileViewAge').textContent = `${u.age || '?'}歳`;
    document.getElementById('profileViewBio').textContent = u.bio || '';

    setupProfileViewImages();
    showScreen('userProfileScreen');
}

function setupProfileViewImages() {
    const img = document.getElementById('profileViewImage');
    const prevBtn = document.getElementById('profileViewPrev');
    const nextBtn = document.getElementById('profileViewNext');
    const dotsEl = document.getElementById('profileViewDots');

    dotsEl.innerHTML = profileViewImages.map((_, i) =>
        `<span class="dot${i === 0 ? ' active' : ''}"></span>`
    ).join('');

    function showImage(i) {
        profileViewImageIndex = i;
        img.style.opacity = '0.6';
        img.src = profileViewImages[i];
        img.onload = () => { img.style.opacity = '1'; };
        img.onerror = () => { img.style.opacity = '1'; };
        dotsEl.querySelectorAll('.dot').forEach((d, di) => d.classList.toggle('active', di === i));
        prevBtn.style.display = i === 0 ? 'none' : 'flex';
        nextBtn.style.display = i === profileViewImages.length - 1 ? 'none' : 'flex';
    }

    prevBtn.onclick = () => showImage(profileViewImageIndex - 1);
    nextBtn.onclick = () => showImage(profileViewImageIndex + 1);
    showImage(0);
}

function backToLikes() {
    showScreen('likesScreen');
}

function likeFromProfile() {
    if (!currentViewedUser) return;

    db.collection('likes').doc(`${currentUid}_${currentViewedUser.uid}`).set({
        senderUid: currentUid,
        receiverUid: currentViewedUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // いいね！一覧から開いているので相手はすでにいいね済み → 常にマッチ成立
    let partner = matches.find(m => m.uid === currentViewedUser.uid);
    if (!partner) {
        partner = {
            id: Date.now(),
            uid: currentViewedUser.uid,
            role: getBotRole(currentViewedUser.name),
            name: currentViewedUser.name || '名無し',
            age: currentViewedUser.age || '?',
            bio: currentViewedUser.bio || '',
            image: profileViewImages[0],
            messages: []
        };
        matchCount++;
        document.getElementById('matchCount').textContent = `マッチ: ${matchCount}件`;
        matches.push(partner);
        saveState();
        const badge = document.getElementById('historyBadge');
        badge.textContent = matches.length;
        badge.style.display = 'inline-flex';
    }

    document.getElementById('matchedPersonImg').src = partner.image;
    document.getElementById('matchMessage').textContent = `${partner.name}さんとマッチしました！`;
    showScreen('matchScreen');
    createConfetti();
}

function messageFromProfile() {
    if (!currentViewedUser) return;

    db.collection('likes').doc(`${currentUid}_${currentViewedUser.uid}`).set({
        senderUid: currentUid,
        receiverUid: currentViewedUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // 相手はすでにいいね済み → マッチ成立してそのままチャットへ
    let partner = matches.find(m => m.uid === currentViewedUser.uid);
    if (!partner) {
        partner = {
            id: Date.now(),
            uid: currentViewedUser.uid,
            role: getBotRole(currentViewedUser.name),
            name: currentViewedUser.name || '名無し',
            age: currentViewedUser.age || '?',
            bio: currentViewedUser.bio || '',
            image: profileViewImages[0],
            messages: []
        };
        matches.push(partner);
        matchCount++;
        document.getElementById('matchCount').textContent = `マッチ: ${matchCount}件`;
        const badge = document.getElementById('historyBadge');
        badge.textContent = matches.length;
        badge.style.display = 'inline-flex';
        saveState();
    }
    openChat(partner);
}

function backToSwipeFromLikes() {
    showScreen('swipeScreen');
}

async function updateLikesBadge() {
    const snapshot = await db.collection('likes')
        .where('receiverUid', '==', currentUid)
        .get();
    const count = snapshot.size;
    const badge = document.getElementById('likesBadge');
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-flex';
    }
}

function openMatchesScreen() {
    renderMatchesList();
    showScreen('messagingScreen');
}

function renderMatchesList() {
    const list = document.getElementById('matchesList');
    if (matches.length === 0) {
        list.innerHTML = `
            <div class="matches-empty">
                <div class="matches-empty-icon">💕</div>
                <p>まだマッチしていません</p>
                <p>スワイプしてLikeしてみよう！</p>
            </div>
        `;
        return;
    }
    const reversed = [...matches].reverse();
    list.innerHTML = reversed.map(partner => {
        const last = partner.messages[partner.messages.length - 1];
        const preview = last ? escapeHtml(last.text) : 'まだメッセージはありません';
        const previewClass = last ? '' : 'no-msg';
        const time = last ? last.time : '';
        const senderPrefix = last && last.type === 'user' ? 'あなた: ' : '';
        return `
            <div class="match-item" onclick="openChatFromList(${partner.id})">
                <img src="${partner.image}" class="match-item-avatar"
                     onerror="this.src='https://i.pravatar.cc/80?img=1'">
                <div class="match-item-info">
                    <div class="match-item-header">
                        <span class="match-item-name">${partner.name}（${partner.age}歳）</span>
                        <span class="match-item-time">${time}</span>
                    </div>
                    <p class="match-item-preview ${previewClass}">${senderPrefix}${preview}</p>
                </div>
            </div>
        `;
    }).join('');
}

function openChatFromList(partnerId) {
    const partner = matches.find(m => m.id === partnerId);
    if (partner) openChat(partner);
}

function openChat(partner) {
    currentChatPartner = partner;
    document.getElementById('chatProfileImage').src = partner.image;
    document.getElementById('chatPartnerName').textContent = partner.name;
    document.getElementById('chatPartnerAge').textContent = `${partner.age}歳`;

    renderMessages();
    showScreen('chatScreen');

    const input = document.getElementById('messageInput');
    input.value = '';
    input.onkeypress = e => { if (e.key === 'Enter') sendMessage(); };

    if (partner.messages.length === 0) {
        const greeting = partner.role === 'bot1'
            ? 'こんにちは！私はポーカー情報ボットです🃏 ポーカーについて何でも聞いてください！メッセージを送るとポーカーのヒントをお伝えします♠️'
            : 'はじめまして！マッチしてくれてありがとう😊';
        setTimeout(() => {
            addPartnerMessage(partner, greeting);
            if (partner.role !== 'bot1') {
                setTimeout(() => {
                    const topic = conversationTopics[Math.floor(Math.random() * conversationTopics.length)];
                    addPartnerMessage(partner, topic);
                }, 1800);
            }
        }, 800);
    }
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text || !currentChatPartner) return;

    const time = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    currentChatPartner.messages.push({ type: 'user', text, time });
    saveState();
    input.value = '';
    renderMessages();

    setTimeout(() => {
        const reply = currentChatPartner.role === 'bot1'
            ? getPokerReply(text)
            : autoReplies[Math.floor(Math.random() * autoReplies.length)];
        addPartnerMessage(currentChatPartner, reply);
    }, 900 + Math.random() * 1200);
}

function addPartnerMessage(partner, text) {
    const time = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    partner.messages.push({ type: 'partner', text, time });
    saveState();
    if (currentChatPartner && currentChatPartner.id === partner.id) {
        renderMessages();
    }
}

function renderMessages() {
    const area = document.getElementById('messagesArea');
    area.innerHTML = currentChatPartner.messages.map(msg => `
        <div class="message ${msg.type === 'user' ? 'message-user' : 'message-partner'}">
            <div class="message-bubble">${escapeHtml(msg.text)}</div>
            <div class="message-time">${msg.time}</div>
        </div>
    `).join('');
    area.scrollTop = area.scrollHeight;
}

function escapeHtml(t) {
    return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function createConfetti() {
    const container = document.querySelector('.confetti');
    container.innerHTML = '';
    for (let i = 0; i < 30; i++) {
        const el = document.createElement('div');
        el.style.cssText = `
            position:absolute; border-radius:50%; pointer-events:none;
            width:${Math.random()*10+5}px; height:${Math.random()*10+5}px;
            background:${['#ff4757','#ff6b6b','#ffa502','#ffb700'][Math.floor(Math.random()*4)]};
            left:${Math.random()*100}%; top:-10px;
            animation:fall ${2+Math.random()}s linear;
        `;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }
}

const style = document.createElement('style');
style.textContent = `@keyframes fall { to { transform: translateY(100vh) rotate(360deg); opacity: 0; } }`;
document.head.appendChild(style);
