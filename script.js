let matchCount = 0;
let currentUserName = '';
let usedProfiles = [];

// ログイン処理
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    currentUserName = document.getElementById('nameInput').value;
    const age = document.getElementById('ageInput').value;
    
    // ログイン画面を非表示
    document.getElementById('loginScreen').classList.remove('active');
    
    // スワイプ画面を表示
    document.getElementById('swipeScreen').classList.add('active');
    
    // 最初のカードを読み込み
    loadCard();
});

// カードを読み込む
function loadCard() {
    // ランダムにプロフィールを生成
    const profile = generateRandomProfile();
    
    const cardStack = document.getElementById('cardStack');
    
    // 既存のカードを削除
    const existingCards = cardStack.querySelectorAll('.card');
    existingCards.forEach(card => card.remove());
    
    // 新しいカードを作成
    const card = document.createElement('div');
    card.className = 'card active';
    card.innerHTML = `
        <img src="${profile.image}" alt="${profile.name}" onerror="this.src='https://i.pravatar.cc/400?img=${Math.floor(Math.random() * 70)}'">
        <div class="card-info">
            <div class="card-name">${profile.name}<span style="font-size: 18px; color: #999;">  ${profile.age}</span></div>
            <div class="card-bio">${profile.bio}</div>
        </div>
    `;
    
    cardStack.appendChild(card);
    makeCardDraggable(card);
}

// カードをドラッグ可能にする
function makeCardDraggable(card) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    
    card.addEventListener('mousedown', startDrag);
    card.addEventListener('touchstart', startDrag);
    
    function startDrag(e) {
        isDragging = true;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        card.style.cursor = 'grabbing';
    }
    
    document.addEventListener('mousemove', moveDrag);
    document.addEventListener('touchmove', moveDrag);
    
    function moveDrag(e) {
        if (!isDragging) return;
        
        currentX = (e.type.includes('mouse') ? e.clientX : e.touches[0].clientX) - startX;
        
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
        isDragging = false;
        card.style.cursor = 'grab';
        
        const threshold = window.innerWidth * 0.25;
        
        if (currentX > threshold) {
            // 右にスワイプ = Like
            likeProfile();
        } else if (currentX < -threshold) {
            // 左にスワイプ = No
            noProfile();
        } else {
            // スワイプ不足 = 元に戻す
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
    // ランダムにマッチ確率を判定（60%でマッチ）
    const matchChance = Math.random() < 0.6;
    
    // 現在のカードから名前を取得
    const cardName = document.querySelector('.card-name');
    const name = cardName.textContent.split(/\s+/)[0];
    
    if (matchChance) {
        // マッチした場合
        matchCount++;
        document.getElementById('matchCount').textContent = `マッチ: ${matchCount}件`;
        showToast(`${name}さんとマッチしました！ 💕`);
        
        // 次のカードを読み込む
        setTimeout(() => {
            loadCard();
        }, 400);
    } else {
        // マッチしなかった場合
        showToast(`${name}さんには興味を持たれませんでした...`);
        
        // 次のカードを読み込む
        setTimeout(() => {
            loadCard();
        }, 400);
    }
}

// Noボタン
function swipeLeft() {
    noProfile();
}

function noProfile() {
    currentProfileIndex++;
    loadCard();
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
