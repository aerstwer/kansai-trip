import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Utensils, Train, Sun, CloudRain, Info, Phone, CreditCard, Plane, Bed, Map, ExternalLink, Trash, WifiOff, Clock, Camera, ChevronDown, CheckSquare } from 'lucide-react';
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
    weather: { temp: '8°C', condition: 'cloudy' },
    events: [
      {
        type: 'transport',
        time: '19:10',
        title: '抵達關西機場 (KIX)',
        subtitle: '航班: 高雄 15:25 → 19:10',
        notes: '入境後上2樓過空橋，找「綠色/白色」售票機領 HARUKA 車票。',
        highlight: '重要: HARUKA 車票',
        coords: 'Kansai International Airport'
      },
      {
        type: 'transport',
        time: '20:00',
        title: 'Haruka 特急 → 京都',
        subtitle: '約 80 分鐘車程',
        notes: '直達京都車站，免轉車。',
        coords: 'Kyoto Station'
      },
      {
        type: 'hotel',
        time: '21:30',
        title: 'Rihga Gran Kyoto',
        subtitle: 'Check-in',
        notes: '京都站八條口步行 4 分鐘。',
        highlight: '住宿',
        coords: 'Rihga Gran Kyoto'
      },
      {
        type: 'food',
        time: '22:00',
        title: '深夜拉麵二選一',
        subtitle: '本家第一旭 / 新福菜館',
        notes: '就在飯店附近，第一旭開到凌晨2點。',
        tips: '必吃: 第一旭醬油拉麵 (排隊名店)',
        coords: 'Honke Daiichi-Asahi'
      }
    ]
  },
  {
    day: 2,
    date: '12/21 (日)',
    location: '京都',
    weather: { temp: '6°C', condition: 'sunny' },
    events: [
      {
        type: 'info',
        time: '購票建議',
        title: '推薦購買：地鐵・巴士一日券',
        subtitle: '售價 ¥1,100',
        highlight: '今日預估車資 ¥1,150 (省¥50)',
        tips: '今日行程巴士趟數多，買這張券不僅划算，還能省去每次投零錢的麻煩！(注意：不包含去貴船的叡山電車)',
        coords: 'Kyoto Station Bus Terminal'
      },
      {
        type: 'transport',
        time: '08:00',
        title: '前往晴明神社',
        subtitle: '搭乘市巴士 9 號 (約25分)',
        notes: '從京都站前 B1 乘車處搭乘 9 號，至「一條戻橋・晴明神社前」下車。',
        coords: 'Seimei Shrine'
      },
      {
        type: 'attraction',
        time: '08:30',
        title: '晴明神社 & 靈光殿天滿宮',
        subtitle: '陰陽師聖地',
        highlight: '新增景點',
        tips: '參拜順序：先去晴明神社看五芒星，再去附近的靈光殿天滿宮。',
        coords: 'Seimei Shrine'
      },
      {
        type: 'transport',
        time: '09:45',
        title: '前往下鴨神社',
        subtitle: '巴士 (東西向移動)201 203 205 ',
        tips: '若是搭市巴士，一定要注意「後門上、前門下」的搭車規則（前門下車刷卡／付費）',
        notes: '搭乘巴士前往「河源町今出川」站。',
        coords: 'Shimogamo Shrine'
      },
      {
        type: 'attraction',
        time: '10:15',
        title: '下鴨神社',
        subtitle: '世界遺產',
        tips: '必買: 「媛守」。參拜後可穿越「糾之森」直接步行至出町柳站 (約10分鐘)，超順路！',
        coords: 'Shimogamo Shrine'
      },
      {
        type: 'transport',
        time: '11:30',
        title: '出町柳 → 貴船',
        subtitle: '叡山電車 (往鞍馬/貴船口)',
        notes: '從出町柳站搭乘，沿途欣賞風景。<b>此段不包含在一日券內</b>。',
        coords: 'Demachiyanagi Station'
      },
      {
        type: 'attraction',
        time: '12:15',
        title: '貴船神社 (含午餐)',
        subtitle: '結緣聖地',
        tips: '必玩: 水占卜。午餐可在貴船街道享用。',
        coords: 'Kibune Shrine'
      },
      {
        type: 'transport',
        time: '14:30',
        title: '出町柳 → 金閣寺',
        subtitle: '搭乘巴士 102/205/1 號',
        notes: '下山回到出町柳站，轉乘巴士直達金閣寺道。',
        coords: 'Kinkaku-ji'
      },
      {
        type: 'attraction',
        time: '15:30',
        title: '金閣寺 (鹿苑寺)',
        subtitle: '京都必去景點',
        tips: '趕在 17:00 關門前參觀，夕陽下的金閣最美。',
        coords: 'Kinkaku-ji'
      },
      {
        type: 'transport',
        time: '16:45',
        title: '金閣寺道 → 四條河原町',
        subtitle: '巴士 204/205/59/101 等',
        highlight: '注意方向',
        notes: '務必確認站牌方向是往「河原町/四條」方向才搭。',
        coords: 'Shijo Kawaramachi'
      },
      {
        type: 'attraction',
        time: '17:30',
        title: '四條河原町逛街',
        subtitle: '購物時間',
        tips: '1. 唐吉訶德 京都四條河原町店<br/>2. 3coins<br/>3. 寶可夢中心京都店 (高島屋)',
        coords: 'Pokemon Center Kyoto'
      },
      {
        type: 'food',
        time: '18:30',
        title: 'I\'m donut? (甜甜圈)',
        subtitle: '人氣甜點',
        tips: '必吃原味生甜甜圈！',
        coords: 'I\'m donut? Kyoto'
      },
      {
        type: 'food',
        time: '19:30',
        title: 'Eggslut (漢堡)',
        subtitle: '晚餐前墊胃',
        notes: '就在 ENEN 燒肉附近。',
        coords: 'Eggslut Kyoto Shijo'
      },
      {
        type: 'food',
        time: '20:30',
        title: 'ENEN 燒肉',
        subtitle: '晚餐',
        tips: '必點: 手毬肉壽司 (需預約)',
        highlight: '已預定(不能遲到)',
        coords: 'https://maps.app.goo.gl/wKZtZ6Vfz6KTLAFU9'
      }
    ]
  },
  {
    day: 3,
    date: '12/22 (一)',
    location: '名古屋',
    weather: { temp: '9°C', condition: 'cloudy' },
    events: [
      {
        type: 'transport',
        time: '07:30',
        title: '出發前往名古屋',
        subtitle: '京都 → 名古屋 (新幹線)',
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
        notes: '攻略: 入場先排該拍的場景。<br/><br/>👉 <b><a href="https://quickticket.moala.fun/books?id=88935175-f46f-44e8-b25c-7d11a0ec16f2" target="_blank" style="color: #2563eb; text-decoration: underline;">點此開啟 QuickTicket 電子票券</a></b>',
        coords: 'Ghibli Park'
      },
      {
        type: 'info',
        time: 'INFO',
        title: '園區地圖',
        subtitle: '主要區域分佈',
        notes: '超連結: <a href="https://lurl.cc/eqABE" target="_blank" style="color: #2563eb; text-decoration: underline;">點這邊開啟地圖</a>',
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
        subtitle: '或 山本屋總本家',
        coords: 'Yabaton Nagoya Station'
      },
      {
        type: 'transport',
        time: '21:00',
        title: '返回京都',
        subtitle: '新幹線 或 高速巴士',
        highlight: '新幹線(最快) / 巴士(省錢)',
        notes: '新幹線: 21:10發 (約35分) <br/> 巴士: 19:15發 (約2小時)',
        coords: 'Kyoto Station'
      }
    ]
  },
  {
    day: 4,
    date: '12/23 (二)',
    location: '天橋立',
    weather: { temp: '5°C', condition: 'rain' },
    events: [
      {
        type: 'transport',
        time: '08:38',
        title: '京都 → 天橋立',
        subtitle: 'JR 特急橋立 1 號',
        highlight: '使用 JR 關西廣域周遊券',
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
    weather: { temp: '7°C', condition: 'cloudy' },
    events: [
      {
        type: 'transport',
        time: '07:40',
        title: '前往三條京阪',
        subtitle: '地鐵烏丸線+東西線 (¥260)',
        notes: '京都站 →烏丸御池(轉乘) → 三條京阪站 (約25分)。',
        coords: 'Sanjo Station Kyoto'
      },
      {
        type: 'info',
        time: '08:10',
        title: '兌換京阪電車一日券',
        subtitle: '京阪三條站指定席窗口',
        highlight: '使用 Have Fun in Kansai Pass QR Code 關西樂享周遊券',
        coords: 'Sanjo Station Kyoto'
      },
      {
        type: 'transport',
        time: '08:30',
        title: '前往石清水八幡宮',
        subtitle: '京阪本線 (約30分鐘)',
        coords: 'Iwashimizu-Hachimangu Station'
      },
      {
        type: 'attraction',
        time: '09:00',
        title: '石清水八幡宮參拜',
        subtitle: '搭乘男山纜車上山 (來回¥400)',
        tips: '看點：勝運守、走井餅、御朱印、展望台眺望木津川流域。',
        coords: 'Iwashimizu Hachimangu'
      },
      {
        type: 'transport',
        time: '11:00',
        title: '八幡市站 → 宇治站',
        subtitle: '京阪本線 + 宇治線 (約25分鐘)',
        coords: 'Keihan Uji Station'
      },
      {
        type: 'food',
        time: '11:30',
        title: '宇治散策 & 午餐',
        subtitle: '平等院/宇治上神社/肉屋黑川',
        highlight: '注意: 肉屋黑川 14:00 結束營業',
        tips: '1. 平等院鳳凰堂 (¥600)<br/>2. 宇治神社、宇治上神社<br/>3. 中村藤吉(抹茶) or 肉屋黑川(和牛丼)<br/>4. 河畔塔之島漫步',
        coords: 'Nikuya Kurokawa Uji'
      },
      {
        type: 'transport',
        time: '16:15',
        title: '宇治 → 京都站',
        subtitle: '搭乘 JR 奈良線',
        highlight: '為了 17:00 teamLab，請務必準時',
        notes: '選擇 JR 回京都比較快，約 20-30 分鐘抵達京都站。',
        coords: 'Kyoto Station'
      },
      {
        type: 'attraction',
        time: '17:00',
        title: 'teamLab 京都',
        subtitle: '光影藝術展',
        highlight: '預約 17:00 - 17:30 進場',
        notes: '抵達京都站後前往會場 (通常為東寺或特定展場，請確認票券地點)。',
        coords: 'Toji Temple'
      }
    ]
  },
  {
    day: 6,
    date: '12/25 (四)',
    location: '勝尾寺/姬路',
    weather: { temp: '8°C', condition: 'sunny' },
    events: [
      {
        type: 'transport',
        time: '08:30',
        title: '前往新大阪 (寄放行李)',
        subtitle: 'JR難波/大阪 → 新大阪',
        notes: '先將行李寄放在新大阪站，再轉御堂筋線直達「箕面萱野站」 (約30分)。',
        coords: 'Shin-Osaka Station'
      },
      {
        type: 'transport',
        time: '09:30',
        title: '箕面萱野站 → 勝尾寺',
        subtitle: '轉搭阪急巴士 29 號',
        notes: '車站出站後轉乘巴士。若 4 人同行可改搭計程車 (約 ¥3,200)。',
        coords: 'Minoh-Kayano Station'
      },
      {
        type: 'attraction',
        time: '10:00',
        title: '勝尾寺 (達摩寺)',
        subtitle: '祈求勝運',
        tips: '建議停留 1.5 小時，山上天氣較涼記得帶外套！到處都是達摩超好拍。',
        coords: 'Katsuo-ji'
      },
      {
        type: 'transport',
        time: '11:30',
        title: '返回箕面萱野站',
        subtitle: '巴士或計程車下山',
        coords: 'Minoh-Kayano Station'
      },
      {
        type: 'transport',
        time: '12:00',
        title: '前往新大阪站',
        subtitle: '御堂筋線',
        notes: '回到新大阪站，準備轉搭新幹線。',
        coords: 'Shin-Osaka Station'
      },
      {
        type: 'transport',
        time: '13:00',
        title: '新大阪 → 姬路',
        subtitle: '山陽新幹線 (自由席)',
        highlight: 'JR Pass 適用',
        notes: '車程約 30 分鐘，可搭 Hikari 或 Kodama 號。',
        coords: 'Himeji Station'
      },
      {
        type: 'attraction',
        time: '13:45',
        title: '姬路城 (世界遺產)',
        subtitle: '白鷺城',
        tips: '入場費 ¥1,000。建議參觀主天守、西之丸庭園。',
        coords: 'Himeji Castle'
      },
      {
        type: 'food',
        time: '16:00',
        title: '姬路站前晚餐',
        subtitle: '自由覓食',
        notes: '商店街或車站附近用餐。',
        coords: 'Himeji Station'
      },
      {
        type: 'transport',
        time: '17:00',
        title: '返回大阪 (難波)',
        subtitle: '姬路 → 新大阪 → 難波',
        notes: '搭新幹線回新大阪，取回行李後轉御堂筋線至難波/心齋橋回飯店。',
        coords: 'Namba Station'
      },
      {
        type: 'hotel',
        time: '19:00',
        title: 'PG 黑門公寓酒店',
        subtitle: '自由活動',
        notes: '回飯店休息或至心齋橋逛街。',
        coords: 'PG Kuromon Apartment'
      }
    ]
  },
  {
    day: 7,
    date: '12/26 (五)',
    location: '大阪市區',
    weather: { temp: '10°C', condition: 'cloudy' },
    events: [
      {
        type: 'food',
        time: '11:00',
        title: 'MooKEN 脆皮泡芙',
        subtitle: '甜點時間',
        highlight: '營業時間短: 11:00-14:00',
        coords: 'MooKEN Osaka'
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
        title: '展望台二選一',
        subtitle: '梅田藍天大廈 / 阿倍野 Harukas',
        notes: '梅田空中庭園 15:00 前入場可能有優惠(視周遊卡規定)。',
        coords: 'Umeda Sky Building'
      },
      {
        type: 'food',
        time: '20:00',
        title: 'A5 肉十八番',
        subtitle: '燒肉晚餐',
        highlight: '預約: 20:00',
        tips: '攻略: A5和牛吃到飽，請空腹前往!',
        coords: 'Yakiniku Nikuhachi'
      }
    ]
  },
  {
    day: 8,
    date: '12/27 (六)',
    location: '大阪自由',
    weather: { temp: '9°C', condition: 'sunny' },
    events: [
      {
        type: 'attraction',
        time: '10:00',
        title: '難波八阪神社',
        subtitle: '巨大獅子頭',
        tips: '必拍: 獅子殿 (據說能吸走厄運，招來好運)',
        coords: 'Namba Yasaka Shrine'
      },
      {
        type: 'food',
        time: '18:00',
        title: '大阪燒 / 自由晚餐',
        subtitle: 'Hirokazuya 或 力丸燒肉',
        notes: '最後一晚，盡情享受大阪美食。',
        coords: 'Dotonbori'
      }
    ]
  },
  {
    day: 9,
    date: '12/28 (日)',
    location: '返程',
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

const WeatherWidget = ({ weather }) => {
  const Icon = weather.condition === 'sunny' ? Sun : CloudRain;
  return (
    <div className="absolute top-4 right-4 bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 text-white text-sm font-medium z-10 border border-white/20">
      <Icon size={16} className="text-white drop-shadow-md" />
      <span className="drop-shadow-md">{weather.temp}</span>
    </div>
  );
};

// Modified NavButton to check if coords is a URL
const NavButton = ({ coords }) => {
  const isUrl = coords.startsWith('http');
  const href = isUrl ? coords : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`;
  
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex items-center justify-center w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors gap-2"
    >
      <ExternalLink size={14} />
      導航 Go
    </a>
  );
};

const EventCard = ({ event }) => {
  const getIcon = () => {
    switch(event.type) {
      case 'food': return <Utensils size={18} className="text-orange-500" />;
      case 'transport': return <Train size={18} className="text-indigo-500" />;
      case 'hotel': return <Bed size={18} className="text-purple-500" />;
      case 'info': return <Info size={18} className="text-cyan-500" />;
      default: return <MapPin size={18} className="text-emerald-500" />;
    }
  };

  const getBorderColor = () => {
     switch(event.type) {
      case 'food': return 'border-l-orange-400';
      case 'transport': return 'border-l-indigo-400';
      case 'hotel': return 'border-l-purple-400';
      case 'info': return 'border-l-cyan-400';
      default: return 'border-l-emerald-400';
    }
  };

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm mb-4 border-l-4 ${getBorderColor()} relative overflow-hidden`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 p-1.5 rounded-full">
            {getIcon()}
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
            {event.time}
          </span>
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-slate-800 mb-1">{event.title}</h3>
      <p className="text-slate-500 text-sm mb-2">{event.subtitle}</p>
      
      {event.highlight && (
        <div className="inline-block bg-red-50 text-red-500 text-xs font-bold px-2 py-1 rounded mb-2">
          {event.highlight}
        </div>
      )}
      
      {event.tips && (
        <div className="bg-amber-50 p-3 rounded-lg text-amber-700 text-xs leading-relaxed mb-2 border border-amber-100">
          <span className="font-bold block mb-1">💡 導遊筆記：</span>
          <div dangerouslySetInnerHTML={{ __html: event.tips }} />
        </div>
      )}
      
      {/* 支援 HTML 解析，讓超連結與地圖圖片生效 */}
      {event.notes && (
        <div className="text-slate-400 text-xs mb-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: event.notes }} />
      )}

      {/* 導航按鈕：如果不是純資訊卡片 (type='info') 則顯示 */}
      {event.type !== 'info' && <NavButton coords={event.coords} />}
    </div>
  );
};

// --- TOOLS SECTION WITH OFFLINE SUPPORT ---
const ToolsSection = ({ currentDay }) => {
  const [amount, setAmount] = useState('');
  const [item, setItem] = useState('');
  // Initialize expenseDay with currentDay passed from props
  const [expenseDay, setExpenseDay] = useState(currentDay);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [user, setUser] = useState(null);

  // Sync expenseDay when currentDay prop changes
  useEffect(() => {
    setExpenseDay(currentDay);
  }, [currentDay]);

  // Auth & Sync Logic
  useEffect(() => {
    let unsubscribeFirestore = () => {};

    const init = async () => {
      // 1. Check if Firebase Auth is viable
      if (!auth) {
        enableOfflineMode();
        return;
      }

      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
           await signInWithCustomToken(auth, __initial_auth_token);
        } else {
           await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth failed, switching to offline mode:", e);
        enableOfflineMode();
        return; // Stop further auth attempts
      }

      // If Auth success, setup listener
      const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          setIsOffline(false);
          // Sync with Firestore
          if (db) {
             const userExpensesRef = collection(db, 'artifacts', appId, 'users', currentUser.uid, 'expenses');
             const q = query(userExpensesRef, orderBy("timestamp", "desc"));
             unsubscribeFirestore = onSnapshot(q, (snapshot) => {
               const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
               setExpenses(data);
               setLoading(false);
             }, (err) => {
               console.error("Firestore error, fallback offline", err);
               enableOfflineMode();
             });
          }
        } else {
          // Should not happen if signIn was successful, but handle safe
          // enableOfflineMode(); 
        }
      });
    };

    init();

    return () => {
      unsubscribeFirestore();
    };
  }, []);

  const enableOfflineMode = () => {
    setIsOffline(true);
    setLoading(false);
    // Load from LocalStorage
    const localData = localStorage.getItem('local_expenses');
    if (localData) {
      setExpenses(JSON.parse(localData));
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!item || !amount) return;

    const newExpense = {
      item,
      amount: Number(amount),
      day: Number(expenseDay), // Save selected day
      timestamp: Date.now(),
      dateStr: new Date().toISOString()
    };

    if (isOffline) {
      // OFFLINE: Save to LocalStorage
      const updatedExpenses = [ { ...newExpense, id: 'local_' + Date.now() }, ...expenses];
      setExpenses(updatedExpenses);
      localStorage.setItem('local_expenses', JSON.stringify(updatedExpenses));
      setItem('');
      setAmount('');
    } else {
      // ONLINE: Save to Firestore
      try {
        const userExpensesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'expenses');
        await addDoc(userExpensesRef, {
            ...newExpense,
            uid: user.uid,
            timestamp: Timestamp.now()
        });
        setItem('');
        setAmount('');
      } catch (error) {
        alert("雲端儲存失敗，切換至離線模式");
        enableOfflineMode();
        // Retry locally
        const updatedExpenses = [ { ...newExpense, id: 'local_' + Date.now() }, ...expenses];
        setExpenses(updatedExpenses);
        localStorage.setItem('local_expenses', JSON.stringify(updatedExpenses));
      }
    }
  };

  const handleDelete = async (id) => {
      if(confirm('確定刪除此筆紀錄?')) {
          if (isOffline) {
             const updated = expenses.filter(ex => ex.id !== id);
             setExpenses(updated);
             localStorage.setItem('local_expenses', JSON.stringify(updated));
          } else {
             try {
                const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'expenses', id);
                await deleteDoc(docRef);
             } catch(e) {
                console.error("Delete failed", e);
                alert("刪除失敗");
             }
          }
      }
  }

  // Group expenses by day
  const expensesByDay = expenses.reduce((acc, ex) => {
    const d = ex.day || 1; // Default to Day 1 if undefined
    if (!acc[d]) acc[d] = [];
    acc[d].push(ex);
    return acc;
  }, {});

  const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="pb-24 px-4 pt-6 max-w-md mx-auto">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="bg-rose-100 p-2 rounded-full text-rose-600"><CreditCard size={20}/></div>
            旅費記帳本
        </h3>
        
        {isOffline ? (
             <div className="mb-4 p-3 bg-amber-50 text-amber-700 text-xs rounded-lg border border-amber-200 flex items-center gap-2">
                 <WifiOff size={16} />
                 <span><strong>離線模式</strong>：資料將儲存於此裝置，未同步雲端。</span>
             </div>
        ) : (
             <div className="mb-4 px-2 text-xs text-emerald-600 flex items-center gap-1">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 雲端同步中
             </div>
        )}

        {/* Expense Form */}
        <form onSubmit={handleAddExpense} className="flex flex-col gap-2 mb-6">
            {/* Day Selector */}
            <div className="relative">
              <select 
                value={expenseDay} 
                onChange={(e) => setExpenseDay(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-400 appearance-none text-slate-700 font-medium"
              >
                {itineraryData.map(d => (
                  <option key={d.day} value={d.day}>
                    Day {d.day} - {d.date}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none"/>
            </div>

            <div className="flex gap-2">
              <input 
                  type="text" 
                  placeholder="項目 (如: 章魚燒)" 
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-400"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
              />
              <input 
                  type="number" 
                  placeholder="¥ 金額" 
                  className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-400"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
              />
              <button type="submit" className="bg-rose-500 text-white rounded-lg px-3 py-2 font-bold shadow-lg shadow-rose-200 active:scale-95 transition-transform">+</button>
            </div>
        </form>

        {/* Expense List Grouped by Day */}
        <div className="space-y-4 mb-4 max-h-80 overflow-y-auto pr-1">
            {loading ? (
                <p className="text-center text-slate-400 text-sm">載入中...</p>
            ) : Object.keys(expensesByDay).length === 0 ? (
                <p className="text-center text-slate-300 text-sm py-4">還沒有記帳紀錄</p>
            ) : (
                Object.keys(expensesByDay).sort((a, b) => b - a).map(dayKey => {
                    const dayExpenses = expensesByDay[dayKey];
                    const dayTotal = dayExpenses.reduce((sum, ex) => sum + ex.amount, 0);
                    // Find date string from itinerary data
                    const dayInfo = itineraryData.find(d => d.day === Number(dayKey));
                    const dateLabel = dayInfo ? dayInfo.date : '未分類日期';

                    return (
                        <div key={dayKey} className="bg-slate-50 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200/60">
                                <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">Day {dayKey} • {dateLabel}</span>
                                <span className="text-xs font-bold text-slate-400">小計: ¥{dayTotal.toLocaleString()}</span>
                            </div>
                            <div className="space-y-2">
                                {dayExpenses.map(ex => (
                                    <div key={ex.id} className="flex justify-between items-center">
                                        <span className="text-slate-700 text-sm">{ex.item}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-slate-800 font-bold text-sm">¥{ex.amount.toLocaleString()}</span>
                                            <button onClick={() => handleDelete(ex.id)} className="text-slate-300 hover:text-red-400"><Trash size={12}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            )}
        </div>

        <div className="bg-slate-800 text-white rounded-xl p-4 flex justify-between items-center shadow-lg shadow-slate-200">
            <span className="text-sm text-slate-300">旅程總花費</span>
            <span className="text-xl font-bold">¥ {total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

// --- INFO SECTION ---
const InfoSection = () => {
  return (
    <div className="pb-24 px-4 pt-6 max-w-md mx-auto">
      
      {/* 住宿資訊 */}
      <div className="bg-white rounded-xl shadow-sm border-l-4 border-rose-400 p-5 mb-4">
        <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Bed size={20} className="text-rose-500" />
          住宿資訊
        </h3>
        
        <div className="mb-4">
          <p className="font-bold text-slate-700 text-sm">京都: Rihga Gran Kyoto</p>
          <p className="text-xs text-slate-500 mb-2">〒601-8003 京都府京都市南区 東九条西山王町1</p>
          <NavButton coords="Rihga Gran Kyoto" />
        </div>
        
        <div className="border-t border-slate-100 pt-3">
          <p className="font-bold text-slate-700 text-sm">大阪: PG 黑門公寓酒店</p>
          <p className="text-xs text-slate-500 mb-2">〒542-0072 大阪市中央区 高津 3-3-22</p>
          <NavButton coords="PG Kuromon Apartment" />
        </div>
      </div>

      {/* 必備清單 */}
      <div className="bg-white rounded-xl shadow-sm border-l-4 border-rose-400 p-5">
        <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <CheckSquare size={20} className="text-rose-500" />
          必備清單
        </h3>
        <ul className="text-sm text-slate-600 space-y-2 list-none">
          <li>□ 環保筷 + 碗 (吃泡麵用)</li>
          <li>□ 洗衣球 (民宿可以洗衣服)</li>
          <li>□ ESIM / 網卡</li>
          <li>□ 暖暖包 (12月很冷)</li>
          <li>□ 牙刷 (有些環保飯店不提供)</li>
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
    <div className="min-h-screen bg-[#F2F1F6] font-sans text-slate-800 pb-24">
      {/* Header - Pink Theme */}
      <header className="sticky top-0 bg-rose-400 text-white z-50 px-5 pt-8 pb-4 shadow-md rounded-b-3xl">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">關西補遺憾之旅</h1>
            <p className="text-xs opacity-90 font-medium">12/20 (六) - 12/28 (日) • 9天8夜</p>
          </div>
          <button 
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'info' ? 'bg-slate-800 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
          >
            <Info size={14} /> 資訊
          </button>
        </div>

        {/* Day Selector - White Pills */}
        {activeTab === 'itinerary' && (
          <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide -mx-2 px-2">
            {itineraryData.map((d) => (
              <button
                key={d.day}
                onClick={() => setSelectedDay(d.day)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                  selectedDay === d.day 
                    ? 'bg-white text-rose-500 shadow-md transform scale-105' 
                    : 'bg-white/30 text-white hover:bg-white/50'
                }`}
              >
                D{d.day} {d.location.split('/')[0]}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto pt-6">
        {activeTab === 'itinerary' ? (
          <div className="px-5 animate-fade-in">
            {/* Day Header */}
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-700 border-l-4 border-rose-400 pl-3">
                {currentDayData.date} 行程
              </h2>
              <div className="bg-white px-3 py-1 rounded-full shadow-sm flex items-center gap-2 text-slate-500 text-xs font-bold border border-slate-100">
                {currentDayData.weather.condition === 'sunny' ? <Sun size={14} className="text-orange-400"/> : <CloudRain size={14} className="text-blue-400"/>}
                {currentDayData.weather.temp}
              </div>
            </div>

            {/* Timeline Events */}
            <div className="space-y-4">
              {currentDayData.events.map((event, index) => (
                <EventCard key={index} event={event} />
              ))}
            </div>

            <div className="h-12"/>
          </div>
        ) : activeTab === 'tools' ? (
          <ToolsSection currentDay={selectedDay} />
        ) : (
          <InfoSection />
        )}
      </main>

      {/* Floating Bottom Nav */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md text-slate-400 px-6 py-3 rounded-full shadow-xl border border-slate-100 flex items-center gap-8 z-50">
        <button 
          onClick={() => setActiveTab('itinerary')} 
          className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === 'itinerary' ? 'text-rose-500' : 'hover:text-slate-600'}`}
        >
          <Calendar size={22} strokeWidth={activeTab === 'itinerary' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">行程</span>
        </button>
        <div className="w-px h-6 bg-slate-200"></div>
        <button 
          onClick={() => setActiveTab('tools')} 
          className={`flex flex-col items-center gap-0.5 transition-colors ${activeTab === 'tools' ? 'text-rose-500' : 'hover:text-slate-600'}`}
        >
          <CreditCard size={22} strokeWidth={activeTab === 'tools' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">記帳</span>
        </button>
      </nav>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
