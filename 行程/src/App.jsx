import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Utensils, Train, Sun, CloudRain, Info, Phone, CreditCard, Plane, Bed, Map, ExternalLink, Trash, WifiOff, Clock, Camera, ChevronRight, CheckSquare, Cloud, CloudSun, Snowflake, Loader2, Wallet } from 'lucide-react';
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

// --- DATA: 行程資料庫 ---
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
        title: '抵達關西機場',
        subtitle: 'KIX T1',
        notes: '入境後上2樓過空橋，找「綠色/白色」售票機領 HARUKA 車票。',
        coords: 'Kansai International Airport',
        size: 'large',
        theme: 'blue'
      },
      {
        type: 'transport',
        time: '20:00',
        title: 'Haruka 特急',
        subtitle: '往京都 (80分)',
        notes: '直達京都車站，免轉車。',
        coords: 'Kyoto Station',
        size: 'small',
        theme: 'gray'
      },
      {
        type: 'hotel',
        time: '21:30',
        title: 'Rihga Gran Kyoto',
        subtitle: 'Check-in',
        notes: '京都站八條口步行 4 分鐘。',
        coords: 'Rihga Gran Kyoto',
        size: 'medium',
        theme: 'purple'
      },
      {
        type: 'food',
        time: '22:00',
        title: '深夜拉麵',
        subtitle: '第一旭 / 新福菜館',
        notes: '就在飯店附近，第一旭開到凌晨2點。',
        coords: 'Honke Daiichi-Asahi',
        size: 'medium',
        theme: 'orange'
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
        time: '必買',
        title: '地鐵巴士一日券',
        subtitle: '省錢攻略',
        tips: '今日車資預估 ¥1,150，買券省 ¥50 且方便！',
        coords: 'Kyoto Station Bus Terminal',
        size: 'small',
        theme: 'yellow'
      },
      {
        type: 'attraction',
        time: '08:30',
        title: '晴明神社',
        subtitle: '陰陽師',
        tips: '必看五芒星鳥居！附近還有靈光殿天滿宮。',
        coords: 'Seimei Shrine',
        size: 'medium',
        theme: 'indigo'
      },
      {
        type: 'attraction',
        time: '10:15',
        title: '下鴨神社',
        subtitle: '世界遺產',
        tips: '必買「媛守」。參拜後穿越糾之森去搭車。',
        coords: 'Shimogamo Shrine',
        size: 'medium',
        theme: 'red'
      },
      {
        type: 'attraction',
        time: '12:15',
        title: '貴船神社',
        subtitle: '水占卜',
        notes: '搭叡山電車上山，景色超美。午餐在貴船街道。',
        coords: 'Kibune Shrine',
        size: 'large',
        theme: 'red'
      },
      {
        type: 'attraction',
        time: '15:30',
        title: '金閣寺',
        subtitle: '夕陽金閣',
        tips: '趕在 17:00 關門前！從出町柳搭巴士前往。',
        coords: 'Kinkaku-ji',
        size: 'medium',
        theme: 'yellow'
      },
      {
        type: 'attraction',
        time: '17:30',
        title: '河原町逛街',
        subtitle: '四條通',
        tips: '唐吉訶德、3coins、寶可夢中心(高島屋)。',
        coords: 'Pokemon Center Kyoto',
        size: 'medium',
        theme: 'pink'
      },
      {
        type: 'food',
        time: '18:30',
        title: '甜點漢堡',
        subtitle: 'I\'m donut?',
        tips: '必吃生甜甜圈！Eggslut 也在附近。',
        coords: 'I\'m donut? Kyoto',
        size: 'small',
        theme: 'orange'
      },
      {
        type: 'food',
        time: '20:30',
        title: 'ENEN 燒肉',
        subtitle: '手毬肉壽司',
        highlight: '已預約',
        coords: 'https://maps.app.goo.gl/wKZtZ6Vfz6KTLAFU9',
        size: 'large',
        theme: 'orange'
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
        time: '08:00',
        title: '新幹線',
        subtitle: '往名古屋',
        notes: '08:35 抵達，寄放行李。',
        coords: 'Nagoya Station',
        size: 'small',
        theme: 'blue'
      },
      {
        type: 'attraction',
        time: '08:45',
        title: '名古屋城',
        subtitle: '本丸御殿',
        coords: 'Nagoya Castle',
        size: 'medium',
        theme: 'green'
      },
      {
        type: 'food',
        time: '10:45',
        title: 'HARBS',
        subtitle: '水果千層',
        tips: '名古屋必吃甜點！',
        coords: 'HARBS Dai Nagoya Building',
        size: 'medium',
        theme: 'orange'
      },
      {
        type: 'attraction',
        time: '14:00',
        title: '吉卜力公園',
        subtitle: '大倉庫入場',
        highlight: '重點行程',
        notes: '👉 <b><a href="https://quickticket.moala.fun/books?id=88935175-f46f-44e8-b25c-7d11a0ec16f2" target="_blank" style="color:white; text-decoration: underline;">開啟 QuickTicket 票券</a></b>',
        coords: 'Ghibli Park',
        size: 'large',
        theme: 'green'
      },
      {
        type: 'info',
        time: 'INFO',
        title: '園區地圖',
        subtitle: '點擊查看',
        notes: '<a href="https://lurl.cc/eqABE" target="_blank" style="color:white; text-decoration: underline;">開啟地圖連結</a>',
        coords: 'Ghibli Park',
        size: 'medium',
        theme: 'green'
      },
      {
        type: 'attraction',
        time: '18:15',
        title: '榮區夜景',
        subtitle: '綠洲21',
        coords: 'Oasis 21',
        size: 'medium',
        theme: 'indigo'
      },
      {
        type: 'transport',
        time: '21:00',
        title: '返回京都',
        subtitle: '新幹線/巴士',
        notes: '新幹線 21:10 (35分) 或 巴士 19:15 (2小時)。',
        coords: 'Kyoto Station',
        size: 'medium',
        theme: 'blue'
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
        title: '特急橋立號',
        subtitle: '往天橋立',
        highlight: 'JR Pass D1',
        coords: 'Amanohashidate Station',
        size: 'medium',
        theme: 'blue'
      },
      {
        type: 'attraction',
        time: '11:10',
        title: '傘松公園',
        subtitle: '昇龍觀',
        notes: '搭纜車上山，再轉登山巴士去成相寺。',
        coords: 'Kasamatsu Park',
        size: 'large',
        theme: 'green'
      },
      {
        type: 'attraction',
        time: '13:00',
        title: '觀光船',
        subtitle: '餵海鷗',
        tips: '記得買蝦味先！船程12分鐘。',
        coords: 'Ichinomiya Marine Pier',
        size: 'small',
        theme: 'cyan'
      },
      {
        type: 'attraction',
        time: '14:00',
        title: 'View Land',
        subtitle: '飛龍觀',
        tips: '必做：胯下觀龍',
        coords: 'Amanohashidate View Land',
        size: 'large',
        theme: 'green'
      },
      {
        type: 'attraction',
        time: '15:00',
        title: '智恩寺 & 足湯',
        subtitle: '散步時間',
        coords: 'Chionji Temple',
        size: 'medium',
        theme: 'purple'
      },
      {
        type: 'transport',
        time: '18:09',
        title: '返回京都',
        subtitle: '特急橋立8號',
        coords: 'Amanohashidate Station',
        size: 'medium',
        theme: 'blue'
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
        type: 'info',
        time: '券',
        title: '京阪電車一日券',
        subtitle: '三條站兌換',
        coords: 'Sanjo Station Kyoto',
        size: 'small',
        theme: 'yellow'
      },
      {
        type: 'attraction',
        time: '09:00',
        title: '石清水八幡宮',
        subtitle: '搭纜車',
        coords: 'Iwashimizu Hachimangu',
        size: 'medium',
        theme: 'red'
      },
      {
        type: 'food',
        time: '11:30',
        title: '午餐戰場',
        subtitle: '肉屋黑川',
        highlight: '14:00 關門',
        tips: '排不到就吃中村藤吉！',
        coords: 'Nikuya Kurokawa Uji',
        size: 'large',
        theme: 'orange'
      },
      {
        type: 'attraction',
        time: '13:00',
        title: '平等院',
        subtitle: '10圓硬幣',
        coords: 'Byodoin Temple',
        size: 'medium',
        theme: 'green'
      },
      {
        type: 'transport',
        time: '16:15',
        title: '返回京都站',
        subtitle: '搭 JR 較快',
        coords: 'Uji Station (JR)',
        size: 'small',
        theme: 'blue'
      },
      {
        type: 'attraction',
        time: '17:00',
        title: 'teamLab',
        subtitle: '京都展',
        highlight: '已預約',
        coords: 'Toji Temple',
        size: 'large',
        theme: 'dark'
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
        type: 'attraction',
        time: '10:00',
        title: '勝尾寺',
        subtitle: '達摩滿山',
        tips: '拍照超美！',
        coords: 'Katsuo-ji',
        size: 'large',
        theme: 'red'
      },
      {
        type: 'transport',
        time: '13:00',
        title: '前往姬路',
        subtitle: '新幹線',
        coords: 'Himeji Station',
        size: 'small',
        theme: 'blue'
      },
      {
        type: 'attraction',
        time: '13:45',
        title: '姬路城',
        subtitle: '白鷺城',
        tips: '世界遺產',
        coords: 'Himeji Castle',
        size: 'large',
        theme: 'white'
      },
      {
        type: 'hotel',
        time: '19:00',
        title: '大阪 Check-in',
        subtitle: 'PG 黑門公寓',
        coords: 'PG Kuromon Apartment',
        size: 'medium',
        theme: 'purple'
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
        title: 'MooKEN',
        subtitle: '脆皮泡芙',
        tips: '只開到 14:00',
        coords: 'MooKEN Osaka',
        size: 'medium',
        theme: 'orange'
      },
      {
        type: 'attraction',
        time: '13:00',
        title: '綱敷天神社',
        subtitle: '御旅社',
        notes: '梅田茶屋町散步。',
        coords: 'Tsunashiki Tenjinsha Otabisha',
        size: 'medium',
        theme: 'indigo'
      },
      {
        type: 'attraction',
        time: '15:00',
        title: '空中庭園',
        subtitle: '梅田展望台',
        coords: 'Umeda Sky Building',
        size: 'large',
        theme: 'blue'
      },
      {
        type: 'food',
        time: '20:00',
        title: 'A5 肉十八番',
        subtitle: '燒肉晚餐',
        highlight: '已預約',
        coords: 'Yakiniku Nikuhachi',
        size: 'large',
        theme: 'orange'
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
        subtitle: '大獅子頭',
        tips: '吸走厄運！',
        coords: 'Namba Yasaka Shrine',
        size: 'large',
        theme: 'green'
      },
      {
        type: 'food',
        time: '18:00',
        title: '自由晚餐',
        subtitle: '大阪燒/燒肉',
        coords: 'Dotonbori',
        size: 'medium',
        theme: 'orange'
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
        coords: 'Rinku Premium Outlets',
        size: 'large',
        theme: 'pink'
      },
      {
        type: 'transport',
        time: '20:10',
        title: '回家囉',
        subtitle: '大阪 → 高雄',
        notes: '18:10 前到機場。',
        coords: 'Kansai International Airport',
        size: 'medium',
        theme: 'blue'
      }
    ]
  }
];

// --- COMPONENTS ---

const LiveWeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const LAT = 34.6937;
  const LON = 135.5023;

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current_weather=true`);
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
  }, []);

  if (loading) return <div className="flex items-center gap-1 text-slate-400 text-xs"><Loader2 size={12} className="animate-spin"/> 氣象..</div>;
  if (!weather) return null;

  const code = weather.weathercode;
  let Icon = Sun;
  if (code > 0 && code <= 3) { Icon = CloudSun; }
  else if (code > 3 && code < 70) { Icon = CloudRain; }
  else if (code >= 70) { Icon = Snowflake; }

  return (
    <div className="bg-slate-800/80 px-3 py-1 rounded-full flex items-center gap-2 text-slate-100 text-xs font-bold border border-slate-700/50 backdrop-blur-sm">
      <Icon size={12} className="text-yellow-400" />
      <span>大阪 {Math.round(weather.temperature)}°C</span>
    </div>
  );
};

const NavButton = ({ coords }) => {
  const isUrl = coords.startsWith('http');
  const href = isUrl ? coords : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all text-white z-10 border border-white/10 shadow-lg">
      {coords.startsWith('http') ? <ExternalLink size={16} /> : <Map size={16} />}
    </a>
  );
};

const BentoCard = ({ event }) => {
  const getThemeStyles = (theme) => {
    switch(theme) {
      case 'orange': return 'bg-gradient-to-br from-orange-500 to-red-600 text-white';
      case 'blue': return 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white';
      case 'green': return 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white';
      case 'purple': return 'bg-gradient-to-br from-purple-500 to-violet-600 text-white';
      case 'yellow': return 'bg-gradient-to-br from-amber-400 to-orange-500 text-white';
      case 'red': return 'bg-gradient-to-br from-rose-500 to-red-600 text-white';
      case 'pink': return 'bg-gradient-to-br from-pink-500 to-rose-500 text-white';
      case 'cyan': return 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white';
      case 'indigo': return 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white';
      case 'dark': return 'bg-slate-800 text-white';
      default: return 'bg-slate-800 text-white';
    }
  };

  const getSizeClasses = (size) => {
    switch(size) {
      case 'large': return 'col-span-2 row-span-2 min-h-[200px]'; // 變大一點
      case 'medium': return 'col-span-2 sm:col-span-1 min-h-[140px]';
      default: return 'col-span-1 min-h-[120px]';
    }
  };

  const getIcon = () => {
    switch(event.type) {
      case 'food': return <Utensils size={16} />;
      case 'transport': return <Train size={16} />;
      case 'hotel': return <Bed size={16} />;
      case 'info': return <Info size={16} />;
      default: return <MapPin size={16} />;
    }
  };

  return (
    <div className={`relative rounded-3xl p-5 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden group ${getThemeStyles(event.theme)} ${getSizeClasses(event.size)}`}>
      {/* Background Decor */}
      <div className="absolute -right-4 -bottom-4 opacity-10 scale-150 rotate-12 group-hover:scale-125 transition-transform duration-500">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">
          <Clock size={10} />
          {event.time}
        </div>
        
        <h3 className="text-lg font-bold leading-tight mb-1 line-clamp-2">{event.title}</h3>
        <p className="text-xs font-medium opacity-90 line-clamp-1">{event.subtitle}</p>
      </div>

      {/* Details for larger cards */}
      {(event.size === 'large' || event.size === 'medium') && (
        <div className="relative z-10 mt-4 pr-8">
          {event.highlight && (
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm mb-2">
              {event.highlight}
            </span>
          )}
          {(event.tips || event.notes) && (
            <div className="text-[11px] leading-relaxed opacity-80 line-clamp-3" dangerouslySetInnerHTML={{ __html: event.tips || event.notes }} />
          )}
        </div>
      )}

      <NavButton coords={event.coords} />
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
           await signInWithCustomToken(auth, __initial_auth_token);
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
             const userExpensesRef = collection(db, 'artifacts', appId, 'users', currentUser.uid, 'expenses');
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
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'expenses'), { ...newExpense, uid: user.uid, timestamp: Timestamp.now() });
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
            await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'expenses', id));
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
                        <div key={dayKey} className="bg-slate-800/50 rounded-xl p-3 border border-slate-800">
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700/50">
                                <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/50">Day {dayKey}</span>
                                <span className="text-xs font-bold text-emerald-400">¥{dayTotal.toLocaleString()}</span>
                            </div>
                            <div className="space-y-2">
                                {dayExpenses.map(ex => (
                                    <div key={ex.id} className="flex justify-between items-center">
                                        <span className="text-slate-300 text-sm truncate pr-2">{ex.item}</span>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-slate-100 font-bold text-sm">¥{ex.amount.toLocaleString()}</span>
                                            <button onClick={() => handleDelete(ex.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash size={12}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            }
        </div>
        <div className="bg-gradient-to-r from-emerald-900/40 to-slate-800 rounded-xl p-4 flex justify-between items-center shadow-inner border border-slate-700/50">
            <span className="text-xs font-medium text-slate-400">總計</span>
            <span className="text-xl font-black text-emerald-400 tracking-tight">¥ {total.toLocaleString()}</span>
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
        <div className="space-y-4">
          <div>
            <p className="font-bold text-slate-200 text-sm mb-1">京都: Rihga Gran Kyoto</p>
            <p className="text-xs text-slate-500">〒601-8003 京都府京都市南区 東九条西山王町1</p>
            <div className="mt-2"><NavButton coords="Rihga Gran Kyoto" /></div>
          </div>
          <div>
            <p className="font-bold text-slate-200 text-sm mb-1">大阪: PG 黑門公寓酒店</p>
            <p className="text-xs text-slate-500">〒542-0072 大阪市中央区 高津 3-3-22</p>
            <div className="mt-2"><NavButton coords="PG Kuromon Apartment" /></div>
          </div>
        </div>
      </div>
      <div className="bg-slate-900 rounded-xl shadow-lg p-5 border border-slate-800">
        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2 border-b border-slate-800 pb-3"><CheckSquare size={18} className="text-blue-400" />必備清單</h3>
        <ul className="text-sm text-slate-400 space-y-2.5 list-disc pl-4 marker:text-slate-600">
          <li>環保筷 + 碗 (吃泡麵用)</li><li>洗衣球 (民宿可以洗衣服)</li><li>ESIM / 網卡</li><li>暖暖包 (12月很冷)</li><li>牙刷 (有些環保飯店不提供)</li>
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
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      
      {/* Sidebar Navigation (Left) - Scrollable for Days */}
      <nav className="w-20 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 z-20 h-full shrink-0">
        <div className="mb-6 font-black text-2xl tracking-tighter text-slate-100">JP</div>
        
        <div className="flex-1 overflow-y-auto w-full flex flex-col items-center gap-3 scrollbar-hide px-2 pb-20">
          {/* Mode Switcher in Sidebar top */}
          <div className="flex flex-col gap-3 mb-4 w-full px-1">
            <button onClick={() => setActiveTab('itinerary')} className={`p-3 rounded-xl transition-all ${activeTab === 'itinerary' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
               <Calendar size={20} />
            </button>
            <button onClick={() => setActiveTab('tools')} className={`p-3 rounded-xl transition-all ${activeTab === 'tools' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
               <Wallet size={20} />
            </button>
            <button onClick={() => setActiveTab('info')} className={`p-3 rounded-xl transition-all ${activeTab === 'info' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
               <Info size={20} />
            </button>
          </div>

          <div className="w-full h-px bg-slate-800 mb-4"></div>

          {/* Day Pills */}
          {activeTab === 'itinerary' && itineraryData.map((d) => (
            <button
              key={d.day}
              onClick={() => setSelectedDay(d.day)}
              className={`relative w-12 h-12 flex items-center justify-center rounded-full text-sm font-bold transition-all duration-300 group ${
                selectedDay === d.day 
                  ? 'bg-slate-100 text-slate-900 shadow-white/10 shadow-lg scale-110 z-10' 
                  : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
              }`}
            >
              <span className="z-10">D{d.day}</span>
              {selectedDay === d.day && <div className="absolute inset-0 rounded-full bg-white blur-md opacity-20"></div>}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Area (Right) */}
      <main className="flex-1 h-full overflow-y-auto relative bg-slate-950 scroll-smooth">
        <div className="max-w-3xl mx-auto min-h-full pb-10">
            
            {/* Header Area */}
            <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md px-6 py-6 border-b border-slate-900/50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                   {activeTab === 'itinerary' ? `Day ${currentDayData.day}` : activeTab === 'tools' ? '記帳工具' : '旅遊資訊'}
                </h2>
                {activeTab === 'itinerary' && <p className="text-sm text-slate-500 font-medium mt-0.5">{currentDayData.date} • {currentDayData.location}</p>}
              </div>
              <LiveWeatherWidget />
            </div>

            {/* Content Body */}
            <div className="px-4 pt-4">
               {activeTab === 'itinerary' ? (
                 <div className="grid grid-cols-2 gap-3 animate-fade-in">
                    {currentDayData.events.map((event, index) => (
                      <BentoCard key={index} event={event} />
                    ))}
                    <div className="col-span-2 h-12 text-center text-slate-700 text-xs mt-8">End of Day {selectedDay}</div>
                 </div>
               ) : activeTab === 'tools' ? (
                 <ToolsSection currentDay={selectedDay} />
               ) : (
                 <InfoSection />
               )}
            </div>

        </div>
      </main>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
