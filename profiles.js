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

const introductions = [
    ["はじめまして！週末はよくカフェ巡りをしています☕", "おいしいスイーツを見つけるのが何より幸せ🍰", "映画も大好きで、特にロマンス系が好きです🎬", "一緒においしいものを食べながら話せる人を探しています", "気軽にメッセージしてくれると嬉しいです💕"],
    ["こんにちは！音楽と旅行が大好きです✈️", "新しい場所に行くたびにわくわくします🌍", "カラオケも得意なので一緒に行きたいです🎤", "趣味の話をいっぱいできる人がいいな〜", "まずは気軽にお話しましょう😊"],
    ["はじめまして〜！ヨガ歴３年です🧘", "最近はアウトドアにもはまっています🏕️", "自然の中で深呼吸するのが最高のリフレッシュ", "料理も好きで、休日はよく手料理します🍳", "一緒に素敵な時間を過ごせる方を探しています"],
    ["こんにちは！デザインの仕事をしています🎨", "おしゃれなカフェや雑貨屋さんめぐりが趣味", "アート展に行くのが週末の楽しみです🖼️", "感性が合う人と話すのが好きです", "まずは友達として仲良くなれたら嬉しいです✨"],
    ["はじめまして！読書と映画が好きです📚", "特にミステリー小説にはまっています🔍", "おすすめの本や映画があったら教えてください！", "静かな場所でゆっくり話すのが好きなタイプです", "一緒に文化的な時間を楽しめたらいいな🌸"],
    ["こんにちは！スポーツ観戦が好きです⚽", "体を動かすことも好きでジムに通っています💪", "アクティブに過ごしたい休日が理想です🏃", "笑顔が絶えない関係が好きです😄", "気軽に話しかけてくれる方歓迎です！"],
    ["はじめまして！お菓子作りが趣味です🍪", "手作りのケーキでよく友達を喜ばせています🎂", "料理全般好きなので一緒に作れたら楽しそう", "甘いもの好きな人と話が合いそうです🍰", "穏やかに過ごせる出会いを求めています💖"],
    ["こんにちは！音楽フェスが大好きです🎵", "特にジャズとポップスが好みです🎷", "ライブに一緒に行ける人を探しています！", "音楽の話なら何時間でもできます😆", "同じ趣味の人と仲良くなりたいです🎶"],
    ["はじめまして！旅行が生きがいです✈️", "国内外問わずいろんなところに行っています", "旅先での出会いや食べ物が大好き🍜", "一緒に旅行の計画を立てたいです🗺️", "フットワーク軽い方と合うと思います😊"],
    ["こんにちは！写真撮影が趣味です📸", "特に風景と街のスナップ写真が好きです🌆", "カメラ片手に散歩するのが休日の定番", "一緒に写真スポットを巡りたいな✨", "感性が豊かな人と仲良くなりたいです🌸"]
];

const emojis = ["💕", "🎨", "🎬", "✈️", "🧘", "🎵", "📚", "⚽", "🍕", "🌸", "💼", "🎸", "🌍", "🍰", "📸"];

// インフルエンサー風プロフィールセット（ポートレート＋ライフスタイル4枚）
const profileSets = [
    {
        portrait: "https://images.unsplash.com/photo-1524638431406-8bf4666d0646?w=400&h=500&fit=crop&crop=faces",
        lifestyle: [
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=500&fit=crop"
        ]
    },
    {
        portrait: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop&crop=faces",
        lifestyle: [
            "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1490750967868-88df5691cc95?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1503791257219-6ac5bff9ef29?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=500&fit=crop"
        ]
    },
    {
        portrait: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop&crop=faces",
        lifestyle: [
            "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=500&fit=crop"
        ]
    },
    {
        portrait: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=500&fit=crop&crop=faces",
        lifestyle: [
            "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=500&fit=crop"
        ]
    },
    {
        portrait: "https://images.unsplash.com/photo-1513631537-e7e4e28bb881?w=400&h=500&fit=crop&crop=faces",
        lifestyle: [
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1490750967868-88df5691cc95?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=500&fit=crop"
        ]
    },
    {
        portrait: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&h=500&fit=crop&crop=faces",
        lifestyle: [
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1503791257219-6ac5bff9ef29?w=400&h=500&fit=crop"
        ]
    },
    {
        portrait: "https://images.unsplash.com/photo-1535746557778-26be8d6ec0cc?w=400&h=500&fit=crop&crop=faces",
        lifestyle: [
            "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=500&fit=crop"
        ]
    },
    {
        portrait: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=faces",
        lifestyle: [
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=500&fit=crop"
        ]
    },
    {
        portrait: "https://images.unsplash.com/photo-1516912481808-846ec9ded34e?w=400&h=500&fit=crop&crop=faces",
        lifestyle: [
            "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=500&fit=crop"
        ]
    },
    {
        portrait: "https://images.unsplash.com/photo-1517841905240-472988babdf0?w=400&h=500&fit=crop&crop=faces",
        lifestyle: [
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1503791257219-6ac5bff9ef29?w=400&h=500&fit=crop",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=500&fit=crop"
        ]
    }
];

// ランダムプロフィールを生成
function generateRandomProfile() {
    const nameObj = japaneseNames[Math.floor(Math.random() * japaneseNames.length)];
    const hobby = hobbies[Math.floor(Math.random() * hobbies.length)];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const set = profileSets[Math.floor(Math.random() * profileSets.length)];
    const intro = introductions[Math.floor(Math.random() * introductions.length)];

    return {
        name: nameObj.first,
        age: nameObj.age,
        bio: `${hobby} ${emoji}`,
        images: [set.portrait, ...set.lifestyle],
        introduction: intro
    };
}
