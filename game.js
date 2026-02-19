// ============================================
// のんびりタウン - ゲームロジック
// ============================================

// 選択可能なアバター（Profile1〜40）
const avatarOptions = Array.from({length: 40}, (_, i) => `Profile/Profile${i + 1}.png`);

// ゲーム状態
const gameState = {
    player: {
        name: 'ユーザー',
        avatar: 'Profile/Profile1.png',
        avatarBgColor: '#FFB6C1',
        money: 10000,
        health: 100,
        maxHealth: 100,
        intelligence: 100,
        maxIntelligence: 100,
        weight: 55.5,
        height: 173,
        bodyFat: 17,
        gender: null, // 性別（'男' / '女' / null）
        lastMealTime: Date.now() - 10 * 60 * 60 * 1000, // 最後に食事した時刻（初期：やや空腹状態）
        job: '無職',
        jobLevel: 0,
        jobExp: 0,
        currentJobId: null, // 現在の職業ID
        workCount: 0, // 出勤回数
        lastWorkTime: null, // 最終出勤時刻
        spouse: null,
        lover: null,
        possessions: [], // 所有物（アイテム全般）
        disease: null, // 現在の病気（null = 健康）
        mealCount: 0, // 食事回数（病気判定用）
        targetJob: null, // 目標の職業ID（単一）
        // 能力値
        abilities: {
            国語: 40,
            数学: 40,
            理科: 40,
            社会: 40,
            英語: 40,
            音楽: 40,
            美術: 40,
            体力: 40,
            気力: 40,
            ルックス: 40,
            素早さ: 40,
            面白さ: 40,
            優しさ: 40,
            エロさ: 40
        }
    },
    currentLocation: null,
    day: 1,
    actionCount: 0,
    lastDiseaseCheckDate: null, // 最後に病気チェックした日付（YYYY-MM-DD）
    // 銀行預金
    savings: 0,
    // 入出金履歴（最新100件）
    bankHistory: [],
    // 掲示板データ
    boardPosts: [],
    boardNextId: 1,
    // つぶやきデータ
    tweets: [],
    tweetNextId: 1,
    lastTweetTime: null,
    lastGymTime: null,
    lastSchoolTime: null,
    likedAnswers: []
};

// 職業レベルシステム
// salaryRate: 昇給率（Lv1〜5: +3%, Lv6〜10: +5%, Lv11〜15: +8%）
const jobLevels = [
    { level: 1, expRequired: 0, salaryRate: 1.00 },
    { level: 2, expRequired: 50, salaryRate: 1.03 },
    { level: 3, expRequired: 120, salaryRate: 1.06 },
    { level: 4, expRequired: 210, salaryRate: 1.09 },
    { level: 5, expRequired: 330, salaryRate: 1.12 },
    { level: 6, expRequired: 480, salaryRate: 1.17 },
    { level: 7, expRequired: 660, salaryRate: 1.22 },
    { level: 8, expRequired: 880, salaryRate: 1.27 },
    { level: 9, expRequired: 1140, salaryRate: 1.32 },
    { level: 10, expRequired: 1450, salaryRate: 1.37 },
    { level: 11, expRequired: 1810, salaryRate: 1.45 },
    { level: 12, expRequired: 2230, salaryRate: 1.53 },
    { level: 13, expRequired: 2720, salaryRate: 1.61 },
    { level: 14, expRequired: 3290, salaryRate: 1.69 },
    { level: 15, expRequired: 3950, salaryRate: 1.80 }
];

// 病気データ（8種類）
// severity: 1=軽め, 2=中くらい, 3=重め
const diseasesData = [
    // 軽め（28,000円）
    { id: 'kaze', name: '風邪', severity: 1, cost: 28000,
      doctorMsg: 'ふむふむ。単なる風邪ですね。<br>注射を打てばすぐに治りますよ。<br>治療費に28,000円かかります。よろしいですね？' },
    { id: 'mushiba', name: '虫歯', severity: 1, cost: 28000,
      doctorMsg: 'ほう、虫歯ですか。<br>さてはあなた、食べすぎましたね？<br>治療費に28,000円かかります。よろしいですね？' },
    // 中くらい（40,000円）
    { id: 'kossetsu', name: '骨折', severity: 2, cost: 40000,
      doctorMsg: '骨折ですね。<br>専用のギプスがあればすぐに治りますよ。<br>治療費に40,000円かかります。よろしいですね？' },
    { id: 'ichouen', name: '胃腸炎', severity: 2, cost: 40000,
      doctorMsg: 'あちゃー、胃腸が荒れ放題！<br>まぁ胃腸薬を飲めば大した事ないですよ。<br>治療費に40,000円かかります。よろしいですね？' },
    { id: 'gikkurigoshi', name: 'ぎっくり腰', severity: 2, cost: 40000,
      doctorMsg: 'ぎっくり腰だなんて。<br>さてはあなた、働きすぎましたね？<br>治療費に40,000円かかります。よろしいですね？' },
    // 重め（80,000円）
    { id: 'haien', name: '肺炎', severity: 3, cost: 80000,
      doctorMsg: 'ふむ。肺炎ですね。<br>では点滴を打っておきましょう。<br>治療費に80,000円かかります。よろしいですね？<br>あ、マスクはしっかりしといてね。' },
    { id: 'kansenshou', name: '感染症', severity: 3, cost: 80000,
      doctorMsg: '感染症ですか。<br>仕方がないので抗生物質を出しておきましょう。<br>治療費に80,000円かかります。よろしいですね？' },
    { id: 'utsubyou', name: 'うつ病', severity: 3, cost: 80000,
      doctorMsg: 'ここは精神病院ではないですが…<br>この魔法のような薬を飲めばたちまち良くなるでしょう。<br>治療費に80,000円かかります。よろしいですね？' }
];

// 職業データ（50職業）
// abilities: { 国語, 数学, 理科, 社会, 英語, 音楽, 美術, 体力, 気力, ルックス, 素早さ, 面白さ, 優しさ, エロさ }
// conditions: { bmi: [最小, 最大], gender: '男'/'女'/null, height: [最小, 最大] }
const jobsData = [
    // ===== Lv.1 職業（10種）=====
    {
        id: 'hibarai',
        name: 'アルバイト',
        level: 1,
        abilities: { 国語: 0, 数学: 0, 理科: 0, 社会: 0, 英語: 0, 音楽: 0, 美術: 0, 体力: 0, 気力: 0, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [15, 99], gender: null, height: [0, 999] },
        salary: 1500,
        bonus: 0,
        bodyConsume: 15,
        brainConsume: 15
    },
    {
        id: 'conveni',
        name: '猫カフェ店員',
        level: 1,
        abilities: { 国語: 0, 数学: 0, 理科: 0, 社会: 30, 英語: 0, 音楽: 0, 美術: 0, 体力: 0, 気力: 0, ルックス: 30, 素早さ: 0, 面白さ: 0, 優しさ: 30, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 2400,
        bonus: 15,
        bodyConsume: 20,
        brainConsume: 15
    },
    {
        id: 'seisou',
        name: '地下アイドル',
        level: 1,
        abilities: { 国語: 0, 数学: 0, 理科: 0, 社会: 0, 英語: 0, 音楽: 40, 美術: 0, 体力: 30, 気力: 0, ルックス: 40, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 28], gender: '女', height: [0, 999] },
        salary: 3300,
        bonus: 15,
        bodyConsume: 30,
        brainConsume: 15,
        upgrade: { name: '売れっ子アイドル', salary: 67500, bonus: 60, bodyConsume: 60, brainConsume: 40, abilities: { 国語: 0, 数学: 0, 理科: 0, 社会: 0, 英語: 0, 音楽: 370, 美術: 0, 体力: 325, 気力: 0, ルックス: 380, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 305 } }
    },
    {
        id: 'babysitter',
        name: 'VTuber',
        level: 1,
        abilities: { 国語: 0, 数学: 0, 理科: 0, 社会: 0, 英語: 40, 音楽: 0, 美術: 50, 体力: 0, 気力: 0, ルックス: 0, 素早さ: 0, 面白さ: 45, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 4200,
        bonus: 15,
        bodyConsume: 15,
        brainConsume: 30,
        upgrade: { name: 'トップVTuber', salary: 73500, bonus: 60, bodyConsume: 30, brainConsume: 65, abilities: { 国語: 0, 数学: 0, 理科: 0, 社会: 0, 英語: 355, 音楽: 0, 美術: 385, 体力: 0, 気力: 0, ルックス: 0, 素早さ: 0, 面白さ: 365, 優しさ: 295, エロさ: 0 } }
    },
    {
        id: 'kaseifu',
        name: 'お笑い芸人',
        level: 1,
        abilities: { 国語: 50, 数学: 0, 理科: 0, 社会: 0, 英語: 0, 音楽: 0, 美術: 0, 体力: 50, 気力: 0, ルックス: 0, 素早さ: 0, 面白さ: 55, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 5100,
        bonus: 15,
        bodyConsume: 30,
        brainConsume: 20,
        upgrade: { name: '冠番組芸人', salary: 79500, bonus: 60, bodyConsume: 55, brainConsume: 50, abilities: { 国語: 375, 数学: 0, 理科: 0, 社会: 0, 英語: 0, 音楽: 0, 美術: 0, 体力: 345, 気力: 0, ルックス: 0, 素早さ: 305, 面白さ: 395, 優しさ: 0, エロさ: 0 } }
    },
    {
        id: 'trimmer',
        name: 'ゲーム実況者',
        level: 1,
        abilities: { 国語: 0, 数学: 65, 理科: 0, 社会: 0, 英語: 55, 音楽: 0, 美術: 0, 体力: 0, 気力: 0, ルックス: 0, 素早さ: 0, 面白さ: 70, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 6000,
        bonus: 15,
        bodyConsume: 15,
        brainConsume: 30,
        upgrade: { name: 'ミリオン実況者', salary: 84000, bonus: 60, bodyConsume: 25, brainConsume: 70, abilities: { 国語: 0, 数学: 385, 理科: 0, 社会: 310, 英語: 350, 音楽: 0, 美術: 0, 体力: 0, 気力: 0, ルックス: 0, 素早さ: 0, 面白さ: 395, 優しさ: 0, エロさ: 0 } }
    },
    {
        id: 'hoikushi',
        name: '小説家',
        level: 1,
        abilities: { 国語: 100, 数学: 0, 理科: 0, 社会: 65, 英語: 0, 音楽: 0, 美術: 75, 体力: 0, 気力: 0, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 7200,
        bonus: 15,
        bodyConsume: 15,
        brainConsume: 35,
        upgrade: { name: 'ベストセラー作家', salary: 88500, bonus: 60, bodyConsume: 20, brainConsume: 80, abilities: { 国語: 410, 数学: 0, 理科: 0, 社会: 340, 英語: 0, 音楽: 0, 美術: 380, 体力: 0, 気力: 330, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 } }
    },
    {
        id: 'kaigoshi',
        name: '占い師',
        level: 1,
        abilities: { 国語: 60, 数学: 0, 理科: 65, 社会: 75, 英語: 0, 音楽: 0, 美術: 0, 体力: 0, 気力: 70, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 8400,
        bonus: 15,
        bodyConsume: 15,
        brainConsume: 35,
        upgrade: { name: '伝説の占い師', salary: 93000, bonus: 60, bodyConsume: 25, brainConsume: 75, abilities: { 国語: 370, 数学: 0, 理科: 375, 社会: 395, 英語: 0, 音楽: 0, 美術: 0, 体力: 0, 気力: 385, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 } }
    },
    {
        id: 'souryo',
        name: '声優',
        level: 1,
        abilities: { 国語: 90, 数学: 0, 理科: 0, 社会: 0, 英語: 65, 音楽: 80, 美術: 0, 体力: 0, 気力: 75, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 9900,
        bonus: 15,
        bodyConsume: 20,
        brainConsume: 35,
        upgrade: { name: '売れっ子声優', salary: 99000, bonus: 60, bodyConsume: 45, brainConsume: 60, abilities: { 国語: 425, 数学: 0, 理科: 0, 社会: 0, 英語: 375, 音楽: 420, 美術: 0, 体力: 0, 気力: 395, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 } }
    },
    {
        id: 'uranaishi',
        name: '探偵',
        level: 1,
        abilities: { 国語: 0, 数学: 70, 理科: 75, 社会: 80, 英語: 0, 音楽: 0, 美術: 0, 体力: 0, 気力: 50, ルックス: 0, 素早さ: 65, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 35], gender: null, height: [0, 999] },
        salary: 11400,
        bonus: 15,
        bodyConsume: 30,
        brainConsume: 30,
        upgrade: { name: '名探偵', salary: 105000, bonus: 60, bodyConsume: 50, brainConsume: 65, abilities: { 国語: 0, 数学: 350, 理科: 355, 社会: 370, 英語: 0, 音楽: 0, 美術: 0, 体力: 0, 気力: 305, ルックス: 0, 素早さ: 320, 面白さ: 0, 優しさ: 0, エロさ: 0 } }
    },

    // ===== Lv.2 職業（10種）=====
    {
        id: 'biyoushi',
        name: 'ミュージシャン',
        level: 2,
        abilities: { 国語: 60, 数学: 0, 理科: 0, 社会: 0, 英語: 65, 音楽: 95, 美術: 0, 体力: 0, 気力: 80, ルックス: 75, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 13500,
        bonus: 20,
        bodyConsume: 30,
        brainConsume: 30,
        upgrade: { name: '一流アーティスト', salary: 90000, bonus: 60, bodyConsume: 55, brainConsume: 55, abilities: { 国語: 315, 数学: 0, 理科: 0, 社会: 0, 英語: 325, 音楽: 395, 美術: 0, 体力: 0, 気力: 340, ルックス: 305, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 } }
    },
    {
        id: 'nailist',
        name: '清掃作業員',
        level: 2,
        abilities: { 国語: 0, 数学: 0, 理科: 0, 社会: 95, 英語: 0, 音楽: 0, 美術: 0, 体力: 115, 気力: 0, ルックス: 0, 素早さ: 105, 面白さ: 0, 優しさ: 95, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 15000,
        bonus: 20,
        bodyConsume: 45,
        brainConsume: 15
    },
    {
        id: 'esthe',
        name: 'イラストレーター',
        level: 2,
        abilities: { 国語: 110, 数学: 100, 理科: 0, 社会: 0, 英語: 100, 音楽: 0, 美術: 135, 体力: 0, 気力: 0, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 16500,
        bonus: 20,
        bodyConsume: 15,
        brainConsume: 45,
        upgrade: { name: '神絵師', salary: 97500, bonus: 60, bodyConsume: 25, brainConsume: 80, abilities: { 国語: 405, 数学: 385, 理科: 0, 社会: 0, 英語: 390, 音楽: 0, 美術: 465, 体力: 0, 気力: 0, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 } }
    },
    {
        id: 'hisho',
        name: '農家',
        level: 2,
        abilities: { 国語: 0, 数学: 0, 理科: 120, 社会: 0, 英語: 0, 音楽: 0, 美術: 0, 体力: 130, 気力: 120, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 110, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 18000,
        bonus: 20,
        bodyConsume: 50,
        brainConsume: 15,
        upgrade: { name: 'ブランド農家', salary: 105000, bonus: 60, bodyConsume: 75, brainConsume: 35, abilities: { 国語: 0, 数学: 0, 理科: 405, 社会: 0, 英語: 0, 音楽: 0, 美術: 0, 体力: 440, 気力: 410, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 385, エロさ: 0 } }
    },
    {
        id: 'seitaishi',
        name: '漁師',
        level: 2,
        abilities: { 国語: 0, 数学: 0, 理科: 125, 社会: 0, 英語: 0, 音楽: 0, 美術: 0, 体力: 140, 気力: 130, ルックス: 0, 素早さ: 120, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 35], gender: null, height: [0, 999] },
        salary: 19500,
        bonus: 20,
        bodyConsume: 50,
        brainConsume: 20,
        upgrade: { name: 'マグロ漁師', salary: 112500, bonus: 60, bodyConsume: 80, brainConsume: 35, abilities: { 国語: 0, 数学: 0, 理科: 415, 社会: 0, 英語: 0, 音楽: 0, 美術: 0, 体力: 455, 気力: 425, ルックス: 0, 素早さ: 395, 面白さ: 0, 優しさ: 0, エロさ: 0 } }
    },
    {
        id: 'takuhaibin',
        name: 'モデル俳優',
        level: 2,
        abilities: { 国語: 115, 数学: 0, 理科: 0, 社会: 0, 英語: 0, 音楽: 0, 美術: 110, 体力: 100, 気力: 0, ルックス: 130, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 95 },
        conditions: { bmi: [17, 25], gender: null, height: [160, 999] },
        salary: 21000,
        bonus: 20,
        bodyConsume: 40,
        brainConsume: 25,
        upgrade: { name: '大物俳優', salary: 120000, bonus: 60, bodyConsume: 55, brainConsume: 65, abilities: { 国語: 350, 数学: 0, 理科: 0, 社会: 0, 英語: 0, 音楽: 0, 美術: 335, 体力: 325, 気力: 0, ルックス: 390, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 300 } }
    },
    {
        id: 'gaichukujo',
        name: '介護士',
        level: 2,
        abilities: { 国語: 0, 数学: 0, 理科: 0, 社会: 145, 英語: 0, 音楽: 0, 美術: 0, 体力: 150, 気力: 135, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 155, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 22500,
        bonus: 20,
        bodyConsume: 45,
        brainConsume: 25
    },
    {
        id: 'animator',
        name: '動画編集者',
        level: 2,
        abilities: { 国語: 0, 数学: 140, 理科: 0, 社会: 0, 英語: 100, 音楽: 120, 美術: 150, 体力: 0, 気力: 0, ルックス: 0, 素早さ: 0, 面白さ: 110, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 23400,
        bonus: 20,
        bodyConsume: 15,
        brainConsume: 45
    },
    {
        id: 'busguide',
        name: 'ネイリスト',
        level: 2,
        abilities: { 国語: 0, 数学: 0, 理科: 0, 社会: 155, 英語: 0, 音楽: 0, 美術: 175, 体力: 0, 気力: 0, ルックス: 170, 素早さ: 0, 面白さ: 0, 優しさ: 160, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 24900,
        bonus: 20,
        bodyConsume: 20,
        brainConsume: 35
    },
    {
        id: 'tozankenka',
        name: 'ヨガ講師',
        level: 2,
        abilities: { 国語: 0, 数学: 0, 理科: 0, 社会: 0, 英語: 0, 音楽: 0, 美術: 0, 体力: 160, 気力: 150, ルックス: 140, 素早さ: 0, 面白さ: 0, 優しさ: 125, エロさ: 115 },
        conditions: { bmi: [17, 27], gender: null, height: [0, 999] },
        salary: 26400,
        bonus: 20,
        bodyConsume: 45,
        brainConsume: 20
    },

    // ===== Lv.3 職業（10種）=====
    {
        id: 'keisatsukan',
        name: 'ウェディングプランナー',
        level: 3,
        abilities: { 国語: 150, 数学: 0, 理科: 0, 社会: 160, 英語: 0, 音楽: 120, 美術: 155, 体力: 0, 気力: 0, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 140, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 25500,
        bonus: 25,
        bodyConsume: 25,
        brainConsume: 45
    },
    {
        id: 'jieitai',
        name: 'トリマー',
        level: 3,
        abilities: { 国語: 0, 数学: 0, 理科: 185, 社会: 0, 英語: 0, 音楽: 0, 美術: 200, 体力: 180, 気力: 0, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 195, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 27000,
        bonus: 25,
        bodyConsume: 35,
        brainConsume: 35
    },
    {
        id: 'daiku',
        name: '宅配便ドライバー',
        level: 3,
        abilities: { 国語: 0, 数学: 0, 理科: 0, 社会: 195, 英語: 0, 音楽: 0, 美術: 0, 体力: 215, 気力: 0, ルックス: 0, 素早さ: 200, 面白さ: 0, 優しさ: 185, エロさ: 0 },
        conditions: { bmi: [17, 35], gender: null, height: [0, 999] },
        salary: 28500,
        bonus: 25,
        bodyConsume: 55,
        brainConsume: 20
    },
    {
        id: 'seibishi',
        name: 'ハンター',
        level: 3,
        abilities: { 国語: 0, 数学: 0, 理科: 205, 社会: 0, 英語: 0, 音楽: 0, 美術: 0, 体力: 220, 気力: 210, ルックス: 0, 素早さ: 195, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 35], gender: null, height: [0, 999] },
        salary: 30000,
        bonus: 25,
        bodyConsume: 55,
        brainConsume: 25
    },
    {
        id: 'patissier',
        name: '引越し業者',
        level: 3,
        abilities: { 国語: 0, 数学: 0, 理科: 0, 社会: 175, 英語: 0, 音楽: 0, 美術: 0, 体力: 210, 気力: 0, ルックス: 0, 素早さ: 195, 面白さ: 155, 優しさ: 130, エロさ: 0 },
        conditions: { bmi: [18, 35], gender: null, height: [0, 999] },
        salary: 32400,
        bonus: 25,
        bodyConsume: 60,
        brainConsume: 15
    },
    {
        id: 'ryoushi',
        name: 'パティシエ',
        level: 3,
        abilities: { 国語: 180, 数学: 165, 理科: 195, 社会: 0, 英語: 0, 音楽: 0, 美術: 210, 体力: 0, 気力: 150, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 34500,
        bonus: 25,
        bodyConsume: 35,
        brainConsume: 45,
        upgrade: { name: 'グランパティシエ', salary: 114000, bonus: 60, bodyConsume: 55, brainConsume: 65, abilities: { 国語: 350, 数学: 330, 理科: 360, 社会: 0, 英語: 0, 音楽: 0, 美術: 385, 体力: 0, 気力: 285, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 } }
    },
    {
        id: 'keiri',
        name: '保育士',
        level: 3,
        abilities: { 国語: 0, 数学: 0, 理科: 0, 社会: 200, 英語: 0, 音楽: 175, 美術: 0, 体力: 190, 気力: 0, ルックス: 0, 素早さ: 0, 面白さ: 155, 優しさ: 215, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 36000,
        bonus: 25,
        bodyConsume: 40,
        brainConsume: 40
    },
    {
        id: 'eigyoman',
        name: '大工',
        level: 3,
        abilities: { 国語: 0, 数学: 210, 理科: 165, 社会: 0, 英語: 0, 音楽: 0, 美術: 195, 体力: 220, 気力: 180, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [18, 35], gender: null, height: [0, 999] },
        salary: 38400,
        bonus: 25,
        bodyConsume: 60,
        brainConsume: 20
    },
    {
        id: 'rinsho',
        name: '整体師',
        level: 3,
        abilities: { 国語: 0, 数学: 0, 理科: 225, 社会: 190, 英語: 0, 音楽: 0, 美術: 0, 体力: 200, 気力: 0, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 215, エロさ: 170 },
        conditions: { bmi: [17, 30], gender: null, height: [0, 999] },
        salary: 40500,
        bonus: 25,
        bodyConsume: 40,
        brainConsume: 40
    },
    {
        id: 'mangaka',
        name: '美容師',
        level: 3,
        abilities: { 国語: 195, 数学: 0, 理科: 0, 社会: 210, 英語: 0, 音楽: 0, 美術: 240, 体力: 0, 気力: 0, ルックス: 225, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 165 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 43500,
        bonus: 25,
        bodyConsume: 35,
        brainConsume: 40,
        upgrade: { name: 'カリスマ美容師', salary: 135000, bonus: 60, bodyConsume: 50, brainConsume: 70, abilities: { 国語: 340, 数学: 0, 理科: 0, 社会: 350, 英語: 0, 音楽: 0, 美術: 390, 体力: 0, 気力: 0, ルックス: 370, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 260 } }
    },

    // ===== Lv.4 職業（10種）=====
    {
        id: 'kangoshi',
        name: 'エステティシャン',
        level: 4,
        abilities: { 国語: 0, 数学: 0, 理科: 205, 社会: 0, 英語: 0, 音楽: 0, 美術: 235, 体力: 0, 気力: 0, ルックス: 225, 素早さ: 0, 面白さ: 0, 優しさ: 215, エロさ: 190 },
        conditions: { bmi: [17, 28], gender: null, height: [0, 999] },
        salary: 44400,
        bonus: 30,
        bodyConsume: 35,
        brainConsume: 50
    },
    {
        id: 'programmer',
        name: 'ドローン操縦士',
        level: 4,
        abilities: { 国語: 0, 数学: 250, 理科: 230, 社会: 0, 英語: 165, 音楽: 0, 美術: 185, 体力: 0, 気力: 0, ルックス: 0, 素早さ: 200, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 46500,
        bonus: 30,
        bodyConsume: 20,
        brainConsume: 55
    },
    {
        id: 'illustrator',
        name: '管理栄養士',
        level: 4,
        abilities: { 国語: 220, 数学: 190, 理科: 250, 社会: 235, 英語: 0, 音楽: 0, 美術: 0, 体力: 0, 気力: 0, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 205, エロさ: 0 },
        conditions: { bmi: [17, 30], gender: null, height: [0, 999] },
        salary: 49500,
        bonus: 30,
        bodyConsume: 20,
        brainConsume: 60
    },
    {
        id: 'eizou',
        name: '臨床心理士',
        level: 4,
        abilities: { 国語: 260, 数学: 0, 理科: 205, 社会: 245, 英語: 0, 音楽: 0, 美術: 0, 体力: 0, 気力: 230, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 220, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 53400,
        bonus: 30,
        bodyConsume: 15,
        brainConsume: 65
    },
    {
        id: 'seiyu',
        name: '僧侶',
        level: 4,
        abilities: { 国語: 260, 数学: 0, 理科: 0, 社会: 240, 英語: 0, 音楽: 210, 美術: 0, 体力: 0, 気力: 280, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 220, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: '男', height: [0, 999] },
        salary: 55500,
        bonus: 30,
        bodyConsume: 40,
        brainConsume: 45
    },
    {
        id: 'shogakkou',
        name: 'シェフ',
        level: 4,
        abilities: { 国語: 225, 数学: 0, 理科: 255, 社会: 0, 英語: 0, 音楽: 0, 美術: 270, 体力: 240, 気力: 210, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 58500,
        bonus: 30,
        bodyConsume: 50,
        brainConsume: 40,
        upgrade: { name: '三ツ星シェフ', salary: 129000, bonus: 60, bodyConsume: 70, brainConsume: 75, abilities: { 国語: 365, 数学: 0, 理科: 385, 社会: 0, 英語: 0, 音楽: 0, 美術: 395, 体力: 365, 気力: 290, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 } }
    },
    {
        id: 'yakuzaishi',
        name: 'eスポーツ選手',
        level: 4,
        abilities: { 国語: 0, 数学: 280, 理科: 0, 社会: 0, 英語: 235, 音楽: 0, 美術: 0, 体力: 0, 気力: 255, ルックス: 0, 素早さ: 270, 面白さ: 210, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 62400,
        bonus: 30,
        bodyConsume: 25,
        brainConsume: 60,
        upgrade: { name: 'eスポーツ王者', salary: 139500, bonus: 60, bodyConsume: 60, brainConsume: 100, abilities: { 国語: 0, 数学: 395, 理科: 0, 社会: 0, 英語: 355, 音楽: 0, 美術: 0, 体力: 0, 気力: 380, ルックス: 0, 素早さ: 390, 面白さ: 330, 優しさ: 0, エロさ: 0 } }
    },
    {
        id: 'sommelier',
        name: '自衛隊',
        level: 4,
        abilities: { 国語: 0, 数学: 0, 理科: 230, 社会: 240, 英語: 0, 音楽: 0, 美術: 0, 体力: 285, 気力: 270, ルックス: 0, 素早さ: 255, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [18, 30], gender: null, height: [150, 999] },
        salary: 65400,
        bonus: 30,
        bodyConsume: 65,
        brainConsume: 25,
        upgrade: { name: '特殊作戦隊員', salary: 150000, bonus: 60, bodyConsume: 110, brainConsume: 70, abilities: { 国語: 0, 数学: 0, 理科: 380, 社会: 385, 英語: 0, 音楽: 0, 美術: 0, 体力: 420, 気力: 395, ルックス: 0, 素早さ: 320, 面白さ: 0, 優しさ: 0, エロさ: 0 } }
    },
    {
        id: 'aidev',
        name: '地方公務員',
        level: 4,
        abilities: { 国語: 275, 数学: 260, 理科: 0, 社会: 290, 英語: 250, 音楽: 0, 美術: 0, 体力: 0, 気力: 0, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 235, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 69000,
        bonus: 30,
        bodyConsume: 20,
        brainConsume: 60
    },
    {
        id: 'esports',
        name: 'アナウンサー',
        level: 4,
        abilities: { 国語: 310, 数学: 0, 理科: 0, 社会: 280, 英語: 265, 音楽: 250, 美術: 0, 体力: 0, 気力: 0, ルックス: 295, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 27], gender: null, height: [0, 999] },
        salary: 73500,
        bonus: 30,
        bodyConsume: 25,
        brainConsume: 60
    },

    // ===== Lv.5 職業（10種）=====
    {
        id: 'isha',
        name: '看護師',
        level: 5,
        abilities: { 国語: 0, 数学: 0, 理科: 300, 社会: 260, 英語: 0, 音楽: 0, 美術: 0, 体力: 275, 気力: 255, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 285, エロさ: 0 },
        conditions: { bmi: [17, 30], gender: null, height: [0, 999] },
        salary: 67500,
        bonus: 40,
        bodyConsume: 50,
        brainConsume: 55
    },
    {
        id: 'bengoshi',
        name: '消防士',
        level: 5,
        abilities: { 国語: 0, 数学: 0, 理科: 265, 社会: 260, 英語: 0, 音楽: 0, 美術: 0, 体力: 310, 気力: 295, ルックス: 0, 素早さ: 280, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [18, 30], gender: null, height: [0, 999] },
        salary: 72000,
        bonus: 40,
        bodyConsume: 70,
        brainConsume: 35
    },
    {
        id: 'pilot',
        name: '警察官',
        level: 5,
        abilities: { 国語: 275, 数学: 0, 理科: 0, 社会: 310, 英語: 0, 音楽: 0, 美術: 0, 体力: 300, 気力: 285, ルックス: 0, 素早さ: 275, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [18, 28], gender: null, height: [0, 999] },
        salary: 76500,
        bonus: 40,
        bodyConsume: 55,
        brainConsume: 50
    },
    {
        id: 'idol',
        name: '大学教授',
        level: 5,
        abilities: { 国語: 330, 数学: 285, 理科: 300, 社会: 270, 英語: 315, 音楽: 0, 美術: 0, 体力: 0, 気力: 0, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 82500,
        bonus: 40,
        bodyConsume: 20,
        brainConsume: 70
    },
    {
        id: 'vtuber',
        name: 'プロンプトエンジニア',
        level: 5,
        abilities: { 国語: 320, 数学: 305, 理科: 295, 社会: 0, 英語: 330, 音楽: 0, 美術: 0, 体力: 0, 気力: 0, ルックス: 0, 素早さ: 0, 面白さ: 285, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 88500,
        bonus: 40,
        bodyConsume: 15,
        brainConsume: 70
    },
    {
        id: 'owarai',
        name: '宇宙飛行士',
        level: 5,
        abilities: { 国語: 0, 数学: 295, 理科: 340, 社会: 0, 英語: 280, 音楽: 0, 美術: 0, 体力: 325, 気力: 310, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [18, 27], gender: null, height: [150, 190] },
        salary: 93000,
        bonus: 40,
        bodyConsume: 65,
        brainConsume: 55
    },
    {
        id: 'eigakantoku',
        name: '弁護士',
        level: 5,
        abilities: { 国語: 345, 数学: 295, 理科: 0, 社会: 335, 英語: 300, 音楽: 0, 美術: 0, 体力: 0, 気力: 315, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 99000,
        bonus: 40,
        bodyConsume: 25,
        brainConsume: 70
    },
    {
        id: 'daigakukyoju',
        name: '医者',
        level: 5,
        abilities: { 国語: 330, 数学: 295, 理科: 350, 社会: 0, 英語: 300, 音楽: 0, 美術: 0, 体力: 0, 気力: 0, ルックス: 0, 素早さ: 0, 面白さ: 0, 優しさ: 315, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 105000,
        bonus: 40,
        bodyConsume: 45,
        brainConsume: 70
    },
    {
        id: 'hitotsuboshichef',
        name: '政治家',
        level: 5,
        abilities: { 国語: 345, 数学: 0, 理科: 0, 社会: 365, 英語: 305, 音楽: 0, 美術: 0, 体力: 0, 気力: 325, ルックス: 310, 素早さ: 0, 面白さ: 0, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [17, 99], gender: null, height: [0, 999] },
        salary: 112500,
        bonus: 40,
        bodyConsume: 40,
        brainConsume: 65
    },
    {
        id: 'uchuhikoushi',
        name: 'プロ野球選手',
        level: 5,
        abilities: { 国語: 0, 数学: 0, 理科: 0, 社会: 0, 英語: 0, 音楽: 0, 美術: 0, 体力: 380, 気力: 345, ルックス: 325, 素早さ: 360, 面白さ: 300, 優しさ: 0, エロさ: 0 },
        conditions: { bmi: [19, 28], gender: '男', height: [160, 195] },
        salary: 120000,
        bonus: 40,
        bodyConsume: 70,
        brainConsume: 60
    }
];

// 街のマップデータ（8x8）
const townMap = [
    ['road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road'],
    ['road', 'road', 'road', 'road', 'kouji', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'onsen', 'kouji', 'road'],
    ['road', 'road', 'road', 'company', 'road', 'bank', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road'],
    ['road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road'],
    ['road', 'road', 'road', 'road', 'road', 'road', 'road', 'shop', 'road', 'kouji', 'gym', 'work', 'road', 'road', 'road', 'road'],
    ['road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road'],
    ['road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road'],
    ['road', 'road', 'road', 'board', 'road', 'school', 'road', 'road', 'road', 'road', 'road', 'kouji', 'kouji', 'road', 'road', 'road'],
    ['road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road'],
    ['road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'shokudo', 'road', 'road', 'road', 'road', 'road'],
    ['road', 'road', 'road', 'road', 'hospital', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'kouji', 'road', 'road'],
    ['road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road', 'road']
];

// マップタイル（視覚表示用）
const mapTiles = [
    ['K', 'K', 'K', 'K', 'K', 'K', 'K', 'K', 'H', 'K', 'K', 'K', 'K', 'K', 'K', 'K'],
    ['K', 'S', 'S', 'L', 'public/kouji', 'L', 'S', 'S', 'T', 'S', 'S', 'S', 'K', 'public/onsen', 'public/kouji', 'K'],
    ['K', 'S', 'S', 'public/bill', 'T', 'public/ginkou', 'S', 'S', 'T', 'S', 'S', 'S', 'K', 'T', 'K', 'K'],
    ['H', 'Y', 'Y', 'Y', '+', 'Y', 'Y', 'Y', '+', 'Y', 'Y', 'Y', 'Y', '+', 'Y', 'H'],
    ['K', 'S', 'S', 'S', 'T', 'S', 'L', 'public/store', 'T', 'public/kouji', 'public/gym', 'public/work', 'L', 'T', 'S', 'K'],
    ['K', 'S', 'S', 'S', 'T', 'S', 'S', 'S', 'T', 'S', 'S', 'S', 'S', 'T', 'S', 'K'],
    ['K', 'S', 'S', 'L', 'T', 'L', 'S', 'S', 'T', 'S', 'S', 'S', 'S', 'T', 'S', 'K'],
    ['K', 'S', 'L', 'public/keiziban', 'T', 'public/school', 'L', 'S', 'T', 'S', 'L', 'public/kouji', 'public/kouji', 'T', 'S', 'K'],
    ['H', 'Y', 'Y', 'Y', '+', 'Y', 'Y', 'Y', '+', 'Y', 'Y', 'Y', 'Y', '+', 'Y', 'H'],
    ['K', 'S', 'S', 'S', 'T', 'S', 'S', 'S', 'T', 'L', 'public/syokudo', 'S', 'S', 'T', 'S', 'K'],
    ['K', 'S', 'S', 'L', 'public/hospital', 'L', 'S', 'S', 'T', 'S', 'S', 'S', 'L', 'public/kouji', 'L', 'K'],
    ['K', 'K', 'K', 'K', 'K', 'K', 'K', 'K', 'H', 'K', 'K', 'K', 'K', 'K', 'K', 'K']
];

// 施設データ
const places = {
    kouji: {
        name: '工事中',
        emoji: '🚧',
        mapDescription: 'ただいま建設工事中です',
        description: 'ただいま建設工事中です',
        actions: []
    },
    company: {
        name: '会社',
        emoji: '🏢',
        description: '働いてお金を稼げます。',
        actions: []
    },
    shop: {
        name: '商店',
        emoji: '🏪',
        description: 'よろず屋さん。いろんなものが買えます。',
        actions: [
            { name: '買い物する', description: 'アイテムを購入', effect: () => openShop() },
            { name: '売却する', description: 'アイテムを売る', effect: () => openSellShop() }
        ]
    },
    gym: {
        name: 'ジム',
        emoji: '🏋️',
        mapDescription: 'トレーニングジム。身体系の能力値を上げることができます。',
        description: '今日も張り切って体を鍛えましょう！<br>トレーニングできる間隔は30分です。',
        actions: []
    },
    hospital: {
        name: '病院',
        emoji: '🏥',
        description: 'どんな病気も瞬く間に治しましょう。',
        actions: []
    },
    bank: {
        name: '銀行',
        emoji: '🏦',
        mapDescription: '銀行です。お金を預けたり引き出したりできます。',
        description: 'いらっしゃいませ。<br>ご希望のお取引をお選びください。',
        hideTitle: true,
        hideDescBackground: true,
        actions: [
            { name: 'お預入れ', description: '', effect: () => deposit() },
            { name: 'お引き出し', description: '', effect: () => withdraw() },
            { name: '入出金明細', description: '', effect: () => showBankHistory() },
            { name: 'お振り込み', description: '', effect: () => showTransfer() }
        ]
    },
    onsen: {
        name: '温泉施設',
        emoji: '♨️',
        description: '温泉です。入浴中は通常の10倍の早さでパワーが回復します。疲れた体を癒やしちゃいましょう。',
        actions: [
            { name: '通常風呂', description: '入浴料1500円', effect: () => normalBath() },
            { name: '広告風呂', description: '広告1分視聴で全回復！', effect: () => adBath() }
        ]
    },
    temple: {
        name: '神社',
        emoji: '⛩️',
        description: '静かな神社。お参りすると良いことがあるかも？',
        actions: [
            { name: 'お参りする', description: '運気UP？ 100円', effect: () => pray() },
            { name: 'おみくじを引く', description: '運勢を占う、200円', effect: () => drawFortune() }
        ]
    },
    school: {
        name: '習い事スクール',
        emoji: '🏫',
        mapDescription: '習い事スクール。頭脳系の能力値を上げることができます。',
        description: '今日も頑張って勉強しましょう！<br>トレーニングできる間隔は30分です。',
        actions: []
    },
    arcade: {
        name: 'ゲーセン',
        emoji: '🕹️',
        description: 'ゲームセンター。遊んでストレス発散！',
        actions: [
            { name: '遊ぶ', description: '体力+5、知力+3、300円', effect: () => playGames() },
            { name: 'クレーンゲーム', description: '景品がもらえるかも？ 200円', effect: () => craneGame() }
        ]
    },
    board: {
        name: '掲示板',
        emoji: '📋',
        description: 'ようこそ街の掲示板へ！<br>見たい掲示板を選んでね。',
        hideTitle: true,
        hideDescBackground: true,
        actions: [
            { name: 'ギモン解決！BBS', description: '', effect: () => openBoard('question') }
        ]
    },
    work: {
        name: '職業安定所',
        emoji: '💼',
        mapDescription: '職業安定所です。就職・転職する方はこちらへ！',
        description: 'お仕事を探せます。',
        isModal: true,
        actions: [
            { name: '求人を見る', description: '職業一覧を見る', effect: () => openHelloworkModal() }
        ]
    },
    shokudo: {
        name: '食堂',
        emoji: '🍽️',
        mapDescription: '食堂です。食事をして空腹を満たしましょう！',
        description: 'おなかが空いたらここへどうぞ！',
        actions: [
            { name: '食事する', description: 'メニューを見る', effect: () => openShokudo() }
        ]
    },
    road: {
        name: '道',
        emoji: '🛤️',
        description: '街の道です。',
        actions: []
    }
};

// 購入確認用の一時変数
let pendingPurchase = {
    items: [],
    totalPrice: 0
};

// 食堂の購入確認用の一時変数
let pendingShokudoPurchase = {
    items: [],
    totalPrice: 0
};

// 食堂のメニュー
const shokudoItems = [
    // テイクアウト品（空腹1〜2段階↑）※所持品に入る
    { type: 'separator', name: 'テイクアウト品' },
    { name: 'おにぎり', price: 100, consumable: true, hungerEffect: 1, takeout: true, stock: 10,
      effect: { hunger: -1 }, description: '空腹度1UP',
      stats: {}, calorie: 180, useCount: 1 },
    { name: 'カップラーメン', price: 150, consumable: true, hungerEffect: 1, takeout: true, stock: 10,
      effect: { hunger: -1 }, description: '空腹度1UP',
      stats: {}, calorie: 250, useCount: 1 },
    { name: '肉まん', price: 150, consumable: true, hungerEffect: 1, takeout: true, stock: 10,
      effect: { hunger: -1 }, description: '空腹度1UP',
      stats: {}, calorie: 280, useCount: 1 },
    { name: 'ホットドッグ', price: 200, consumable: true, hungerEffect: 1, takeout: true, stock: 10,
      effect: { hunger: -1 }, description: '空腹度1UP',
      stats: {}, calorie: 300, useCount: 1 },
    { name: 'チキンナゲット', price: 250, consumable: true, hungerEffect: 1, takeout: true, stock: 10,
      effect: { hunger: -1 }, description: '空腹度1UP',
      stats: {}, calorie: 350, useCount: 1 },
    { name: 'サンドイッチ', price: 300, consumable: true, hungerEffect: 1, takeout: true, stock: 10,
      effect: { hunger: -1 }, description: '空腹度1UP',
      stats: {}, calorie: 320, useCount: 1 },
    { name: 'たこ焼き', price: 350, consumable: true, hungerEffect: 2, takeout: true, stock: 10,
      effect: { hunger: -1 }, description: '空腹度2UP',
      stats: {}, calorie: 400, useCount: 1 },
    { name: '焼きそば', price: 400, consumable: true, hungerEffect: 2, takeout: true, stock: 10,
      effect: { hunger: -1 }, description: '空腹度2UP',
      stats: { 体力: 1, 気力: 1 }, calorie: 500, useCount: 1 },
    { name: 'ピザ', price: 600, consumable: true, hungerEffect: 2, takeout: true, stock: 10,
      effect: { hunger: -1 }, description: '空腹度2UP',
      stats: { 体力: 1, 面白さ: 2, 美術: 1 }, calorie: 600, useCount: 1 },
    { name: 'ハンバーガー', price: 800, consumable: true, hungerEffect: 2, takeout: true, stock: 10,
      effect: { hunger: -1 }, description: '空腹度2UP',
      stats: { 体力: 3, 気力: 1, エロさ: 1 }, calorie: 700, useCount: 1 },

    // 食料品（満腹になる）※その場で食べる
    { type: 'separator', name: '食料品' },
    { name: 'かけうどん', price: 500, consumable: true, hungerEffect: 6, stock: 15,
      effect: { hunger: -1 },
      stats: { 素早さ: 1 }, calorie: 450 },
    { name: 'のり弁当', price: 650, consumable: true, hungerEffect: 6, stock: 15,
      effect: { hunger: -1 },
      stats: { 体力: 1 }, calorie: 500 },
    { name: '牛丼', price: 700, consumable: true, hungerEffect: 6, stock: 15,
      effect: { hunger: -1 },
      stats: { 国語: 1, 体力: 1 }, calorie: 650 },
    { name: '醤油ラーメン', price: 800, consumable: true, hungerEffect: 6, stock: 15,
      effect: { hunger: -1 },
      stats: { 素早さ: 2, 面白さ: 1 }, calorie: 750 },
    { name: 'カレーライス', price: 900, consumable: true, hungerEffect: 6, stock: 15,
      effect: { hunger: -1 },
      stats: { 気力: 2, エロさ: 1 }, calorie: 700 },
    { name: 'オムライス', price: 1000, consumable: true, hungerEffect: 6, stock: 10,
      effect: { hunger: -1 },
      stats: { 優しさ: 2, 音楽: 2 }, calorie: 600 },
    { name: 'カルボナーラ', price: 1200, consumable: true, hungerEffect: 6, stock: 10,
      effect: { hunger: -1 },
      stats: { ルックス: 1, 優しさ: 1, 美術: 2 }, calorie: 800 },
    { name: '唐揚げ定食', price: 1400, consumable: true, hungerEffect: 6, stock: 10,
      effect: { hunger: -1 },
      stats: { 体力: 3, 社会: 1 }, calorie: 800 },
    { name: '焼肉定食', price: 1600, consumable: true, hungerEffect: 6, stock: 10,
      effect: { hunger: -1 },
      stats: { 気力: 3, 体力: 2 }, calorie: 900 },
    { name: 'キムチ鍋', price: 2000, consumable: true, hungerEffect: 6, stock: 10,
      effect: { hunger: -1 },
      stats: { 数学: 2, 社会: 2, 優しさ: 1 }, calorie: 700 },
    { name: 'ステーキ', price: 2500, consumable: true, hungerEffect: 6, stock: 10,
      effect: { hunger: -1 },
      stats: { 体力: 2, ルックス: 2, エロさ: 2 }, calorie: 950 },
    { name: '特上握り寿司', price: 3000, consumable: true, hungerEffect: 6, stock: 5,
      effect: { hunger: -1 },
      stats: { 国語: 1, 数学: 1, 理科: 1, 社会: 1, 英語: 1, 音楽: 1, 美術: 1 }, calorie: 750 },
];

// 商店のアイテム
const shopItems = [
    // 書籍（日用品レート：総獲得×150円/pt）
    { type: 'separator', name: '書籍' },
    { name: 'はらぺこいもむし', price: 1200, consumable: true,
      stats: { 国語: 2, 優しさ: 2 }, calorie: 0, useCount: 2, cooldown: '15分', bodyConsume: 0, brainConsume: 5 },
    { name: 'まんが・下剋上', price: 1200, consumable: true,
      stats: { 社会: 2, 面白さ: 2 }, calorie: 0, useCount: 2, cooldown: '15分', bodyConsume: 0, brainConsume: 5 },
    { name: '雑誌・Azura', price: 1200, consumable: true,
      stats: { ルックス: 2, 美術: 2 }, calorie: 0, useCount: 2, cooldown: '15分', bodyConsume: 0, brainConsume: 5 },
    { name: 'Music ++', price: 1200, consumable: true,
      stats: { 音楽: 2, エロさ: 2 }, calorie: 0, useCount: 2, cooldown: '15分', bodyConsume: 0, brainConsume: 5 },
    { name: '新発見！昆虫サバイバル図鑑', price: 1500, consumable: true,
      stats: { 理科: 4, 体力: 1 }, calorie: 0, useCount: 2, cooldown: '15分', bodyConsume: 0, brainConsume: 5 },
    { name: '英単語は覚えるな。', price: 1500, consumable: true,
      stats: { 英語: 4, 気力: 1 }, calorie: 0, useCount: 2, cooldown: '15分', bodyConsume: 0, brainConsume: 5 },
    { name: 'まるわかり世界史', price: 1500, consumable: true,
      stats: { 社会: 4, 国語: 1 }, calorie: 0, useCount: 2, cooldown: '15分', bodyConsume: 0, brainConsume: 5 },
    { name: '今日のごはん365', price: 1200, consumable: true,
      stats: { 優しさ: 2, 美術: 1, 体力: 1 }, calorie: 0, useCount: 2, cooldown: '15分', bodyConsume: 0, brainConsume: 5 },
    { name: '鬼の計算1000問ドリル', price: 1500, consumable: true,
      stats: { 数学: 3, 素早さ: 2 }, calorie: 0, useCount: 2, cooldown: '15分', bodyConsume: 0, brainConsume: 5 },
    { name: '朝5時起きで人生が変わる', price: 1500, consumable: true,
      stats: { 気力: 2, 国語: 2, 数学: 1 }, calorie: 0, useCount: 2, cooldown: '15分', bodyConsume: 0, brainConsume: 5 },

    // 楽器（専門品レート：総獲得×130~150円/pt）
    { type: 'separator', name: '楽器' },
    { name: 'リコーダー', price: 2250, consumable: true,
      stats: { 音楽: 3, 気力: 2 }, calorie: 0, useCount: 3, cooldown: '15分', bodyConsume: 4, brainConsume: 6 },
    { name: 'ハーモニカ', price: 2940, consumable: true,
      stats: { 音楽: 4, 気力: 2, 体力: 1 }, calorie: 0, useCount: 3, cooldown: '15分', bodyConsume: 6, brainConsume: 9 },
    { name: 'メトロノーム', price: 6500, consumable: true,
      stats: { 音楽: 5, 数学: 3, 素早さ: 2 }, calorie: 0, useCount: 5, cooldown: '20分', bodyConsume: 0, brainConsume: 15 },
    { name: 'コンデンサーマイク', price: 8450, consumable: true,
      stats: { 音楽: 5, ルックス: 3, エロさ: 3, 面白さ: 2 }, calorie: 0, useCount: 5, cooldown: '20分', bodyConsume: 10, brainConsume: 15 },
    { name: 'ベース', price: 14560, consumable: true,
      stats: { 音楽: 6, 体力: 4, 気力: 3, 面白さ: 3 }, calorie: 0, useCount: 7, cooldown: '30分', bodyConsume: 14, brainConsume: 21 },
    { name: 'エレキギター', price: 18200, consumable: true,
      stats: { 音楽: 7, ルックス: 4, 面白さ: 4, エロさ: 3, 気力: 2 }, calorie: 0, useCount: 7, cooldown: '30分', bodyConsume: 14, brainConsume: 21 },
    { name: 'キーボード', price: 26000, consumable: true,
      stats: { 音楽: 8, 数学: 5, 素早さ: 5, 美術: 3, 気力: 4 }, calorie: 0, useCount: 8, cooldown: '30分', bodyConsume: 20, brainConsume: 30 },
    { name: 'バイオリン', price: 39000, consumable: true,
      stats: { 音楽: 10, 美術: 6, ルックス: 5, 気力: 5, 優しさ: 4 }, calorie: 0, useCount: 10, cooldown: '45分', bodyConsume: 20, brainConsume: 30 },
    { name: 'ドラムセット', price: 45500, consumable: true,
      stats: { 音楽: 10, 体力: 8, 素早さ: 6, 面白さ: 5, 気力: 6 }, calorie: 0, useCount: 10, cooldown: '45分', bodyConsume: 40, brainConsume: 25 },
    { name: 'グランドピアノ', price: 70200, consumable: true,
      stats: { 音楽: 12, 美術: 8, 数学: 7, 気力: 6, ルックス: 5, 優しさ: 5, エロさ: 2 }, calorie: 0, useCount: 12, cooldown: '45分', bodyConsume: 30, brainConsume: 50 },

    // 画材（専門品レート：総獲得×130~140円/pt）
    { type: 'separator', name: '画材' },
    { name: '色鉛筆セット', price: 2100, consumable: true,
      stats: { 美術: 3, 気力: 2 }, calorie: 0, useCount: 3, cooldown: '15分', bodyConsume: 2, brainConsume: 8 },
    { name: 'スケッチブック', price: 2940, consumable: true,
      stats: { 美術: 4, 気力: 2, 国語: 1 }, calorie: 0, useCount: 3, cooldown: '15分', bodyConsume: 2, brainConsume: 8 },
    { name: '粘土', price: 4200, consumable: true,
      stats: { 美術: 5, 体力: 3, 面白さ: 2 }, calorie: 0, useCount: 3, cooldown: '20分', bodyConsume: 3, brainConsume: 12 },
    { name: '水彩絵の具', price: 5070, consumable: true,
      stats: { 美術: 5, 優しさ: 3, ルックス: 2, 気力: 3 }, calorie: 0, useCount: 3, cooldown: '20分', bodyConsume: 3, brainConsume: 12 },
    { name: 'デッサン人形', price: 8320, consumable: true,
      stats: { 美術: 6, ルックス: 4, エロさ: 3, 素早さ: 3 }, calorie: 0, useCount: 4, cooldown: '20分', bodyConsume: 5, brainConsume: 20 },
    { name: '彫刻刀セット', price: 10400, consumable: true,
      stats: { 美術: 7, 体力: 5, 素早さ: 4, 気力: 4 }, calorie: 0, useCount: 4, cooldown: '30分', bodyConsume: 5, brainConsume: 20 },
    { name: 'コピックセット', price: 16250, consumable: true,
      stats: { 美術: 8, ルックス: 5, 面白さ: 5, 気力: 4, 素早さ: 3 }, calorie: 0, useCount: 5, cooldown: '30分', bodyConsume: 7, brainConsume: 28 },
    { name: '油絵セット', price: 23400, consumable: true,
      stats: { 美術: 10, 優しさ: 6, 気力: 5, ルックス: 5, 国語: 4 }, calorie: 0, useCount: 6, cooldown: '30分', bodyConsume: 10, brainConsume: 40 },
    { name: 'ペンタブレット', price: 31850, consumable: true,
      stats: { 美術: 10, 素早さ: 7, 面白さ: 6, 数学: 6, 気力: 6 }, calorie: 0, useCount: 7, cooldown: '45分', bodyConsume: 10, brainConsume: 40 },
    { name: 'スプレー塗料', price: 41600, consumable: true,
      stats: { 美術: 12, 面白さ: 8, 体力: 6, ルックス: 5, エロさ: 5, 気力: 4 }, calorie: 0, useCount: 8, cooldown: '45分', bodyConsume: 10, brainConsume: 40 },

    // スポーツ用品（専門品レート：総獲得×130~140円/pt）
    { type: 'separator', name: 'スポーツ用品' },
    { name: '縄跳び', price: 2100, consumable: true,
      stats: { 体力: 2, 素早さ: 2, 気力: 1 }, calorie: 0, useCount: 3, cooldown: '15分', bodyConsume: 10, brainConsume: 0 },
    { name: 'ヨガマット', price: 2940, consumable: true,
      stats: { 気力: 3, 体力: 2, ルックス: 1, 優しさ: 1 }, calorie: 0, useCount: 3, cooldown: '15分', bodyConsume: 10, brainConsume: 5 },
    { name: 'サッカーボール', price: 5850, consumable: true,
      stats: { 体力: 3, 素早さ: 3, 気力: 2, 面白さ: 1 }, calorie: 0, useCount: 5, cooldown: '20分', bodyConsume: 15, brainConsume: 0 },
    { name: 'バスケットボール', price: 8450, consumable: true,
      stats: { 体力: 4, 素早さ: 4, 気力: 3, 面白さ: 2 }, calorie: 0, useCount: 5, cooldown: '20分', bodyConsume: 23, brainConsume: 2 },
    { name: 'テニスラケット', price: 10400, consumable: true,
      stats: { 体力: 5, 素早さ: 4, 気力: 3, ルックス: 2, 面白さ: 2 }, calorie: 0, useCount: 5, cooldown: '30分', bodyConsume: 20, brainConsume: 5 },
    { name: '野球バット', price: 11700, consumable: true,
      stats: { 体力: 6, 素早さ: 4, 気力: 4, 面白さ: 2, ルックス: 2 }, calorie: 0, useCount: 5, cooldown: '30分', bodyConsume: 25, brainConsume: 0 },
    { name: 'フィットネス水着', price: 13650, consumable: true,
      stats: { 体力: 5, ルックス: 5, エロさ: 4, 気力: 4, 素早さ: 3 }, calorie: 0, useCount: 5, cooldown: '30分', bodyConsume: 30, brainConsume: 5 },
    { name: 'ダンベル', price: 16900, consumable: true,
      stats: { 体力: 8, 気力: 6, ルックス: 5, 素早さ: 4, エロさ: 3 }, calorie: 0, useCount: 5, cooldown: '30分', bodyConsume: 35, brainConsume: 0 },
    { name: 'ボクシンググローブ', price: 23400, consumable: true,
      stats: { 体力: 8, 素早さ: 6, 気力: 6, 面白さ: 5, ルックス: 5 }, calorie: 0, useCount: 6, cooldown: '30分', bodyConsume: 45, brainConsume: 5 },
    { name: 'ゴルフクラブ', price: 31850, consumable: true,
      stats: { 体力: 8, 気力: 7, ルックス: 6, 素早さ: 5, 社会: 5, 優しさ: 4 }, calorie: 0, useCount: 7, cooldown: '45分', bodyConsume: 38, brainConsume: 12 }
];

// ============================================
// 初期化
// ============================================
function init() {
    updateBackground(); // 時間帯に応じた背景を設定
    renderMap();
    renderAvatarGrid();
    updateStatus();

    renderTweetList();
    setupTweetInfiniteScroll(); // 無限スクロール設定

    // 最初はマップを表示（施設に移動しない）
    document.getElementById('mapView').style.display = 'block';
    document.getElementById('actionView').style.display = 'none';
    document.getElementById('tweetView').style.display = 'none';
}

// ============================================
// 時間帯別背景設定
// ============================================
function updateBackground() {
    const hour = new Date().getHours();
    const body = document.body;

    // 既存の背景クラスを削除
    body.classList.remove('bg-day', 'bg-evening', 'bg-night');

    // 時間帯に応じてクラスを追加
    if (hour >= 6 && hour < 16) {
        // 6:00〜16:00 → 昼
        body.classList.add('bg-day');
    } else if (hour >= 16 && hour < 19) {
        // 16:00〜19:00 → 夕方
        body.classList.add('bg-evening');
    } else {
        // 19:00〜6:00 → 夜
        body.classList.add('bg-night');
    }
}

// ============================================
// アバター選択グリッド描画
// ============================================
function renderAvatarGrid() {
    const grid = document.getElementById('avatarGrid');
    grid.innerHTML = avatarOptions.map(avatarPath =>
        `<div class="avatar-option ${avatarPath === gameState.player.avatar ? 'selected' : ''}"
              onclick="selectAvatar('${avatarPath}')">
            <img src="${avatarPath}" alt="アバター" class="avatar-option-img">
        </div>`
    ).join('');
}

// ============================================
// アバター選択
// ============================================
function selectAvatar(avatarPath) {
    gameState.player.avatar = avatarPath;
    document.getElementById('playerAvatar').innerHTML = `<img src="${avatarPath}" alt="アバター" class="player-avatar-img">`;
    renderAvatarGrid();
    closeAvatarModal();
}

// ============================================
// モーダル操作
// ============================================
function openAvatarModal() {
    document.getElementById('avatarModal').classList.add('active');
    document.getElementById('avatarBgColor').value = gameState.player.avatarBgColor;
    renderAvatarGrid();
}

function closeAvatarModal() {
    document.getElementById('avatarModal').classList.remove('active');
}

function changeAvatarBgColor(color) {
    gameState.player.avatarBgColor = color;
    document.getElementById('playerAvatar').style.backgroundColor = color;
}

function openNameModal() {
    document.getElementById('nameInput').value = gameState.player.name;
    document.getElementById('nameModal').classList.add('active');
}

function closeNameModal() {
    document.getElementById('nameModal').classList.remove('active');
}

function saveName() {
    const newName = document.getElementById('nameInput').value.trim();
    if (newName && newName.length <= 10) {
        gameState.player.name = newName;
        updateStatus();
        closeNameModal();
    }
}

// ============================================
// マップ描画
// ============================================
function renderMap() {
    const mapTable = document.getElementById('townMap');
    const labelsTop = document.getElementById('mapLabelsTop');
    const labelsLeft = document.getElementById('mapLabelsLeft');
    mapTable.innerHTML = '';
    labelsTop.innerHTML = '';
    labelsLeft.innerHTML = '';
    const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

    // 上部ラベル（横軸の数字 1-16）
    for (let x = 1; x <= 16; x++) {
        const label = document.createElement('div');
        label.classList.add('map-label', 'map-label-top');
        label.textContent = x;
        labelsTop.appendChild(label);
    }

    // 左側ラベル（縦軸 A-L）
    for (let y = 0; y < rowLabels.length; y++) {
        const label = document.createElement('div');
        label.classList.add('map-label', 'map-label-left');
        label.textContent = rowLabels[y];
        labelsLeft.appendChild(label);
    }

    // マップ本体
    for (let y = 0; y < townMap.length; y++) {
        const row = document.createElement('tr');

        for (let x = 0; x < townMap[y].length; x++) {
            const cell = document.createElement('td');
            const placeId = townMap[y][x];
            const place = places[placeId];
            const tile = mapTiles[y][x];

            // タイル画像があれば画像を表示、なければ絵文字を表示
            if (tile) {
                // フォルダ指定があればそのパス、なければtree_roadフォルダ
                const imgPath = tile.includes('/') ? `${tile}.png` : `tree_road/${tile}.png`;
                cell.innerHTML = `<img src="${imgPath}" alt="${tile}" class="tile-img">`;
            } else {
                cell.innerHTML = `<span class="emoji">${place.emoji}</span>`;
            }
            cell.dataset.place = placeId;

            if (placeId === 'road') {
                cell.classList.add('road');
            }

            // 木や道路タイル（T, +, Y, L, K, S）はホバーエフェクトを無効化
            const noHoverTiles = ['T', '+', 'Y', 'L', 'K', 'S'];
            if (noHoverTiles.includes(tile)) {
                cell.classList.add('no-hover');
            }

            cell.addEventListener('click', () => moveTo(placeId));
            cell.addEventListener('mouseenter', () => showPlaceInfo(placeId, tile));
            cell.addEventListener('mouseleave', () => hidePlaceInfo());
            row.appendChild(cell);
        }
        mapTable.appendChild(row);
    }
}

// ============================================
// マップホバー説明表示
// ============================================
function showPlaceInfo(placeId, tile) {
    const place = places[placeId];
    const infoBox = document.getElementById('placeInfoBox');
    // 木や道路のタイル（T, +, Y, L, K）の場合は説明を空欄に
    const roadTiles = ['T', '+', 'Y', 'L', 'K'];
    if (roadTiles.includes(tile)) {
        infoBox.textContent = '';
    } else if (tile === 'S') {
        infoBox.textContent = 'この場所に家を建てることができます';
    } else if (tile === 'H') {
        infoBox.textContent = '他のタウンに移動します。※ただいま建設工事中';
    } else if (placeId === 'company') {
        // 会社の場合は動的に情報を生成
        const p = gameState.player;
        if (p.job === '無職') {
            infoBox.textContent = '仕事に出かけます。※職に就いていません';
        } else {
            const currentLevel = getCurrentJobLevel();
            const nextLevel = jobLevels[currentLevel.level] || null;
            const expToNext = nextLevel ? nextLevel.expRequired - p.jobExp : 0;
            const nextText = nextLevel ? `次のLvまであと ${expToNext}` : 'MAX';
            infoBox.textContent = `仕事に出かけます。【現在】Lv.${currentLevel.level} | 勤務回数 ${p.workCount}回 | 経験値 ${p.jobExp} | ${nextText}`;
        }
    } else {
        infoBox.textContent = place.mapDescription || place.description;
    }
    infoBox.classList.add('visible');
}

function hidePlaceInfo() {
    const infoBox = document.getElementById('placeInfoBox');
    infoBox.classList.remove('visible');
}

// ============================================
// 移動
// ============================================
function moveTo(placeId) {
    const place = places[placeId];
    if (!place) return;

    // 道・工事中は移動のみ（アクションビューを開かない）
    if (placeId === 'road' || placeId === 'kouji') {
        return;
    }

    gameState.currentLocation = placeId;

    // マップの現在地表示を更新
    document.querySelectorAll('.town-map td').forEach(cell => {
        cell.classList.remove('current');
        if (cell.dataset.place === placeId) {
            cell.classList.add('current');
        }
    });

    // 食堂は直接モーダルを開く
    if (placeId === 'shokudo') {
        openShokudo();
        return;
    }

    // 職業安定所は直接モーダルを開く
    if (placeId === 'work') {
        openHelloworkModal();
        return;
    }

    // 会社は直接仕事モーダルを開く
    if (placeId === 'company') {
        openWorkModal();
        return;
    }

    // アクションビューを表示
    showActionView(place);
}

// ============================================
// アクションビュー表示
// ============================================
// 現在のアクションを保存するグローバル配列
let currentActions = [];

function showActionView(place) {
    // マップを非表示、アクションビューを表示
    document.getElementById('mapView').style.display = 'none';
    document.getElementById('actionView').style.display = 'block';

    const titleEl = document.getElementById('actionViewTitle');
    const descEl = document.getElementById('actionViewDesc');

    // タイトルを非表示
    titleEl.style.display = 'none';

    // 説明文を設定（HTMLタグ対応）
    descEl.innerHTML = place.description;

    // 説明の背景を非表示、フォント設定
    descEl.style.background = 'none';
    descEl.style.border = 'none';
    descEl.style.boxShadow = 'none';
    descEl.style.fontFamily = '"ヒラギノ角ゴシック", "Hiragino Sans", sans-serif';
    descEl.style.color = '#333333';

    // ジム・スクールのテーブルを一旦非表示
    document.getElementById('gymTableArea').style.display = 'none';
    document.getElementById('schoolTableArea').style.display = 'none';

    // 施設スタイルのリセット
    document.getElementById('actionButtons').classList.remove('hospital-buttons', 'shop-buttons');
    document.querySelector('.action-view-content').style.borderColor = '';

    // 病院の特別処理
    if (place === places.hospital) {
        const p = gameState.player;
        const diseaseInfo = p.disease ? diseasesData.find(d => d.id === p.disease) : null;
        if (diseaseInfo) {
            descEl.innerHTML = diseaseInfo.doctorMsg;
            currentActions = [
                { name: 'お願いします', description: '', effect: () => treatDisease() },
                { name: 'ぼったくりっぽいのでやめる', description: '', effect: () => backToMap() }
            ];
        } else {
            descEl.innerHTML = 'どこも悪いところはないようです。<br>念のため注射を打っておきますか？<br>10,000円かかりますが。。。';
            currentActions = [
                { name: 'お願いします', description: '', effect: () => preventiveShot() },
                { name: '金を取られる前に退散する', description: '', effect: () => backToMap() }
            ];
        }
        // ボタン生成
        const hospitalBtns = document.getElementById('actionButtons');
        let html = '';
        currentActions.forEach((action, index) => {
            html += `
                <button class="btn btn-primary action-btn" onclick="executeAction(${index})">
                    <span class="action-btn-name">${action.name}</span>
                </button>
            `;
        });
        hospitalBtns.innerHTML = html;
        hospitalBtns.classList.add('hospital-buttons');
        document.querySelector('.action-view-content').style.borderColor = '#5FC4C5';
        return;
    }

    // ジム専用テーブルの表示制御
    if (place === places.gym) {
        renderGymTable();
        document.getElementById('gymTableArea').style.display = 'block';
    }
    if (place === places.school) {
        renderSchoolTable();
        document.getElementById('schoolTableArea').style.display = 'block';
    }

    // アクションを保存
    currentActions = place.actions;

    // アクションボタンを生成
    const buttonsContainer = document.getElementById('actionButtons');
    let html = '';

    place.actions.forEach((action, index) => {
        const descHtml = action.description ? `<span class="action-btn-desc">${action.description}</span>` : '';
        html += `
            <button class="btn btn-primary action-btn" onclick="executeAction(${index})">
                <span class="action-btn-name">${action.name}</span>
                ${descHtml}
            </button>
        `;
    });

    buttonsContainer.innerHTML = html;

    // 商店スタイルの適用
    if (place === places.shop) {
        buttonsContainer.classList.add('shop-buttons');
    }
}

// アクション実行関数
function executeAction(index) {
    if (currentActions[index] && currentActions[index].effect) {
        currentActions[index].effect();
    }
}

// ============================================
// マップに戻る
// ============================================
function backToMap() {
    document.getElementById('mapView').style.display = 'block';
    document.getElementById('actionView').style.display = 'none';
    document.getElementById('tweetView').style.display = 'none';
    // 銀行画面も非表示に
    document.getElementById('bankDepositView').style.display = 'none';
    document.getElementById('bankDepositCompleteView').style.display = 'none';
    document.getElementById('bankWithdrawView').style.display = 'none';
    document.getElementById('bankWithdrawCompleteView').style.display = 'none';
    // ジム・スクール結果画面も非表示に
    document.getElementById('gymResultView').style.display = 'none';
    document.getElementById('schoolResultView').style.display = 'none';
    // アクション後のみランダムイベント判定
    if (gameState.pendingRandomEvent) {
        gameState.pendingRandomEvent = false;
        tryShowRandomEvent();
    }
}

// ============================================
// ステータス更新
// ============================================
function updateStatus() {
    const p = gameState.player;

    // 基本情報
    document.getElementById('playerAvatar').innerHTML = `<img src="${p.avatar}" alt="アバター" class="player-avatar-img">`;
    document.getElementById('playerAvatar').style.backgroundColor = p.avatarBgColor;
    document.getElementById('playerName').textContent = p.name;
    document.getElementById('money').textContent = p.money.toLocaleString();

    // 総資産計算（所持金 + 銀行預金）
    document.getElementById('totalAssets').textContent = (p.money + gameState.savings).toLocaleString();

    // 職業
    document.getElementById('playerJob').textContent = p.job;
    document.getElementById('playerJobLevel').textContent = '';

    // 身体ステータス
    document.getElementById('health').textContent = Math.floor(p.health);
    document.getElementById('intelligence').textContent = Math.floor(p.intelligence);
    document.getElementById('weight').textContent = p.weight.toFixed(1);
    document.getElementById('height').textContent = p.height;

    // BMI計算: 体重(kg) ÷ {身長(m) × 身長(m)}
    const heightInMeters = p.height / 100;
    const bmi = p.weight / (heightInMeters * heightInMeters);
    document.getElementById('bodyFat').textContent = bmi.toFixed(1);

    // バー更新
    const healthPercent = p.health / p.maxHealth * 100;
    const intelligencePercent = p.intelligence / p.maxIntelligence * 100;

    // ゲージ色の計算
    const getBarColor = (percent) => {
        if (percent <= 10) return '#EB6101';
        if (percent <= 50) return '#EAD504';
        return '#329E27';
    };

    const healthBar = document.getElementById('healthBar');
    const intelligenceBar = document.getElementById('intelligenceBar');

    if (healthBar) {
        healthBar.style.width = healthPercent + '%';
        healthBar.style.background = getBarColor(healthPercent);
    }
    if (intelligenceBar) {
        intelligenceBar.style.width = intelligencePercent + '%';
        intelligenceBar.style.background = getBarColor(intelligencePercent);
    }

    // 空腹度テキスト
    const hungerResult = getHungerText();
    const hungerEl = document.getElementById('hungerText');
    if (hungerEl) {
        hungerEl.textContent = hungerResult.text;
        hungerEl.style.color = hungerResult.isWarning ? '#EB6101' : '';
    }

    // コンディション
    const condition = getCondition();
    const conditionEl = document.getElementById('condition');
    if (conditionEl) {
        conditionEl.textContent = condition.text;
        conditionEl.style.color = condition.class === 'bad' ? '#D32F2F' : '';
    }

    // BMIラベル
    const bmiLabel = getBMILabel(bmi);
    const bmiLabelEl = document.getElementById('bodyFatLabel');
    if (bmiLabelEl) {
        bmiLabelEl.textContent = bmiLabel.text;
        bmiLabelEl.className = 'body-fat-label ' + bmiLabel.class;
    }

    // 所有物更新
    renderPossessions();
}

// ============================================
// 職業レベル取得
// ============================================
function getCurrentJobLevel() {
    const exp = gameState.player.jobExp;
    for (let i = jobLevels.length - 1; i >= 0; i--) {
        if (exp >= jobLevels[i].expRequired) {
            return jobLevels[i];
        }
    }
    return jobLevels[0];
}

// ============================================
// 空腹度テキスト（時間ベース）
// ============================================

// 空腹度ステージ定義（startHours: そのステージの開始時間）
const hungerStages = [
    { stage: 1, text: '満腹（食事できません）', isWarning: true, startHours: 0 },
    { stage: 2, text: '丁度いい', isWarning: false, startHours: 2 },
    { stage: 3, text: 'やや空腹', isWarning: false, startHours: 8 },
    { stage: 4, text: '空腹', isWarning: false, startHours: 16 },
    { stage: 5, text: 'かなり空腹', isWarning: false, startHours: 24 },
    { stage: 6, text: '死にそう⋯', isWarning: true, startHours: 72 }
];

function getHungerText() {
    const lastMeal = gameState.player.lastMealTime;
    const now = Date.now();
    const hoursElapsed = (now - lastMeal) / (1000 * 60 * 60);

    // 後ろから判定して該当ステージを返す
    for (let i = hungerStages.length - 1; i >= 0; i--) {
        if (hoursElapsed >= hungerStages[i].startHours) {
            return { text: hungerStages[i].text, isWarning: hungerStages[i].isWarning, stage: hungerStages[i].stage };
        }
    }
    return { text: hungerStages[0].text, isWarning: hungerStages[0].isWarning, stage: 1 };
}

// ============================================
// コンディション判定
// ============================================
function getCondition() {
    const p = gameState.player;
    const hungerStatus = getHungerText();

    // 死にそうな状態 → 絶不調
    if (hungerStatus.text === '死にそう⋯') {
        return { text: '絶不調', class: 'bad' };
    }
    // 病気の場合は病名を表示
    if (p.disease) {
        const diseaseInfo = diseasesData.find(d => d.id === p.disease);
        if (diseaseInfo) {
            return { text: diseaseInfo.name, class: 'bad' };
        }
    }

    // 「最高」判定：空腹度が丁度いい & 身体・頭脳パワー両方95%以上 & BMI 17~30
    const hpRatio = p.health / p.maxHealth;
    const intRatio = p.intelligence / p.maxIntelligence;
    const heightM = p.height / 100;
    const bmi = p.weight / (heightM * heightM);
    if (hungerStatus.text === '丁度いい' && hpRatio >= 0.95 && intRatio >= 0.95 && bmi >= 17 && bmi < 30) {
        return { text: '最高', class: 'best' };
    }

    // 身体パワー + 頭脳パワーの合計で判定
    const totalPower = p.health + p.intelligence;
    const maxTotalPower = p.maxHealth + p.maxIntelligence;
    const powerRatio = totalPower / maxTotalPower;

    if (powerRatio >= 0.8) {
        return { text: '良好', class: 'good' };
    }
    if (powerRatio >= 0.5) {
        return { text: '普通', class: 'normal' };
    }
    if (powerRatio >= 0.3) {
        return { text: '悪い', class: 'tired' };
    }
    return { text: 'かなり悪い', class: 'bad' };
}

// ============================================
// BMIラベル
// ============================================
function getBMILabel(bmi) {
    if (bmi < 17) return { text: 'やせすぎ', class: 'thin' };
    if (bmi < 18.5) return { text: 'やせ', class: 'thin' };
    if (bmi < 25) return { text: '普通', class: 'normal' };
    if (bmi < 30) return { text: 'やや肥満', class: 'overweight' };
    return { text: '肥満', class: 'overweight' };
}

// ============================================
// 所有物描画
// ============================================
function renderPossessions() {
    const container = document.getElementById('possessions');
    if (!container) return; // 要素が存在しない場合はスキップ

    const poss = gameState.player.possessions;

    if (poss.length === 0) {
        container.innerHTML = '<div class="empty-inventory">何も持っていません</div>';
        return;
    }

    // アイテムをグループ化（同じ名前のアイテムをまとめる）
    const grouped = {};
    poss.forEach(item => {
        if (grouped[item.name]) {
            grouped[item.name].count++;
        } else {
            grouped[item.name] = { ...item, count: 1 };
        }
    });

    let html = '';
    Object.values(grouped).forEach(item => {
        const isConsumable = item.consumable;
        const countBadge = item.count > 1 ? `<span class="possession-count">×${item.count}</span>` : '';
        const useButton = isConsumable ? `<button class="btn-use" onclick="useItem('${item.name}')">使う</button>` : '';

        html += `
            <div class="possession-item ${isConsumable ? 'consumable' : ''}">
                <span class="possession-emoji">${item.emoji || ''}</span>
                <span class="possession-name">${item.name}</span>
                ${countBadge}
                ${useButton}
            </div>
        `;
    });

    container.innerHTML = html;
}

// ============================================
// アイテム使用
// ============================================
function useItem(itemName) {
    const p = gameState.player;
    const itemIndex = p.possessions.findIndex(item => item.name === itemName);

    if (itemIndex === -1) {
        return;
    }

    const item = p.possessions[itemIndex];
    const shopItem = shopItems.find(si => si.name === itemName) || shokudoItems.find(si => si.name === itemName);

    if (!shopItem || !shopItem.consumable) {
        return;
    }

    // パワーチェック（消費パワーが足りるか確認）
    const bodyConsume = shopItem.bodyConsume || 0;
    const brainConsume = shopItem.brainConsume || 0;
    if (p.health < bodyConsume && p.intelligence < brainConsume) {
        showToast('身体パワーと頭脳パワーが足りません');
        return;
    } else if (p.health < bodyConsume) {
        showToast('身体パワーが足りません');
        return;
    } else if (p.intelligence < brainConsume) {
        showToast('頭脳パワーが足りません');
        return;
    }

    // パワー消費
    p.health = Math.max(0, p.health - bodyConsume);
    p.intelligence = Math.max(0, p.intelligence - brainConsume);

    // 効果を適用
    if (shopItem.effect) {
        if (shopItem.effect.health) {
            changeHealth(shopItem.effect.health);
        }
        if (shopItem.effect.intelligence) {
            changeIntelligence(shopItem.effect.intelligence);
        }
        if (shopItem.effect.weight) {
            changeWeight(shopItem.effect.weight);
        }
        if (shopItem.effect.hunger) {
            eatFood(shopItem.hungerEffect || 1);
        }
        if (shopItem.effect.bodyFat) {
            changeBodyFat(shopItem.effect.bodyFat);
        }
    }

    // カロリーによる体重増加（1000kcal = 1kg）
    if (shopItem.calorie && shopItem.calorie > 0) {
        const weightGain = shopItem.calorie / 1000;
        changeWeight(weightGain);
    }

    // 能力値を適用
    if (shopItem.stats) {
        const stats = shopItem.stats;
        const abilities = p.abilities;

        for (const key in stats) {
            if (key in abilities && stats[key]) {
                abilities[key] += stats[key];
            }
        }
    }

    // アイテムを消費（残り回数を減らす）
    if (item.remainingUses > 1) {
        item.remainingUses -= 1;
    } else {
        // 残り1個の場合は削除
        p.possessions.splice(itemIndex, 1);
    }
    updateStatus();
}


// ============================================
// ステータス変更ヘルパー
// ============================================
function changeHealth(amount) {
    const p = gameState.player;
    p.health = Math.max(0, Math.min(p.maxHealth, p.health + amount));
    updateStatus();
}

function changeMoney(amount) {
    gameState.player.money += amount;
    updateStatus();
}

function changeIntelligence(amount) {
    const p = gameState.player;
    // ノートパソコン所持で効率UP
    const hasLaptop = p.possessions.some(item => item.name === 'ノートパソコン');
    const finalAmount = hasLaptop && amount > 0 ? amount * 2 : amount;
    p.intelligence = Math.max(0, Math.min(p.maxIntelligence, p.intelligence + finalAmount));
    updateStatus();
}

function changeWeight(amount) {
    gameState.player.weight = Math.max(40, gameState.player.weight + amount);
    updateStatus();
}

function changeHunger(amount) {
    // 食事した場合（マイナス値）は lastMealTime をリセット
    if (amount < 0) {
        eatFood();
    }
    // プラス値は何もしない（時間ベースのため）
    updateStatus();
}

// 食事関数（hungerEffectの段階数ぶん空腹度を回復）
function eatFood(stages = 1) {
    const hungerStatus = getHungerText();
    if (hungerStatus.text === '満腹（食事できません）') {
        return false;
    }

    // 現在のステージからstages分だけ回復（最低ステージ1＝満腹）
    const currentStage = hungerStatus.stage;
    const targetStage = Math.max(1, currentStage - stages);

    // 目標ステージの開始時間ぶんだけlastMealTimeを設定
    const targetHours = hungerStages[targetStage - 1].startHours;
    gameState.player.lastMealTime = Date.now() - targetHours * 60 * 60 * 1000;

    gameState.player.mealCount++;
    updateStatus();
    return true;
}

function changeBodyFat(amount) {
    const p = gameState.player;
    p.bodyFat = Math.max(5, Math.min(40, p.bodyFat + amount));
    updateStatus();
}

// ============================================
// アクション後の処理
// ============================================
function afterAction() {
    gameState.actionCount++;
    gameState.pendingRandomEvent = true;
}

// ============================================
// パワー自然回復（30秒に1ポイント）
// ============================================
setInterval(() => {
    const p = gameState.player;
    if (p.health < p.maxHealth) {
        p.health = Math.min(p.maxHealth, p.health + 1);
    }
    if (p.intelligence < p.maxIntelligence) {
        p.intelligence = Math.min(p.maxIntelligence, p.intelligence + 1);
    }
    updateStatus();
}, 30000);

// ============================================
// アクション関数
// ============================================

// 会社モーダル
let workCooldownInterval = null;

function openWorkModal() {
    const modal = document.getElementById('workModal');
    const messageEl = document.getElementById('workResultMessage');
    const detailsEl = document.getElementById('workResultDetails');
    const p = gameState.player;

    // 無職チェック
    if (p.job === '無職') {
        messageEl.innerHTML = '<span class="error-text">ERROR！</span><br>まだ職に就いていないようです。<br>E-12の職業安定所で職を探しましょう！';
        messageEl.classList.add('no-job');
        detailsEl.innerHTML = '';
    } else {
        // 現在の職業データを取得
        const job = jobsData.find(j => j.id === p.currentJobId);
        if (!job) {
            messageEl.innerHTML = '職業データが見つかりません。';
            messageEl.classList.add('no-job');
            detailsEl.innerHTML = '';
            modal.classList.add('active');
            return;
        }

        // 出勤間隔チェック（1分 = 60000ミリ秒）
        const workInterval = 0; // テスト用: 時間制限なし（本来は10分: 600000）
        if (p.lastWorkTime && Date.now() - p.lastWorkTime < workInterval) {
            messageEl.classList.add('no-job');
            detailsEl.innerHTML = '';

            // カウントダウン更新関数
            const updateWorkCooldown = () => {
                const remaining = workInterval - (Date.now() - p.lastWorkTime);
                if (remaining <= 0) {
                    if (workCooldownInterval) {
                        clearInterval(workCooldownInterval);
                        workCooldownInterval = null;
                    }
                    messageEl.innerHTML = '出勤できるようになりました！';
                    return;
                }
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                const timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                messageEl.innerHTML = `<span class="error-text">ERROR！</span><br>仕事に行ける間隔は1分です。<br>次に出勤できるまであと ${timeText}`;
            };

            updateWorkCooldown();
            if (workCooldownInterval) clearInterval(workCooldownInterval);
            workCooldownInterval = setInterval(updateWorkCooldown, 1000);

            modal.classList.add('active');
            return;
        }

        // コンディションチェック
        const condition = getCondition();
        if (condition.text === '絶不調') {
            messageEl.innerHTML = '<span class="error-text">ERROR！</span><br>コンディションが絶不調のため出勤できないようです。。。';
            messageEl.classList.add('no-job');
            detailsEl.innerHTML = '';
            modal.classList.add('active');
            return;
        }

        // BMIチェック
        const heightM = p.height / 100;
        const playerBMI = p.weight / (heightM * heightM);
        const minBMI = job.conditions.bmi[0];
        if (playerBMI < minBMI) {
            messageEl.innerHTML = '<span class="error-text">ERROR！</span><br>体格指数（BMI）が足りていないため出勤できません。。。';
            messageEl.classList.add('no-job');
            detailsEl.innerHTML = '';
            modal.classList.add('active');
            return;
        }

        // パワーチェック
        const bodyConsume = job.bodyConsume;
        const brainConsume = job.brainConsume;

        if (p.health < bodyConsume && p.intelligence < brainConsume) {
            messageEl.innerHTML = '<span class="error-text">ERROR！</span><br>身体パワーと頭脳パワーが足りないようです！';
            messageEl.classList.add('no-job');
            detailsEl.innerHTML = '';
            modal.classList.add('active');
            return;
        } else if (p.health < bodyConsume) {
            messageEl.innerHTML = '<span class="error-text">ERROR！</span><br>身体パワーが足りないようです！';
            messageEl.classList.add('no-job');
            detailsEl.innerHTML = '';
            modal.classList.add('active');
            return;
        } else if (p.intelligence < brainConsume) {
            messageEl.innerHTML = '<span class="error-text">ERROR！</span><br>頭脳パワーが足りないようです！';
            messageEl.classList.add('no-job');
            detailsEl.innerHTML = '';
            modal.classList.add('active');
            return;
        }

        // 最終出勤時刻を記録
        p.lastWorkTime = Date.now();

        // 出勤回数をカウント
        p.workCount++;

        // 経験値（コンディションに応じてランダム）
        const prevLevel = getCurrentJobLevel();
        const prevSalary = Math.floor(job.salary * prevLevel.salaryRate);

        let expGain;
        // 病気のときは経験値が減る
        const diseaseInfo = p.disease ? diseasesData.find(d => d.id === p.disease) : null;
        if (diseaseInfo) {
            if (diseaseInfo.severity === 1) {
                expGain = -(Math.floor(Math.random() * 3) + 2); // -2~-4
            } else if (diseaseInfo.severity === 2) {
                expGain = -(Math.floor(Math.random() * 4) + 5); // -5~-8
            } else {
                expGain = -(Math.floor(Math.random() * 4) + 9); // -9~-12
            }
        } else if (condition.text === '最高') {
            expGain = 20;
        } else if (condition.text === '良好') {
            expGain = Math.floor(Math.random() * 4) + 14; // 14~17
        } else if (condition.text === '普通') {
            expGain = Math.floor(Math.random() * 4) + 10; // 10~13
        } else if (condition.text === '悪い') {
            expGain = Math.floor(Math.random() * 4) + 6; // 6~9
        } else {
            expGain = Math.floor(Math.random() * 4) + 2; // 2~5（かなり悪い）
        }
        p.jobExp = Math.max(0, p.jobExp + expGain);

        // レベルアップチェック
        const newLevel = getCurrentJobLevel();
        const newSalary = Math.floor(job.salary * newLevel.salaryRate);
        const leveledUp = newLevel.level > prevLevel.level;

        // 身体パワー・頭脳パワー消費
        p.health = Math.max(0, p.health - bodyConsume);
        p.intelligence = Math.max(0, p.intelligence - brainConsume);

        // 体重減少（ベース0.05 + 身体消費に応じた減少）
        const weightLoss = 0.05 + bodyConsume * 0.01;
        p.weight = Math.max(0, p.weight - weightLoss);

        // 給料計算（昇給率を適用）
        const baseSalary = Math.floor(job.salary * newLevel.salaryRate);
        let salaryEarned = baseSalary;
        let bonusEarned = 0;

        // レベルアップボーナス（前のレベルの給料で計算）
        if (leveledUp && job.bonus > 0) {
            bonusEarned = prevSalary * job.bonus;
        }

        // 給料・ボーナスを所持金に追加
        const totalEarned = salaryEarned + bonusEarned;
        if (totalEarned > 0) {
            p.money += totalEarned;
        }

        // 表示を更新
        messageEl.innerHTML = `仕事に出かけました(${p.workCount}回目)`;
        messageEl.classList.remove('no-job');

        let detailsHTML = `
            <p>${expGain >= 0 ? `${expGain}の経験値を得ました。` : `経験値が${Math.abs(expGain)}下がってしまいました。`}</p>
            <p>身体パワーを${bodyConsume}使いました。</p>
            <p>頭脳パワーを${brainConsume}使いました。</p>
            <p>体重が${weightLoss.toFixed(2)}kg減りました。</p>
        `;

        // 給料表示
        if (salaryEarned > 0) {
            detailsHTML += `<p class="salary-info">${salaryEarned.toLocaleString()}円のお給料をもらいました！</p>`;
        }

        // ボーナス表示
        if (bonusEarned > 0) {
            detailsHTML += `<p class="bonus-info">${bonusEarned.toLocaleString()}円のボーナスが出ました！</p>`;
        }

        // レベルアップ表示
        if (leveledUp) {
            detailsHTML += `<p class="levelup-info">レベルが${newLevel.level}へ上がりました！</p>`;
            detailsHTML += `<p class="levelup-info">${newSalary.toLocaleString()}円 / 1回に昇給しました！</p>`;
        }

        detailsEl.innerHTML = detailsHTML;

        // ステータス更新
        updateStatus();
    }

    modal.classList.add('active');
}

function closeWorkModal() {
    if (workCooldownInterval) {
        clearInterval(workCooldownInterval);
        workCooldownInterval = null;
    }
    document.getElementById('workModal').classList.remove('active');
    // ランダムイベント判定
    tryShowRandomEvent();
}

// ジム
const gymMenus = [
    { name: 'スイミング', stats: { 体力: 8, ルックス: 7, 素早さ: 6, エロさ: 9 }, price: 15000, bodyConsume: 20, bmi: [17, 35] },
    { name: 'ダンス', stats: { ルックス: 6, 素早さ: 7, 面白さ: 7, エロさ: 10 }, price: 15000, bodyConsume: 20, bmi: [17, 32] },
    { name: 'ジョギング', stats: { 体力: 8, 気力: 8, ルックス: 7, 優しさ: 7 }, price: 15000, bodyConsume: 20, bmi: [17, 35] },
    { name: 'フットサル', stats: { 体力: 6, 素早さ: 9, 面白さ: 7, 優しさ: 8 }, price: 15000, bodyConsume: 20, bmi: [17, 33] },
    { name: 'テニス', stats: { 体力: 7, 気力: 6, 素早さ: 10, 面白さ: 7 }, price: 15000, bodyConsume: 20, bmi: [17, 33] },
    { name: '空手', stats: { 体力: 8, 気力: 10, 優しさ: 7, エロさ: 5 }, price: 15000, bodyConsume: 20, bmi: [17, 35] },
    { name: 'ヨガ', stats: { 気力: 7, ルックス: 8, 優しさ: 5, エロさ: 10 }, price: 15000, bodyConsume: 20, bmi: [17, 40] },
    { name: 'ボクシング', stats: { 体力: 8, 素早さ: 9, 面白さ: 5, エロさ: 8 }, price: 15000, bodyConsume: 20, bmi: [17, 35] },
    { name: 'トランポリン', stats: { ルックス: 6, 素早さ: 5, 面白さ: 11, 優しさ: 8 }, price: 15000, bodyConsume: 20, bmi: [17, 30] },
    { name: '弓道', stats: { 気力: 10, ルックス: 7, 面白さ: 5, 優しさ: 8 }, price: 15000, bodyConsume: 20, bmi: [17, 40] },
    { name: 'バレエ', stats: { 気力: 5, ルックス: 10, 素早さ: 6, エロさ: 9 }, price: 15000, bodyConsume: 20, bmi: [17, 25] },
    { name: 'ボルダリング', stats: { 体力: 7, 気力: 6, 面白さ: 9, 優しさ: 8 }, price: 15000, bodyConsume: 20, bmi: [17, 28] }
];

function renderGymTable() {
    const tbody = document.getElementById('gymTableBody');
    const abilities = gameState.player.abilities;
    const playerBmi = gameState.player.weight / ((gameState.player.height / 100) ** 2);

    const gymAbilityKeys = ['体力', '気力', 'ルックス', '素早さ', '面白さ', '優しさ', 'エロさ'];

    // ユーザー能力値行
    let userCells = '';
    gymAbilityKeys.forEach(key => {
        userCells += `<td>${abilities[key]}</td>`;
    });

    const userStatsRow = `
        <tr class="gym-user-stats">
            <td class="gym-user-stats-label">現在の能力値</td>
            ${userCells}
            <td>${playerBmi.toFixed(1)}</td>
            <td>-</td>
            <td>-</td>
        </tr>
    `;

    // メニュー行
    let menuRows = '';
    gymMenus.forEach((menu, index) => {
        let abilityCells = '';
        gymAbilityKeys.forEach(key => {
            const val = menu.stats[key];
            abilityCells += `<td>${val ? val : '-'}</td>`;
        });

        const bmiText = `${menu.bmi[0]}〜${menu.bmi[1]}`;
        const bmiOk = playerBmi >= menu.bmi[0] && playerBmi <= menu.bmi[1];
        const bmiClass = bmiOk ? 'stat-met' : 'stat-not-met';

        menuRows += `
            <tr>
                <td class="gym-menu-name"><label><input type="radio" name="gymMenu" class="gym-radio" value="${index}"> ${menu.name}</label></td>
                ${abilityCells}
                <td class="${bmiClass}">${bmiText}</td>
                <td>${menu.price.toLocaleString()}円</td>
                <td>${menu.bodyConsume}</td>
            </tr>
        `;
    });

    tbody.innerHTML = userStatsRow + menuRows;
}

// ============================================
// 習い事スクール
// ============================================
const schoolMenus = [
    { name: '英会話教室', stats: { 国語: 8, 社会: 7, 英語: 9, 音楽: 6 }, price: 15000, brainConsume: 20 },
    { name: 'ピアノレッスン', stats: { 数学: 5, 理科: 7, 音楽: 9, 美術: 9 }, price: 15000, brainConsume: 20 },
    { name: 'プログラミング講座', stats: { 数学: 10, 理科: 8, 社会: 5, 英語: 7 }, price: 15000, brainConsume: 20 },
    { name: 'お料理教室', stats: { 国語: 6, 理科: 8, 社会: 8, 美術: 8 }, price: 15000, brainConsume: 20 },
    { name: 'イラスト講座', stats: { 国語: 7, 数学: 6, 音楽: 7, 美術: 10 }, price: 15000, brainConsume: 20 },
    { name: 'ボーカルレッスン', stats: { 国語: 6, 英語: 7, 音楽: 10, 美術: 7 }, price: 15000, brainConsume: 20 },
    { name: '写真教室', stats: { 理科: 7, 社会: 8, 音楽: 7, 美術: 8 }, price: 15000, brainConsume: 20 },
    { name: 'コーヒー講座', stats: { 国語: 8, 数学: 8, 理科: 7, 社会: 7 }, price: 15000, brainConsume: 20 },
    { name: '心理学講座', stats: { 国語: 9, 数学: 8, 社会: 8, 英語: 5 }, price: 15000, brainConsume: 20 },
    { name: 'ペン字・美文字', stats: { 国語: 8, 数学: 5, 英語: 7, 美術: 10 }, price: 15000, brainConsume: 20 },
    { name: '占い講座', stats: { 理科: 7, 社会: 8, 英語: 9, 音楽: 6 }, price: 15000, brainConsume: 20 },
    { name: 'マネーリテラシー講座', stats: { 数学: 9, 理科: 7, 英語: 8, 音楽: 6 }, price: 15000, brainConsume: 20 }
];

function renderSchoolTable() {
    const tbody = document.getElementById('schoolTableBody');
    const abilities = gameState.player.abilities;

    const schoolAbilityKeys = ['国語', '数学', '理科', '社会', '英語', '音楽', '美術'];

    // ユーザー能力値行
    let userCells = '';
    schoolAbilityKeys.forEach(key => {
        userCells += `<td>${abilities[key]}</td>`;
    });

    const userStatsRow = `
        <tr class="gym-user-stats">
            <td class="gym-user-stats-label">現在の能力値</td>
            ${userCells}
            <td>-</td>
            <td>-</td>
        </tr>
    `;

    // メニュー行
    let menuRows = '';
    schoolMenus.forEach((menu, index) => {
        let abilityCells = '';
        schoolAbilityKeys.forEach(key => {
            const val = menu.stats[key];
            abilityCells += `<td>${val ? val : '-'}</td>`;
        });

        menuRows += `
            <tr>
                <td class="gym-menu-name"><label><input type="radio" name="schoolMenu" class="gym-radio" value="${index}"> ${menu.name}</label></td>
                ${abilityCells}
                <td>${menu.price.toLocaleString()}円</td>
                <td>${menu.brainConsume}</td>
            </tr>
        `;
    });

    tbody.innerHTML = userStatsRow + menuRows;
}

function doSchoolLesson() {
    const selected = document.querySelector('input[name="schoolMenu"]:checked');
    if (!selected) {
        showToast('メニューを選択してください');
        return;
    }

    const menu = schoolMenus[selected.value];
    const p = gameState.player;

    // 病気チェック
    if (p.disease) {
        const diseaseInfo = diseasesData.find(d => d.id === p.disease);
        showToast(`${diseaseInfo ? diseaseInfo.name : '病気'}のためレッスンを受けられません。。。`, 2000);
        return;
    }

    // クールダウンチェック（30分）※テスト用: 無効化
    /* if (gameState.lastSchoolTime) {
        const elapsed = Date.now() - new Date(gameState.lastSchoolTime).getTime();
        const cooldownMs = 30 * 60 * 1000;
        if (elapsed < cooldownMs) {
            const remaining = cooldownMs - elapsed;
            const min = Math.floor(remaining / 60000);
            const sec = Math.floor((remaining % 60000) / 1000);
            showToast(`まだ30分経過していません。\n次のレッスンまであと ${min}分${sec.toString().padStart(2, '0')}秒`, 3000);
            return;
        }
    } */

    // 所持金チェック
    if (p.money < menu.price) {
        showToast('所持金が足りません');
        return;
    }

    // 頭脳パワーチェック
    if (p.intelligence < menu.brainConsume) {
        showToast('頭脳パワーが足りません');
        return;
    }

    // 支払い＆消費
    changeMoney(-menu.price);
    changeIntelligence(-menu.brainConsume);

    // クールダウン開始時刻を記録
    gameState.lastSchoolTime = new Date().toISOString();

    // 能力値を加算
    const abilities = p.abilities;
    for (const key in menu.stats) {
        if (key in abilities && menu.stats[key]) {
            abilities[key] += menu.stats[key];
        }
    }

    updateStatus();

    // 結果表示（画面切り替え）
    let statsHtml = '';
    for (const [key, value] of Object.entries(menu.stats)) {
        if (value > 0) {
            statsHtml += `<div class="gym-stat-up-item">${key}が <strong>+${value}</strong> アップ！</div>`;
        }
    }

    document.getElementById('schoolResultMessage').textContent = `${menu.name}を受講しました！`;
    document.getElementById('schoolResultStats').innerHTML = statsHtml;

    // アクションビューを隠してスクール結果画面を表示
    document.getElementById('actionView').style.display = 'none';
    document.getElementById('schoolResultView').style.display = 'block';

    afterAction();
}

// はてなツールチップ（position:fixed で overflow の影響を回避）
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.gym-hatena-wrapper').forEach(wrapper => {
        const icon = wrapper.querySelector('.gym-hatena-icon');
        const tooltip = wrapper.querySelector('.gym-hatena-tooltip');
        if (icon && tooltip) {
            icon.addEventListener('mouseenter', () => {
                const rect = icon.getBoundingClientRect();
                tooltip.style.left = (rect.left + rect.width / 2) + 'px';
                tooltip.style.top = (rect.top - 8) + 'px';
                tooltip.style.transform = 'translate(-50%, -100%)';
                tooltip.style.display = 'block';
            });
            icon.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        }
    });
});

// トースト通知
let toastTimer = null;
function showToast(message, duration = 2000) {
    const el = document.getElementById('toastNotification');
    el.textContent = message;
    el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        el.classList.remove('show');
    }, duration);
}

function doGymTraining() {
    const selected = document.querySelector('input[name="gymMenu"]:checked');
    if (!selected) {
        showToast('メニューを選択してください');
        return;
    }

    const menu = gymMenus[selected.value];
    const p = gameState.player;

    // 病気チェック
    if (p.disease) {
        const diseaseInfo = diseasesData.find(d => d.id === p.disease);
        showToast(`${diseaseInfo ? diseaseInfo.name : '病気'}のためトレーニングできません。。。`, 2000);
        return;
    }

    // クールダウンチェック（30分）※テスト用: 無効化
    /* if (gameState.lastGymTime) {
        const elapsed = Date.now() - new Date(gameState.lastGymTime).getTime();
        const cooldownMs = 30 * 60 * 1000;
        if (elapsed < cooldownMs) {
            const remaining = cooldownMs - elapsed;
            const min = Math.floor(remaining / 60000);
            const sec = Math.floor((remaining % 60000) / 1000);
            showToast(`まだ30分経過していません。\n次のトレーニングまであと ${min}分${sec.toString().padStart(2, '0')}秒`, 3000);
            return;
        }
    } */

    const playerBmi = p.weight / ((p.height / 100) ** 2);

    // BMIチェック
    if (playerBmi < menu.bmi[0] || playerBmi > menu.bmi[1]) {
        showToast('体格指数（BMI）が条件を満たしていません');
        return;
    }

    // 所持金チェック
    if (p.money < menu.price) {
        showToast('所持金が足りません');
        return;
    }

    // 身体パワーチェック
    if (p.health < menu.bodyConsume) {
        showToast('身体パワーが足りません');
        return;
    }

    // 支払い＆消費
    changeMoney(-menu.price);
    changeHealth(-menu.bodyConsume);

    // クールダウン開始時刻を記録
    gameState.lastGymTime = new Date().toISOString();

    // 能力値を加算
    const abilities = p.abilities;
    for (const key in menu.stats) {
        if (key in abilities && menu.stats[key]) {
            abilities[key] += menu.stats[key];
        }
    }

    updateStatus();

    // 結果表示（画面切り替え）
    let statsHtml = '';
    for (const [key, value] of Object.entries(menu.stats)) {
        if (value > 0) {
            statsHtml += `<div class="gym-stat-up-item">${key}が <strong>+${value}</strong> アップ！</div>`;
        }
    }

    document.getElementById('gymResultMessage').textContent = `${menu.name}をしました！`;
    document.getElementById('gymResultStats').innerHTML = statsHtml;

    // アクションビューを隠してジム結果画面を表示
    document.getElementById('actionView').style.display = 'none';
    document.getElementById('gymResultView').style.display = 'block';

    afterAction();
}

// BGM
// ↓ここに曲を追加するだけでランダム再生されます♪
const onsenBgmList = [
    'BGM/onsen-ryokan-1.mp3',
    'BGM/onsen-ryokan-3.mp3',
    'BGM/onsen-ryokan-6.mp3',
    'BGM/onsen-ryokan-7.mp3',
    'BGM/onsen-ryokan-8.mp3',
    'BGM/onsen-ryokan-9.mp3',
    'BGM/onsen-ryokan-15.mp3',
    'BGM/onsen-ryokan-16.mp3',
    'BGM/onsen-ryokan-17.mp3',
    'BGM/onsen-ryokan-18.mp3',
    'BGM/onsen-ryokan-19.mp3',
    'BGM/onsen-ryokan-20.mp3',
];

let bgmPlaying = false;
let lastBgmIndex = -1;
const bgmAudio = new Audio();
bgmAudio.volume = 0.50;

function playRandomBgm() {
    let index;
    if (onsenBgmList.length === 1) {
        index = 0;
    } else {
        do {
            index = Math.floor(Math.random() * onsenBgmList.length);
        } while (index === lastBgmIndex);
    }
    lastBgmIndex = index;
    bgmAudio.src = onsenBgmList[index];
    bgmAudio.play();
}

// 曲が終わったら次のランダム曲を再生
bgmAudio.addEventListener('ended', () => {
    if (bgmPlaying) {
        playRandomBgm();
    }
});

function toggleBgm() {
    if (bgmPlaying) {
        bgmAudio.pause();
        bgmPlaying = false;
    } else {
        playRandomBgm();
        bgmPlaying = true;
    }
}

// 温泉施設
let onsenBgTimer = null;
let onsenRecoveryTimer = null;

function normalBath() {
    if (gameState.player.money < 1500) {
        return;
    }
    changeMoney(-1500);
    updateStatus();

    const p = gameState.player;
    const healthPercent = p.health / p.maxHealth * 100;
    const intelligencePercent = p.intelligence / p.maxIntelligence * 100;
    const getBarColor = (percent) => {
        if (percent <= 10) return '#EB6101';
        if (percent <= 50) return '#EAD504';
        return '#329E27';
    };

    document.getElementById('onsenHealth').textContent = p.health;
    document.getElementById('onsenMaxHealth').textContent = p.maxHealth;
    document.getElementById('onsenHealthBar').style.width = healthPercent + '%';
    document.getElementById('onsenHealthBar').style.background = getBarColor(healthPercent);

    document.getElementById('onsenIntelligence').textContent = p.intelligence;
    document.getElementById('onsenMaxIntelligence').textContent = p.maxIntelligence;
    document.getElementById('onsenIntelligenceBar').style.width = intelligencePercent + '%';
    document.getElementById('onsenIntelligenceBar').style.background = getBarColor(intelligencePercent);

    document.getElementById('onsenModal').classList.add('active');

    // 背景画像の交互切り替え開始
    const img = document.getElementById('onsenBgImg');
    let isFirst = true;
    img.src = 'haikei/onsen.png';
    onsenBgTimer = setInterval(() => {
        isFirst = !isFirst;
        img.src = isFirst ? 'haikei/onsen.png' : 'haikei/onsen2.png';
    }, 2000);

    // 10倍速回復（3秒に1ポイント）
    onsenRecoveryTimer = setInterval(() => {
        const pl = gameState.player;
        let recovered = false;
        if (pl.health < pl.maxHealth) {
            pl.health = Math.min(pl.maxHealth, pl.health + 1);
            recovered = true;
        }
        if (pl.intelligence < pl.maxIntelligence) {
            pl.intelligence = Math.min(pl.maxIntelligence, pl.intelligence + 1);
            recovered = true;
        }
        if (recovered) {
            const hp = pl.health / pl.maxHealth * 100;
            const ip = pl.intelligence / pl.maxIntelligence * 100;
            const barColor = (pct) => pct <= 10 ? '#EB6101' : pct <= 50 ? '#EAD504' : '#329E27';
            document.getElementById('onsenHealth').textContent = pl.health;
            document.getElementById('onsenHealthBar').style.width = hp + '%';
            document.getElementById('onsenHealthBar').style.background = barColor(hp);
            document.getElementById('onsenIntelligence').textContent = pl.intelligence;
            document.getElementById('onsenIntelligenceBar').style.width = ip + '%';
            document.getElementById('onsenIntelligenceBar').style.background = barColor(ip);
            updateStatus();
        }
    }, 3000);
}

function closeOnsenModal() {
    // タイマー停止
    if (onsenBgTimer) {
        clearInterval(onsenBgTimer);
        onsenBgTimer = null;
    }
    if (onsenRecoveryTimer) {
        clearInterval(onsenRecoveryTimer);
        onsenRecoveryTimer = null;
    }
    // BGM停止
    bgmAudio.pause();
    bgmAudio.currentTime = 0;
    bgmPlaying = false;
    document.getElementById('onsenModal').classList.remove('active');
    // ランダムイベント判定
    tryShowRandomEvent();
}

function adBath() {
    // TODO: 広告風呂の処理
}

// 病院
function treatDisease() {
    const p = gameState.player;
    const diseaseInfo = p.disease ? diseasesData.find(d => d.id === p.disease) : null;
    if (!diseaseInfo) return;

    // 所持金チェック
    if (p.money < diseaseInfo.cost) {
        showToast('お金が足りません。。。', 2000);
        return;
    }

    // 治療実行
    p.money -= diseaseInfo.cost;
    p.disease = null;
    gameState.pendingRandomEvent = true;
    updateStatus();

    // 説明文を更新
    const descEl = document.getElementById('actionViewDesc');
    descEl.innerHTML = '病気の治療が完了しました。<br>これでもう安心です。<br>病気の際はまた当院をご利用くださいませ。';

    // ボタンをOKだけに変更
    const buttonsContainer = document.getElementById('actionButtons');
    buttonsContainer.innerHTML = `
        <button class="btn btn-primary action-btn" onclick="backToMap()">
            <span class="action-btn-name">OK</span>
        </button>
    `;
}

function preventiveShot() {
    const p = gameState.player;

    // 所持金チェック
    if (p.money < 10000) {
        showToast('お金が足りません。。。', 2000);
        return;
    }

    // 注射実行
    p.money -= 10000;
    gameState.pendingRandomEvent = true;
    updateStatus();

    // 説明文を更新
    const descEl = document.getElementById('actionViewDesc');
    descEl.innerHTML = 'これで風邪予防は万全です。<br>まぁ、だからと言って体調に何の変化もありませんがね。<br>ぜひまたお待ちしております。';

    // ボタンをOKだけに変更
    const buttonsContainer = document.getElementById('actionButtons');
    buttonsContainer.innerHTML = `
        <button class="btn btn-primary action-btn" onclick="backToMap()">
            <span class="action-btn-name">OK</span>
        </button>
    `;
}

// 銀行
function deposit() {
    // 銀行お預け画面を表示
    document.getElementById('actionView').style.display = 'none';
    document.getElementById('bankDepositView').style.display = 'block';

    // 現在の所持金と預金残高を表示
    document.getElementById('depositCurrentMoney').textContent = gameState.player.money.toLocaleString();
    document.getElementById('depositCurrentSavings').textContent = gameState.savings.toLocaleString();

    // 入力欄をリセット
    document.getElementById('depositAmount').value = '';
}

function backToBankMenu() {
    // 銀行メニューに戻る
    document.getElementById('bankDepositView').style.display = 'none';
    document.getElementById('bankDepositCompleteView').style.display = 'none';
    document.getElementById('bankWithdrawView').style.display = 'none';
    document.getElementById('bankWithdrawCompleteView').style.display = 'none';
    document.getElementById('bankTransferView').style.display = 'none';
    document.getElementById('bankTransferConfirmView').style.display = 'none';
    document.getElementById('bankHistoryView').style.display = 'none';
    document.getElementById('actionView').style.display = 'block';
}

function showDepositComplete(amount) {
    // 預け入れ完了画面を表示
    document.getElementById('depositCompleteAmount').textContent = amount.toLocaleString();
    document.getElementById('depositCompleteMoney').textContent = gameState.player.money.toLocaleString();
    document.getElementById('depositCompleteSavings').textContent = gameState.savings.toLocaleString();

    document.getElementById('bankDepositView').style.display = 'none';
    document.getElementById('bankDepositCompleteView').style.display = 'block';
}

function confirmDeposit() {
    const amount = parseInt(document.getElementById('depositAmount').value) || 0;

    if (amount <= 0) {
        return;
    }

    if (amount > gameState.player.money) {
        return;
    }

    // 預け入れ処理
    gameState.player.money -= amount;
    gameState.savings += amount;
    addBankHistory('deposit', amount, 'お預入れ');
    updateStatus();

    // 完了画面を表示
    showDepositComplete(amount);
    afterAction();
}

function depositKeepAmount() {
    const keepAmount = parseInt(document.getElementById('depositKeepAmount').value);
    const currentMoney = gameState.player.money;

    // 残す金額より所持金が少ない場合
    if (currentMoney <= keepAmount) {
        return;
    }

    // 預ける金額を計算（所持金 - 残す金額）
    const depositAmount = currentMoney - keepAmount;

    // 預け入れ処理
    gameState.player.money -= depositAmount;
    gameState.savings += depositAmount;
    addBankHistory('deposit', depositAmount, 'お預入れ');
    updateStatus();

    // 完了画面を表示
    showDepositComplete(depositAmount);
    afterAction();
}

function showBankHistory() {
    // 銀行入出金明細画面を表示
    document.getElementById('actionView').style.display = 'none';
    document.getElementById('bankHistoryView').style.display = 'block';

    // テーブルを更新
    renderBankHistory();
}

function renderBankHistory() {
    const tbody = document.getElementById('bankHistoryTableBody');
    const emptyMsg = document.getElementById('bankHistoryEmpty');

    // 最新100件を取得（新しい順）
    const history = gameState.bankHistory.slice(-100).reverse();

    if (history.length === 0) {
        tbody.innerHTML = '';
        emptyMsg.style.display = 'block';
        return;
    }

    emptyMsg.style.display = 'none';

    tbody.innerHTML = history.map(item => {
        const date = new Date(item.date);
        const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
        const payment = item.payment ? `<span class="payment">-${item.payment.toLocaleString()}</span>` : '';
        const deposit = item.deposit ? `<span class="deposit">+${item.deposit.toLocaleString()}</span>` : '';
        const balance = `<span class="balance">${item.balance.toLocaleString()}</span>`;

        return `
            <tr>
                <td>${dateStr}</td>
                <td>${item.description}</td>
                <td>${payment}</td>
                <td>${deposit}</td>
                <td>${balance}</td>
            </tr>
        `;
    }).join('');
}

function addBankHistory(type, amount, description, memo = '') {
    const now = new Date();
    const entry = {
        date: now.getTime(),
        payment: type === 'payment' ? amount : 0,
        deposit: type === 'deposit' ? amount : 0,
        description: description,
        balance: gameState.savings,
        memo: memo
    };

    gameState.bankHistory.push(entry);

    // 100件を超えたら古いものを削除
    if (gameState.bankHistory.length > 100) {
        gameState.bankHistory = gameState.bankHistory.slice(-100);
    }
}

function showTransfer() {
    // 銀行お振り込み画面を表示
    document.getElementById('actionView').style.display = 'none';
    document.getElementById('bankTransferView').style.display = 'block';

    // 預金残高を表示
    document.getElementById('transferCurrentSavings').textContent = gameState.savings.toLocaleString();

    // 入力欄をリセット
    document.getElementById('transferName').value = '';
    document.getElementById('transferAmount').value = '';
}

function showTransferConfirm() {
    const name = document.getElementById('transferName').value.trim();
    const amount = parseInt(document.getElementById('transferAmount').value) || 0;
    const errorEl = document.getElementById('transferErrorMessage');

    if (gameState.savings <= 0) {
        errorEl.textContent = '預金が無いためお振込みができません';
        errorEl.style.display = 'block';
        return;
    }

    if (!name) {
        errorEl.textContent = 'お振込み先のお名前を入力してください';
        errorEl.style.display = 'block';
        return;
    }

    if (amount <= 0 || amount > gameState.savings) {
        errorEl.textContent = '預金残高が足りません';
        errorEl.style.display = 'block';
        return;
    }

    errorEl.style.display = 'none';

    // 確認画面に情報を表示
    document.getElementById('transferTargetName').textContent = name;
    document.getElementById('transferTargetJob').textContent = '---'; // Firebase連携時に取得
    document.getElementById('transferTargetAvatar').innerHTML = `<img src="${gameState.player.avatar}" alt="アバター" class="player-avatar-img">`;
    document.getElementById('transferTargetAvatar').style.backgroundColor = gameState.player.avatarBgColor;
    document.getElementById('transferConfirmAmount').textContent = amount.toLocaleString();
    document.getElementById('transferConfirmSavings').textContent = gameState.savings.toLocaleString();

    // 確認画面を表示
    document.getElementById('bankTransferView').style.display = 'none';
    document.getElementById('bankTransferConfirmView').style.display = 'block';
}

function backToTransferInput() {
    // 入力画面に戻る
    document.getElementById('bankTransferConfirmView').style.display = 'none';
    document.getElementById('bankTransferView').style.display = 'block';
}

function confirmTransfer() {
    const name = document.getElementById('transferName').value.trim();
    const amount = parseInt(document.getElementById('transferAmount').value) || 0;

    // 振り込み処理（普通口座から引き落とし）
    gameState.savings -= amount;
    addBankHistory('payment', amount, `お振込み→${name}`);
    updateStatus();

    // 確認画面を非表示にして銀行メニューに戻る
    document.getElementById('bankTransferConfirmView').style.display = 'none';
    backToBankMenu();
    afterAction();
}

function withdraw() {
    // 銀行お引き出し画面を表示
    document.getElementById('actionView').style.display = 'none';
    document.getElementById('bankWithdrawView').style.display = 'block';

    // 現在の所持金と預金残高を表示
    document.getElementById('withdrawCurrentMoney').textContent = gameState.player.money.toLocaleString();
    document.getElementById('withdrawCurrentSavings').textContent = gameState.savings.toLocaleString();

    // 入力欄をリセット
    document.getElementById('withdrawAmount').value = '';
}

function showWithdrawComplete(amount) {
    // 引き出し完了画面を表示
    document.getElementById('withdrawCompleteAmount').textContent = amount.toLocaleString();
    document.getElementById('withdrawCompleteMoney').textContent = gameState.player.money.toLocaleString();
    document.getElementById('withdrawCompleteSavings').textContent = gameState.savings.toLocaleString();

    document.getElementById('bankWithdrawView').style.display = 'none';
    document.getElementById('bankWithdrawCompleteView').style.display = 'block';
}

function confirmWithdraw() {
    const amount = parseInt(document.getElementById('withdrawAmount').value) || 0;

    if (amount <= 0) {
        return;
    }

    if (amount > gameState.savings) {
        return;
    }

    // 引き出し処理
    gameState.savings -= amount;
    gameState.player.money += amount;
    addBankHistory('payment', amount, 'お引き出し');
    updateStatus();

    // 完了画面を表示
    showWithdrawComplete(amount);
    afterAction();
}

function withdrawFixedAmount() {
    const selectValue = document.getElementById('withdrawFixedAmount').value;

    // 全額の場合
    let amount;
    if (selectValue === 'all') {
        amount = gameState.savings;
        if (amount <= 0) {
            return;
        }
    } else {
        amount = parseInt(selectValue);
        if (amount > gameState.savings) {
            return;
        }
    }

    // 引き出し処理
    gameState.savings -= amount;
    gameState.player.money += amount;
    addBankHistory('payment', amount, 'お引き出し');
    updateStatus();

    // 完了画面を表示
    showWithdrawComplete(amount);
    afterAction();
}

function withdrawKeepAmount() {
    const keepAmount = parseInt(document.getElementById('withdrawKeepAmount').value);
    const currentSavings = gameState.savings;

    // 残す金額より預金が少ない場合
    if (currentSavings <= keepAmount) {
        return;
    }

    // 引き出す金額を計算（預金 - 残す金額）
    const withdrawAmount = currentSavings - keepAmount;

    // 引き出し処理
    gameState.savings -= withdrawAmount;
    gameState.player.money += withdrawAmount;
    addBankHistory('payment', withdrawAmount, 'お引き出し');
    updateStatus();

    // 完了画面を表示
    showWithdrawComplete(withdrawAmount);
    afterAction();
}

// 神社
function pray() {
    if (gameState.player.money < 100) {
        return;
    }
    changeMoney(-100);
    const luck = Math.random();
    if (luck < 0.3) {
        changeMoney(500);
    } else {
        changeHealth(10);
    }
    afterAction();
}

function drawFortune() {
    if (gameState.player.money < 200) {
        return;
    }
    changeMoney(-200);
    const fortunes = [
        { name: '大吉', effect: () => { changeMoney(1000); return '臨時収入1000円！'; } },
        { name: '吉', effect: () => { changeHealth(20); return '体力+20！'; } },
        { name: '中吉', effect: () => { changeIntelligence(5); return '知力+5！'; } },
        { name: '小吉', effect: () => { changeHealth(10); return '体力+10！'; } },
        { name: '末吉', effect: () => { return '今日は静かに過ごしましょう'; } },
        { name: '凶', effect: () => { changeHealth(-5); return 'ちょっと疲れました...'; } }
    ];
    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
    const result = fortune.effect();
    afterAction();
}

// 学校

// ゲームセンター
function playGames() {
    if (gameState.player.money < 300) {
        return;
    }
    changeMoney(-300);
    changeHealth(5);
    changeIntelligence(3);
    afterAction();
}

function craneGame() {
    if (gameState.player.money < 200) {
        return;
    }
    changeMoney(-200);

    const chance = Math.random();
    if (chance < 0.25) {
        const prizes = [
            { name: 'ぬいぐるみ', emoji: '🧸' },
            { name: 'キーホルダー', emoji: '🔑' },
            { name: 'お菓子', emoji: '🍬' }
        ];
        const prize = prizes[Math.floor(Math.random() * prizes.length)];
        gameState.player.possessions.push({
            name: prize.name,
            emoji: prize.emoji,
            consumable: false
        });
        updateStatus();
    }
    afterAction();
}

// ============================================
// 商店機能
// ============================================
function openShop() {
    const modal = document.getElementById('shopModal');
    const tbody = document.getElementById('shopTableBody');

    // ビューをリセット（買い物リスト画面に戻す）
    document.getElementById('shopListView').style.display = 'block';
    document.getElementById('shopConfirmView').style.display = 'none';
    document.getElementById('shopNoMoneyView').style.display = 'none';
    document.getElementById('shopCompleteView').style.display = 'none';
    document.getElementById('shopModal').querySelector('.shop-header').style.display = '';
    document.getElementById('shopMoney').style.display = 'block';
    document.getElementById('shopTitle').textContent = 'デパートの品揃えは毎日変わります。ぜひ見ていってくださいね！';

    // 所持金を表示
    document.getElementById('shopMoney').textContent = `現在の所持金：${gameState.player.money.toLocaleString()}円`;

    // 能力値行をテーブル先頭に生成
    const abilities = gameState.player.abilities;
    const abilityKeys = ['国語', '数学', '理科', '社会', '英語', '音楽', '美術', '体力', '気力', 'ルックス', '素早さ', '面白さ', '優しさ', 'エロさ'];
    let abilityCells = '';
    abilityKeys.forEach(key => {
        abilityCells += `<td>${abilities[key]}</td>`;
    });

    // 目標職業の能力値行
    let targetJobRow = '';
    if (gameState.player.targetJob) {
        const targetJob = jobsData.find(j => j.id === gameState.player.targetJob);
        if (targetJob) {
            let targetCells = '';
            abilityKeys.forEach(key => {
                const req = targetJob.abilities[key];
                targetCells += `<td>${req || '-'}</td>`;
            });
            targetJobRow = `
        <tr class="target-job-stats">
            <td class="target-job-stats-label">目標の職業：${targetJob.name}</td>
            ${targetCells}
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
        </tr>`;
        }
    }

    let html = `
        <tr class="gym-user-stats">
            <td class="gym-user-stats-label">現在の能力値</td>
            ${abilityCells}
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
        </tr>
        ${targetJobRow}
    `;
    shopItems.forEach((item, index) => {
        if (item.type === 'separator') {
            html += `<tr class="separator-row"><td colspan="23">${item.name}</td></tr>`;
            return;
        }

        // 非消費アイテムは1つしか持てない
        const alreadyOwned = !item.consumable &&
            gameState.player.possessions.some(p => p.name === item.name);

        // 在庫表示（stockプロパティがあればその値、なければ従来ロジック）
        const stock = item.stock !== undefined ? item.stock : (item.consumable ? '∞' : (alreadyOwned ? '0' : '1'));

        // 在庫切れの場合はチェックボックスを無効化
        const isDisabled = (!item.consumable && alreadyOwned) || (item.stock !== undefined && item.stock <= 0);

        html += `
            <tr>
                <td class="gym-menu-name"><label><input type="checkbox" class="shop-checkbox" data-index="${index}" ${isDisabled ? 'disabled' : ''}> ${item.name}</label></td>
                <td>${item.stats?.国語 || '-'}</td>
                <td>${item.stats?.数学 || '-'}</td>
                <td>${item.stats?.理科 || '-'}</td>
                <td>${item.stats?.社会 || '-'}</td>
                <td>${item.stats?.英語 || '-'}</td>
                <td>${item.stats?.音楽 || '-'}</td>
                <td>${item.stats?.美術 || '-'}</td>
                <td>${item.stats?.体力 || '-'}</td>
                <td>${item.stats?.気力 || '-'}</td>
                <td>${item.stats?.ルックス || '-'}</td>
                <td>${item.stats?.素早さ || '-'}</td>
                <td>${item.stats?.面白さ || '-'}</td>
                <td>${item.stats?.優しさ || '-'}</td>
                <td>${item.stats?.エロさ || '-'}</td>
                <td>${item.calorie ? item.calorie + 'kcal' : '-'}</td>
                <td>${item.useCount || '-'}</td>
                <td>${item.cooldown && item.cooldown !== '0分' ? item.cooldown : '-'}</td>
                <td>${item.bodyConsume ? item.bodyConsume : '-'}</td>
                <td>${item.brainConsume ? item.brainConsume : '-'}</td>
                <td>${item.description || '-'}</td>
                <td>${item.price.toLocaleString()}円</td>
                <td>${stock}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;

    // ヘッダー高さに基づいてstickyのtop値を設定
    requestAnimationFrame(() => {
        const table = document.getElementById('shopTable');
        const headerRows = table.querySelectorAll('thead tr');
        if (headerRows.length >= 2) {
            const firstRowHeight = headerRows[0].offsetHeight;
            const totalHeaderHeight = firstRowHeight + headerRows[1].offsetHeight;
            headerRows[1].querySelectorAll('th').forEach(th => {
                th.style.top = firstRowHeight + 'px';
            });
            const userStatsRow = table.querySelector('.gym-user-stats');
            if (userStatsRow) {
                userStatsRow.style.top = totalHeaderHeight + 'px';
                const targetRow = table.querySelector('.target-job-stats');
                if (targetRow) {
                    targetRow.style.top = (totalHeaderHeight + userStatsRow.offsetHeight) + 'px';
                }
            }
        }
    });

    // チェックボックスの変更を監視
    const checkboxes = document.querySelectorAll('.shop-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updatePurchaseButton);
    });

    // 購入ボタンの状態をリセット
    updatePurchaseButton();

    modal.classList.add('active');

    // ヘッダー高さに基づいてstickyのtop値を設定
    requestAnimationFrame(() => {
        const table = document.getElementById('shopTable');
        const headerRows = table.querySelectorAll('thead tr');
        if (headerRows.length >= 2) {
            const firstRowHeight = headerRows[0].offsetHeight;
            const totalHeaderHeight = firstRowHeight + headerRows[1].offsetHeight;
            headerRows[1].querySelectorAll('th').forEach(th => {
                th.style.top = firstRowHeight + 'px';
            });
            const userStatsRow = table.querySelector('.gym-user-stats');
            if (userStatsRow) {
                userStatsRow.style.top = totalHeaderHeight + 'px';
            }
        }
    });
}

function updatePurchaseButton() {
    const checkboxes = document.querySelectorAll('.shop-checkbox:checked');
    const purchaseBtn = document.getElementById('shopPurchaseBtn');

    if (checkboxes.length > 0) {
        purchaseBtn.disabled = false;
        purchaseBtn.classList.add('active');
    } else {
        purchaseBtn.disabled = true;
        purchaseBtn.classList.remove('active');
    }
}

function closeShop() {
    document.getElementById('shopModal').classList.remove('active');
}

function closeShopAndOpenInventory() {
    closeShop();
    openInventoryModal();
}

function purchaseSelectedItems() {
    const checkboxes = document.querySelectorAll('.shop-checkbox:checked');
    if (checkboxes.length === 0) return;

    // 選択された商品を取得
    const selectedItems = [];
    let totalPrice = 0;

    checkboxes.forEach(checkbox => {
        const index = parseInt(checkbox.dataset.index);
        const item = shopItems[index];
        if (item && item.type !== 'separator') {
            selectedItems.push(item);
            totalPrice += item.price;
        }
    });

    // 確認画面に商品一覧を表示
    const itemsList = document.getElementById('confirmItemsList');
    let html = '';
    selectedItems.forEach(item => {
        html += `
            <div class="confirm-item">
                <span class="confirm-item-name">${item.name}</span>
                <span class="confirm-item-price">${item.price.toLocaleString()}円</span>
            </div>
        `;
    });
    itemsList.innerHTML = html;

    // 合計金額を表示
    document.getElementById('confirmTotalPrice').textContent = totalPrice.toLocaleString() + '円';

    // 購入確認用に保存
    pendingPurchase.items = selectedItems;
    pendingPurchase.totalPrice = totalPrice;

    // 所持金を表示
    document.getElementById('confirmCurrentMoney').textContent = `現在の所持金：${gameState.player.money.toLocaleString()}円`;

    // ビューを切り替え
    document.getElementById('shopListView').style.display = 'none';
    document.getElementById('shopConfirmView').style.display = 'block';
    document.getElementById('shopModal').querySelector('.shop-header').style.display = 'none';
}

function backToShopList() {
    // ビューを切り替え
    document.getElementById('shopConfirmView').style.display = 'none';
    document.getElementById('shopNoMoneyView').style.display = 'none';
    document.getElementById('shopListView').style.display = 'block';
    document.getElementById('shopModal').querySelector('.shop-header').style.display = '';
    document.getElementById('shopTitle').textContent = 'デパートの品揃えは毎日変わります。ぜひ見ていってくださいね！';
}


function confirmPurchase() {
    const items = pendingPurchase.items;
    const totalPrice = pendingPurchase.totalPrice;

    // 所持金チェック
    if (gameState.player.money < totalPrice) {
        // 所持金不足ビューを表示
        document.getElementById('noMoneyCurrentMoney').textContent = gameState.player.money.toLocaleString() + '円';
        document.getElementById('noMoneyTotalPrice').textContent = totalPrice.toLocaleString() + '円';
        document.getElementById('noMoneyShortage').textContent = (totalPrice - gameState.player.money).toLocaleString() + '円';
        document.getElementById('shopConfirmView').style.display = 'none';
        document.getElementById('shopNoMoneyView').style.display = 'block';
        document.getElementById('shopModal').querySelector('.shop-header').style.display = 'none';
        return;
    }

    // 各アイテムを所持品に追加
    items.forEach(item => {
        // 消費アイテムの場合、既存のアイテムがあれば残り回数を増やす
        if (item.consumable) {
            const existingItem = gameState.player.possessions.find(p => p.name === item.name);
            if (existingItem) {
                existingItem.remainingUses += (item.useCount || 1);
                return;
            }
        }

        // 非消費アイテムは1つしか持てない
        if (!item.consumable) {
            const alreadyOwned = gameState.player.possessions.some(p => p.name === item.name);
            if (alreadyOwned) {
                return;
            }
        }

        // 新規アイテムを追加
        gameState.player.possessions.push({
            name: item.name,
            consumable: item.consumable,
            price: item.price,
            description: item.description,
            effect: item.effect,
            stats: item.stats || {},
            calorie: item.calorie,
            useCount: item.useCount,
            remainingUses: item.useCount || 1,
            cooldown: item.cooldown,
            bodyConsume: item.bodyConsume,
            brainConsume: item.brainConsume,
            purchaseDate: new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
        });
    });

    // お金を減らす
    changeMoney(-totalPrice);

    // 購入完了画面に商品一覧を表示
    const completeList = document.getElementById('completeItemsList');
    let html = '';
    items.forEach(item => {
        html += `<div class="complete-item">${item.name}</div>`;
    });
    completeList.innerHTML = html;

    // 購入完了ビューを表示
    document.getElementById('shopConfirmView').style.display = 'none';
    document.getElementById('shopCompleteView').style.display = 'block';
    document.getElementById('shopModal').querySelector('.shop-header').style.display = 'none';

    updateStatus();
}


function buyItem(index) {
    const item = shopItems[index];
    if (!item || item.type === 'separator') return;

    if (gameState.player.money < item.price) {
        return;
    }

    // 非消費アイテム（高額商品）は1つしか持てない
    if (!item.consumable) {
        const alreadyOwned = gameState.player.possessions.some(p => p.name === item.name);
        if (alreadyOwned) {
            return;
        }
    }

    changeMoney(-item.price);

    // 消費アイテムの場合、既存のアイテムがあれば残り回数を増やす
    if (item.consumable) {
        const existingItem = gameState.player.possessions.find(p => p.name === item.name);
        if (existingItem) {
            existingItem.remainingUses += (item.useCount || 1);
            updateStatus();
            openShop();
            return;
        }
    }

    // 新規アイテムを追加（すべてのステータスを保存）
    gameState.player.possessions.push({
        name: item.name,
        consumable: item.consumable,
        price: item.price,
        description: item.description,
        effect: item.effect,
        stats: item.stats || {},
        calorie: item.calorie,
        useCount: item.useCount,
        remainingUses: item.useCount || 1,
        cooldown: item.cooldown,
        bodyConsume: item.bodyConsume,
        brainConsume: item.brainConsume,
        purchaseDate: new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
    });

    updateStatus();
    openShop(); // 商店を更新
}

// ============================================
// 食堂機能
// ============================================

function openShokudo() {
    const modal = document.getElementById('shokudoModal');
    const tbody = document.getElementById('shokudoTableBody');

    // ビューをリセット
    document.getElementById('shokudoListView').style.display = 'block';
    document.getElementById('shokudoConfirmView').style.display = 'none';
    document.getElementById('shokudoNoMoneyView').style.display = 'none';
    document.getElementById('shokudoCompleteView').style.display = 'none';
    document.getElementById('shokudoModal').querySelector('.shop-header').style.display = '';
    document.getElementById('shokudoMoney').style.display = 'block';
    document.getElementById('shokudoTitle').textContent = 'いらっしゃいませ！何を食べますか？';

    // 所持金を表示
    document.getElementById('shokudoMoney').textContent = `現在の所持金：${gameState.player.money.toLocaleString()}円`;

    // 能力値行をテーブル先頭に生成
    const abilities = gameState.player.abilities;
    const abilityKeys = ['国語', '数学', '理科', '社会', '英語', '音楽', '美術', '体力', '気力', 'ルックス', '素早さ', '面白さ', '優しさ', 'エロさ'];
    let abilityCells = '';
    abilityKeys.forEach(key => {
        abilityCells += `<td>${abilities[key]}</td>`;
    });

    // 目標職業の能力値行
    let targetJobRow = '';
    if (gameState.player.targetJob) {
        const targetJob = jobsData.find(j => j.id === gameState.player.targetJob);
        if (targetJob) {
            let targetCells = '';
            abilityKeys.forEach(key => {
                const req = targetJob.abilities[key];
                targetCells += `<td>${req || '-'}</td>`;
            });
            targetJobRow = `
        <tr class="target-job-stats">
            <td class="target-job-stats-label">目標の職業：${targetJob.name}</td>
            ${targetCells}
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
        </tr>`;
        }
    }

    let html = `
        <tr class="gym-user-stats">
            <td class="gym-user-stats-label">現在の能力値</td>
            ${abilityCells}
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
        </tr>
        ${targetJobRow}
    `;
    shokudoItems.forEach((item, index) => {
        if (item.type === 'separator') {
            html += `<tr class="separator-row"><td colspan="20">${item.name}</td></tr>`;
            return;
        }

        // 在庫表示
        const stock = item.stock !== undefined ? item.stock : '∞';
        const isDisabled = item.stock !== undefined && item.stock <= 0;

        html += `
            <tr>
                <td class="gym-menu-name"><label>${item.takeout
                    ? `<input type="checkbox" class="shokudo-checkbox" data-index="${index}" data-takeout="true" ${isDisabled ? 'disabled' : ''}>`
                    : `<input type="radio" name="shokudo-food" class="shokudo-checkbox" data-index="${index}" data-takeout="false" ${isDisabled ? 'disabled' : ''}>`
                } ${item.name}</label></td>
                <td>${item.stats?.国語 || '-'}</td>
                <td>${item.stats?.数学 || '-'}</td>
                <td>${item.stats?.理科 || '-'}</td>
                <td>${item.stats?.社会 || '-'}</td>
                <td>${item.stats?.英語 || '-'}</td>
                <td>${item.stats?.音楽 || '-'}</td>
                <td>${item.stats?.美術 || '-'}</td>
                <td>${item.stats?.体力 || '-'}</td>
                <td>${item.stats?.気力 || '-'}</td>
                <td>${item.stats?.ルックス || '-'}</td>
                <td>${item.stats?.素早さ || '-'}</td>
                <td>${item.stats?.面白さ || '-'}</td>
                <td>${item.stats?.優しさ || '-'}</td>
                <td>${item.stats?.エロさ || '-'}</td>
                <td>${item.calorie ? item.calorie + 'kcal' : '-'}</td>
                <td>${item.useCount ? item.useCount + '回' : '-'}</td>
                <td>${item.description || '-'}</td>
                <td>${item.price.toLocaleString()}円</td>
                <td>${stock}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;

    // ヘッダー高さに基づいてstickyのtop値を設定
    requestAnimationFrame(() => {
        const table = document.getElementById('shokudoTable');
        const headerRows = table.querySelectorAll('thead tr');
        if (headerRows.length >= 2) {
            const firstRowHeight = headerRows[0].offsetHeight;
            const totalHeaderHeight = firstRowHeight + headerRows[1].offsetHeight;
            headerRows[1].querySelectorAll('th').forEach(th => {
                th.style.top = firstRowHeight + 'px';
            });
            const userStatsRow = table.querySelector('.gym-user-stats');
            if (userStatsRow) {
                userStatsRow.style.top = totalHeaderHeight + 'px';
                const targetRow = table.querySelector('.target-job-stats');
                if (targetRow) {
                    targetRow.style.top = (totalHeaderHeight + userStatsRow.offsetHeight) + 'px';
                }
            }
        }
    });

    // チェックボックス・ラジオボタンの変更を監視
    const checkboxes = document.querySelectorAll('.shokudo-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateShokudoPurchaseButton(this);
        });
    });

    // 購入ボタンの状態をリセット
    updateShokudoPurchaseButton();

    modal.classList.add('active');
}

function updateShokudoPurchaseButton(changedCheckbox) {
    // テイクアウト品と食料品の排他制御
    if (changedCheckbox && changedCheckbox.checked) {
        const isTakeout = changedCheckbox.dataset.takeout === 'true';
        if (isTakeout) {
            // テイクアウト品を選んだ → 食料品のラジオを解除
            document.querySelectorAll('.shokudo-checkbox[data-takeout="false"]').forEach(radio => {
                radio.checked = false;
            });
        } else {
            // 食料品を選んだ → テイクアウト品のチェックボックスを全解除
            document.querySelectorAll('.shokudo-checkbox[data-takeout="true"]').forEach(cb => {
                cb.checked = false;
            });
        }
    }

    const checkboxes = document.querySelectorAll('.shokudo-checkbox:checked');
    const purchaseBtn = document.getElementById('shokudoPurchaseBtn');

    if (checkboxes.length > 0) {
        purchaseBtn.disabled = false;
        purchaseBtn.classList.add('active');
    } else {
        purchaseBtn.disabled = true;
        purchaseBtn.classList.remove('active');
    }
}

function closeShokudo() {
    document.getElementById('shokudoModal').classList.remove('active');
}

function closeShokudoAndOpenInventory() {
    closeShokudo();
    openInventoryModal();
}

function purchaseShokudoItems() {
    const checkboxes = document.querySelectorAll('.shokudo-checkbox:checked');
    if (checkboxes.length === 0) return;

    const selectedItems = [];
    let totalPrice = 0;

    checkboxes.forEach(checkbox => {
        const index = parseInt(checkbox.dataset.index);
        const item = shokudoItems[index];
        if (item && item.type !== 'separator') {
            selectedItems.push(item);
            totalPrice += item.price;
        }
    });

    pendingShokudoPurchase.items = selectedItems;
    pendingShokudoPurchase.totalPrice = totalPrice;

    // 食料品（その場で食べる）→ 確認画面スキップして直接実行
    const isFoodOnly = selectedItems.every(item => !item.takeout);
    if (isFoodOnly) {
        confirmShokudoPurchase();
        return;
    }

    // テイクアウト品 → 確認画面を表示
    const itemsList = document.getElementById('shokudoConfirmItemsList');
    let html = '';
    selectedItems.forEach(item => {
        html += `
            <div class="confirm-item">
                <span class="confirm-item-name">${item.name}</span>
                <span class="confirm-item-price">${item.price.toLocaleString()}円</span>
            </div>
        `;
    });
    itemsList.innerHTML = html;

    document.getElementById('shokudoConfirmTotalPrice').textContent = totalPrice.toLocaleString() + '円';

    // 所持金を表示
    document.getElementById('shokudoConfirmCurrentMoney').textContent = `現在の所持金：${gameState.player.money.toLocaleString()}円`;

    document.getElementById('shokudoListView').style.display = 'none';
    document.getElementById('shokudoConfirmView').style.display = 'block';
    document.getElementById('shokudoModal').querySelector('.shop-header').style.display = 'none';
}

function backToShokudoList() {
    document.getElementById('shokudoConfirmView').style.display = 'none';
    document.getElementById('shokudoNoMoneyView').style.display = 'none';
    document.getElementById('shokudoFullView').style.display = 'none';
    document.getElementById('shokudoListView').style.display = 'block';
    document.getElementById('shokudoModal').querySelector('.shop-header').style.display = '';
    document.getElementById('shokudoMoney').style.display = 'block';
    document.getElementById('shokudoTitle').textContent = 'いらっしゃいませ！何を食べますか？';
}

function confirmShokudoPurchase() {
    const items = pendingShokudoPurchase.items;
    const totalPrice = pendingShokudoPurchase.totalPrice;

    // 満腹チェック（食料品が含まれている場合）
    const hasEatHere = items.some(item => !item.takeout);
    if (hasEatHere) {
        const hungerStatus = getHungerText();
        if (hungerStatus.text === '満腹（食事できません）') {
            document.getElementById('shokudoListView').style.display = 'none';
            document.getElementById('shokudoConfirmView').style.display = 'none';
            document.getElementById('shokudoFullView').style.display = 'block';
            document.getElementById('shokudoModal').querySelector('.shop-header').style.display = 'none';
            return;
        }
    }

    // 所持金チェック
    if (gameState.player.money < totalPrice) {
        document.getElementById('shokudoNoMoneyCurrentMoney').textContent = gameState.player.money.toLocaleString() + '円';
        document.getElementById('shokudoNoMoneyTotalPrice').textContent = totalPrice.toLocaleString() + '円';
        document.getElementById('shokudoNoMoneyShortage').textContent = (totalPrice - gameState.player.money).toLocaleString() + '円';
        document.getElementById('shokudoListView').style.display = 'none';
        document.getElementById('shokudoConfirmView').style.display = 'none';
        document.getElementById('shokudoNoMoneyView').style.display = 'block';
        document.getElementById('shokudoModal').querySelector('.shop-header').style.display = 'none';
        return;
    }

    // お金を減らす
    changeMoney(-totalPrice);

    // テイクアウト品と食料品を分ける
    const takeoutItems = items.filter(item => item.takeout);
    const eatHereItems = items.filter(item => !item.takeout);

    // 在庫を減らす
    items.forEach(item => {
        if (item.stock !== undefined && item.stock > 0) {
            item.stock--;
        }
    });

    // テイクアウト品 → 所持品に追加
    takeoutItems.forEach(item => {
        if (item.consumable) {
            const existingItem = gameState.player.possessions.find(p => p.name === item.name);
            if (existingItem) {
                existingItem.remainingUses += (item.useCount || 1);
                return;
            }
        }
        gameState.player.possessions.push({
            name: item.name,
            consumable: item.consumable,
            price: item.price,
            description: item.description,
            effect: item.effect,
            stats: item.stats || {},
            calorie: item.calorie,
            useCount: item.useCount,
            remainingUses: item.useCount || 1,
            purchaseDate: new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
        });
    });

    // 食料品 → その場で食べる（効果を即時適用）
    const p = gameState.player;
    let eatResultHtml = '';

    const statNames = {
        国語: '国語', 数学: '数学', 理科: '理科', 社会: '社会', 英語: '英語',
        音楽: '音楽', 美術: '美術', 体力: '体力', 気力: '気力',
        ルックス: 'ルックス', 素早さ: '素早さ', 面白さ: '面白さ',
        優しさ: '優しさ', エロさ: 'エロさ'
    };

    eatHereItems.forEach(item => {
        // 変更前の値を保存
        const beforeStats = {};
        if (item.stats) {
            for (const key in item.stats) {
                if (key in p.abilities && item.stats[key]) {
                    beforeStats[key] = p.abilities[key];
                }
            }
        }
        const beforeHunger = getHungerText().text;
        const beforeHealth = p.health;
        const beforeWeight = p.weight;

        // 空腹度回復
        if (item.effect && item.effect.hunger) {
            eatFood(item.hungerEffect || 1);
        }

        // カロリーによる体重増加
        if (item.calorie && item.calorie > 0) {
            const weightGain = item.calorie / 1000;
            changeWeight(weightGain);
        }

        // 能力値を適用
        if (item.stats) {
            for (const key in item.stats) {
                if (key in p.abilities && item.stats[key]) {
                    p.abilities[key] += item.stats[key];
                }
            }
        }

        // 変更後の値を取得
        const afterHunger = getHungerText().text;
        const afterHealth = p.health;
        const afterWeight = p.weight;

        // 結果表示用HTML
        eatResultHtml += `<div class="shokudo-eat-result">`;
        eatResultHtml += `<div class="shokudo-eat-heading">${item.name} を食べました！</div>`;
        eatResultHtml += `<div class="shokudo-eat-label">【能力値の変化】</div>`;
        eatResultHtml += `<div class="shokudo-eat-changes">`;

        // 能力値の変化（緑太字）
        if (item.stats) {
            for (const [key, value] of Object.entries(item.stats)) {
                if (value && value > 0) {
                    const before = beforeStats[key];
                    const after = p.abilities[key];
                    eatResultHtml += `<div class="shokudo-change-row">`;
                    eatResultHtml += `<span class="shokudo-change-label">${statNames[key] || key}</span>`;
                    eatResultHtml += `<span class="shokudo-change-value"><span class="shokudo-change-before">${before}</span> ▶ <span class="shokudo-change-after shokudo-change-up">${after}</span></span>`;
                    eatResultHtml += `</div>`;
                }
            }
        }

        // 空腹度の変化
        if (beforeHunger !== afterHunger) {
            eatResultHtml += `<div class="shokudo-change-row">`;
            eatResultHtml += `<span class="shokudo-change-label">空腹度</span>`;
            eatResultHtml += `<span class="shokudo-change-value"><span class="shokudo-change-before">${beforeHunger}</span> ▶ <span class="shokudo-change-after shokudo-change-up">${afterHunger}</span></span>`;
            eatResultHtml += `</div>`;
        }

        // 身体パワーの変化
        if (beforeHealth !== afterHealth) {
            eatResultHtml += `<div class="shokudo-change-row">`;
            eatResultHtml += `<span class="shokudo-change-label">身体パワー</span>`;
            eatResultHtml += `<span class="shokudo-change-value"><span class="shokudo-change-before">${beforeHealth}</span> ▶ <span class="shokudo-change-after">${afterHealth}</span></span>`;
            eatResultHtml += `</div>`;
        }

        // 体重の変化
        if (beforeWeight !== afterWeight) {
            eatResultHtml += `<div class="shokudo-change-row">`;
            eatResultHtml += `<span class="shokudo-change-label">体重</span>`;
            eatResultHtml += `<span class="shokudo-change-value"><span class="shokudo-change-before">${beforeWeight.toFixed(1)}kg</span> ▶ <span class="shokudo-change-after">${afterWeight.toFixed(1)}kg</span></span>`;
            eatResultHtml += `</div>`;
        }

        eatResultHtml += `</div>`;
        eatResultHtml += `</div>`;
    });

    // 完了画面を構築
    const completeList = document.getElementById('shokudoCompleteItemsList');
    let html = '';

    if (takeoutItems.length > 0) {
        // テイクアウト品 → 商店風の表示
        document.getElementById('shokudoCompleteHeading').style.display = '';
        document.getElementById('shokudoCompleteSubheading').style.display = '';
        document.getElementById('shokudoCompleteLabel').style.display = '';
        document.getElementById('shokudoCompleteInventoryBtn').style.display = '';
        completeList.style.border = '';
        completeList.style.background = '';
        completeList.style.width = '';
        completeList.style.display = '';
        completeList.style.marginBottom = '';
        completeList.parentElement.style.paddingTop = '';

        // 閉じるボタンをリセット
        const closeBtn = document.getElementById('shokudoCompleteCloseBtn');
        closeBtn.textContent = '閉じる';
        closeBtn.classList.remove('board-btn-confirm');
        closeBtn.classList.add('board-btn-back');

        takeoutItems.forEach(item => {
            html += `<div class="complete-item">${item.name}</div>`;
        });
    } else {
        // 食料品のみ → 能力値変化表示
        document.getElementById('shokudoCompleteHeading').style.display = 'none';
        document.getElementById('shokudoCompleteSubheading').style.display = 'none';
        document.getElementById('shokudoCompleteLabel').style.display = 'none';
        document.getElementById('shokudoCompleteInventoryBtn').style.display = 'none';
        completeList.style.border = 'none';
        completeList.style.background = 'none';
        completeList.style.width = '';
        completeList.style.display = '';
        completeList.style.marginBottom = '';
        completeList.parentElement.style.paddingTop = '';

        // 閉じるボタンをOKに変更（confirm色）
        const closeBtn = document.getElementById('shokudoCompleteCloseBtn');
        closeBtn.textContent = 'OK';
        closeBtn.classList.remove('board-btn-back');
        closeBtn.classList.add('board-btn-confirm');

        html += eatResultHtml;
    }

    completeList.innerHTML = html;

    document.getElementById('shokudoListView').style.display = 'none';
    document.getElementById('shokudoConfirmView').style.display = 'none';
    document.getElementById('shokudoCompleteView').style.display = 'block';
    document.getElementById('shokudoModal').querySelector('.shop-header').style.display = 'none';

    updateStatus();
}

// ============================================
// 売却機能
// ============================================

// アイテムのカテゴリを取得するヘルパー関数
function getItemCategory(itemName) {
    // 商店と食堂の両方から検索
    const allItems = [...shopItems, ...shokudoItems];
    let currentCategory = '';
    for (const item of allItems) {
        if (item.type === 'separator') {
            currentCategory = item.name;
        } else if (item.name === itemName) {
            return currentCategory;
        }
    }
    return '';
}

// 所持品をカテゴリごとにグループ化
function groupPossessionsByCategory(possessions) {
    const grouped = {};
    possessions.forEach((item, originalIndex) => {
        const category = getItemCategory(item.name);
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push({ ...item, originalIndex });
    });
    return grouped;
}

function openSellShop() {
    const modal = document.getElementById('sellModal');
    const tbody = document.getElementById('sellTableBody');
    const emptyMsg = document.getElementById('sellEmpty');

    // ビューをリセット
    document.getElementById('sellListView').style.display = 'block';
    document.getElementById('sellCompleteView').style.display = 'none';
    document.getElementById('sellTitle').textContent = '何を売りますか？';
    document.getElementById('sellMoney').style.display = 'block';

    // 所持金を表示
    document.getElementById('sellMoney').textContent = `所持金：${gameState.player.money.toLocaleString()}円`;

    // 売却ボタンをリセット
    const sellButton = document.getElementById('sellButton');
    sellButton.disabled = true;
    sellButton.classList.remove('btn-success');
    sellButton.classList.add('btn-disabled');

    const possessions = gameState.player.possessions;

    if (possessions.length === 0) {
        tbody.innerHTML = '';
        emptyMsg.style.display = 'block';
    } else {
        emptyMsg.style.display = 'none';
        let html = '';

        // カテゴリごとにグループ化
        const grouped = groupPossessionsByCategory(possessions);

        // shopItemsの順序でカテゴリを表示
        const categoryOrder = [...shopItems, ...shokudoItems].filter(s => s.type === 'separator').map(s => s.name);

        categoryOrder.forEach(category => {
            if (grouped[category] && grouped[category].length > 0) {
                // カテゴリヘッダー
                html += `<tr class="separator-row"><td colspan="25">${category}</td></tr>`;

                grouped[category].forEach(item => {
                    const shopItem = shopItems.find(s => s.name === item.name);
                    const originalPrice = shopItem ? shopItem.price : 0;
                    const sellPrice = Math.floor(originalPrice * 0.5);

                    html += `
                        <tr>
                            <td class="gym-menu-name"><label><input type="checkbox" class="sell-checkbox" data-index="${item.originalIndex}" data-price="${sellPrice}" onchange="updateSellButton()"> ${item.name}</label></td>
                            <td>${shopItem?.stats?.国語 || '-'}</td>
                            <td>${shopItem?.stats?.数学 || '-'}</td>
                            <td>${shopItem?.stats?.理科 || '-'}</td>
                            <td>${shopItem?.stats?.社会 || '-'}</td>
                            <td>${shopItem?.stats?.英語 || '-'}</td>
                            <td>${shopItem?.stats?.音楽 || '-'}</td>
                            <td>${shopItem?.stats?.美術 || '-'}</td>
                            <td>${shopItem?.stats?.体力 || '-'}</td>
                            <td>${shopItem?.stats?.気力 || '-'}</td>
                            <td>${shopItem?.stats?.ルックス || '-'}</td>
                            <td>${shopItem?.stats?.素早さ || '-'}</td>
                            <td>${shopItem?.stats?.面白さ || '-'}</td>
                            <td>${shopItem?.stats?.優しさ || '-'}</td>
                            <td>${shopItem?.stats?.エロさ || '-'}</td>
                            <td>${shopItem?.calorie ? shopItem.calorie + 'kcal' : '-'}</td>
                            <td>${shopItem?.useCount || '-'}</td>
                            <td>${shopItem?.cooldown && shopItem.cooldown !== '0分' ? shopItem.cooldown : '-'}</td>
                            <td>${shopItem?.bodyConsume ? shopItem.bodyConsume : '-'}</td>
                            <td>${shopItem?.brainConsume ? shopItem.brainConsume : '-'}</td>
                            <td class="sell-price">${sellPrice.toLocaleString()}円</td>
                        </tr>
                    `;
                });
            }
        });

        tbody.innerHTML = html;
    }

    modal.classList.add('active');

    // ヘッダー高さに基づいてstickyのtop値を設定
    requestAnimationFrame(() => {
        const table = document.getElementById('sellTable');
        const headerRows = table.querySelectorAll('thead tr');
        if (headerRows.length >= 2) {
            const firstRowHeight = headerRows[0].offsetHeight;
            headerRows[1].querySelectorAll('th').forEach(th => {
                th.style.top = firstRowHeight + 'px';
            });
        }
    });
}

function updateSellButton() {
    const checkboxes = document.querySelectorAll('.sell-checkbox:checked');
    const sellButton = document.getElementById('sellButton');

    if (checkboxes.length > 0) {
        sellButton.disabled = false;
        sellButton.classList.remove('btn-disabled');
        sellButton.classList.add('btn-success');
    } else {
        sellButton.disabled = true;
        sellButton.classList.remove('btn-success');
        sellButton.classList.add('btn-disabled');
    }
}

function sellSelectedItems() {
    const checkboxes = document.querySelectorAll('.sell-checkbox:checked');
    if (checkboxes.length === 0) return;

    // 選択されたアイテムの情報を保存（削除前に取得）
    const soldItems = [];
    checkboxes.forEach(checkbox => {
        const index = parseInt(checkbox.dataset.index);
        const price = parseInt(checkbox.dataset.price);
        const item = gameState.player.possessions[index];
        soldItems.push({
            name: item.name,
            price: price
        });
    });

    // 選択されたアイテムのインデックスを取得（降順でソート）
    const indices = [];
    checkboxes.forEach(checkbox => {
        indices.push(parseInt(checkbox.dataset.index));
    });
    indices.sort((a, b) => b - a);

    // 合計売却金額を計算
    let totalPrice = 0;
    soldItems.forEach(item => {
        totalPrice += item.price;
    });

    // アイテムを削除（インデックスが大きい順に削除）
    indices.forEach(index => {
        gameState.player.possessions.splice(index, 1);
    });

    // お金を増やす
    changeMoney(totalPrice);

    // 売却完了画面に商品一覧を表示
    const completeList = document.getElementById('sellCompleteItemsList');
    let html = '';
    soldItems.forEach(item => {
        html += `
            <div class="confirm-item">
                <span class="confirm-item-name">${item.name}</span>
                <span class="confirm-item-price">${item.price.toLocaleString()}円</span>
            </div>
        `;
    });
    completeList.innerHTML = html;

    // 所持金を表示
    document.getElementById('sellCompleteRemainingMoney').textContent = gameState.player.money.toLocaleString() + '円';

    // 売却完了ビューを表示
    document.getElementById('sellListView').style.display = 'none';
    document.getElementById('sellCompleteView').style.display = 'block';
    document.getElementById('sellTitle').textContent = '🎉 売却完了';
    document.getElementById('sellMoney').style.display = 'none';

    updateStatus();
}

function closeSellShop() {
    document.getElementById('sellModal').classList.remove('active');
}


// ============================================
// 掲示板機能
// ============================================

// 現在の返信先を記録する変数
let currentReplyTarget = null;
let selectedCategory = null;
let currentPostId = null;
let bookmarkedPosts = new Set();

// サンプルデータ（後でgameState.boardPostsを使う）
const sampleBoardPosts = [
    { id: 1, authorName: 'のん', date: '2026/02/04', title: 'おすすめの稼ぎ方ってありますか？', categories: ['お金', '仕事', 'ゲーム'] },
    { id: 2, authorName: 'たろう', date: '2026/02/03', title: '銀行の利息っていつ入りますか？', categories: ['お金'] },
    { id: 3, authorName: 'はなこ', date: '2026/02/02', title: '体力の回復方法を教えてください！', categories: ['健康・美容', 'ゲーム'] },
    { id: 4, authorName: 'ゆうき', date: '2026/02/01', title: 'レベル上げのコツを知りたいです', categories: ['ゲーム', '趣味'] },
    { id: 5, authorName: 'みさき', date: '2026/01/31', title: '友達の作り方がわかりません...', categories: ['人間関係', '暮らし'] },
];

// 回答データ（postIdごとに管理）
const sampleAnswers = {
    1: [
        { id: 1, authorName: 'たろう', authorAvatar: '😄', date: '2026/2/4 18:15', text: 'おすすめは仕事をたくさんすることです！\nあとは銀行に預けておくと利息がつきますよ！' },
        { id: 2, authorName: 'はなこ', authorAvatar: '🌸', date: '2026/2/4 19:30', text: '私はコンビニでアイテムを買って転売してます！\n意外と儲かりますよ〜' },
        { id: 3, authorName: 'ゆうき', authorAvatar: '🎮', date: '2026/2/4 20:45', text: '稼ぎ方についてはいくつかおすすめがあります！\n\nまず、序盤は「ハローワーク」でお仕事を見つけるのが一番です。仕事によって給料が違うので、体力と相談しながら選んでくださいね。\n\n次に、銀行預金もおすすめです。利息が毎日つくので、使わないお金は預けておきましょう！\n\nあとは、イベントにも積極的に参加するといいですよ。報酬がもらえることがあります！\n\n長くなりましたが、参考になれば嬉しいです！' },
    ]
};

function openBoard(boardType) {
    const modal = document.getElementById('boardModal');
    currentReplyTarget = null;
    selectedCategory = null;
    // TODO: boardTypeに応じて表示を切り替える（intro, happy, recommend, question）
    renderBoardPostList();
    modal.classList.add('active');
}

function closeBoard() {
    document.getElementById('boardModal').classList.remove('active');
    currentReplyTarget = null;
    selectedCategory = null;

    // 投稿フォームをリセット
    document.getElementById('newPostTitle').value = '';
    document.getElementById('newPostBody').value = '';
    document.getElementById('newPostCategory1').value = '';
    document.getElementById('newPostCategory2').value = '';
    document.getElementById('newPostCategory3').value = '';
    document.getElementById('bodyCharCount').textContent = '0';

    // 画面をメインビューに戻す
    document.getElementById('boardNewPostView').style.display = 'none';
    document.getElementById('boardConfirmView').style.display = 'none';
    document.getElementById('boardDetailView').style.display = 'none';
    document.getElementById('boardHeader').style.display = 'block';
    document.getElementById('boardMainView').style.display = 'flex';
}

function openNewPostForm() {
    // メインビューを非表示、新規投稿フォームを表示
    document.getElementById('boardMainView').style.display = 'none';
    document.getElementById('boardNewPostView').style.display = 'flex';

    // カテゴリ選択肢を生成
    const categories = ['趣味', '暮らし', '健康・美容', '仕事', '人間関係', '恋愛', 'ゲーム', 'ファッション', 'グルメ', 'トレンド', '子育て', '家電・ガジェット', '学問', 'お金', 'スポーツ', '乗り物・旅行', '雑談', 'その他'];

    const selects = ['newPostCategory1', 'newPostCategory2', 'newPostCategory3'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        // 既に選択肢があれば再生成しない（戻るボタンで戻ってきた場合）
        if (select.options.length <= 1) {
            select.innerHTML = '<option value="">選択してください</option>';
            categories.forEach(cat => {
                select.innerHTML += `<option value="${cat}">${cat}</option>`;
            });
        }
    });
}

function closeNewPostForm() {
    // 新規投稿フォームを非表示、メインビューを表示
    document.getElementById('boardNewPostView').style.display = 'none';
    document.getElementById('boardMainView').style.display = 'flex';
}

function updateBodyCharCount() {
    const body = document.getElementById('newPostBody');
    const count = document.getElementById('bodyCharCount');
    count.textContent = body.value.length;
}

function showPostConfirm() {
    // 入力値を取得
    const title = document.getElementById('newPostTitle').value.trim();
    const category1 = document.getElementById('newPostCategory1').value;
    const category2 = document.getElementById('newPostCategory2').value;
    const category3 = document.getElementById('newPostCategory3').value;
    const body = document.getElementById('newPostBody').value.trim();

    // バリデーション
    if (!title) {
        alert('タイトルを入力してください');
        return;
    }
    if (!category1) {
        alert('カテゴリを1つ以上選択してください');
        return;
    }
    if (!body) {
        alert('本文を入力してください');
        return;
    }

    // カテゴリをまとめる
    const categories = [category1, category2, category3].filter(c => c);

    // 確認画面に値を反映
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmCategories').textContent = categories.join(' , ');
    document.getElementById('confirmBody').textContent = body;

    // 新規投稿フォームを非表示、確認画面を表示
    document.getElementById('boardNewPostView').style.display = 'none';
    document.getElementById('boardHeader').style.display = 'none';
    document.getElementById('boardConfirmView').style.display = 'flex';
}

function backToEditForm() {
    // 確認画面を非表示、新規投稿フォームを表示
    document.getElementById('boardConfirmView').style.display = 'none';
    document.getElementById('boardHeader').style.display = 'block';
    document.getElementById('boardNewPostView').style.display = 'flex';
}

function submitPost() {
    try {
    // 入力値を取得
    const title = document.getElementById('newPostTitle').value.trim();
    const category1 = document.getElementById('newPostCategory1').value;
    const category2 = document.getElementById('newPostCategory2').value;
    const category3 = document.getElementById('newPostCategory3').value;
    const body = document.getElementById('newPostBody').value.trim();
    const categories = [category1, category2, category3].filter(c => c);

    // 日付を生成
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

    // 新しい投稿を作成
    const playerName = (gameState && gameState.player && gameState.player.name) ? gameState.player.name : 'ゲスト';
    const newPost = {
        id: Date.now(),
        authorName: playerName,
        date: dateStr,
        title: title,
        categories: categories,
        body: body
    };

    // 投稿リストの先頭に追加
    sampleBoardPosts.unshift(newPost);

    // 確認画面を非表示、メインビューを表示
    document.getElementById('boardConfirmView').style.display = 'none';
    document.getElementById('boardHeader').style.display = 'block';
    document.getElementById('boardMainView').style.display = 'flex';

    // フォームをリセット
    document.getElementById('newPostTitle').value = '';
    document.getElementById('newPostCategory1').value = '';
    document.getElementById('newPostCategory2').value = '';
    document.getElementById('newPostCategory3').value = '';
    document.getElementById('newPostBody').value = '';

    // 投稿一覧を再描画
    renderBoardPostList();

    // 投稿完了のフィードバック
    showPostToast();
    } catch (e) {
        alert('エラー: ' + e.message);
    }
}

function showPostToast() {
    const existingToast = document.querySelector('.post-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'post-toast';
    toast.textContent = '投稿しました！';

    document.querySelector('.board-modal-content').appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 1500);
}

// 投稿一覧を描画（左下ブロック）
function renderBoardPostList() {
    const container = document.getElementById('boardPostList');

    // カテゴリで絞り込み
    let posts = sampleBoardPosts;
    if (selectedCategory) {
        posts = sampleBoardPosts.filter(post => post.categories.includes(selectedCategory));
    }

    if (posts.length === 0) {
        container.innerHTML = '<div class="board-post-list-empty">該当する投稿がありません</div>';
        return;
    }

    let html = '';
    posts.forEach(post => {
        const categoriesText = post.categories.join(' ,  ');
        html += `
            <div class="board-post-item" onclick="selectPost(${post.id})">
                <div class="board-post-item-header">
                    <span class="board-post-item-author">${post.authorName} さん</span>
                    <span class="board-post-item-separator">|</span>
                    <span class="board-post-item-categories">${categoriesText}</span>
                    <span class="board-post-item-date">${post.date}</span>
                </div>
                <div class="board-post-item-title">${post.title}</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function selectPost(postId) {
    // 投稿データを取得
    const post = sampleBoardPosts.find(p => p.id === postId);
    if (!post) return;

    currentPostId = postId;

    // 詳細画面にデータを反映
    document.getElementById('detailAuthorName').textContent = post.authorName;
    document.getElementById('detailDate').textContent = post.date + ' 17:39';
    document.getElementById('detailCategories').textContent = post.categories.join(' , ');
    document.getElementById('detailTitle').textContent = post.title;
    document.getElementById('detailBody').textContent = post.body || 'ここに本文が入ります。サンプルテキストです。\n\nみなさんのご回答お待ちしております！';

    // ブックマーク状態を反映
    const bookmarkImg = document.getElementById('detailBookmark');
    if (bookmarkedPosts.has(postId)) {
        bookmarkImg.src = 'status/Bookmark_B.png';
    } else {
        bookmarkImg.src = 'status/Bookmark_A.png';
    }

    // メインビューを非表示、詳細ビューを表示
    document.getElementById('boardMainView').style.display = 'none';
    document.getElementById('boardHeader').style.display = 'none';
    document.getElementById('boardDetailView').style.display = 'flex';

    // 回答フォームを閉じる
    document.getElementById('boardAnswerForm').style.display = 'none';

    // 回答一覧を描画
    renderAnswers(postId);
}

function closeDetailView() {
    // 詳細ビューを非表示、メインビューを表示
    document.getElementById('boardDetailView').style.display = 'none';
    document.getElementById('boardHeader').style.display = 'block';
    document.getElementById('boardMainView').style.display = 'flex';
}

function toggleBookmark() {
    if (!currentPostId) return;

    const bookmarkImg = document.getElementById('detailBookmark');

    if (bookmarkedPosts.has(currentPostId)) {
        // ブックマーク解除
        bookmarkedPosts.delete(currentPostId);
        bookmarkImg.src = 'status/Bookmark_A.png';
    } else {
        // ブックマーク追加
        bookmarkedPosts.add(currentPostId);
        bookmarkImg.src = 'status/Bookmark_B.png';
        showBookmarkToast();
    }
}

function showBookmarkToast() {
    // 既存のトーストがあれば削除
    const existingToast = document.querySelector('.bookmark-toast');
    if (existingToast) existingToast.remove();

    // トースト要素を作成
    const toast = document.createElement('div');
    toast.className = 'bookmark-toast';
    toast.textContent = 'ブックマークしました！';

    // ブックマークアイコンの近くに配置
    const bookmarkImg = document.getElementById('detailBookmark');
    bookmarkImg.parentElement.appendChild(toast);

    // アニメーション後に削除
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 1000);
}

function toggleAnswerForm() {
    const form = document.getElementById('boardAnswerForm');
    if (form.style.display === 'none') {
        form.style.display = 'block';
        document.getElementById('answerText').value = '';
        document.getElementById('answerText').focus();
    } else {
        form.style.display = 'none';
    }
}

function submitAnswer() {
    const answerText = document.getElementById('answerText').value.trim();
    if (!answerText) return;
    if (!currentPostId) return;

    // 現在の日時を取得
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 回答データを作成
    const newAnswer = {
        id: Date.now(),
        authorName: gameState.player.name,
        authorAvatar: gameState.player.avatar,
        date: dateStr,
        text: answerText
    };

    // 回答リストに追加（なければ作成）
    if (!sampleAnswers[currentPostId]) {
        sampleAnswers[currentPostId] = [];
    }
    // 先頭に追加（新しいものが上）
    sampleAnswers[currentPostId].unshift(newAnswer);

    // フォームを閉じて再描画
    document.getElementById('boardAnswerForm').style.display = 'none';
    document.getElementById('answerText').value = '';
    renderAnswers(currentPostId);
}

function renderAnswers(postId) {
    const container = document.getElementById('boardAnswersSection');
    const answers = sampleAnswers[postId] || [];

    if (answers.length === 0) {
        container.innerHTML = `
            <h4 class="board-answers-title">回答</h4>
            <div class="board-answers-divider"></div>
            <p style="color: rgba(255,255,255,0.7); text-align: center;">まだ回答がありません</p>
        `;
        return;
    }

    let html = `<h4 class="board-answers-title">回答</h4>`;
    html += `<div class="board-answers-divider"></div>`;

    answers.forEach((answer, index) => {
        // アバターが画像パスかどうかで表示を切り替え
        const avatarHtml = answer.authorAvatar.includes('/')
            ? `<img src="${answer.authorAvatar}" alt="アバター" class="board-answer-avatar-img">`
            : answer.authorAvatar;

        // 返信の表示（折りたたみ式）
        let repliesHtml = '';
        if (answer.replies && answer.replies.length > 0) {
            const count = answer.replies.length;
            let replyItems = '';
            answer.replies.forEach((reply, index) => {
                const replyAvatar = reply.authorAvatar || '😊';
                const replyAvatarHtml = replyAvatar.includes('/')
                    ? `<img src="${replyAvatar}" alt="アバター" class="board-reply-avatar-img">`
                    : replyAvatar;
                replyItems += `
                    <div class="board-reply-item">
                        <div class="board-reply-author-row">
                            <div class="board-reply-avatar">${replyAvatarHtml}</div>
                            <div class="board-reply-author-info">
                                <div class="board-reply-author-name">${reply.authorName}</div>
                                <div class="board-reply-date">${reply.date}</div>
                            </div>
                        </div>
                        <div class="board-reply-text">${reply.replyTo ? `<span class="board-reply-to">&gt;&gt;${reply.replyTo}</span><br>` : ''}${reply.text.replace(/\n/g, '<br>')}</div>
                        <div class="board-answer-actions">
                            <img src="status/Comment.png" alt="返信" class="board-action-icon board-comment-icon" onclick="toggleReplyForm(${answer.id}, '${reply.authorName.replace(/'/g, "\\'")}')">
                            <img src="status/${gameState.likedAnswers.includes('reply-' + answer.id + '-' + index) ? 'Heart2' : 'Heart'}.png" alt="いいね" class="board-action-icon board-heart-icon" id="heartIcon-reply-${answer.id}-${index}" onclick="toggleHeart('reply-${answer.id}-${index}')">
                        </div>
                    </div>
                `;
            });
            repliesHtml = `
                <div class="board-reply-list" id="replyList-${answer.id}" style="display: none;">
                    ${replyItems}
                </div>
            `;
        }

        html += `
            <div class="board-answer-item">
                <div class="board-answer-author-row">
                    <div class="board-answer-avatar">${avatarHtml}</div>
                    <div class="board-answer-author-info">
                        <div class="board-answer-author-name">${answer.authorName}</div>
                        <div class="board-answer-date">${answer.date}</div>
                    </div>
                </div>
                <div class="board-answer-text truncated" id="answerText-${answer.id}">${answer.text.replace(/\n/g, '<br>')}</div>
                <div class="board-read-more" id="readMore-${answer.id}" style="display: none;" onclick="toggleReadMore(${answer.id})">もっと読む ▼</div>
                <div class="board-answer-actions">
                    <img src="status/Comment.png" alt="返信" class="board-action-icon board-comment-icon" onclick="toggleReplyForm(${answer.id})">
                    <img src="status/${gameState.likedAnswers.includes('answer-' + answer.id) ? 'Heart2' : 'Heart'}.png" alt="いいね" class="board-action-icon board-heart-icon" id="heartIcon-answer-${answer.id}" onclick="toggleHeart('answer-${answer.id}')">
                    ${answer.replies && answer.replies.length > 0 ? `<span class="board-reply-toggle" id="replyToggle-${answer.id}" onclick="toggleReplies(${answer.id})">${answer.replies.length}件の返信</span>` : ''}
                </div>
                ${repliesHtml}
                <div class="board-reply-form" id="replyForm-${answer.id}" style="display: none;">
                    <textarea class="board-reply-textarea" id="replyText-${answer.id}" placeholder="返信を入力..." maxlength="500"></textarea>
                    <div class="board-reply-buttons">
                        <button class="btn board-btn-reply-submit" onclick="submitBoardReply(${answer.id})">返信する</button>
                    </div>
                </div>
            </div>
        `;
        // 最後以外は区切り線を追加
        if (index < answers.length - 1) {
            html += `<div class="board-answers-divider"></div>`;
        }
    });

    container.innerHTML = html;

    // 4行を超えるテキストに「もっと読む」を表示
    answers.forEach(answer => {
        const textEl = document.getElementById(`answerText-${answer.id}`);
        const readMoreEl = document.getElementById(`readMore-${answer.id}`);
        if (textEl && readMoreEl) {
            // scrollHeightがclientHeightより大きければ切り詰められている
            if (textEl.scrollHeight > textEl.clientHeight) {
                readMoreEl.style.display = 'block';
            }
        }
    });
}

function toggleReadMore(answerId) {
    const textEl = document.getElementById(`answerText-${answerId}`);
    const readMoreEl = document.getElementById(`readMore-${answerId}`);
    if (!textEl || !readMoreEl) return;

    if (textEl.classList.contains('truncated')) {
        textEl.classList.remove('truncated');
        textEl.classList.add('expanded');
        readMoreEl.textContent = '閉じる ▲';
    } else {
        textEl.classList.remove('expanded');
        textEl.classList.add('truncated');
        readMoreEl.textContent = 'もっと読む ▼';
    }
}

function toggleReplies(answerId) {
    const list = document.getElementById(`replyList-${answerId}`);
    const toggle = document.getElementById(`replyToggle-${answerId}`);
    if (!list || !toggle) return;
    if (list.style.display === 'none') {
        list.style.display = 'block';
        toggle.classList.add('open');
    } else {
        list.style.display = 'none';
        toggle.classList.remove('open');
    }
}

function toggleHeart(answerId) {
    const icon = document.getElementById(`heartIcon-${answerId}`);
    if (!icon) return;
    const liked = gameState.likedAnswers;
    const idx = liked.indexOf(answerId);
    if (idx >= 0) {
        liked.splice(idx, 1);
        icon.src = 'status/Heart.png';
    } else {
        liked.push(answerId);
        icon.src = 'status/Heart2.png';
    }
}

function toggleReplyForm(answerId, replyToName) {
    const form = document.getElementById(`replyForm-${answerId}`);
    if (!form) return;

    if (form.style.display === 'none') {
        // 他の返信フォームを閉じる
        document.querySelectorAll('.board-reply-form').forEach(f => {
            f.style.display = 'none';
        });
        // 返信先の名前を記録
        currentReplyTarget = replyToName || null;
        form.style.display = 'block';
        document.getElementById(`replyText-${answerId}`).value = '';
        document.getElementById(`replyText-${answerId}`).focus();
    } else {
        form.style.display = 'none';
        currentReplyTarget = null;
    }
}

function submitBoardReply(answerId) {
    const textArea = document.getElementById(`replyText-${answerId}`);
    if (!textArea) return;

    const replyText = textArea.value.trim();
    if (!replyText) return;
    if (!currentPostId) return;

    // 対象の回答を探す
    const answers = sampleAnswers[currentPostId];
    if (!answers) return;
    const answer = answers.find(a => a.id === answerId);
    if (!answer) return;

    // 現在の日時を取得
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 返信データを作成
    const newReply = {
        id: Date.now(),
        authorName: gameState.player.name || 'ゲスト',
        authorAvatar: gameState.player.avatar || '😊',
        date: dateStr,
        text: replyText,
        replyTo: currentReplyTarget || answer.authorName
    };
    currentReplyTarget = null;

    // 返信リストに追加（なければ作成）
    if (!answer.replies) {
        answer.replies = [];
    }
    answer.replies.push(newReply);

    // 再描画して返信一覧だけ開いた状態にする
    renderAnswers(currentPostId);
    const replyList = document.getElementById(`replyList-${answerId}`);
    if (replyList) replyList.style.display = 'block';
}

function selectCategory(category) {
    selectedCategory = category;
    renderBoardPostList();
}

// 職業安定所
function openHelloworkModal() {
    const modal = document.getElementById('helloworkModal');

    // ビューをリセット（メイン画面を表示）
    document.querySelector('.hellowork-top').style.display = '';
    document.querySelector('.hellowork-bottom').style.display = '';
    document.querySelector('.hellowork-modal-content > .btn-close').style.display = '';
    document.querySelector('.hellowork-modal-content').classList.remove('complete-view');
    document.getElementById('helloworkCompleteView').style.display = 'none';
    document.querySelector('.hellowork-complete-details').style.display = '';

    // ユーザー名を反映
    document.getElementById('helloworkUserName').textContent = gameState.player.name;
    document.getElementById('helloworkTargetUserName').textContent = gameState.player.name;

    // 職業テーブルを生成（ユーザーの能力値行も含む）
    renderJobTable();

    // 就職可能な職業リストを更新
    updateAvailableJobs();

    // 目標職業の表示を更新
    updateTargetJobDropdown();
    renderTargetJobDisplay();

    modal.classList.add('active');
}

function closeHelloworkModal() {
    document.getElementById('helloworkModal').classList.remove('active');
    // ビューをリセット
    document.querySelector('.hellowork-top').style.display = '';
    document.querySelector('.hellowork-bottom').style.display = '';
    document.querySelector('.hellowork-modal-content > .btn-close').style.display = '';
    document.querySelector('.hellowork-modal-content').classList.remove('complete-view');
    document.getElementById('helloworkCompleteView').style.display = 'none';
    // 就職したときだけランダムイベント判定
    if (gameState.pendingRandomEvent) {
        gameState.pendingRandomEvent = false;
        tryShowRandomEvent();
    }
}

// 職業テーブルを動的に生成
function renderJobTable() {
    const tbody = document.getElementById('helloworkTableBody');
    const abilities = gameState.player.abilities;
    const playerBmi = gameState.player.weight / ((gameState.player.height / 100) ** 2);
    const playerGender = gameState.player.gender || null;
    const playerHeight = gameState.player.height;

    // ユーザー能力値行を生成
    let userStatsRow = `
        <tr class="hellowork-user-stats">
            <td class="user-stats-label">現在の能力値</td>
            <td id="userStatKokugo">${abilities.国語}</td>
            <td id="userStatSugaku">${abilities.数学}</td>
            <td id="userStatRika">${abilities.理科}</td>
            <td id="userStatShakai">${abilities.社会}</td>
            <td id="userStatEigo">${abilities.英語}</td>
            <td id="userStatOngaku">${abilities.音楽}</td>
            <td id="userStatBijutsu">${abilities.美術}</td>
            <td id="userStatTairyoku">${abilities.体力}</td>
            <td id="userStatKiryoku">${abilities.気力}</td>
            <td id="userStatLooks">${abilities.ルックス}</td>
            <td id="userStatSubayasa">${abilities.素早さ}</td>
            <td id="userStatOmoshirosa">${abilities.面白さ}</td>
            <td id="userStatYasashisa">${abilities.優しさ}</td>
            <td id="userStatErosa">${abilities.エロさ}</td>
            <td id="userStatBMI">${playerBmi.toFixed(1)}</td>
            <td id="userStatGender">${playerGender || '-'}</td>
            <td id="userStatHeight">${playerHeight}</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
        </tr>
    `;

    // 職業行を生成
    let jobRows = '';
    let rowIndex = 0;
    jobsData.forEach(job => {
        const canApply = checkJobRequirements(job);
        const evenClass = rowIndex % 2 === 0 ? 'row-even' : '';
        const rowClass = (canApply ? 'job-available' : '') + (evenClass ? ' ' + evenClass : '');
        rowIndex++;

        // 能力値のセルを生成（必要値を表示、0の場合は'-'）
        const abilityKeys = ['国語', '数学', '理科', '社会', '英語', '音楽', '美術', '体力', '気力', 'ルックス', '素早さ', '面白さ', '優しさ', 'エロさ'];
        let abilityCells = '';
        abilityKeys.forEach(key => {
            const required = job.abilities[key];
            const playerVal = abilities[key];
            const isMet = playerVal >= required;
            const cellClass = required > 0 ? (isMet ? 'stat-met' : 'stat-not-met') : '';
            abilityCells += `<td class="${cellClass}">${required > 0 ? required : '-'}</td>`;
        });

        // 条件セルを生成
        let bmiText = '-';
        if (job.conditions.bmi[0] > 0 || job.conditions.bmi[1] < 99) {
            if (job.conditions.bmi[1] >= 99) {
                bmiText = `${job.conditions.bmi[0]}以上`;
            } else if (job.conditions.bmi[0] <= 0) {
                bmiText = `${job.conditions.bmi[1]}以下`;
            } else {
                bmiText = `${job.conditions.bmi[0]}~${job.conditions.bmi[1]}`;
            }
        }
        const bmiMet = playerBmi >= job.conditions.bmi[0] && playerBmi <= job.conditions.bmi[1];
        const bmiClass = bmiText !== '-' ? (bmiMet ? 'stat-met' : 'stat-not-met') : '';

        const genderText = job.conditions.gender || '-';
        const genderMet = !job.conditions.gender || playerGender === job.conditions.gender;
        const genderClass = genderText !== '-' ? (genderMet ? 'stat-met' : 'stat-not-met') : '';

        const heightText = job.conditions.height[0] > 0 || job.conditions.height[1] < 999
            ? `${job.conditions.height[0] > 0 ? job.conditions.height[0] : ''}~${job.conditions.height[1] < 999 ? job.conditions.height[1] : ''}`
            : '-';
        const heightMet = playerHeight >= job.conditions.height[0] && playerHeight <= job.conditions.height[1];
        const heightClass = heightText !== '-' ? (heightMet ? 'stat-met' : 'stat-not-met') : '';

        // ボーナス表示（レベルアップ時）
        const bonusText = job.bonus > 0 ? `×${job.bonus}` : '-';

        const hasUpgrade = !!job.upgrade;
        const jobNameClass = hasUpgrade ? 'job-name job-upgradeable' : 'job-name';
        const jobNameText = job.name;
        const jobNameClick = hasUpgrade ? ` onclick="toggleUpgradeView('${job.id}')"` : '';

        // 通常表示の行
        jobRows += `
            <tr class="${rowClass}" id="job-row-${job.id}">
                <td class="${jobNameClass}"${jobNameClick}>${jobNameText}</td>
                ${abilityCells}
                <td class="${bmiClass}">${bmiText}</td>
                <td class="${genderClass}">${genderText}</td>
                <td class="${heightClass}">${heightText}</td>
                <td class="salary">${job.salary.toLocaleString()}円</td>
                <td>${bonusText}</td>
                <td>${job.bodyConsume}</td>
                <td>${job.brainConsume}</td>
            </tr>
        `;

        // 上位職業表示の行（初期非表示）
        if (hasUpgrade) {
            let upgradeAbilityCells = '';
            abilityKeys.forEach(key => {
                const required = job.upgrade.abilities[key];
                const playerVal = abilities[key];
                const isMet = playerVal >= required;
                const cellClass = required > 0 ? (isMet ? 'stat-met' : 'stat-not-met') : '';
                upgradeAbilityCells += `<td class="${cellClass}">${required > 0 ? required : '-'}</td>`;
            });

            jobRows += `
            <tr class="upgrade-view${evenClass ? ' ' + evenClass : ''}" id="job-upgrade-${job.id}" style="display:none">
                <td class="job-name job-upgradeable job-upgrade-active" onclick="toggleUpgradeView('${job.id}')">▼ ${job.upgrade.name}</td>
                ${upgradeAbilityCells}
                <td class="${bmiClass}">${bmiText}</td>
                <td class="${genderClass}">${genderText}</td>
                <td class="${heightClass}">${heightText}</td>
                <td class="salary">${job.upgrade.salary.toLocaleString()}円</td>
                <td>×${job.upgrade.bonus}</td>
                <td>${job.upgrade.bodyConsume}</td>
                <td>${job.upgrade.brainConsume}</td>
            </tr>
            `;
        }
    });

    tbody.innerHTML = userStatsRow + jobRows;
}

// 上位職業の表示を切り替え（元の行 ⇔ 上位職業行）
function toggleUpgradeView(jobId) {
    const baseRow = document.getElementById('job-row-' + jobId);
    const upgradeRow = document.getElementById('job-upgrade-' + jobId);
    if (baseRow && upgradeRow) {
        const showingUpgrade = upgradeRow.style.display !== 'none';
        baseRow.style.display = showingUpgrade ? '' : 'none';
        upgradeRow.style.display = showingUpgrade ? 'none' : '';
    }
}

// 職業の必要条件を満たしているかチェック
function checkJobRequirements(job) {
    const abilities = gameState.player.abilities;
    const playerBmi = gameState.player.weight / ((gameState.player.height / 100) ** 2);
    const playerGender = gameState.player.gender || null;
    const playerHeight = gameState.player.height;

    // 能力値チェック
    const abilityKeys = ['国語', '数学', '理科', '社会', '英語', '音楽', '美術', '体力', '気力', 'ルックス', '素早さ', '面白さ', '優しさ', 'エロさ'];
    for (const key of abilityKeys) {
        if (abilities[key] < job.abilities[key]) {
            return false;
        }
    }

    // BMIチェック
    if (playerBmi < job.conditions.bmi[0] || playerBmi > job.conditions.bmi[1]) {
        return false;
    }

    // 性別チェック
    if (job.conditions.gender && playerGender !== job.conditions.gender) {
        return false;
    }

    // 身長チェック
    if (playerHeight < job.conditions.height[0] || playerHeight > job.conditions.height[1]) {
        return false;
    }

    return true;
}

function updateAvailableJobs() {
    const select = document.getElementById('helloworkJobSelect');
    select.innerHTML = '<option value="">-- 職業を選択 --</option>';

    // 就職可能な職業をフィルタリング
    const availableJobs = jobsData.filter(job => checkJobRequirements(job));

    availableJobs.forEach(job => {
        select.innerHTML += `<option value="${job.id}">${job.name}（給料: ${job.salary.toLocaleString()}円）</option>`;
    });

    // 就職可能な職業数を表示
    if (availableJobs.length === 0) {
        select.innerHTML = '<option value="">就職可能な職業がありません</option>';
    }
}

// 目標職業ドロップダウンを更新（全50職業）
function updateTargetJobDropdown() {
    const select = document.getElementById('targetJobSelect');
    select.innerHTML = '<option value="">-- 職業を選択 --</option>';

    for (let lv = 1; lv <= 5; lv++) {
        const levelJobs = jobsData.filter(j => j.level === lv);
        if (levelJobs.length === 0) continue;
        const optgroup = document.createElement('optgroup');
        optgroup.label = `Lv.${lv}`;
        levelJobs.forEach(job => {
            const option = document.createElement('option');
            option.value = job.id;
            option.textContent = job.name;
            optgroup.appendChild(option);
        });
        select.appendChild(optgroup);
    }
}

// 目標職業の表示を切り替え
function renderTargetJobDisplay() {
    const selectArea = document.getElementById('targetJobSelectArea');
    const display = document.getElementById('targetJobDisplay');
    const nameSpan = document.getElementById('targetJobName');

    if (gameState.player.targetJob) {
        const job = jobsData.find(j => j.id === gameState.player.targetJob);
        if (job) {
            nameSpan.textContent = job.name;
            selectArea.style.display = 'none';
            display.style.display = '';
        }
    } else {
        selectArea.style.display = '';
        display.style.display = 'none';
    }
}

// 目標職業を設定
function setTargetJob() {
    const select = document.getElementById('targetJobSelect');
    const jobId = select.value;
    if (!jobId) return;

    gameState.player.targetJob = jobId;
    renderTargetJobDisplay();
}

// 目標職業を解除
function removeTargetJob() {
    gameState.player.targetJob = null;
    renderTargetJobDisplay();
    updateTargetJobDropdown();
}

function applyForJob() {
    const select = document.getElementById('helloworkJobSelect');
    const jobId = select.value;

    if (!jobId) {
        return;
    }

    // 選択した職業を取得
    const job = jobsData.find(j => j.id === jobId);
    if (!job) {
        return;
    }

    // 同じ職業に就いている場合はエラー表示
    if (gameState.player.currentJobId === jobId) {
        document.querySelector('.hellowork-top').style.display = 'none';
        document.querySelector('.hellowork-bottom').style.display = 'none';
        document.querySelector('.hellowork-modal-content > .btn-close').style.display = 'none';
        document.querySelector('.hellowork-modal-content').classList.add('complete-view');
        const msgEl = document.querySelector('.hellowork-complete-message');
        msgEl.innerHTML = '<span class="error-text">ERROR！</span><br>もう既にその職業に就いています！';
        msgEl.classList.add('no-job');
        document.querySelector('.hellowork-complete-details').style.display = 'none';
        document.getElementById('helloworkCompleteView').style.display = 'flex';
        return;
    }

    // 就職処理
    gameState.pendingRandomEvent = true;
    gameState.player.job = job.name;
    gameState.player.jobLevel = 1;
    gameState.player.jobExp = 0;
    gameState.player.currentJobId = job.id;

    // ステータス更新
    updateStatus();

    // 就職完了画面を表示
    document.querySelector('.hellowork-top').style.display = 'none';
    document.querySelector('.hellowork-bottom').style.display = 'none';
    document.querySelector('.hellowork-modal-content > .btn-close').style.display = 'none';
    document.querySelector('.hellowork-modal-content').classList.add('complete-view');
    const msgEl = document.querySelector('.hellowork-complete-message');
    msgEl.innerHTML = `おめでとうございます！<br><span id="helloworkCompleteJobName">${job.name}</span>になりました。`;
    msgEl.classList.remove('no-job');
    document.querySelector('.hellowork-complete-details').style.display = '';
    document.getElementById('helloworkCompleteSalary').textContent = job.salary.toLocaleString();
    document.getElementById('helloworkCompleteBonus').textContent = job.bonus;
    document.getElementById('helloworkCompleteView').style.display = 'flex';
}

function formatBoardDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hour}:${min}`;
}

function renderBoardPosts() {
    const container = document.getElementById('boardPosts');
    const posts = gameState.boardPosts;

    if (posts.length === 0) {
        container.innerHTML = '<div class="board-empty">まだ投稿がありません。最初の投稿をしてみましょう！</div>';
        return;
    }

    let html = '';
    // 新しい順に表示
    const sortedPosts = [...posts].reverse();

    sortedPosts.forEach(post => {
        html += `
            <div class="board-post">
                <div class="board-post-header">
                    <span class="board-post-no">No.${post.id}</span>
                    <span class="board-post-author">${post.authorAvatar} ${post.authorName}</span>
                    <span class="board-post-date">${formatBoardDate(post.date)}</span>
                </div>
                <div class="board-post-content">${escapeHtml(post.content)}</div>
                <div class="board-post-actions">
                    <button class="btn-reply" onclick="showReplyForm(${post.id}, null, '${escapeAttr(post.authorName)}')">💬 返信</button>
                </div>
                <div class="board-reply-form" id="replyForm-${post.id}" style="display:none;">
                    <div class="reply-target-info" id="replyTargetInfo-${post.id}"></div>
                    <textarea class="board-reply-input" id="replyInput-${post.id}" placeholder="返信を入力..." maxlength="200"></textarea>
                    <div class="board-reply-buttons">
                        <button class="btn btn-success btn-small" onclick="submitReply(${post.id})">送信</button>
                        <button class="btn btn-close btn-small" onclick="hideReplyForm(${post.id})">キャンセル</button>
                    </div>
                </div>
                ${renderReplies(post.replies, post.id)}
            </div>
        `;
    });

    container.innerHTML = html;
}

function renderReplies(replies, postId) {
    if (!replies || replies.length === 0) return '';

    let html = '<div class="board-replies">';
    replies.forEach((reply, index) => {
        const replyNo = `${postId}-${index + 1}`;
        // 返信先の表示
        let replyToHtml = '';
        if (reply.replyTo) {
            replyToHtml = `<span class="reply-to-anchor">&gt;&gt;${reply.replyTo.no} (${reply.replyTo.name}さんへ)</span>`;
        }

        html += `
            <div class="board-reply" id="reply-${replyNo}">
                <div class="board-reply-header">
                    <span class="board-reply-no">No.${replyNo}</span>
                    <span class="board-post-author">${reply.authorAvatar} ${reply.authorName}</span>
                    <span class="board-post-date">${formatBoardDate(reply.date)}</span>
                </div>
                ${replyToHtml}
                <div class="board-reply-content">${escapeHtml(reply.content)}</div>
                <div class="board-reply-actions">
                    <button class="btn-reply-small" onclick="showReplyForm(${postId}, ${index + 1}, '${escapeAttr(reply.authorName)}')">↩️ 返信</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function submitPostOld() {
    const input = document.getElementById('boardNewPost');
    const content = input.value.trim();

    if (!content) {
        return;
    }

    if (content.length > 300) {
        return;
    }

    const post = {
        id: gameState.boardNextId++,
        authorName: gameState.player.name,
        authorAvatar: gameState.player.avatar,
        content: content,
        date: new Date().toISOString(),
        replies: []
    };

    gameState.boardPosts.push(post);
    input.value = '';
    renderBoardPosts();
}

function showReplyForm(postId, replyIndex, targetName) {
    // 他の返信フォームを閉じる
    document.querySelectorAll('.board-reply-form').forEach(form => {
        form.style.display = 'none';
    });

    const form = document.getElementById(`replyForm-${postId}`);
    const targetInfo = document.getElementById(`replyTargetInfo-${postId}`);
    const input = document.getElementById(`replyInput-${postId}`);

    // 返信先を設定
    if (replyIndex === null) {
        // 元の投稿への返信
        currentReplyTarget = {
            postId: postId,
            replyIndex: null,
            no: `${postId}`,
            name: targetName
        };
        targetInfo.innerHTML = `<span class="reply-target-badge">📝 No.${postId} ${targetName}さんへ返信</span>`;
    } else {
        // 返信への返信
        currentReplyTarget = {
            postId: postId,
            replyIndex: replyIndex,
            no: `${postId}-${replyIndex}`,
            name: targetName
        };
        targetInfo.innerHTML = `<span class="reply-target-badge">↩️ No.${postId}-${replyIndex} ${targetName}さんへ返信</span>`;
    }

    form.style.display = 'block';
    input.value = '';
    input.focus();
}

function hideReplyForm(postId) {
    document.getElementById(`replyForm-${postId}`).style.display = 'none';
    document.getElementById(`replyInput-${postId}`).value = '';
    currentReplyTarget = null;
}

function submitReply(postId) {
    const input = document.getElementById(`replyInput-${postId}`);
    const content = input.value.trim();

    if (!content) {
        return;
    }

    if (content.length > 200) {
        return;
    }

    const post = gameState.boardPosts.find(p => p.id === postId);
    if (!post) return;

    const reply = {
        authorName: gameState.player.name,
        authorAvatar: gameState.player.avatar,
        content: content,
        date: new Date().toISOString(),
        replyTo: currentReplyTarget ? {
            no: currentReplyTarget.no,
            name: currentReplyTarget.name
        } : null
    };

    post.replies.push(reply);
    currentReplyTarget = null;
    renderBoardPosts();
}

// ============================================
// つぶやき機能
// ============================================
let tweetCooldownInterval = null;

function openTweetModal() {
    // マップを非表示、つぶやきビューを表示
    document.getElementById('mapView').style.display = 'none';
    document.getElementById('actionView').style.display = 'none';
    document.getElementById('bankDepositView').style.display = 'none';
    document.getElementById('bankDepositCompleteView').style.display = 'none';
    document.getElementById('bankWithdrawView').style.display = 'none';
    document.getElementById('bankWithdrawCompleteView').style.display = 'none';
    document.getElementById('bankTransferView').style.display = 'none';
    document.getElementById('bankTransferConfirmView').style.display = 'none';
    document.getElementById('bankHistoryView').style.display = 'none';
    document.getElementById('tweetView').style.display = 'block';

    // プレイヤー情報を更新
    document.getElementById('tweetComposeAvatar').innerHTML = `<img src="${gameState.player.avatar}" alt="アバター" class="tweet-avatar-img">`;
    document.getElementById('tweetComposeAvatar').style.backgroundColor = gameState.player.avatarBgColor;
    document.getElementById('tweetComposeName').textContent = gameState.player.name;

    // 入力欄をリセット
    const input = document.getElementById('tweetInput');
    input.value = '';
    updateTweetCharCount();

    // クールダウンチェック
    checkTweetCooldown();

    // 文字数カウントイベント
    input.oninput = updateTweetCharCount;
}

function updateTweetCharCount() {
    const input = document.getElementById('tweetInput');
    const count = input.value.length;
    const countEl = document.getElementById('tweetCharCount');
    countEl.textContent = count;

    // 文字数に応じて色を変更
    const countContainer = countEl.parentElement;
    countContainer.classList.remove('near-limit', 'at-limit');
    if (count >= 60) {
        countContainer.classList.add('at-limit');
    } else if (count >= 50) {
        countContainer.classList.add('near-limit');
    }
}

function checkTweetCooldown() {
    const btn = document.getElementById('tweetSubmitBtn');
    const msg = document.getElementById('tweetCooldownMsg');
    const timeEl = document.getElementById('tweetCooldownTime');

    if (!gameState.lastTweetTime) {
        btn.disabled = false;
        msg.style.display = 'none';
        return;
    }

    const now = new Date().getTime();
    const lastTweet = new Date(gameState.lastTweetTime).getTime();
    const cooldownMs = 10 * 60 * 1000; // 10分
    const remaining = cooldownMs - (now - lastTweet);

    if (remaining <= 0) {
        btn.disabled = false;
        msg.style.display = 'none';
        if (tweetCooldownInterval) {
            clearInterval(tweetCooldownInterval);
            tweetCooldownInterval = null;
        }
        return;
    }

    btn.disabled = true;
    msg.style.display = 'block';

    // 残り時間を更新
    const updateRemaining = () => {
        const nowUpdate = new Date().getTime();
        const remainingUpdate = cooldownMs - (nowUpdate - lastTweet);

        if (remainingUpdate <= 0) {
            btn.disabled = false;
            msg.style.display = 'none';
            if (tweetCooldownInterval) {
                clearInterval(tweetCooldownInterval);
                tweetCooldownInterval = null;
            }
            return;
        }

        const minutes = Math.floor(remainingUpdate / 60000);
        const seconds = Math.floor((remainingUpdate % 60000) / 1000);
        timeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    updateRemaining();
    if (tweetCooldownInterval) clearInterval(tweetCooldownInterval);
    tweetCooldownInterval = setInterval(updateRemaining, 1000);
}

function submitTweet() {
    const input = document.getElementById('tweetInput');
    const content = input.value.trim();

    if (!content) {
        alert('つぶやきを入力してください。');
        return;
    }

    if (content.length > 60) {
        alert('つぶやきは60文字以内でお願いします。');
        return;
    }

    // クールダウンチェック
    if (gameState.lastTweetTime) {
        const now = new Date().getTime();
        const lastTweet = new Date(gameState.lastTweetTime).getTime();
        const cooldownMs = 10 * 60 * 1000; // 10分
        if (now - lastTweet < cooldownMs) {
            alert('まだつぶやけません。10分待ってください。');
            return;
        }
    }

    // つぶやきを追加
    const tweet = {
        id: gameState.tweetNextId++,
        authorName: gameState.player.name,
        authorJob: gameState.player.job,
        authorAvatar: gameState.player.avatar,
        authorAvatarBgColor: gameState.player.avatarBgColor,
        content: content,
        date: new Date().toISOString()
    };

    gameState.tweets.unshift(tweet); // 先頭に追加
    gameState.lastTweetTime = tweet.date;

    // 入力をクリア
    input.value = '';
    updateTweetCharCount();

    // 左側の掲示板を更新
    renderTweetList();

    // クールダウン表示を更新
    checkTweetCooldown();

    // マップに戻る
    backToMap();
}

// 表示するつぶやき数（無限スクロール用）
let tweetDisplayCount = 10;

function renderTweetList(reset = true) {
    const container = document.getElementById('tweetList');

    // リセット時は表示数を初期化
    if (reset) {
        tweetDisplayCount = 10;
    }

    if (gameState.tweets.length === 0) {
        container.innerHTML = '';
        return;
    }

    // 表示するつぶやきを制限
    const tweetsToShow = gameState.tweets.slice(0, tweetDisplayCount);

    let html = '';
    tweetsToShow.forEach(tweet => {
        // アバターが画像パスか絵文字かを判定
        const bgColor = tweet.authorAvatarBgColor || '#FFB6C1';
        const avatarHtml = tweet.authorAvatar.includes('/')
            ? `<img src="${tweet.authorAvatar}" alt="アバター" class="tweet-avatar-img">`
            : tweet.authorAvatar;
        const jobText = tweet.authorJob || '無職';
        html += `
            <div class="tweet-item">
                <div class="tweet-header">
                    <span class="tweet-avatar" style="background-color: ${bgColor}">${avatarHtml}</span>
                    <div class="tweet-author-info">
                        <span class="tweet-name">${escapeHtml(tweet.authorName)}</span>
                        <span class="tweet-job">${escapeHtml(jobText)}</span>
                    </div>
                    <span class="tweet-time">${formatTweetTime(tweet.date)}</span>
                </div>
                <div class="tweet-content">${escapeHtml(tweet.content)}</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// 無限スクロール：もっと読み込む
function loadMoreTweets() {
    if (tweetDisplayCount >= gameState.tweets.length) {
        return; // もう全部表示済み
    }
    tweetDisplayCount += 10;
    renderTweetList(false); // リセットしない
}

// 無限スクロールのイベント設定
function setupTweetInfiniteScroll() {
    const container = document.getElementById('tweetList');
    container.addEventListener('scroll', () => {
        // 下端に近づいたら読み込み
        const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        if (scrollBottom < 50) {
            loadMoreTweets();
        }
    });
}

function formatTweetTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);

    if (diffMin < 1) return 'たった今';
    if (diffMin < 60) return `${diffMin}分前`;
    if (diffHour < 24) return `${diffHour}時間前`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

// ============================================
// 所持品機能
// ============================================
function openInventoryModal() {
    // モーダルを表示
    document.getElementById('inventoryModal').classList.add('active');

    // ビューをリセット
    document.getElementById('inventoryListView').style.display = 'block';
    document.getElementById('itemUsedView').style.display = 'none';
    document.getElementById('inventoryTitle').textContent = '所持品リスト';

    // 使うボタンをリセット
    const useBtn = document.getElementById('inventoryUseBtn');
    useBtn.disabled = true;
    useBtn.classList.remove('active');

    // 所持品一覧を描画
    renderInventoryTable();
}

// ============================================
// DM機能（未実装）
// ============================================
function openDMModal() {
    // DM機能は現在準備中です
}

// ============================================
// 友人関係機能（未実装）
// ============================================
function openFriendModal() {
    // 友人関係機能は現在準備中です
}

// ============================================
// セーブ機能
// ============================================
function saveGame() {
    try {
        localStorage.setItem('townGameSave', JSON.stringify(gameState));
    } catch (e) {
        console.error('保存に失敗しました:', e);
    }
}

// ============================================
// 更新機能
// ============================================
function refreshGame() {
    location.reload();
}

function renderAbilityRow(highlightStats = null) {
    const abilities = gameState.player.abilities;
    const row = document.getElementById('abilityRow');

    // ハイライトするかどうかを判定するヘルパー関数
    const highlight = (key) => {
        if (highlightStats && highlightStats[key] && highlightStats[key] > 0) {
            return ' class="ability-highlight"';
        }
        return '';
    };

    row.innerHTML = `
        <td${highlight('国語')}>${abilities.国語}</td>
        <td${highlight('数学')}>${abilities.数学}</td>
        <td${highlight('理科')}>${abilities.理科}</td>
        <td${highlight('社会')}>${abilities.社会}</td>
        <td${highlight('英語')}>${abilities.英語}</td>
        <td${highlight('音楽')}>${abilities.音楽}</td>
        <td${highlight('美術')}>${abilities.美術}</td>
        <td${highlight('体力')}>${abilities.体力}</td>
        <td${highlight('気力')}>${abilities.気力}</td>
        <td${highlight('ルックス')}>${abilities.ルックス}</td>
        <td${highlight('素早さ')}>${abilities.素早さ}</td>
        <td${highlight('面白さ')}>${abilities.面白さ}</td>
        <td${highlight('優しさ')}>${abilities.優しさ}</td>
        <td${highlight('エロさ')}>${abilities.エロさ}</td>
    `;
}

function closeInventoryModal() {
    document.getElementById('inventoryModal').classList.remove('active');
}

function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    const emptyMsg = document.getElementById('inventoryEmpty');
    const tableContainer = document.querySelector('.inventory-table-container');
    const possessions = gameState.player.possessions;

    tableContainer.style.display = 'block';
    if (possessions.length === 0) {
        emptyMsg.style.display = 'block';
    } else {
        emptyMsg.style.display = 'none';
    }

    // 能力値行をテーブル先頭に生成
    const abilities = gameState.player.abilities;
    const abilityKeys = ['国語', '数学', '理科', '社会', '英語', '音楽', '美術', '体力', '気力', 'ルックス', '素早さ', '面白さ', '優しさ', 'エロさ'];
    let abilityCells = '';
    abilityKeys.forEach(key => {
        abilityCells += `<td>${abilities[key]}</td>`;
    });

    // 目標職業の能力値行
    let targetJobRow = '';
    if (gameState.player.targetJob) {
        const targetJob = jobsData.find(j => j.id === gameState.player.targetJob);
        if (targetJob) {
            let targetCells = '';
            abilityKeys.forEach(key => {
                const req = targetJob.abilities[key];
                targetCells += `<td>${req || '-'}</td>`;
            });
            targetJobRow = `
        <tr class="target-job-stats">
            <td class="target-job-stats-label">目標の職業：${targetJob.name}</td>
            ${targetCells}
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
        </tr>`;
        }
    }

    let html = `
        <tr class="gym-user-stats">
            <td class="gym-user-stats-label">現在の能力値</td>
            ${abilityCells}
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
        </tr>
        ${targetJobRow}
    `;

    // カテゴリごとにグループ化
    const grouped = groupPossessionsByCategory(possessions);
    const categoryOrder = [...shopItems, ...shokudoItems].filter(s => s.type === 'separator').map(s => s.name);

    categoryOrder.forEach(category => {
        if (grouped[category] && grouped[category].length > 0) {
            // カテゴリヘッダー
            html += `<tr class="separator-row"><td colspan="22">${category}</td></tr>`;

            grouped[category].forEach(item => {
                const index = item.originalIndex;
                // アイテムにstatsがない場合はshopItems/shokudoItemsから取得（後方互換性）
                const shopItem = shopItems.find(s => s.name === item.name) || shokudoItems.find(s => s.name === item.name);
                const stats = item.stats || shopItem?.stats || {};
                const calorieVal = item.calorie !== undefined ? item.calorie : (shopItem?.calorie !== undefined ? shopItem.calorie : 0);
                const calorie = calorieVal ? calorieVal + 'kcal' : '-';
                const cooldownVal = item.cooldown || shopItem?.cooldown || '0分';
                const cooldown = cooldownVal !== '0分' ? cooldownVal : '-';
                const bodyConsumeVal = item.bodyConsume !== undefined ? item.bodyConsume : (shopItem?.bodyConsume !== undefined ? shopItem.bodyConsume : 0);
                const bodyConsume = bodyConsumeVal ? bodyConsumeVal : '-';
                const brainConsumeVal = item.brainConsume !== undefined ? item.brainConsume : (shopItem?.brainConsume !== undefined ? shopItem.brainConsume : 0);
                const brainConsume = brainConsumeVal ? brainConsumeVal : '-';
                const remainingUses = item.remainingUses !== undefined ? item.remainingUses : (item.useCount || shopItem?.useCount || 1);

                const isConsumable = item.consumable;
                html += `
                    <tr>
                        <td class="gym-menu-name"><label><input type="radio" name="inventoryItem" class="gym-radio" value="${index}" ${!isConsumable ? 'disabled' : ''}> ${item.name}</label></td>
                        <td>${stats.国語 || '-'}</td>
                        <td>${stats.数学 || '-'}</td>
                        <td>${stats.理科 || '-'}</td>
                        <td>${stats.社会 || '-'}</td>
                        <td>${stats.英語 || '-'}</td>
                        <td>${stats.音楽 || '-'}</td>
                        <td>${stats.美術 || '-'}</td>
                        <td>${stats.体力 || '-'}</td>
                        <td>${stats.気力 || '-'}</td>
                        <td>${stats.ルックス || '-'}</td>
                        <td>${stats.素早さ || '-'}</td>
                        <td>${stats.面白さ || '-'}</td>
                        <td>${stats.優しさ || '-'}</td>
                        <td>${stats.エロさ || '-'}</td>
                        <td>${calorie}</td>
                        <td>${cooldown}</td>
                        <td>${bodyConsume}</td>
                        <td>${brainConsume}</td>
                        <td>${item.description || shopItem?.description || '-'}</td>
                        <td>${item.purchaseDate || '-'}</td>
                        <td>${remainingUses}</td>
                    </tr>
                `;
            });
        }
    });

    tbody.innerHTML = html;

    // ヘッダー高さに基づいてstickyのtop値を設定
    requestAnimationFrame(() => {
        const table = document.getElementById('inventoryTable');
        const headerRows = table.querySelectorAll('thead tr');
        if (headerRows.length >= 2) {
            const firstRowHeight = headerRows[0].offsetHeight;
            const totalHeaderHeight = firstRowHeight + headerRows[1].offsetHeight;
            headerRows[1].querySelectorAll('th').forEach(th => {
                th.style.top = firstRowHeight + 'px';
            });
            const userStatsRow = table.querySelector('.gym-user-stats');
            if (userStatsRow) {
                userStatsRow.style.top = totalHeaderHeight + 'px';
                const targetRow = table.querySelector('.target-job-stats');
                if (targetRow) {
                    targetRow.style.top = (totalHeaderHeight + userStatsRow.offsetHeight) + 'px';
                }
            }
        }
    });

    // ラジオボタンの変更を監視
    document.querySelectorAll('input[name="inventoryItem"]').forEach(radio => {
        radio.addEventListener('change', updateInventoryUseButton);
    });
    updateInventoryUseButton();
}

function updateInventoryUseButton() {
    const selected = document.querySelector('input[name="inventoryItem"]:checked');
    const useBtn = document.getElementById('inventoryUseBtn');
    if (selected) {
        useBtn.disabled = false;
        useBtn.classList.add('active');
    } else {
        useBtn.disabled = true;
        useBtn.classList.remove('active');
    }
}

function useSelectedInventoryItem() {
    const selected = document.querySelector('input[name="inventoryItem"]:checked');
    if (!selected) return;
    const useBtn = document.getElementById('inventoryUseBtn');
    useBtn.disabled = true;
    useBtn.classList.remove('active');
    useInventoryItem(parseInt(selected.value));
}

function useInventoryItem(index) {
    const item = gameState.player.possessions[index];
    if (!item || !item.consumable) return;

    // アイテム情報を取得（使用前に取得）
    const shopItem = shopItems.find(si => si.name === item.name) || shokudoItems.find(si => si.name === item.name);

    // 満腹チェック（食べ物系アイテムの場合）
    if (shopItem?.effect?.hunger) {
        const hungerStatus = getHungerText();
        if (hungerStatus.text === '満腹（食事できません）') {
            document.getElementById('inventoryListView').style.display = 'none';
            document.getElementById('inventoryFullView').style.display = 'block';
            document.getElementById('inventoryTitle').textContent = 'ERROR';
            return;
        }
    }

    const p = gameState.player;
    const itemName = item.name;
    const stats = shopItem?.stats || {};

    // 変更前の値を保存
    const beforeStats = {};
    if (shopItem?.stats) {
        for (const key in shopItem.stats) {
            if (key in p.abilities && shopItem.stats[key]) {
                beforeStats[key] = p.abilities[key];
            }
        }
    }
    const beforeHunger = getHungerText().text;
    const beforeHealth = p.health;
    const beforeWeight = p.weight;

    // アイテムを使用
    useItem(item.name);

    // 変更後の値を取得
    const afterHunger = getHungerText().text;
    const afterHealth = p.health;
    const afterWeight = p.weight;

    // 結果画面を表示
    showItemUsedResult(itemName, stats, beforeStats, beforeHunger, afterHunger, beforeHealth, afterHealth, beforeWeight, afterWeight);
}

function showItemUsedResult(itemName, stats, beforeStats, beforeHunger, afterHunger, beforeHealth, afterHealth, beforeWeight, afterWeight) {
    // ビューを切り替え
    document.getElementById('inventoryListView').style.display = 'none';
    document.getElementById('itemUsedView').style.display = 'block';
    document.getElementById('inventoryTitle').style.display = 'none';

    const p = gameState.player;

    // ジャンルに応じたアクション動詞を取得
    const category = getItemCategory(itemName);
    let actionVerb = '使用しました';

    if (category.includes('テイクアウト品') || category.includes('食料品')) {
        actionVerb = '食べました';
    } else if (category.includes('ドリンク')) {
        actionVerb = '飲みました';
    } else if (category.includes('書籍')) {
        actionVerb = '読みました';
    } else if (category.includes('スポーツ用品')) {
        actionVerb = '使いました';
    } else if (category.includes('電化製品')) {
        actionVerb = '使いました';
    } else if (category.includes('アクセサリー')) {
        actionVerb = '身につけました';
    } else if (category.includes('乗り物')) {
        actionVerb = '乗りました';
    }

    const statNames = {
        国語: '国語', 数学: '数学', 理科: '理科', 社会: '社会', 英語: '英語',
        音楽: '音楽', 美術: '美術', 体力: '体力', 気力: '気力',
        ルックス: 'ルックス', 素早さ: '素早さ', 面白さ: '面白さ',
        優しさ: '優しさ', エロさ: 'エロさ'
    };

    // 見出し
    const messageEl = document.getElementById('itemUsedMessage');
    messageEl.innerHTML = `<div class="shokudo-eat-heading">${itemName} を${actionVerb}！</div>`;

    // 変化テーブル生成
    const statsEl = document.getElementById('itemUsedStats');
    let html = '';
    html += '<div class="shokudo-eat-label">【能力値の変化】</div>';
    html += '<div class="shokudo-eat-changes">';

    // 能力値の変化
    for (const [key, value] of Object.entries(stats)) {
        if (value && value > 0) {
            const before = beforeStats[key];
            const after = p.abilities[key];
            html += `<div class="shokudo-change-row">`;
            html += `<span class="shokudo-change-label">${statNames[key] || key}</span>`;
            html += `<span class="shokudo-change-value"><span class="shokudo-change-before">${before}</span> ▶ <span class="shokudo-change-after shokudo-change-up">${after}</span></span>`;
            html += `</div>`;
        }
    }

    // 空腹度の変化
    if (beforeHunger !== afterHunger) {
        html += `<div class="shokudo-change-row">`;
        html += `<span class="shokudo-change-label">空腹度</span>`;
        html += `<span class="shokudo-change-value"><span class="shokudo-change-before">${beforeHunger}</span> ▶ <span class="shokudo-change-after shokudo-change-up">${afterHunger}</span></span>`;
        html += `</div>`;
    }

    // 身体パワーの変化
    if (beforeHealth !== afterHealth) {
        html += `<div class="shokudo-change-row">`;
        html += `<span class="shokudo-change-label">身体パワー</span>`;
        html += `<span class="shokudo-change-value"><span class="shokudo-change-before">${beforeHealth}</span> ▶ <span class="shokudo-change-after">${afterHealth}</span></span>`;
        html += `</div>`;
    }

    // 体重の変化
    if (beforeWeight !== afterWeight) {
        html += `<div class="shokudo-change-row">`;
        html += `<span class="shokudo-change-label">体重</span>`;
        html += `<span class="shokudo-change-value"><span class="shokudo-change-before">${beforeWeight.toFixed(1)}kg</span> ▶ <span class="shokudo-change-after">${afterWeight.toFixed(1)}kg</span></span>`;
        html += `</div>`;
    }

    html += '</div>';
    statsEl.innerHTML = html;

    // 表とボタンの間を40pxに調整（purchase-complete-content padding-bottom 20px を引いて20px追加）
    document.getElementById('itemUsedView').querySelector('.confirm-buttons').style.paddingTop = '20px';
}

function backToInventoryList() {
    // ビューを切り替え
    document.getElementById('itemUsedView').style.display = 'none';
    document.getElementById('inventoryFullView').style.display = 'none';
    document.getElementById('inventoryListView').style.display = 'block';
    document.getElementById('inventoryTitle').style.display = '';
    document.getElementById('inventoryTitle').textContent = '所持品リスト';

    // 所持品テーブルを再描画
    renderInventoryTable();
}

function formatPurchaseDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

// ============================================
// ランダムイベント
// ============================================
// 通常ランダムイベント（病気以外）
const randomEvents = [
    {
        text: 'ピアノの練習をしました。音楽の力が３アップ！',
        type: 'good',
        effect: () => { gameState.player.abilities.音楽 += 3; }
    },
    {
        text: '出した本の印税が1000円入りました。',
        type: 'good',
        effect: () => { gameState.player.money += 1000; }
    }
];

// 病気チェック（1日1回、重→中→軽の優先順）
function checkDisease() {
    const p = gameState.player;
    // すでに病気なら判定しない
    if (p.disease) return null;

    // 今日の日付（YYYY-MM-DD）
    const today = new Date().toISOString().slice(0, 10);
    if (gameState.lastDiseaseCheckDate === today) return null;
    gameState.lastDiseaseCheckDate = today;

    const hpRatio = p.health / p.maxHealth;
    const kiryokuRatio = p.intelligence / p.maxIntelligence;

    // 重め（優先度：高）
    if (hpRatio <= 0.2 && Math.random() < 0.15) {
        return { id: 'haien', text: '肺炎にかかってしまいました。' };
    }
    if (hpRatio <= 0.3 && kiryokuRatio <= 0.3 && Math.random() < 0.15) {
        return { id: 'kansenshou', text: '感染症にかかってしまいました。' };
    }
    if (kiryokuRatio <= 0.05 && Math.random() < 0.45) {
        return { id: 'utsubyou', text: 'うつ病になってしまいました。' };
    }

    // 中くらい（優先度：中）
    if (p.workCount >= 8 && Math.random() < 0.45) {
        return { id: 'gikkurigoshi', text: 'ぎっくり腰になってしまいました。' };
    }
    if (Math.random() < 0.05) {
        return { id: 'kossetsu', text: '骨折してしまいました。' };
    }
    if (Math.random() < 0.05) {
        return { id: 'ichouen', text: '胃腸炎にかかってしまいました。' };
    }

    // 軽め（優先度：低）
    if (p.mealCount >= 5 && Math.random() < 0.20) {
        return { id: 'mushiba', text: '虫歯になってしまいました。' };
    }
    if (Math.random() < 0.05) {
        return { id: 'kaze', text: '風邪を引いてしまいました。' };
    }

    return null;
}

function tryShowRandomEvent() {
    // テスト用: イベント無効化
    return;

    // まず病気チェック（1日1回）
    const diseaseResult = checkDisease();
    if (diseaseResult) {
        gameState.player.disease = diseaseResult.id;
        updateStatus();
        showRandomEvent(diseaseResult.text, 'bad');
        return;
    }

    // 通常ランダムイベント（テスト用：90%の確率）
    if (Math.random() > 0.9) return;

    const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
    event.effect();
    updateStatus();
    showRandomEvent(event.text, event.type);
}

function showRandomEvent(text, type) {
    const container = document.getElementById('randomEventNotification');
    const textEl = document.getElementById('randomEventText');
    if (!container || !textEl) return;

    // 一旦非表示にしてアニメーションをリセット
    container.style.display = 'none';
    container.className = 'random-event-notification';

    // 少し遅延させてアニメーションを確実に再トリガー
    requestAnimationFrame(() => {
        textEl.innerHTML = '●イベント発生！<br>' + text;
        container.classList.add(type === 'good' ? 'event-good' : 'event-bad');
        container.style.display = '';
    });
}

// ============================================
// 起動
// ============================================
window.addEventListener('DOMContentLoaded', init);
