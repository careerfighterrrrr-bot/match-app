let matchCount = 0;
let currentUserName = '';
let currentProfile = null;
let matches = [];
let currentChatPartner = null;

const STORAGE_KEY = 'matchapp_data';

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentUserName, matchCount, matches }));
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    const data = JSON.parse(saved);
    currentUserName = data.currentUserName || '';
    matchCount = data.matchCount || 0;
    matches = data.matches || [];
    return true;
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

// ログイン処理
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    currentUserName = document.getElementById('nameInput').value;
    const age = document.getElementById('ageInput').value;
    saveState();

    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('swipeScreen').classList.add('active');
    loadCard();
});

// カードを読み込む
function loadCard() {
    const profile = generateRandomProfile();
    currentProfile = profile;
    
    const cardStack = document.getElementById('cardStack');
    
    // 既存のカードを削除
    const existingCards = cardStack.querySelectorAll('.card');
    existingCards.forEach(card => card.remove());
    
    // 新しいカードを作成
    const card = document.createElement('div');
    card.className = 'card active';
    const introHTML = profile.introduction.map(line => `<p>${line}</p>`).join('');
    const dotsHTML = profile.images.map((_, i) =>
        `<span class="dot${i === 0 ? ' active' : ''}"></span>`
    ).join('');
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

// 画像ナビゲーションのセットアップ
function setupImageNav(card, images) {
    let index = 0;
    const img = card.querySelector('.card-main-image');
    const dots = card.querySelectorAll('.dot');
    const prevBtn = card.querySelector('.img-nav-prev');
    const nextBtn = card.querySelector('.img-nav-next');

    // ドラッグ開始がナビボタンから発火しないよう伝播を止める
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

// カードをドラッグ可能にする
function makeCardDraggable(card) {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let isDragging = false;
    let hasMoved = false;

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

        if (Math.abs(currentX) > 8 || Math.abs(currentY) > 8) {
            hasMoved = true;
        }

        if (!hasMoved) return;

        // カードを回転させながら移動
        const rotate = (currentX / window.innerWidth) * 20;
        card.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;

        // 透明度を変更
        const opacity = 1 - Math.abs(currentX) / window.innerWidth;
        card.style.opacity = opacity;
    }

    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        card.style.cursor = 'grab';

        if (!hasMoved) {
            // タップ（ドラッグなし）→ 自己紹介オーバーレイを表示
            overlay.classList.add('active');
            return;
        }

        const threshold = window.innerWidth * 0.25;

        if (currentX > threshold) {
            likeProfile();
        } else if (currentX < -threshold) {
            noProfile();
        } else {
            card.style.transform = 'translateX(0) rotate(0deg)';
            card.style.opacity = 1;
        }
    }
}

// Likeボタン
function swipeRight() {
    likeProfile();
}

function likeProfile() {
    const matchChance = Math.random() < 0.6;
    const name = currentProfile ? currentProfile.name : '?';

    const card = document.querySelector('.card.active');
    if (card) {
        card.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
        card.style.transform = 'translateX(120%) rotate(20deg)';
        card.style.opacity = '0';
    }

    if (matchChance) {
        matchCount++;
        document.getElementById('matchCount').textContent = `マッチ: ${matchCount}件`;

        const partner = {
            id: Date.now(),
            name: currentProfile.name,
            age: currentProfile.age,
            bio: currentProfile.bio,
            image: currentProfile.images[0],
            messages: []
        };
        matches.push(partner);
        saveState();

        const badge = document.getElementById('historyBadge');
        badge.textContent = matches.length;
        badge.style.display = 'inline-flex';

        document.getElementById('matchedPersonImg').src = partner.image;
        document.getElementById('matchMessage').textContent = `${partner.name}さんがあなたにLikeしました！`;

        setTimeout(() => {
            showScreen('matchScreen');
            createConfetti();
        }, 350);
    } else {
        showToast(`${name}さんには興味を持たれませんでした...`);
        setTimeout(() => loadCard(), 400);
    }
}

// Noボタン
function swipeLeft() {
    noProfile();
}

function noProfile() {
    const card = document.querySelector('.card.active');
    if (card) {
        card.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
        card.style.transform = 'translateX(-120%) rotate(-20deg)';
        card.style.opacity = '0';
    }
    setTimeout(() => loadCard(), 350);
}

// トースト通知を表示
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 3秒後に削除
    setTimeout(() => {
        toast.remove();
    }, 3000);
}



// 画面切り替え
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// マッチ画面 → チャット画面へ
function goToMessaging() {
    const partner = matches[matches.length - 1];
    if (partner) openChat(partner);
}

// マッチ画面 or チャット画面 → スワイプ画面へ戻る
function backToSwipe() {
    showScreen('swipeScreen');
    loadCard();
}

// チャット画面 → マッチ一覧へ戻る
function backToMatches() {
    renderMatchesList();
    showScreen('messagingScreen');
}

// マッチ一覧 → スワイプ画面へ戻る
function backToMatch() {
    showScreen('swipeScreen');
}

// スワイプ画面 → マッチ一覧を開く
function openMatchesScreen() {
    renderMatchesList();
    showScreen('messagingScreen');
}

// マッチ一覧を描画
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

// チャット画面を開く
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
        setTimeout(() => {
            addPartnerMessage(partner, `はじめまして！マッチしてくれてありがとう😊`);
        }, 800);
    }
}

// メッセージ送信
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
        const reply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
        addPartnerMessage(currentChatPartner, reply);
    }, 900 + Math.random() * 1200);
}

// 相手のメッセージを追加
function addPartnerMessage(partner, text) {
    const time = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    partner.messages.push({ type: 'partner', text, time });
    saveState();
    if (currentChatPartner && currentChatPartner.id === partner.id) {
        renderMessages();
    }
}

// メッセージ一覧を描画
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

// コンフェッティ効果
function createConfetti() {
    const confettiContainer = document.querySelector('.confetti');
    confettiContainer.innerHTML = '';
    
    for (let i = 0; i < 30; i++) {
        const confetto = document.createElement('div');
        confetto.style.position = 'absolute';
        confetto.style.width = Math.random() * 10 + 5 + 'px';
        confetto.style.height = confetto.style.width;
        confetto.style.background = ['#ff4757', '#ff6b6b', '#ffa502', '#ffb700'][Math.floor(Math.random() * 4)];
        confetto.style.left = Math.random() * 100 + '%';
        confetto.style.top = '-10px';
        confetto.style.borderRadius = '50%';
        confetto.style.animation = `fall ${2 + Math.random() * 1}s linear`;
        confetto.style.pointerEvents = 'none';
        
        document.body.appendChild(confetto);
        
        setTimeout(() => confetto.remove(), 3000);
    }
}

// 起動時にデータを復元
if (loadState()) {
    document.getElementById('matchCount').textContent = `マッチ: ${matchCount}件`;
    if (matches.length > 0) {
        const badge = document.getElementById('historyBadge');
        badge.textContent = matches.length;
        badge.style.display = 'inline-flex';
    }
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('swipeScreen').classList.add('active');
    loadCard();
}

// フォールアニメーション
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
