// ランダムプロフィール生成用の日本人女性の名前リスト
const japaneseNames = [
    { first: "美咲", age: 24 },
    { first: "真衣", age: 22 },
    { first: "ひかり", age: 25 },
    { first: "さくら", age: 23 },
    { first: "由紀", age: 26 },
    { first: "陽菜", age: 21 },
    { first: "結衣", age: 27 },
    { first: "夏美", age: 24 },
    { first: "優子", age: 25 },
    { first: "彩子", age: 22 },
    { first: "麗奈", age: 26 },
    { first: "咲良", age: 23 },
    { first: "葵", age: 24 },
    { first: "舞", age: 25 },
    { first: "美優", age: 22 },
    { first: "日菜", age: 27 },
    { first: "梨央", age: 24 },
    { first: "美紗", age: 23 },
    { first: "菜々美", age: 25 },
    { first: "麻衣", age: 22 },
    { first: "未来", age: 26 },
    { first: "そら", age: 24 },
    { first: "由美", age: 25 },
    { first: "彩華", age: 23 },
    { first: "春菜", age: 26 },
    { first: "優美", age: 24 },
    { first: "瑠璃", age: 25 },
    { first: "由貴", age: 22 },
    { first: "緋紗子", age: 27 },
    { first: "美優", age: 24 }
];

const hobbies = [
    "カフェ巡りが趣味",
    "映画が好きです",
    "旅行好きです",
    "ヨガをしています",
    "アートが好き",
    "新しい友達作りたい",
    "仕事も趣味も両立",
    "景色が好き",
    "料理が得意です",
    "音楽とリズム大好き",
    "おしゃれ好き",
    "人の話を聞くのが好き",
    "テック好き",
    "優雅さが大事",
    "就活中です",
    "夜勤多いです",
    "デザイン好き",
    "健康重視",
    "映画マニア",
    "お菓子が好き",
    "漫画好き",
    "ゲーム開発中",
    "丁寧さが大事",
    "素敵な式を企画",
    "健康サポート",
    "喋るのが得意",
    "歴史が好き",
    "雑誌に掲載",
    "料理が人生"
];

const emojis = ["💕", "🎨", "🎬", "✈️", "🧘", "🎵", "📚", "⚽", "🍕", "🌸", "💼", "🎸", "🌍", "🍰", "📸"];

// 女性限定の画像URL配列（Unsplash API で厳選）
const femaleProfileImages = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1517841905240-472988babdf0?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1516912481808-846ec9ded34e?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1513631537-e7e4e28bb881?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1535746557778-26be8d6ec0cc?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1531287112200-be8279dc85f9?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1537639626411-91b2fef5c628?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1488426749025-52ac7b3d1d1a?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1524638431406-8bf4666d0646?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1529157191745-a64ee322c4b2?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1507529541307-9609aeb12d6d?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1514568400929-f4a346bd10ea?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1506307773633-336efa751b5f?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1515077678510-ce3bdf266007?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1508003516284-48f0ea180b11?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1516534775068-bb64ad47b042?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1522071820081-940282645e1e?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1539571696357-5a69c006ae84?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1529395854325-c73764d92e57?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1518235506717-e1ed3306a326?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1534308983496-4d93c60b9d7d?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1516214104703-3e161c9c1fe7?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1537693649245-ea2149f8f5d2?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop"
];

// リアルな女性顔画像（AI生成、実在しない人物）
const femaleAvatars = [
    "https://api.generated.photos/api/v1/photos?order_by=random&limit=1&person=woman",
    // フォールバック：手動セレクトした確実な女性写真URL
    "https://images.pexels.com/photos/3844645/pexels-photo-3844645.jpeg?w=400&h=500&fit=crop",
    "https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?w=400&h=500&fit=crop",
    "https://images.pexels.com/photos/3718292/pexels-photo-3718292.jpeg?w=400&h=500&fit=crop",
    "https://images.pexels.com/photos/3807412/pexels-photo-3807412.jpeg?w=400&h=500&fit=crop",
    "https://images.pexels.com/photos/3806258/pexels-photo-3806258.jpeg?w=400&h=500&fit=crop",
    "https://images.pexels.com/photos/3772510/pexels-photo-3772510.jpeg?w=400&h=500&fit=crop",
    "https://images.pexels.com/photos/3751632/pexels-photo-3751632.jpeg?w=400&h=500&fit=crop",
    "https://images.pexels.com/photos/3490184/pexels-photo-3490184.jpeg?w=400&h=500&fit=crop",
    "https://images.pexels.com/photos/3771113/pexels-photo-3771113.jpeg?w=400&h=500&fit=crop",
    "https://images.pexels.com/photos/3775576/pexels-photo-3775576.jpeg?w=400&h=500&fit=crop"
];

// ランダムプロフィールを生成
function generateRandomProfile() {
    const nameObj = japaneseNames[Math.floor(Math.random() * japaneseNames.length)];
    const hobby = hobbies[Math.floor(Math.random() * hobbies.length)];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    // リアルな女性写真をランダムに選択
    const randomImage = femaleAvatars[Math.floor(Math.random() * femaleAvatars.length)];
    
    return {
        name: nameObj.first,
        age: nameObj.age,
        bio: `${hobby} ${emoji}`,
        image: randomImage
    };
}
