let matchCount = 0;
let currentUserName = '';
let currentProfile = null;
let matches = [];
let currentChatPartner = null;

const USERS_KEY = 'matchapp_users';
const SESSION_KEY = 'matchapp_session';

function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentSession() {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
}

function setCurrentSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function userDataKey(userId) {
    return `matchapp_data_${userId}`;
}

function saveState() {
    const session = getCurrentSession();
    if (!session) return;
    localStorage.setItem(userDataKey(session.id), JSON.stringify({ currentUserName, matchCount, matches }));
}

function loadState() {
    const session = getCurrentSession();
    if (!session) return false;
    const saved = localStorage.getItem(userDataKey(session.id));
    if (!saved) {
        currentUserName = session.name;
        matchCount = 0;
        matches = [];
        return true;
    }
    const data = JSON.parse(saved);
    currentUserName = data.currentUserName || session.name;
    matchCount = data.matchCount || 0;
    matches = data.matches || [];
    return true;
}

function startApp() {
    loadState();
    const session = getCurrentSession();
    document.getElementById('matchCount').textContent = `マッチ: ${matchCount}件`;
    if (matches.length > 0) {
        const badge = document.getElementById('historyBadge');
        badge.textContent = matches.length;
        badge.style.display = 'inline-flex';
    }
    const initial = currentUserName.charAt(0) || '?';
    document.getElementById('drawerName').textContent = currentUserName;
    document.getElementById('drawerAge').textContent = session ? `${session.age}歳` : '';
    document.getElementById('drawerIdentifier').textContent = maskIdentifier(session ? session.identifier : '');
    applyProfilePhoto(session ? session.photo : null, initial);

    document.getElementById('authScreen').classList.remove('active');
    document.getElementById('swipeScreen').classList.add('active');
    loadCard();
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

function triggerPhotoUpload() {
    document.getElementById('photoInput').click();
}

function handlePhotoChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const photo = e.target.result;
        const session = getCurrentSession();
        if (!session) return;
        const users = getUsers();
        const user = users.find(u => u.id === session.id);
        if (user) {
            user.photo = photo;
            saveUsers(users);
        }
        session.photo = photo;
        setCurrentSession(session);
        applyProfilePhoto(photo, currentUserName.charAt(0));
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

function maskIdentifier(id) {
    if (!id) return '';
    if (id.includes('@')) {
        const [local, domain] = id.split('@');
        return local.slice(0, 2) + '***@' + domain;
    }
    return id.slice(0, 3) + '****';
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
    localStorage.removeItem(SESSION_KEY);
    closeProfile();
    matchCount = 0;
    currentUserName = '';
    matches = [];
    currentChatPartner = null;
    document.getElementById('matchCount').textContent = 'マッチ: 0件';
    document.getElementById('historyBadge').style.display = 'none';
    document.getElementById('swipeScreen').classList.remove('active');
    document.getElementById('authScreen').classList.add('active');
    showAuthTab('register');
}

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
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const identifier = document.getElementById('regIdentifier').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const name = document.getElementById('regName').value.trim();
    const age = document.getElementById('regAge').value;
    const errorEl = document.getElementById('registerError');

    if (password !== passwordConfirm) {
        errorEl.textContent = 'パスワードが一致しません';
        return;
    }

    const users = getUsers();
    if (users.find(u => u.identifier === identifier)) {
        errorEl.textContent = 'このアドレス/電話番号はすでに登録されています';
        return;
    }

    const user = { id: Date.now(), identifier, password, name, age };
    users.push(user);
    saveUsers(users);
    setCurrentSession(user);
    startApp();
});

// ログイン処理
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    const users = getUsers();
    const user = users.find(u => u.identifier === identifier && u.password === password);

    if (!user) {
        errorEl.textContent = 'メールアドレス/電話番号またはパスワードが違います';
        return;
    }

    setCurrentSession(user);
    startApp();
});

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

// カードを読み込む
function loadCard() {
    const profile = generateRandomProfile();
    currentProfile = profile;

    const cardStack = document.getElementById('cardStack');
    const existingCards = cardStack.querySelectorAll('.card');
    existingCards.forEach(card => card.remove());

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

        const rotate = (currentX / window.innerWidth) * 20;
        card.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;

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
        setTimeout(() => {
            addPartnerMessage(partner, `はじめまして！マッチしてくれてありがとう😊`);
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
        const reply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
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

// 起動時の自動ログイン
if (getCurrentSession()) {
    startApp();
}
