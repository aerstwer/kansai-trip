import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Utensils, Train, Sun, CloudRain, Info, Phone, CreditCard, Plane, Bed, Map, ExternalLink, Trash, WifiOff, Clock, Camera, ChevronDown, CheckSquare, Cloud, CloudSun, Snowflake, Loader2, Wallet } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBTQNjMYemXQF-KMCtU9mMpNTea9tRUpcs",
  authDomain: "japan-osaka-daecf.firebaseapp.com",
  projectId: "japan-osaka-daecf",
  storageBucket: "japan-osaka-daecf.firebasestorage.app",
  messagingSenderId: "465652513966",
  appId: "1:465652513966:web:c2ee1c4602ec08aaed013f",
  measurementId: "G-RCKQBWY3E5"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'kansai-travel-mate';
const sanitizedAppId = appId.replace(/[/\.]/g, '_');

// Initialize Firebase
let db, auth;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.warn("Firebase init warning:", e);
}

// --- DATA: 完整行程資料庫 ---
const itineraryData = [
  {
    day: 1,
    date: '12/20 (六)',
    location: '大阪/京都',
    cityCode: 'kyoto',
    weather: { temp: '8°C', condition: 'cloudy' },
    events: [
      {
        type: 'transport',
        time: '19:10',
        title: '抵達關西機場',
        subtitle: 'KIX T1',
        notes: '2. <b><a href="https://guest-ui.west-qr.com/#/" target="_blank" style="color: #60a5fa; text-decoration: underline;">點此開啟 HARUKA 車票</a></b><br/>3. 入關請準備：<b><a href="https://www.vjw.digital.go.jp/main/#/vjwpco001" target="_blank" style="color: #60a5fa; text-decoration: underline;">Visit Japan Web (VJW)</a></b>',
        highlight: '重要: VJW & 車票',
        coords: 'Kansai International Airport'
      },
      {
        type: 'transport',
        time: '20:00',
        title: 'Haruka 特急',
        subtitle: '往京都 (80分)',
        notes: '直達京都車站，免轉車。',
        coords: 'Kyoto Station'
      },
      {
        type: 'hotel',
        time: '21:30',
        title: 'Rihga Gran Kyoto',
        subtitle: 'Check-in',
        notes: '京都站八條口步行 4 分鐘。',
        coords: 'Rihga Gran Kyoto'
      },
      {
        type: 'food',
        time: '22:00',
        title: '深夜拉麵',
        subtitle: '第一旭 / 新福菜館',
        notes: '就在飯店附近，第一旭開到凌晨2點。',
        coords: 'Honke Daiichi-Asahi'
      }
    ]
  },
  {
    day: 2,
    date: '12/21 (日)',
    location: '京都北區',
    cityCode: 'kyoto',
    weather: { temp: '6°C', condition: 'sunny' },
    events: [
      {
        type: 'info',
        time: '必辦事項',
        title: '1. 領取 JR Pass & 劃位',
        subtitle: 'JR西日本人工櫃台',
        highlight: '任務 2 (重要)',
        tips: '請準備：<br/>1. 凱方的信用卡<br/>2. 預定編號後五碼 (49507)<br/>3. 兩人的護照<br/><br/><b>順便劃天橋立車票：</b><br/>去程：橋立1號 (8:38)<br/>回程：橋立8號 (18:09)',
        coords: 'Kyoto Station'
      },
      {
        type: 'info',
        time: '必買票券',
        title: '2. 購買一日券',
        subtitle: '地鐵・巴士一日券 (¥1,100)',
        highlight: '任務 1',
        tips: '請先在京都站外的「巴士乘車處」自動售票機或櫃檯購買。',
        coords: 'Kyoto Station Bus Terminal'
      },

      {
        type: 'transport',
        time: '08:30',
        title: '前往下鴨神社',
        subtitle: '市巴士 4 / 205',
        notes: '從京都站出發，車程約 25-30 分鐘。<span class="text-emerald-400 font-bold">✔ 一日券可用</span>',
        coords: 'Shimogamo Shrine'
      },
      {
        type: 'attraction',
        time: '09:00',
        title: '下鴨神社',
        subtitle: '糺之森散策',
        tips: '建議路線：樓門 → 本殿參拜 → 漫步糺之森。',
        coords: 'Shimogamo Shrine'
      },
      {
        type: 'transport',
        time: '09:55',
        title: '出町柳 → 貴船口',
        subtitle: '叡山電鐵 (約27分)',
        notes: '步行約10分鐘至出町柳站搭車。<br/><span class="text-rose-400 font-bold">❌ 一日券不可用 (¥340)</span>',
        coords: 'Demachiyanagi Station'
      },
      {
        type: 'attraction',
        time: '10:30',
        title: '貴船神社',
        subtitle: '本宮、結社、奧宮',
        tips: '轉乘京都巴士33號(5分)抵達。山路濕滑請注意腳步。',
        coords: 'Kibune Shrine'
      },
      {
        type: 'transport',
        time: '12:00',
        title: '返回出町柳',
        subtitle: '巴士 + 叡山電鐵',
        notes: '建議提早排隊搭巴士回貴船口，再搭電車回出町柳。<span class="text-rose-400 font-bold">❌ 一日券不可用</span>',
        coords: 'Kibuneguchi Station'
      },
            {
        type: 'transport',
        time: '12:45',
        title: '前往京都御所',
        subtitle: '搭巴士 201 203過去 ',
        notes: '車程約(6分鐘)。<span class="text-emerald-400 font-bold">✔ 一日券可用</span>',
        coords: 'Kyoto Imperial Palace'
      },
           {
        type: 'attraction',
        time: '13:10',
        title: '京都御所 (清和院)',
        subtitle: '買菊紋皮革小錢包',
        tips: '從「乾御門」入口進入。無需預約。',
        coords: 'Nakadachiuri Rest Area'
      },
      {
        type: 'attraction',
        time: '12:55',
        title: '前往靈光殿',
        subtitle: '走路約(10分鐘)',
        notes: '走過去就好。<span class="text-emerald-400 font-bold"></span>',
        coords: '靈光殿天滿宮'
      },
      {
        type: 'attraction',
        time: '13:10',
        title: '晴明神社',
        subtitle: '陰陽師聖地',
        tips: '兩座神社步行 3 分鐘可達。',
        coords: 'Seimei Shrine'
      },
      {
        type: 'transport',
        time: '14:10',
        title: '前往金閣寺',
        subtitle: '巴士 12 (最推)',
        notes: '也可搭 59/204/205。車程約 20 分，從門口搭車即可。<span class="text-emerald-400 font-bold">✔ 一日券可用</span>',
        coords: 'Kinkaku-ji'
      },
      {
        type: 'attraction',
        time: '14:35',
        title: '金閣寺',
        subtitle: '鹿苑寺',
        tips: '人多時建議順時針繞園拍照，避開逆光。',
        coords: 'Kinkaku-ji'
      },
      {
        type: 'transport',
        time: '15:20',
        title: '前往四条河原町',
        subtitle: '巴士 12 / 205 / 204',
        notes: '前往錦市場/商圈。車程約 25 分。<span class="text-emerald-400 font-bold">✔ 一日券可用</span>',
        coords: 'Nishiki Market'
      },
      {
        type: 'attraction',
        time: '15:50',
        title: '逛街 & 點心時間',
        subtitle: '3coins / I\'m donut? / Eggslut',
        tips: 'I\'m donut? 甜甜圈、Eggslut 漢堡都在附近，晚餐前的小確幸。',
        coords: 'I\'m donut? Kyoto'
      },
      {
        type: 'food',
        time: '20:30',
        title: 'ENEN 燒肉',
        subtitle: '晚餐',
        highlight: '預約 20:30',
        tips: '盡情享受手毬肉壽司！',
        coords: 'https://maps.app.goo.gl/wKZtZ6Vfz6KTLAFU9'
      },
      {
        type: 'transport',
        time: '22:00',
        title: '返回京都站',
        subtitle: '地鐵烏丸線',
        notes: '步行至烏丸站搭車 (約5分)。<span class="text-emerald-400 font-bold">✔ 一日券可用</span>',
        coords: 'Karasuma Station'
      }
    ]
  },
  {
    day: 3,
    date: '12/22 (一)',
    location: '名古屋',
    cityCode: 'nagoya',
    weather: { temp: '9°C', condition: 'cloudy' },
    events: [
      {
        type: 'transport',
        time: '07:30',
        title: '出發前往名古屋',
        subtitle: '京都 → 名古屋 (新幹線)',
        highlight: 'Klook買1092元',
        notes: '08:00搭乘 Nozomi 204號，08:35抵達。',
        coords: 'Nagoya Station'
      },
      {
        type: 'attraction',
        time: '08:45',
        title: '名古屋城',
        subtitle: '含本丸御殿',
        coords: 'Nagoya Castle'
      },
      {
        type: 'food',
        time: '10:45',
        title: 'HARBS 大名古屋大樓店',
        subtitle: '午餐＋甜點',
        tips: '必吃: 水果千層蛋糕',
        coords: 'HARBS Dai Nagoya Building'
      },
      {
        type: 'transport',
        time: '12:15',
        title: '前往吉卜力公園',
        subtitle: '地鐵東山線 → Linimo',
        coords: 'Ghibli Park'
      },
      {
        type: 'attraction',
        time: '14:00',
        title: '吉卜力公園 (Ghibli Park)',
        subtitle: '大倉庫入場',
        highlight: '請準時入場',
        notes: '攻略: 入場先排該拍的場景。<br/><br/>👉 <b><a href="https://quickticket.moala.fun/books?id=88935175-f46f-44e8-b25c-7d11a0ec16f2" target="_blank" style="color: #60a5fa; text-decoration: underline;">點此開啟 QuickTicket 電子票券</a></b>',
        coords: 'Ghibli Park'
      },
      {
        type: 'info',
        time: 'INFO',
        title: '園區地圖',
        subtitle: '主要區域分佈',
        notes: '超連結: <a href="https://lurl.cc/eqABE" target="_blank" style="color: #60a5fa; text-decoration: underline;">點這邊開啟地圖</a>',
        tips: '青春之丘(5), 吉卜力大倉庫(4), 魔女之谷(2), 動動力森林(1)。',
        coords: 'Ghibli Park'
      },
      {
        type: 'attraction',
        time: '18:15',
        title: '名古屋榮區夜景',
        subtitle: '綠洲21 ＋ 電視塔',
        coords: 'Oasis 21'
      },
      {
        type: 'food',
        time: '19:30',
        title: '晚餐：矢場豬排',
        subtitle: '返回名古屋站買伴手禮(蝦餅、砂糖樹名古屋限定(抹茶口味)',
        coords: 'Yabaton Nagoya Station'
      },
      {
        type: 'transport',
        time: '21:00',
        title: '返回京都',
        subtitle: '新幹線 或 高速巴士',
        highlight: '新幹線(最快)Klook買1092元 / 巴士(省錢)',
        notes: '新幹線: 21:10發 (約35分) <br/> 巴士: 19:15發 (約2小時)',
        coords: 'Kyoto Station'
      }
    ]
  },
  {
    day: 4,
    date: '12/23 (二)',
    location: '天橋立',
    cityCode: 'amanohashidate',
    weather: { temp: '5°C', condition: 'rain' },
    events: [
      {
        type: 'transport',
        time: '08:38',
        title: '京都 → 天橋立',
        subtitle: 'JR 特急橋立 1 號',
        highlight: 'JR Pass 適用',
        notes: '10:40 抵達天橋立站，請在車站寄放行李。',
        coords: 'Amanohashidate Station'
      },
      {
        type: 'transport',
        time: '10:50',
        title: '前往傘松公園',
        subtitle: '公車(¥400) 或 計程車(¥1200)',
        notes: '前往府中地區「傘松公園纜車站」。公車約20分，計程車約10分。',
        coords: 'Motoise Kono Shrine'
      },
      {
        type: 'attraction',
        time: '11:10',
        title: '傘松公園 (昇龍觀)',
        subtitle: '搭纜車/吊椅上山',
        notes: '冬季開放 9:00–17:00。觀景約 20 分鐘。',
        coords: 'Kasamatsu Park'
      },
      {
        type: 'attraction',
        time: '11:40',
        title: '成相寺',
        subtitle: '搭登山巴士',
        notes: '巴士約 10 分鐘，入山費 ¥500。<br/><b>建議 13:00 前回到山下。</b>',
        coords: 'Nariaiji Temple'
      },
      {
        type: 'transport',
        time: '13:00',
        title: '天橋立觀光船',
        subtitle: '一之宮棧橋 → 天橋立棧橋',
        tips: '必玩：船程 12 分鐘，買蝦味先 (¥100) 餵海鷗！🐦',
        coords: 'Ichinomiya Marine Pier'
      },
      {
        type: 'food',
        time: '13:15',
        title: '文珠地區午餐',
        subtitle: '海鮮丼、烏龍麵',
        notes: '步行至文珠地區用餐 (附近有天橋立神社)。',
        coords: 'Chionji Temple'
      },
      {
        type: 'attraction',
        time: '14:00',
        title: '天橋立 View Land',
        subtitle: '飛龍觀 (View Land 纜車站)',
        highlight: '必去: 飛龍觀',
        tips: '一定要體驗「胯下觀龍」！門票 ¥850，營業至 16:30。',
        coords: 'Amanohashidate View Land'
      },
      {
        type: 'attraction',
        time: '15:00',
        title: '智恩寺',
        subtitle: '參拜智慧之神',
        notes: '下山後步行 5 分鐘。',
        coords: 'Chionji Temple'
      },
      {
        type: 'attraction',
        time: '15:30',
        title: '商店街 & 足湯',
        subtitle: '伴手禮、咖啡',
        notes: '若時間充裕可泡「天橋立溫泉足湯」。',
        coords: 'Amanohashidate Station'
      },
      {
        type: 'transport',
        time: '18:09',
        title: '返回京都',
        subtitle: 'JR 特急橋立 8 號',
        notes: '17:00 前回車站取行李。20:21 抵達京都。',
        coords: 'Amanohashidate Station'
      }
    ]
  },
  {
    day: 5,
    date: '12/24 (三)',
    location: '宇治',
    cityCode: 'kyoto',
    weather: { temp: '7°C', condition: 'cloudy' },
    events: [
      {
        type: 'transport',
        time: '08:00',
        title: '京都站出發',
        subtitle: 'JR 奈良線',
        highlight: 'JR Pass 適用',
        notes: '約 25 分鐘抵達 JR 宇治站。',
        coords: 'Kyoto Station'
      },
      {
        type: 'attraction',
        time: '08:30',
        title: '興聖寺',
        subtitle: '宇治早段散策',
        tips: '早上人少氣氛最好，可先購買御朱印。',
        coords: 'Kosho-ji'
      },
      {
        type: 'attraction',
        time: '09:15',
        title: '宇治神社 & 上神社',
        subtitle: '世界遺產',
        coords: 'Ujigami Shrine'
      },
      {
        type: 'attraction',
        time: '10:30',
        title: '平等院 & 中村藤吉',
        subtitle: '鳳凰堂參觀',
        tips: '第一件事：先到中村藤吉平等院店抽號碼牌！',
        coords: 'Byodoin Temple'
      },
      {
        type: 'food',
        time: '11:00',
        title: '午餐：肉屋黑川',
        subtitle: '宇治本店',
        highlight: '11:00 開門，買完伴手禮可以提早去排',
        tips: '第一輪入店最穩，吃完後完全不用趕時間！',
        coords: 'Nikuya Kurokawa Uji'
      },
      {
        type: 'transport',
        time: '13:40',
        title: '返回京都站',
        subtitle: 'JR 奈良線',
        highlight: 'JR Pass 適用',
        notes: '14:15 抵達京都站，準備逛街。',
        coords: 'Uji Station (JR)'
      },
      {
        type: 'attraction',
        time: '14:15',
        title: '京都站購物',
        subtitle: '伊勢丹 / PORTA',
        tips: '不趕時間，悠閒逛街買伴手禮。',
        coords: 'Kyoto Station'
      },
      {
        type: 'attraction',
        time: '17:00',
        title: 'teamLab 京都',
        subtitle: '光影藝術展',
        highlight: '預約 17:00',
        notes: '依實際會場搭地鐵或巴士前往。',
        coords: 'Toji Temple'
      }
    ]
  },
  {
    day: 6,
    date: '12/25 (四)',
    location: '勝尾寺/姬路',
    cityCode: 'himeji',
    weather: { temp: '8°C', condition: 'sunny' },
    events: [
      {
        type: 'transport',
        time: '08:30',
        title: '京都 → 新大阪',
        subtitle: 'JR 新快速',
        highlight: 'JR Pass 適用',
        notes: '09:00 新大阪轉御堂筋線 → 箕面萱野 (寄放行李在車站或勝尾寺)。',
        coords: 'Kyoto Station'
      },
      {
        type: 'transport',
        time: '09:30',
        title: '箕面萱野 → 勝尾寺',
        subtitle: '計程車 (約10分)',
        notes: '建議搭計程車最省時。',
        coords: 'Minoh-Kayano Station'
      },
      {
        type: 'attraction',
        time: '09:45',
        title: '勝尾寺參拜',
        subtitle: '達摩滿山',
        tips: '停留約 1.5 小時。',
        coords: 'Katsuo-ji'
      },
      {
        type: 'transport',
        time: '11:30',
        title: '返回新大阪',
        subtitle: '計程車 + 御堂筋線',
        notes: '12:00-13:00 新大阪站午餐/休息。',
        coords: 'Shin-Osaka Station'
      },
      {
        type: 'transport',
        time: '13:00',
        title: '新大阪 → 姬路',
        subtitle: '山陽新幹線 (自由席)',
        highlight: 'JR Pass 適用',
        notes: '約 30 分鐘抵達。不需劃位，直接搭自由席。',
        coords: 'Himeji Station'
      },
      {
        type: 'attraction',
        time: '13:45',
        title: '姬路城',
        subtitle: '世界遺產',
        tips: '建議參觀 2 小時。門票 ¥1,000。',
        coords: 'Himeji Castle'
      },
      {
        type: 'transport',
        time: '16:00',
        title: '姬路 → 新神戶',
        subtitle: '山陽新幹線 (自由席)',
        highlight: 'JR Pass 適用',
        notes: '約 15 分鐘抵達。出站後轉地鐵 西神・山手線至三宮。',
        coords: 'Shin-Kobe Station'
      },
      {
        type: 'food',
        time: '17:15',
        title: '晚餐：石田屋',
        subtitle: '神戶牛燒肉',
        highlight: '已預約',
        tips: '位於三宮站北野坂 新神戶 → 三宮：地鐵（2 分鐘，¥210，刷西瓜卡）。',
        coords: 'https://maps.app.goo.gl/6Dyqw6bmbcab9iyS9'
      },
      {
        type: 'transport',
        time: '19:00',
        title: '返回新大阪 → 難波',
        subtitle: 'JR三宮回新大阪 + 御堂筋線',
        highlight: 'JR Pass 適用 御堂筋刷西瓜卡',
        notes: '35分鐘回新大阪拿行李，再轉地鐵回難波飯店。',
        coords: 'Shin-Osaka Station'
      },
      {
        type: 'hotel',
        time: '19:35',
        title: 'PG 黑門公寓酒店',
        subtitle: 'Check-in',
        coords: 'PG Kuromon Apartment'
      }
    ]
  },
  {
    day: 7,
    date: '12/26 (五)',
    location: '大阪市區',
    cityCode: 'osaka',
    weather: { temp: '10°C', condition: 'cloudy' },
    events: [
      {
        type: 'food',
        time: '11:00',
        title: 'MooKEN',
        subtitle: '脆皮泡芙',
        tips: '10:30前排隊最穩',
        coords: 'MooKEN Osaka'
      },
      {
        type: 'attraction',
        time: '18:00',
        title: '空中庭園',
        subtitle: '阿貝野展望台',
        coords: 'Harukas300展望台'
      },
    ]
  },
  {
    day: 8,
    date: '12/27 (六)',
    location: '大阪自由',
    cityCode: 'osaka',
    weather: { temp: '9°C', condition: 'sunny' },
    events: [
      {
        type: 'attraction',
        time: '10:00',
        title: '難波八阪神社',
        subtitle: '大獅子頭',
        tips: '吸走厄運！',
        coords: 'Namba Yasaka Shrine'
      },
      {
        type: 'attraction',
        time: '13:00',
        title: '綱敷天神社 御旅社',
        subtitle: '梅田茶屋町',
        highlight: '新增景點',
        tips: '位在梅田鬧區的神社，適合散步。祈求學業進步。',
        notes: '就在 NU 茶屋町附近，參拜後可步行至梅田藍天大廈。',
        coords: 'Tsunashiki Tenjinsha Otabisha'
      },
      {
        type: 'attraction',
        time: '15:00',
        title: '空中庭園',
        subtitle: '梅田展望台',
        coords: 'Umeda Sky Building'
      },
      {
        type: 'food',
        time: '18:00',
        title: '自由晚餐',
        subtitle: '大阪燒/燒肉',
        coords: 'Dotonbori'
      }
    ]
  },
  {
    day: 9,
    date: '12/28 (日)',
    location: '返程',
    cityCode: 'osaka',
    weather: { temp: '10°C', condition: 'cloudy' },
    events: [
      {
        type: 'attraction',
        time: '11:00',
        title: '臨空城 Outlet',
        subtitle: '最後衝刺',
        highlight: '優惠: 記得去 Service Center 領外國人 Coupon',
        tips: '必逛: Nike, Adidas, GAP, Coach',
        coords: 'Rinku Premium Outlets'
      },
      {
        type: 'transport',
        time: '20:10',
        title: '返程航班',
        subtitle: '大阪 20:10 → 高雄 22:45',
        notes: '請於 18:10 前抵達機場櫃檯報到。',
        coords: 'Kansai International Airport'
      }
    ]
  }
];

// --- COMPONENTS ---

// Real-time Weather Widget (using Open-Meteo API)
const LiveWeatherWidget = ({ cityCode }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 座標設定
  const locations = {
    osaka: { lat: 34.6937, lon: 135.5023, name: '大阪' },
    kyoto: { lat: 35.0116, lon: 135.7681, name: '京都' },
    nagoya: { lat: 35.1815, lon: 136.9066, name: '名古屋' },
    amanohashidate: { lat: 35.5701, lon: 135.1912, name: '天橋立' },
    himeji: { lat: 34.8151, lon: 134.6853, name: '姬路' },
  };

  const target = locations[cityCode] || locations['osaka'];

  useEffect(() => {
    setLoading(true);
    const fetchWeather = async () => {
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${target.lat}&longitude=${target.lon}&current_weather=true`);
        const data = await response.json();
        setWeather(data.current_weather);
      } catch (error) {
        console.error("Weather fetch failed", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeather();
    const interval = setInterval(fetchWeather, 1800000);
    return () => clearInterval(interval);
  }, [cityCode]);

  if (loading) return <div className="flex items-center gap-1 text-slate-400 text-xs"><Loader2 size={12} className="animate-spin"/> {target.name}氣象..</div>;
  if (!weather) return null;

  const code = weather.weathercode;
  let Icon = Sun;
  if (code > 0 && code <= 3) { Icon = CloudSun; }
  else if (code > 3 && code < 70) { Icon = CloudRain; }
  else if (code >= 70) { Icon = Snowflake; }

  return (
    <div className="bg-slate-800/80 px-3 py-1.5 rounded-full flex items-center gap-2 text-slate-100 text-xs font-bold border border-slate-700/50 backdrop-blur-sm transition-all duration-500">
      <Icon size={14} className="text-yellow-300" />
      <span>{target.name} 現在 {Math.round(weather.temperature)}°C</span>
    </div>
  );
};

// Static Weather Label (for future dates)
const EstimatedWeatherLabel = ({ weather }) => {
  const Icon = weather.condition === 'sunny' ? Sun : CloudRain;
  return (
    <div className="flex items-center gap-1.5 text-slate-400 text-xs bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
      <Icon size={12} className={weather.condition === 'sunny' ? 'text-amber-400' : 'text-blue-400'} />
      <span>{weather.temp} (12月均溫)</span>
    </div>
  );
};

// Static NavButton for Info Section
const InfoNavButton = ({ coords }) => {
  const isUrl = coords.startsWith('http');
  const href = isUrl ? coords : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`;
  
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center w-full py-3 bg-slate-700 text-slate-200 rounded-xl text-sm font-bold hover:bg-slate-600 transition-colors gap-2 border border-slate-600 mt-2"
    >
      <Map size={16} className="text-emerald-400" />
      導航 Go
    </a>
  );
};

// Enhanced Event Card (Vertical List Style)
const EventCard = ({ event }) => {
  const getIcon = () => {
    switch(event.type) {
      case 'food': return <Utensils size={18} className="text-orange-400" />;
      case 'transport': return <Train size={18} className="text-blue-400" />;
      case 'hotel': return <Bed size={18} className="text-purple-400" />;
      case 'info': return <Info size={18} className="text-cyan-400" />;
      default: return <MapPin size={18} className="text-emerald-400" />;
    }
  };

  const getBorderColor = () => {
     switch(event.type) {
      case 'food': return 'border-l-orange-500';
      case 'transport': return 'border-l-blue-500';
      case 'hotel': return 'border-l-purple-500';
      case 'info': return 'border-l-cyan-500';
      default: return 'border-l-emerald-500';
    }
  };

  const NavButton = () => {
    const isUrl = event.coords.startsWith('http');
    const href = isUrl ? event.coords : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.coords)}`;
    
    return (
      <a 
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center w-full py-2.5 bg-slate-800 text-slate-200 rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors gap-2 border border-slate-700 shadow-sm"
      >
        {isUrl ? <ExternalLink size={14} className="text-blue-300"/> : <Map size={14} className="text-emerald-400"/>}
        導航 Go
      </a>
    );
  };

  return (
    <div className={`bg-slate-900 rounded-xl p-5 shadow-lg mb-4 border-l-4 ${getBorderColor()} relative overflow-hidden border-t border-r border-b border-slate-800`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-slate-800 p-2 rounded-full border border-slate-700 shadow-inner">
            {getIcon()}
          </div>
          <span className="text-sm font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 shadow-sm">
            {event.time}
          </span>
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-slate-100 mb-1 tracking-tight">{event.title}</h3>
      <p className="text-slate-400 text-sm mb-3 font-medium">{event.subtitle}</p>
      
      {event.highlight && (
        <div className="inline-block bg-rose-950/60 text-rose-200 text-xs font-bold px-3 py-1 rounded-md mb-3 border border-rose-900/50">
          {event.highlight}
        </div>
      )}
      
      {event.tips && (
        <div className="bg-amber-950/30 p-3 rounded-lg text-amber-200 text-sm leading-relaxed mb-3 border border-amber-900/50">
          <span className="font-bold block mb-1 text-amber-400 text-xs uppercase tracking-wider">💡 導遊筆記</span>
          <div dangerouslySetInnerHTML={{ __html: event.tips }} />
        </div>
      )}
      
      {/* 支援 HTML 解析，讓超連結與地圖圖片生效 */}
      {event.notes && (
        <div className="text-slate-400 text-sm mb-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: event.notes }} />
      )}

      {/* Special handling for map image */}
      {event.type === 'info' && event.title.includes('地圖') ? (
        <div className="mt-3">
          <p className="text-sm font-bold text-cyan-400 mb-2">園區配置參考：</p>
          <div className="w-full bg-slate-800 rounded-lg flex items-center justify-center h-32 text-slate-500 text-xs border border-slate-700">
             (點擊上方連結開啟地圖)
          </div>
        </div>
      ) : (
        event.type !== 'info' && <NavButton />
      )}
    </div>
  );
};

// --- TOOLS SECTION ---
const ToolsSection = ({ currentDay }) => {
  const [amount, setAmount] = useState('');
  const [item, setItem] = useState('');
  const [expenseDay, setExpenseDay] = useState(currentDay);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => { setExpenseDay(currentDay); }, [currentDay]);

  useEffect(() => {
    let unsubscribeFirestore = () => {};
    const init = async () => {
      if (!auth) { enableOfflineMode(); return; }
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
           try {
             await signInWithCustomToken(auth, __initial_auth_token);
           } catch (tokenError) {
             console.warn("Custom token failed, fallback to anon", tokenError);
             await signInAnonymously(auth);
           }
        } else {
           await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth failed", e);
        enableOfflineMode();
        return;
      }
      onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          setIsOffline(false);
          if (db) {
             const userExpensesRef = collection(db, 'artifacts', sanitizedAppId, 'users', currentUser.uid, 'expenses');
             const q = query(userExpensesRef, orderBy("timestamp", "desc"));
             unsubscribeFirestore = onSnapshot(q, (snapshot) => {
               const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
               setExpenses(data);
               setLoading(false);
             }, () => enableOfflineMode());
          }
        }
      });
    };
    init();
    return () => unsubscribeFirestore();
  }, []);

  const enableOfflineMode = () => {
    setIsOffline(true);
    setLoading(false);
    const localData = localStorage.getItem('local_expenses');
    if (localData) setExpenses(JSON.parse(localData));
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!item || !amount) return;
    const newExpense = { item, amount: Number(amount), day: Number(expenseDay), timestamp: Date.now() };

    if (isOffline) {
      const updated = [ { ...newExpense, id: 'local_' + Date.now() }, ...expenses];
      setExpenses(updated);
      localStorage.setItem('local_expenses', JSON.stringify(updated));
    } else {
      try {
        await addDoc(collection(db, 'artifacts', sanitizedAppId, 'users', user.uid, 'expenses'), { ...newExpense, uid: user.uid, timestamp: Timestamp.now() });
      } catch (error) {
        enableOfflineMode();
      }
    }
    setItem(''); setAmount('');
  };

  const handleDelete = async (id) => {
      if(!confirm('確定刪除?')) return;
      if (isOffline) {
         const updated = expenses.filter(ex => ex.id !== id);
         setExpenses(updated);
         localStorage.setItem('local_expenses', JSON.stringify(updated));
      } else {
         try {
            await deleteDoc(doc(db, 'artifacts', sanitizedAppId, 'users', user.uid, 'expenses', id));
         } catch(e) { console.error(e); }
      }
  }

  const expensesByDay = expenses.reduce((acc, ex) => {
    const d = ex.day || 1;
    if (!acc[d]) acc[d] = [];
    acc[d].push(ex);
    return acc;
  }, {});

  const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="pb-24 px-4 pt-6 w-full">
      <div className="bg-slate-900 rounded-3xl shadow-lg border border-slate-800 p-6 w-full">
        <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <div className="bg-slate-800 p-2 rounded-full text-emerald-400 border border-slate-700"><Wallet size={20}/></div>
            旅費記帳本
        </h3>
        
        {isOffline ? <div className="mb-4 p-3 bg-amber-950/30 text-amber-400 text-xs rounded-lg border border-amber-900/50 flex items-center gap-2"><WifiOff size={16}/> 離線模式</div> : <div className="mb-4 px-2 text-xs text-emerald-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>雲端同步中</div>}

        <form onSubmit={handleAddExpense} className="flex flex-col gap-2 mb-6">
            <div className="relative">
              <select value={expenseDay} onChange={(e) => setExpenseDay(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-sm outline-none focus:border-emerald-500 appearance-none text-slate-200 font-medium">
                {itineraryData.map(d => <option key={d.day} value={d.day}>Day {d.day} - {d.date}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3.5 text-slate-500 pointer-events-none"/>
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="項目" className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-sm outline-none focus:border-emerald-500 text-white placeholder-slate-500" value={item} onChange={(e) => setItem(e.target.value)}/>
              <input type="number" placeholder="¥" className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-sm outline-none focus:border-emerald-500 text-white placeholder-slate-500" value={amount} onChange={(e) => setAmount(e.target.value)}/>
              <button type="submit" className="bg-emerald-600 text-white rounded-lg px-3 py-2 font-bold shadow-lg shadow-emerald-900/20 active:scale-95 transition-transform hover:bg-emerald-500">+</button>
            </div>
        </form>

        <div className="space-y-4 mb-4 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
            {loading ? <p className="text-center text-slate-500 text-sm">載入中...</p> : Object.keys(expensesByDay).length === 0 ? <p className="text-center text-slate-500 text-sm py-4">還沒有記帳紀錄</p> : 
                Object.keys(expensesByDay).sort((a, b) => b - a).map(dayKey => {
                    const dayExpenses = expensesByDay[dayKey];
                    const dayTotal = dayExpenses.reduce((sum, ex) => sum + ex.amount, 0);
                    const dayInfo = itineraryData.find(d => d.day === Number(dayKey));
                    const dateLabel = dayInfo ? dayInfo.date : '未分類';
                    return (
                        <div key={dayKey} className="bg-slate-800/50 rounded-lg p-3 border border-slate-800">
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700">
                                <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Day {dayKey} • {dateLabel}</span>
                                <span className="text-xs font-bold text-emerald-400">¥{dayTotal.toLocaleString()}</span>
                            </div>
                            <div className="space-y-2">
                                {dayExpenses.map(ex => (
                                    <div key={ex.id} className="flex justify-between items-center">
                                        <span className="text-slate-300 text-sm truncate pr-2">{ex.item}</span>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-slate-100 font-bold text-sm">¥{ex.amount.toLocaleString()}</span>
                                            <button onClick={() => handleDelete(ex.id)} className="text-slate-500 hover:text-red-400 transition-colors"><Trash size={12}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            }
        </div>
        <div className="bg-slate-800 text-white rounded-xl p-4 flex justify-between items-center shadow-lg border border-slate-700">
            <span className="text-sm text-slate-400">旅程總花費</span>
            <span className="text-xl font-bold text-emerald-400">¥ {total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

// --- INFO SECTION ---
const InfoSection = () => {
  return (
    <div className="pb-24 px-4 pt-6 w-full space-y-4">
      <div className="bg-slate-900 rounded-xl shadow-lg p-5 border border-slate-800">
        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2 border-b border-slate-800 pb-3"><Bed size={18} className="text-purple-400" />住宿資訊</h3>
        <div className="space-y-6">
          <div>
            <p className="font-bold text-slate-200 text-sm mb-1">京都: Rihga Gran Kyoto</p>
            <p className="text-xs text-slate-500">〒601-8003 京都府京都市南区 東九条西山王町1</p>
            <InfoNavButton coords="Rihga Gran Kyoto" />
          </div>
          <div className="border-t border-slate-800 pt-4">
            <p className="font-bold text-slate-200 text-sm mb-1">大阪: PG 黑門公寓酒店</p>
            <p className="text-xs text-slate-500">〒542-0072 大阪市中央区 高津 3-3-22</p>
            <InfoNavButton coords="PG Kuromon Apartment" />
          </div>
        </div>
      </div>
      <div className="bg-slate-900 rounded-xl shadow-lg p-5 border border-slate-800">
        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2 border-b border-slate-800 pb-3"><CheckSquare size={18} className="text-blue-400" />必備清單</h3>
        <ul className="text-sm text-slate-400 space-y-2.5 list-disc pl-4 marker:text-slate-600">
          <li>環保筷 + 碗 (吃泡麵用)</li><li>洗衣球 (民宿可以洗衣服)</li><li>ESIM / 網卡</li><li>暖暖包 (12月很冷)</li><li>牙刷 (有些環保飯店不提供)</li><li>常備保養品</li>
        </ul>
      </div>
    </div>
  );
};

// --- MAIN APP ---
const App = () => {
  const [activeTab, setActiveTab] = useState('itinerary');
  const [selectedDay, setSelectedDay] = useState(1);
  const currentDayData = itineraryData.find(d => d.day === selectedDay);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden flex-col">
      
      {/* Header */}
      <header className="sticky top-0 bg-slate-900 text-white z-50 px-5 pt-8 pb-4 shadow-xl border-b border-slate-800 rounded-b-3xl shrink-0">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-100">關西補遺憾之旅</h1>
            <p className="text-xs text-slate-400 font-medium">12/20 (六) - 12/28 (日) • 9天8夜</p>
          </div>
          {/* Live Weather Widget in Header */}
          <div className="flex flex-col items-end gap-1">
             <LiveWeatherWidget cityCode={currentDayData.cityCode} />
             <button onClick={() => setActiveTab('info')} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${activeTab === 'info' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}>
               <Info size={14} /> 資訊
             </button>
          </div>
        </div>

        {/* Day Selector - Dark Pills */}
        {activeTab === 'itinerary' && (
          <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide -mx-2 px-2">
            {itineraryData.map((d) => (
              <button key={d.day} onClick={() => setSelectedDay(d.day)} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border border-transparent ${selectedDay === d.day ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50 transform scale-105 border-rose-500' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'}`}>
                D{d.day} {d.location.split('/')[0]}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Area - Full Width List */}
      <main className="flex-1 h-full overflow-y-auto relative bg-slate-950 scroll-smooth">
        <div className="max-w-md mx-auto min-h-full pb-24 pt-6">
            
            {activeTab === 'itinerary' ? (
             <div className="px-5 animate-fade-in">
               <div className="mb-4 flex justify-between items-center">
                 <h2 className="text-lg font-bold text-slate-200 border-l-4 border-rose-500 pl-3">{currentDayData.date} 行程</h2>
                 <EstimatedWeatherLabel weather={currentDayData.weather} />
               </div>
               <div className="space-y-4">
                 {currentDayData.events.map((event, index) => (
                   <EventCard key={index} event={event} />
                 ))}
               </div>
               <div className="h-12 text-center text-slate-700 text-xs mt-8">End of Day {selectedDay}</div>
             </div>
           ) : activeTab === 'tools' ? (
             <ToolsSection currentDay={selectedDay} />
           ) : (
             <InfoSection />
           )}

        </div>
      </main>

      {/* Floating Bottom Nav - Dark Mode */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-slate-400 px-6 py-3 rounded-full shadow-2xl border border-slate-700 flex items-center gap-8 z-50">
        <button onClick={() => setActiveTab('itinerary')} className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === 'itinerary' ? 'text-rose-500' : 'hover:text-slate-200'}`}>
          <Calendar size={22} strokeWidth={activeTab === 'itinerary' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">行程</span>
        </button>
        <div className="w-px h-6 bg-slate-700"></div>
        <button onClick={() => setActiveTab('tools')} className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === 'tools' ? 'text-rose-500' : 'hover:text-slate-200'}`}>
          <CreditCard size={22} strokeWidth={activeTab === 'tools' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">記帳</span>
        </button>
      </nav>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        body { background-color: #020617; }
      `}</style>
    </div>
  );
};

export default App;
