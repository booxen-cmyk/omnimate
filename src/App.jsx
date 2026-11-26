import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { analyzeMemoWithAI, analyzeMealWithAI, semanticSearchWithAI } from './lib/gemini';
import {
  Home, FileText, HeartPulse, Store, Search, Mic, Send,
  ShieldAlert, Droplets, Pill, Sparkles, CheckCircle2,
  LogOut, Globe, Radio, Bluetooth, Watch, Cpu, ArrowDownToLine,
  Activity, BookOpen, Video, Baby, Volume2, ShieldCheck
} from 'lucide-react';

// [버전 관리] 0.1씩 조금씩 진화하는 빌드 체계
const APP_VERSION = 'v0.3.5';

// [테스트 모드 스위치] true: 로그인 생략 후 바로 입장 / false: 기존 로그인·회원가입 화면 활성화
const BYPASS_AUTH = true;

const TRANSLATIONS = {
  ko: {
    selectLangTitle: '언어를 선택하세요',
    selectLangSub: '선택한 언어로 AI 비서가 즉시 시작됩니다.',
    subtitle: '광고 없이 내 갤럭시에 심는 오픈형 초개인화 AI 비서',
    emailPlaceholder: '이메일 주소',
    passwordPlaceholder: '비밀번호 (6자 이상)',
    loginBtn: '내 비서 시작하기 (로그인)',
    signupBtn: '새 계정 만들기 (무료 가입)',
    permissionNote: '※ 배너 광고·결제 유도 없음. 갤럭시 표준 센서(모션·자이로·지자기·조도·BLE)와 직결됩니다.',
    agentActive: `GALAXY AI AGENT 상시 대기 (${APP_VERSION})`,
    searchPlaceholder: '내 메모·식단·센서·아이 케어 기록을 물어보세요',
    searchBtn: '검색',
    briefingTitle: '오늘의 AI 컨텍스트 브리핑',
    calLabel: '섭취 칼로리',
    waterLabel: '수분 섭취',
    neckLabel: '경추 각도',
    recentMemoTitle: '최근 AI 정리 메모',
    memoHeader: '음성 · 텍스트 자동 요약 메모',
    voiceBtn: '음성 입력',
    memoPlaceholder: '회의 내용, 아이디어, 할 일을 두서없이 적어주세요. AI가 요약·태그·할 일을 자동 추출합니다.',
    saveMemoBtn: 'AI 자동 정리 후 저장',
    savingBtn: 'AI 분석 및 저장 중...',
    mealHeader: 'AI 자연어 식단 & 칼로리 계산',
    voiceMealBtn: '말로 기록',
    mealPlaceholder: '예: 점심에 닭가슴살 샐러드랑 고구마 먹었어',
    logBtn: '기록',
    quickMealLabel: '원클릭 자주 먹는 식단',
    waterBtn: '물 1잔 마시기',
    suppBtn: '영양제 체크',
    suppSub: '터치하여 복용 기록',
    sensorHeader: '갤럭시 올-센서 매트릭스 (All-Sensor Matrix)',
    sosTestBtn: '낙상 SOS 테스트',
    openBridgeTitle: '오픈 스마트 기기 연동 허브 (Universal Bridge)',
    openBridgeDesc: '제조사 API 제휴 없이 표준 BLE 및 모든 외부 JSON/센서 패킷을 OMNI-MATE가 자동 해석해 수용합니다.',
    bleScanBtn: '블루투스 기기 스캔 (BLE)',
    bleConnected: '연결된 기기',
    bleNone: '연결된 외부 기기 없음',
    rawIngestLabel: '오픈 데이터 패킷 수신기 (타사 워치·센서 JSON 아무 형식 입력)',
    rawIngestBtn: '오픈 데이터 자동 해석 및 반영',
    storeTitle: '무광고 모듈형 비서 스토어',
    storeSub: '기본 엔진은 평생 무료 · 필요한 키즈/전문가 모듈만 선택 장착',
    activeCount: '개 장착됨',
    tabs: { home: '홈', memo: 'AI 메모', health: '갤럭시·기기', store: '비서 스토어' },
    postureWarn: '⚠️ 거북목 주의 각도',
    postureOk: '✅ 바른 자세 유지 중',
  },
  en: {
    selectLangTitle: 'Select Your Language',
    selectLangSub: 'Your AI assistant will start immediately in your chosen language.',
    subtitle: 'Ad-Free Open Hyper-Personalized Assistant for Galaxy',
    emailPlaceholder: 'Email address',
    passwordPlaceholder: 'Password (6+ chars)',
    loginBtn: 'Start My Assistant (Login)',
    signupBtn: 'Create New Account (Free)',
    permissionNote: '※ Zero ads or forced popups. Connects directly to Android Galaxy sensors & open BLE.',
    agentActive: `GALAXY AI AGENT ACTIVE (${APP_VERSION})`,
    searchPlaceholder: 'Ask anything about memos, meals, sensors, or kids care...',
    searchBtn: 'Ask',
    briefingTitle: "Today's AI Context Briefing",
    calLabel: 'Calories',
    waterLabel: 'Hydration',
    neckLabel: 'Neck Angle',
    recentMemoTitle: 'Recent AI Summaries',
    memoHeader: 'Voice & Text Auto-Summary Memo',
    voiceBtn: 'Voice Input',
    memoPlaceholder: 'Jot down notes, ideas, or tasks freely. AI will extract summaries, tags, and to-dos.',
    saveMemoBtn: 'Organize & Save with AI',
    savingBtn: 'Analyzing with AI...',
    mealHeader: 'AI Natural Language Meal Tracker',
    voiceMealBtn: 'Voice Log',
    mealPlaceholder: 'e.g., Had chicken breast salad and sweet potato for lunch',
    logBtn: 'Log',
    quickMealLabel: 'One-Tap Quick Meals',
    waterBtn: 'Drink 1 Cup Water',
    suppBtn: 'Daily Supplement',
    suppSub: 'Tap to log intake',
    sensorHeader: 'Galaxy Hardware All-Sensor Matrix',
    sosTestBtn: 'Test Fall SOS',
    openBridgeTitle: 'Open Smart Device Bridge (Universal Adapter)',
    openBridgeDesc: 'Accepts standard BLE & any external watch/sensor JSON payload without vendor API lock-in.',
    bleScanBtn: 'Scan Bluetooth Device (BLE)',
    bleConnected: 'Connected Device',
    bleNone: 'No external device connected',
    rawIngestLabel: 'Open Payload Receiver (Paste any watch/sensor JSON or text)',
    rawIngestBtn: 'Auto-Parse & Ingest Open Data',
    storeTitle: 'Ad-Free Modular Assistant Store',
    storeSub: 'Core engine free forever · Equip only the Kids & Pro packs you need',
    activeCount: ' equipped',
    tabs: { home: 'Home', memo: 'AI Memo', health: 'Galaxy & IoT', store: 'Store' },
    postureWarn: '⚠️ Neck Tilt Warning',
    postureOk: '✅ Good Posture',
  },
  tl: {
    selectLangTitle: 'Piliin ang Iyong Wika',
    selectLangSub: 'Magsisimula agad ang iyong AI assistant sa napiling wika.',
    subtitle: 'Walang Ads na Personal AI Assistant para sa Samsung Galaxy',
    emailPlaceholder: 'Email address',
    passwordPlaceholder: 'Password (6+ na karakter)',
    loginBtn: 'Simulan ang AI Assistant (Login)',
    signupBtn: 'Gumawa ng Bagong Account (Libre)',
    permissionNote: '※ Walang ads. Direktang gumagamit ng mga sensor ng Android Galaxy at open BLE.',
    agentActive: `GALAXY AI AGENT AKTIBO (${APP_VERSION})`,
    searchPlaceholder: 'Magtanong tungkol sa tala, pagkain, sensor, o anak...',
    searchBtn: 'Hanapin',
    briefingTitle: 'Buod ng AI Ngayong Araw',
    calLabel: 'Kaloriya',
    waterLabel: 'Tubig',
    neckLabel: 'Anggulo ng Leeg',
    recentMemoTitle: 'Mga Kamakailang Buod ng AI',
    memoHeader: 'Awtomatikong Buod ng Boses at Teksto',
    voiceBtn: 'Boses',
    memoPlaceholder: 'Isulat ang iyong mga ideya o gawain. Aayusin ito ng AI para sa iyo.',
    saveMemoBtn: 'Ayusin at I-save gamit ang AI',
    savingBtn: 'Sinusuri ng AI...',
    mealHeader: 'AI Tagasubaybay ng Pagkain at Kaloriya',
    voiceMealBtn: 'Itala gamit ang Boses',
    mealPlaceholder: 'Hal: Kumain ako ng chicken salad at kamote para sa tanghalian',
    logBtn: 'Itala',
    quickMealLabel: 'Mabilisang Pagpili ng Pagkain',
    waterBtn: 'Uminom ng 1 Basong Tubig',
    suppBtn: 'Bitamina / Supplement',
    suppSub: 'Pindutin upang itala',
    sensorHeader: 'Galaxy All-Sensor Matrix',
    sosTestBtn: 'Subukan ang Fall SOS',
    openBridgeTitle: 'Open Smart Device Bridge (Universal Adapter)',
    openBridgeDesc: 'Tumatanggap ng standard BLE at anumang external watch/sensor data nang walang vendor lock-in.',
    bleScanBtn: 'Mag-scan ng Bluetooth Device (BLE)',
    bleConnected: 'Nakakonektang Device',
    bleNone: 'Walang nakakonektang device',
    rawIngestLabel: 'Open Data Receiver (Maglagay ng anumang watch/sensor JSON)',
    rawIngestBtn: 'Awtomatikong Basahin at Itala',
    storeTitle: 'Walang-Ads na Tindahan ng Modyul',
    storeSub: 'Libreng core engine · Piliin lamang ang Kids at Pro packs na kailangan',
    activeCount: ' aktibo',
    tabs: { home: 'Tahanan', memo: 'AI Tala', health: 'Galaxy·IoT', store: 'Tindahan' },
    postureWarn: '⚠️ Babala sa Postura ng Leeg',
    postureOk: '✅ Tamang Postura',
  }
};

const QUICK_MEALS = [
  { title: '도토리 얇은 면 냉국수', calories: 420, carbs: 72, protein: 14, fat: 6 },
  { title: '콜드 쉬림프 샐러드 (큐민 소스)', calories: 310, carbs: 18, protein: 28, fat: 14 },
  { title: '아메리카노 (카페인 기록)', calories: 10, carbs: 2, protein: 0, fat: 0 },
];

const DEFAULT_MODULES = [
  // KIDS & FAMILY PACK (핵심 수익 모델)
  {
    code: 'kids_storyteller',
    name: '원격 AI 맞춤 동화 읽어주기',
    desc: '아이 이름·관심사를 넣어 즉석 동화를 짓고 부모 목소리 톤(TTS)으로 원격 낭독',
    category: '키즈·패밀리 케어',
    tier: 'KIDS PACK',
    active: true
  },
  {
    code: 'kids_home_cctv',
    name: '오픈 홈 CCTV 직결 뷰어',
    desc: '제조사 무관 IP카메라·구형폰 홈캠 스트림 연결 및 이상 움직임/울음소리 감지',
    category: '키즈·패밀리 케어',
    tier: 'KIDS PACK',
    active: true
  },
  {
    code: 'kids_safety_guard',
    name: '아이 안전·등하원 안심 가디언',
    desc: '키즈 워치·BLE 태그·스마트폰 센서 연동 실시간 안심존 및 긴급 호출',
    category: '키즈·패밀리 케어',
    tier: 'KIDS PACK',
    active: true
  },
  // FREE FOREVER CORE (무광고 영구 무료 뼈대)
  {
    code: 'galaxy_all_sensor',
    name: '갤럭시 하드웨어 풀-센서 엔진',
    desc: '가속도·자이로·중력·지자기·조도·기압계 통합 감시',
    category: '갤럭시 코어',
    tier: 'FREE FOREVER',
    active: true
  },
  {
    code: 'open_ble_bridge',
    name: '유니버설 오픈 BLE · JSON 브릿지',
    desc: '제조사 API 제휴 없이 모든 스마트워치·센서 패킷 자동 수용',
    category: '오픈 기기 연동',
    tier: 'FREE FOREVER',
    active: true
  },
  // PRO / CREATOR PACK (전문가·생활 특화 모듈)
  {
    code: 'multilingual_interpreter',
    name: '3개국어(한·영·타갈로그) 실시간 통역 팩',
    desc: '병원·관공서·로컬 생활 상황별 즉시 음성 통역 및 문화 가이드',
    category: '글로벌 컨텐츠',
    tier: 'PRO PACK',
    active: false
  },
  {
    code: 'bio_weather_coach',
    name: '기압·조도 바이오리듬 코치',
    desc: '갤럭시 기압계·조도 센서 기반 저기압 컨디션 및 수면 리듬 케어',
    category: '헬스 스페셜',
    tier: 'PRO PACK',
    active: false
  }
];

const GUEST_SESSION = {
  user: { id: 'guest-test-user', email: 'guest@omnimate.test' }
};

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('omni_lang') || 'ko');
  const [hasSelectedLang, setHasSelectedLang] = useState(() => Boolean(localStorage.getItem('omni_lang')));
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ko;

  const [session, setSession] = useState(BYPASS_AUTH ? GUEST_SESSION : null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('home');

  const [memos, setMemos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('omni_guest_memos') || '[]');
    } catch {
      return [];
    }
  });
  const [healthLogs, setHealthLogs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('omni_guest_health') || '[]');
    } catch {
      return [];
    }
  });
  const [modules, setModules] = useState(DEFAULT_MODULES);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchAnswer, setSearchAnswer] = useState('');
  const [memoInput, setMemoInput] = useState('');
  const [mealInput, setMealInput] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  // 키즈 케어 데모 상태 (원격 동화 & 홈 CCTV)
  const [kidName, setKidName] = useState('지우');
  const [storyTopic, setStoryTopic] = useState('용감한 아기 공룡과 제주 바다 탐험');
  const [generatedStory, setGeneratedStory] = useState('');
  const [cctvStreamUrl, setCctvStreamUrl] = useState('rtsp://home-cam.local:8554/livingroom');
  const [cctvConnected, setCctvConnected] = useState(false);

  // 갤럭시 전방위 센서 상태
  const [sensorData, setSensorData] = useState({
    tiltAngle: 15,
    rollAngle: 0,
    compassHeading: 0,
    accelPeak: 1.0,
    linearAccel: 0.0,
    gyroRate: 0.0,
    lightLux: null,
    isWarn: true,
    supportedApis: []
  });
  const [sosTriggered, setSosTriggered] = useState(false);

  // 외부 오픈 기기 연동 상태
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [deviceMetrics, setDeviceMetrics] = useState({ hr: null, battery: null, lastSource: null });
  const [rawDevicePacket, setRawDevicePacket] = useState('{"source":"GalaxyWatch_Open","heart_rate":78,"steps":5420,"spo2":98}');

  function changeLanguage(newLang) {
    setLang(newLang);
    localStorage.setItem('omni_lang', newLang);
    setHasSelectedLang(true);
  }

  useEffect(() => {
    if (BYPASS_AUTH) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserData(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserData(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 갤럭시 하드웨어 센서 통합 리스너
  useEffect(() => {
    const detected = [];
    if ('DeviceMotionEvent' in window) detected.push('Accelerometer/Gyro');
    if ('DeviceOrientationEvent' in window) detected.push('Orientation/Compass');
    if ('GravitySensor' in window) detected.push('Gravity');
    if ('LinearAccelerationSensor' in window) detected.push('LinearAccel');
    if ('Magnetometer' in window) detected.push('Magnetometer');
    if ('AmbientLightSensor' in window) detected.push('AmbientLight');
    if ('bluetooth' in navigator) detected.push('WebBLE');

    setSensorData(prev => ({ ...prev, supportedApis: detected }));

    const handleOrientation = (e) => {
      const beta = Math.round(e.beta || 15);
      const gamma = Math.round(e.gamma || 0);
      const alpha = Math.round(e.alpha || 0);
      const isTurtleNeck = beta > 0 && beta < 35;
      setSensorData(prev => ({
        ...prev,
        tiltAngle: beta,
        rollAngle: gamma,
        compassHeading: alpha,
        isWarn: isTurtleNeck
      }));
    };

    const handleMotion = (e) => {
      const acc = e.accelerationIncludingGravity;
      const lin = e.acceleration;
      const rot = e.rotationRate;

      let totalG = 1.0;
      if (acc) {
        const total = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
        if (total > 28) setSosTriggered(true);
        totalG = Number((total / 9.8).toFixed(2));
      }

      let linVal = 0;
      if (lin) {
        linVal = Number(Math.sqrt((lin.x || 0) ** 2 + (lin.y || 0) ** 2 + (lin.z || 0) ** 2).toFixed(2));
      }

      let gyroVal = 0;
      if (rot) {
        gyroVal = Number(Math.sqrt((rot.alpha || 0) ** 2 + (rot.beta || 0) ** 2 + (rot.gamma || 0) ** 2).toFixed(1));
      }

      setSensorData(prev => ({
        ...prev,
        accelPeak: totalG,
        linearAccel: linVal,
        gyroRate: gyroVal
      }));
    };

    let lightSensor = null;
    if ('AmbientLightSensor' in window) {
      try {
        lightSensor = new window.AmbientLightSensor();
        lightSensor.addEventListener('reading', () => {
          setSensorData(prev => ({ ...prev, lightLux: Math.round(lightSensor.illuminance) }));
        });
        lightSensor.start();
      } catch {}
    }

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('devicemotion', handleMotion);
      if (lightSensor) {
        try { lightSensor.stop(); } catch {}
      }
    };
  }, []);

  // 원격 동화 생성 및 음성 낭독 (Web Speech Synthesis)
  function handlePlayKidsStory() {
    const text = `옛날 옛적 푸른 바다가 반짝이는 마을에 호기심 많은 ${kidName}가 살고 있었어요. 오늘 ${kidName}는 '${storyTopic}' 모험을 떠나며 반짝이는 별빛 친구들을 만났답니다. 오늘도 건강하고 씩씩하게 자란 ${kidName}, 편안한 밤 되세요!`;
    setGeneratedStory(text);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang === 'en' ? 'en-US' : lang === 'tl' ? 'fil-PH' : 'ko-KR';
      utter.rate = 0.92;
      window.speechSynthesis.speak(utter);
    }
  }

  async function handleConnectBLEDevice() {
    if (!navigator.bluetooth) {
      return alert('이 브라우저는 Web Bluetooth를 지원하지 않습니다. 갤럭시 크롬 또는 삼성 인터넷에서 실행해 주세요.');
    }
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['heart_rate', 'battery_service', 'environmental_sensing']
      });
      setConnectedDevice(device.name || 'Unnamed BLE Sensor');
      const server = await device.gatt.connect();

      try {
        const battService = await server.getPrimaryService('battery_service');
        const battChar = await battService.getCharacteristic('battery_level');
        const val = await battChar.readValue();
        setDeviceMetrics(prev => ({ ...prev, battery: val.getUint8(0), lastSource: device.name || 'BLE' }));
      } catch {
        setDeviceMetrics(prev => ({ ...prev, lastSource: device.name || 'BLE' }));
      }
    } catch (err) {
      if (err.name !== 'NotFoundError') {
        alert('블루투스 연결 안내: ' + err.message);
      }
    }
  }

  async function handleIngestOpenPacket() {
    if (!rawDevicePacket.trim()) return;
    try {
      const parsed = JSON.parse(rawDevicePacket);
      const hr = parsed.heart_rate || parsed.hr || parsed.bpm || parsed.heartRate || null;
      const battery = parsed.battery || parsed.batt || null;
      const source = parsed.source || parsed.device || 'Open-IoT-Packet';

      setDeviceMetrics({ hr, battery, lastSource: source });
      setConnectedDevice(source);

      const newLog = {
        id: Date.now(),
        user_id: session.user.id,
        log_type: 'device_sync',
        title: `[${source}] ${Object.entries(parsed).map(([k, v]) => `${k}:${v}`).join(', ')}`
      };

      const updated = [newLog, ...healthLogs];
      setHealthLogs(updated);
      if (BYPASS_AUTH) {
        localStorage.setItem('omni_guest_health', JSON.stringify(updated));
      }
      alert(`✅ [${source}] 오픈 패킷 해석 및 동기화 완료!`);
    } catch {
      alert('JSON 형식을 확인해 주세요. 예: {"source":"Watch","bpm":80}');
    }
  }

  async function fetchUserData(userId) {
    const { data: memoData } = await supabase.from('memos').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (memoData) setMemos(memoData);

    const today = new Date().toISOString().split('T')[0];
    const { data: healthData } = await supabase.from('health_logs').select('*').eq('user_id', userId).gte('created_at', today).order('created_at', { ascending: false });
    if (healthData) setHealthLogs(healthData);
  }

  async function handleAuth(type) {
    if (!email || !password) return alert('이메일과 비밀번호를 입력하세요.');
    const { error } = type === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else if (type === 'signup') alert('가입 완료! 바로 로그인해 주세요.');
  }

  function startVoiceInput(targetSetter) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert('이 브라우저는 음성 인식을 지원하지 않습니다. (Chrome/삼성인터넷 권장)');
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'en' ? 'en-US' : lang === 'tl' ? 'fil-PH' : 'ko-KR';
    recognition.onresult = (e) => targetSetter(e.results[0][0].transcript);
    recognition.start();
  }

  async function handleSaveMemo() {
    if (!memoInput.trim() || loadingAI) return;
    setLoadingAI(true);
    try {
      const aiResult = await analyzeMemoWithAI(memoInput);
      const newMemo = {
        id: Date.now(),
        user_id: session.user.id,
        raw_content: memoInput,
        summary: aiResult.summary,
        tags: aiResult.tags || [],
        todos: aiResult.todos || []
      };

      if (BYPASS_AUTH) {
        const updated = [newMemo, ...memos];
        setMemos(updated);
        localStorage.setItem('omni_guest_memos', JSON.stringify(updated));
        setMemoInput('');
      } else {
        const { data, error } = await supabase.from('memos').insert([newMemo]).select();
        if (!error && data) {
          setMemos([data[0], ...memos]);
          setMemoInput('');
        }
      }
    } catch (e) {
      alert('AI 분석 중 오류가 발생했습니다. API 키를 확인하세요.');
    }
    setLoadingAI(false);
  }

  async function handleLogMeal(customMeal = null) {
    if (loadingAI) return;
    setLoadingAI(true);
    try {
      const mealInfo = customMeal || await analyzeMealWithAI(mealInput);
      const newLog = {
        id: Date.now(),
        user_id: session.user.id,
        log_type: 'meal',
        title: mealInfo.title,
        calories: mealInfo.calories,
        carbs: mealInfo.carbs,
        protein: mealInfo.protein,
        fat: mealInfo.fat
      };

      if (BYPASS_AUTH) {
        const updated = [newLog, ...healthLogs];
        setHealthLogs(updated);
        localStorage.setItem('omni_guest_health', JSON.stringify(updated));
        setMealInput('');
      } else {
        const { data, error } = await supabase.from('health_logs').insert([newLog]).select();
        if (!error && data) {
          setHealthLogs([data[0], ...healthLogs]);
          setMealInput('');
        }
      }
    } catch (e) {
      alert('식단 분석 오류: 입력 내용을 다시 확인해 주세요.');
    }
    setLoadingAI(false);
  }

  async function handleQuickHabit(type, title) {
    const newLog = {
      id: Date.now(),
      user_id: session.user.id,
      log_type: type,
      title
    };

    if (BYPASS_AUTH) {
      const updated = [newLog, ...healthLogs];
      setHealthLogs(updated);
      localStorage.setItem('omni_guest_health', JSON.stringify(updated));
    } else {
      const { data } = await supabase.from('health_logs').insert([newLog]).select();
      if (data) setHealthLogs([data[0], ...healthLogs]);
    }
  }

  async function handleSemanticSearch() {
    if (!searchQuery.trim() || loadingAI) return;
    setLoadingAI(true);
    try {
      const answer = await semanticSearchWithAI(searchQuery, memos, healthLogs);
      setSearchAnswer(answer);
    } catch (e) {
      setSearchAnswer('검색 중 오류가 발생했습니다.');
    }
    setLoadingAI(false);
  }

  const totalCalories = healthLogs.filter(l => l.log_type === 'meal').reduce((acc, cur) => acc + (cur.calories || 0), 0);
  const waterCups = healthLogs.filter(l => l.log_type === 'water').length;

  const LanguageSelector = () => (
    <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 rounded-full p-1">
      <Globe className="w-3.5 h-3.5 text-cyan-400 ml-1.5 mr-0.5 shrink-0" />
      {[
        { code: 'ko', label: '한국어' },
        { code: 'en', label: 'EN' },
        { code: 'tl', label: 'Tagalog' },
      ].map((item) => (
        <button
          key={item.code}
          onClick={() => changeLanguage(item.code)}
          className={`px-2 py-1 rounded-full text-[11px] font-semibold transition-all ${
            lang === item.code
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  // 1단계: 최초 진입 시 언어 선택 화면
  if (!hasSelectedLang) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[#090d16] select-none">
        <div className="w-full max-w-sm bg-slate-900/95 border border-slate-800 rounded-3xl p-7 shadow-2xl text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <Globe className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">OMNI-MATE <span className="text-xs text-cyan-400">{APP_VERSION}</span></h1>
          <p className="text-xs text-slate-400 mb-6">
            언어 선택 / Select Language / Piliin ang Wika
          </p>

          <div className="space-y-3">
            {[
              { code: 'ko', title: '한국어', sub: 'Korean · 한국어로 시작하기' },
              { code: 'en', title: 'English', sub: '영어 · Start in English' },
              { code: 'tl', title: 'Tagalog', sub: '타갈로그어 · Simulan sa Tagalog' },
            ].map((item) => (
              <button
                key={item.code}
                onClick={() => changeLanguage(item.code)}
                className="w-full bg-slate-800 hover:bg-slate-700/90 active:scale-[0.99] border border-slate-700 hover:border-cyan-500/50 rounded-2xl p-4 flex items-center justify-between transition-all text-left"
              >
                <div>
                  <div className="text-base font-bold text-white">{item.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{item.sub}</div>
                </div>
                <span className="text-cyan-400 text-sm font-bold">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2단계: BYPASS_AUTH가 false일 때만 로그인/회원가입 화면 표시
  if (!session) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-5 bg-[#090d16] select-none">
        <div className="w-full max-w-sm mb-4 flex justify-end">
          <LanguageSelector />
        </div>

        <div className="w-full max-w-sm bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                OMNI-MATE
              </h1>
            </div>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-medium">
              {APP_VERSION}
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-6">{t.subtitle}</p>

          <input
            type="email"
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-sm mb-3 focus:outline-none focus:border-cyan-400 text-white"
          />
          <input
            type="password"
            placeholder={t.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-sm mb-5 focus:outline-none focus:border-cyan-400 text-white"
          />
          <button
            onClick={() => handleAuth('login')}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 active:scale-[0.99] py-3.5 rounded-xl font-bold text-sm text-white mb-2.5 shadow-lg shadow-cyan-500/20"
          >
            {t.loginBtn}
          </button>
          <button
            onClick={() => handleAuth('signup')}
            className="w-full bg-slate-800 hover:bg-slate-700 active:scale-[0.99] py-3 rounded-xl text-xs font-medium text-slate-300"
          >
            {t.signupBtn}
          </button>

          <p className="text-[11px] text-slate-500 mt-5 leading-relaxed text-center">
            {t.permissionNote}
          </p>
        </div>
      </div>
    );
  }

  // 3단계: 메인 대시보드
  return (
    <div className="max-w-md mx-auto min-h-[100dvh] bg-[#090d16] pb-24 relative">
      {sosTriggered && (
        <div className="fixed inset-0 z-50 bg-red-950/95 flex flex-col items-center justify-center p-6 text-center">
          <ShieldAlert className="w-16 h-16 text-red-400 animate-bounce mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">강한 충격(낙상) 감지됨!</h2>
          <p className="text-sm text-red-200 mb-6">30초 내 해제하지 않으면 등록된 비상 연락처로 현재 위치가 전송됩니다.</p>
          <button onClick={() => setSosTriggered(false)} className="bg-white text-red-900 font-bold px-8 py-3.5 rounded-full">
            괜찮습니다 (경보 해제)
          </button>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-[#090d16]/90 backdrop-blur-md px-4 pt-4 pb-3 flex items-center justify-between border-b border-slate-800/80 gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" />
            <span className="text-[10px] font-semibold tracking-wider text-emerald-400 truncate">{t.agentActive}</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white">OMNI-MATE</h1>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">NO-ADS</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <LanguageSelector />
          {!BYPASS_AUTH && (
            <button onClick={() => supabase.auth.signOut()} className="p-2 text-slate-400 hover:text-white">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <main className="p-4 space-y-4">
        {activeTab === 'home' && (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400 shrink-0" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSemanticSearch()}
                  className="bg-transparent text-xs w-full focus:outline-none text-white"
                />
                <button onClick={handleSemanticSearch} className="bg-cyan-500/20 text-cyan-400 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0">
                  {t.searchBtn}
                </button>
              </div>
              {searchAnswer && (
                <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-200 leading-relaxed">
                  {searchAnswer}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border border-indigo-500/30 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> {t.briefingTitle}
                </span>
                <span className="text-[11px] text-slate-300">{sensorData.isWarn ? t.postureWarn : t.postureOk}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Calories: <strong className="text-cyan-400">{totalCalories} kcal</strong> · Water: <strong className="text-blue-400">{waterCups}</strong> · Kids Care: <strong className="text-amber-300">Active</strong>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
                <div className="text-[11px] text-slate-400 mb-1">{t.calLabel}</div>
                <div className="text-base font-bold text-emerald-400">{totalCalories}</div>
                <div className="text-[10px] text-slate-500">/ 2,000 kcal</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
                <div className="text-[11px] text-slate-400 mb-1">{t.waterLabel}</div>
                <div className="text-base font-bold text-cyan-400">{waterCups}</div>
                <div className="text-[10px] text-slate-500">Goal: 8</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
                <div className="text-[11px] text-slate-400 mb-1">{t.neckLabel}</div>
                <div className="text-base font-bold text-purple-400">{sensorData.tiltAngle}°</div>
                <div className="text-[10px] text-slate-500">Gyro/Pitch</div>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold text-slate-400 mb-2">{t.recentMemoTitle}</h2>
              {memos.slice(0, 2).map((m) => (
                <div key={m.id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 mb-2">
                  <p className="text-xs text-slate-200 font-medium">{m.summary || m.raw_content}</p>
                  <div className="flex gap-1.5 mt-2">
                    {m.tags?.map((tag, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-800 text-cyan-400 px-2 py-0.5 rounded-full">#{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'memo' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-cyan-400">{t.memoHeader}</span>
                <button onClick={() => startVoiceInput(setMemoInput)} className="flex items-center gap-1 text-[11px] bg-purple-500/20 text-purple-300 px-3 py-1.5 rounded-full">
                  <Mic className="w-3.5 h-3.5" /> {t.voiceBtn}
                </button>
              </div>
              <textarea
                rows={3}
                placeholder={t.memoPlaceholder}
                value={memoInput}
                onChange={(e) => setMemoInput(e.target.value)}
                className="w-full bg-slate-800/70 rounded-xl p-3 text-xs text-white focus:outline-none mb-2.5"
              />
              <button
                onClick={handleSaveMemo}
                disabled={loadingAI}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> {loadingAI ? t.savingBtn : t.saveMemoBtn}
              </button>
            </div>

            <div className="space-y-2.5">
              {memos.map((m) => (
                <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-white mb-1">{m.summary}</div>
                  <p className="text-[11px] text-slate-400 mb-2">{m.raw_content}</p>
                  {m.todos?.length > 0 && (
                    <div className="bg-slate-800/60 rounded-lg p-2 mb-2 space-y-1">
                      {m.todos.map((todo, i) => (
                        <div key={i} className="text-[11px] text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" /> {todo}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {m.tags?.map((tag, i) => (
                      <span key={i} className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-md">#{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-4">
            {/* 갤럭시 올-센서 매트릭스 */}
            <div className="bg-slate-900 border border-purple-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" /> {t.sensorHeader}
                </span>
                <button onClick={() => setSosTriggered(true)} className="text-[10px] bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full font-semibold">
                  {t.sosTestBtn}
                </button>
              </div>

              <div className="flex flex-wrap gap-1">
                {sensorData.supportedApis.map((api, idx) => (
                  <span key={idx} className="text-[10px] bg-purple-950/80 border border-purple-500/30 text-purple-200 px-2 py-0.5 rounded-md">
                    ● {api}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/70 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400">자이로·기울기 (Pitch/Roll)</div>
                  <div className="font-bold text-white mt-0.5">{sensorData.tiltAngle}° / {sensorData.rollAngle}°</div>
                  <div className="text-[10px] text-cyan-300 mt-0.5">{sensorData.isWarn ? t.postureWarn : t.postureOk}</div>
                </div>
                <div className="bg-slate-800/70 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400">가속도·중력 / 선형가속</div>
                  <div className="font-bold text-white mt-0.5">{sensorData.accelPeak} G / {sensorData.linearAccel} m/s²</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">회전속도: {sensorData.gyroRate} °/s</div>
                </div>
                <div className="bg-slate-800/70 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400">지자기 방위각 (Compass)</div>
                  <div className="font-bold text-white mt-0.5">{sensorData.compassHeading}° N</div>
                </div>
                <div className="bg-slate-800/70 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400">조도(Lux) · 기압/폴드</div>
                  <div className="font-bold text-white mt-0.5">
                    {sensorData.lightLux !== null ? `${sensorData.lightLux} lx` : 'Native Bridge 대기'}
                  </div>
                </div>
              </div>
            </div>

            {/* 오픈 스마트 기기 연동 허브 */}
            <div className="bg-gradient-to-br from-slate-900 to-cyan-950/30 border border-cyan-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Watch className="w-4 h-4" /> {t.openBridgeTitle}
                </span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">OPEN</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{t.openBridgeDesc}</p>

              <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <div className="text-xs">
                  <div className="text-[10px] text-slate-400">{t.bleConnected}</div>
                  <div className="font-semibold text-white mt-0.5">
                    {connectedDevice || t.bleNone}
                    {deviceMetrics.hr ? ` · ❤️ ${deviceMetrics.hr} bpm` : ''}
                    {deviceMetrics.battery ? ` · 🔋 ${deviceMetrics.battery}%` : ''}
                  </div>
                </div>
                <button
                  onClick={handleConnectBLEDevice}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-[11px] flex items-center gap-1 shrink-0"
                >
                  <Bluetooth className="w-3.5 h-3.5" /> {t.bleScanBtn}
                </button>
              </div>

              <div className="pt-1">
                <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-cyan-400" /> {t.rawIngestLabel}
                </div>
                <textarea
                  rows={2}
                  value={rawDevicePacket}
                  onChange={(e) => setRawDevicePacket(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-[11px] font-mono text-cyan-200 focus:outline-none mb-2"
                />
                <button
                  onClick={handleIngestOpenPacket}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 text-cyan-300 font-semibold py-2 rounded-xl text-[11px] flex items-center justify-center gap-1.5"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" /> {t.rawIngestBtn}
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-400">{t.mealHeader}</span>
                <button onClick={() => startVoiceInput(setMealInput)} className="text-[11px] text-slate-300 flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-full">
                  <Mic className="w-3 h-3 text-emerald-400" /> {t.voiceMealBtn}
                </button>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder={t.mealPlaceholder}
                  value={mealInput}
                  onChange={(e) => setMealInput(e.target.value)}
                  className="flex-1 bg-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none text-white"
                />
                <button onClick={() => handleLogMeal()} disabled={loadingAI} className="bg-emerald-500 text-slate-950 font-bold px-3.5 rounded-xl text-xs">
                  {loadingAI ? '...' : t.logBtn}
                </button>
              </div>

              <div className="text-[10px] text-slate-400 mb-1.5">{t.quickMealLabel}</div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {QUICK_MEALS.map((qm, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleLogMeal(qm)}
                    className="shrink-0 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-3 py-2 text-left"
                  >
                    <div className="text-[11px] font-medium text-white">{qm.title}</div>
                    <div className="text-[10px] text-emerald-400">{qm.calories} kcal</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button onClick={() => handleQuickHabit('water', 'Water 250ml')} className="bg-slate-900 border border-slate-800 active:scale-[0.98] rounded-2xl p-3.5 flex items-center gap-3">
                <Droplets className="w-6 h-6 text-cyan-400 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-semibold text-white">{t.waterBtn}</div>
                  <div className="text-[10px] text-slate-400">{waterCups} cups</div>
                </div>
              </button>
              <button onClick={() => handleQuickHabit('supplement', 'Daily Supplement')} className="bg-slate-900 border border-slate-800 active:scale-[0.98] rounded-2xl p-3.5 flex items-center gap-3">
                <Pill className="w-6 h-6 text-purple-400 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-semibold text-white">{t.suppBtn}</div>
                  <div className="text-[10px] text-slate-400">{t.suppSub}</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'store' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">{t.storeTitle}</h2>
                <span className="text-[11px] text-cyan-400 font-semibold">{modules.filter(m => m.active).length}{t.activeCount}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{t.storeSub}</p>
            </div>

            {/* 키즈 & 패밀리 킬러 모듈 실시간 체험 카드 */}
            <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Baby className="w-4 h-4" /> 키즈 & 패밀리 케어 허브 (KIDS PACK)
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold">CORE VALUE</span>
              </div>

              {/* 1. 원격 AI 동화 읽어주기 */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" /> 원격 AI 맞춤 동화 읽어주기
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={kidName}
                    onChange={(e) => setKidName(e.target.value)}
                    placeholder="아이 이름"
                    className="w-20 bg-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    value={storyTopic}
                    onChange={(e) => setStoryTopic(e.target.value)}
                    placeholder="동화 주제 입력"
                    className="flex-1 bg-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <button
                  onClick={handlePlayKidsStory}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5"
                >
                  <Volume2 className="w-3.5 h-3.5" /> 동화 생성 & 원격 음성 낭독 실행
                </button>
                {generatedStory && (
                  <p className="text-[11px] text-amber-100/90 bg-slate-900 p-2.5 rounded-lg leading-relaxed">
                    "{generatedStory}"
                  </p>
                )}
              </div>

              {/* 2. 오픈 홈 CCTV 직결 & 안전 상태 */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-cyan-400" /> 오픈 홈 CCTV · 안전 모니터링
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> 안전존 정상
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cctvStreamUrl}
                    onChange={(e) => setCctvStreamUrl(e.target.value)}
                    className="flex-1 bg-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-200 focus:outline-none"
                  />
                  <button
                    onClick={() => setCctvConnected(!cctvConnected)}
                    className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-[11px] font-semibold shrink-0"
                  >
                    {cctvConnected ? '연결 끊기' : '홈캠 접속'}
                  </button>
                </div>
                {cctvConnected && (
                  <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-3 text-center">
                    <div className="text-[11px] text-cyan-300 font-semibold">● LIVE OPEN STREAM CONNECTED</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{cctvStreamUrl} · 움직임 및 울음소리 AI 감지 대기 중</div>
                  </div>
                )}
              </div>
            </div>

            {/* 전체 모듈 카탈로그 */}
            <div className="space-y-2.5">
              {modules.map((mod, idx) => (
                <div key={mod.code} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-purple-400 font-medium">{mod.category}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        mod.tier === 'FREE FOREVER'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : mod.tier === 'KIDS PACK'
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-cyan-500/15 text-cyan-300'
                      }`}>
                        {mod.tier}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white mt-1">{mod.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{mod.desc}</div>
                  </div>
                  <button
                    onClick={() => {
                      const updated = [...modules];
                      updated[idx].active = !updated[idx].active;
                      setModules(updated);
                    }}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 shrink-0 ${mod.active ? 'bg-cyan-500' : 'bg-slate-700'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${mod.active ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex justify-between">
        {[
          { id: 'home', icon: Home, label: t.tabs.home },
          { id: 'memo', icon: FileText, label: t.tabs.memo },
          { id: 'health', icon: HeartPulse, label: t.tabs.health },
          { id: 'store', icon: Store, label: t.tabs.store },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 ${active ? 'text-cyan-400' : 'text-slate-500'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
