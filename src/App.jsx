import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { analyzeMemoWithAI, analyzeMealWithAI, semanticSearchWithAI } from './lib/gemini';
import {
  Home, FileText, HeartPulse, Store, Search, Mic, Send,
  ShieldAlert, Droplets, Pill, Sparkles, CheckCircle2,
  LogOut, Globe, Radio, Bluetooth, Watch, Cpu, ArrowDownToLine,
  Activity, BookOpen, Video, Baby, Volume2, ShieldCheck, PlusCircle, Users, Play
} from 'lucide-react';

// [버전 관리] 0.1씩 조금씩 진화하는 빌드 체계
const APP_VERSION = 'v0.4.0';

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
    storeTitle: 'B2P2P AI 캐릭터 · 모듈 마켓',
    storeSub: '오리지널 캐릭터 장착 & 내가 만든 AI 캐릭터 거래소',
    activeCount: '개 장착됨',
    tabs: { home: '홈', memo: 'AI 메모', health: '갤럭시·기기', store: '캐릭터 마켓' },
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
    storeTitle: 'B2P2P AI Character & Module Market',
    storeSub: 'Equip official characters or publish & trade your own AI personas',
    activeCount: ' equipped',
    tabs: { home: 'Home', memo: 'AI Memo', health: 'Galaxy & IoT', store: 'Market' },
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
    storeTitle: 'B2P2P AI Character & Module Market',
    storeSub: 'Pumili ng AI character o ibenta ang sarili mong likha',
    activeCount: ' aktibo',
    tabs: { home: 'Tahanan', memo: 'AI Tala', health: 'Galaxy·IoT', store: 'Merkado' },
    postureWarn: '⚠️ Babala sa Postura ng Leeg',
    postureOk: '✅ Tamang Postura',
  }
};

const QUICK_MEALS = [
  { title: '도토리 얇은 면 냉국수', calories: 420, carbs: 72, protein: 14, fat: 6 },
  { title: '콜드 쉬림프 샐러드 (큐민 소스)', calories: 310, carbs: 18, protein: 28, fat: 14 },
  { title: '아메리카노 (카페인 기록)', calories: 10, carbs: 2, protein: 0, fat: 0 },
];

// 오리지널 고퀄리티 키즈·헬스·통역 캐릭터 15종 + 기본 코어 엔진
const INITIAL_CHARACTERS = [
  // [KIDS 5종]
  {
    code: 'kids_1',
    group: 'kids',
    name: '별빛 동화 이모 루나',
    creator: 'OMNI Official',
    price: 'FREE',
    desc: '아이 이름과 오늘 있었던 일을 넣어 포근한 잠자리 창작 동화를 들려줍니다.',
    sampleVoice: '안녕 꼬마 탐험가! 오늘 하루도 정말 씩씩했어. 이제 포근한 별빛 나라로 여행을 떠나볼까?',
    active: true
  },
  {
    code: 'kids_2',
    group: 'kids',
    name: '공룡 박사 티라노 쌤',
    creator: 'OMNI Official',
    price: '1,500원',
    desc: '공룡·우주·자연 호기심 질문에 눈높이 퀴즈와 효과음 톤으로 대답하는 놀이 친구입니다.',
    sampleVoice: '크앙! 티라노사우루스의 이빨은 바나나만큼 크다는 사실, 알고 있었니? 다음 퀴즈 나간다!',
    active: false
  },
  {
    code: 'kids_3',
    group: 'kids',
    name: '양치·정리정돈 히어로 캡틴',
    creator: 'OMNI Official',
    price: '1,000원',
    desc: '3분 양치 타이머와 장난감 정리 미션을 게임처럼 응원해 주는 생활 습관 코치입니다.',
    sampleVoice: '치카치카 대작전 시작! 윗니 아랫니 반짝반짝 닦으면 오늘의 히어로 배지를 줄게!',
    active: false
  },
  {
    code: 'kids_4',
    group: 'kids',
    name: '하원·귀가 안전 수호천사 미호',
    creator: 'OMNI Official',
    price: '2,000원',
    desc: '구형 폰 홈캠·키즈 워치 연동으로 아이 귀가 감지 및 비상 호출을 보호자에게 알립니다.',
    sampleVoice: '우리 아이가 안전하게 집에 도착했어요. 지금 거실 홈캠과 안전존이 정상 작동 중입니다.',
    active: true
  },
  {
    code: 'kids_5',
    group: 'kids',
    name: '영어·타갈로그어 놀이 친구 코코',
    creator: 'OMNI Official',
    price: '1,500원',
    desc: '아이와 인사말·동물·숫자를 한국어·영어·타갈로그어 노래와 퀴즈로 놀아줍니다.',
    sampleVoice: '안녕! 영어로 Hello, 타갈로그어로는 Kumusta! 오늘 우리 같이 세 가지 인사를 외쳐보자!',
    active: false
  },

  // [HEALTH 5종]
  {
    code: 'health_1',
    group: 'health',
    name: '스파르타 식단·근성장 코치 강팀장',
    creator: 'OMNI Official',
    price: '2,000원',
    desc: '야식·당류를 칼같이 지적하고 단백질·칼로리 목표를 냉정하게 관리해 주는 PT 트레이너입니다.',
    sampleVoice: '잠깐, 지금 그 야식 진짜 먹을 겁니까? 오늘 단백질 20g 부족합니다. 물 한 잔 마시고 참으세요!',
    active: false
  },
  {
    code: 'health_2',
    group: 'health',
    name: '거북목·자세 교정 물리치료사 정원장',
    creator: 'OMNI Official',
    price: 'FREE',
    desc: '갤럭시 자이로·기울기 센서와 연동해 고개가 숙여질 때마다 스트레칭을 안내합니다.',
    sampleVoice: '목 각도가 25도 아래로 숙여졌습니다. 지금 화면을 눈높이로 올리고 어깨를 5초간 뒤로 젖혀주세요.',
    active: true
  },
  {
    code: 'health_3',
    group: 'health',
    name: '제주·로컬 제철 미식 영양사 소담',
    creator: 'OMNI Official',
    price: '1,500원',
    desc: '기록된 식단과 활동량을 분석해 자극적이지 않고 속 편한 한식·제철 식단을 추천합니다.',
    sampleVoice: '오늘 활동량이 많으셨네요. 저녁에는 소화가 잘 되는 따뜻한 국수와 단백질 반찬을 곁들여 보세요.',
    active: false
  },
  {
    code: 'health_4',
    group: 'health',
    name: '저기압·수면 바이오리듬 케어 달빛',
    creator: 'OMNI Official',
    price: '1,500원',
    desc: '갤럭시 조도·기압 센서와 워치 심박수를 결합해 취침 루틴과 컨디션 저하를 미리 챙깁니다.',
    sampleVoice: '주변 조도가 낮아졌어요. 스마트폰 블루라이트를 줄이고 내일 아침을 위해 심호흡을 시작할 시간입니다.',
    active: false
  },
  {
    code: 'health_5',
    group: 'health',
    name: '부모님 안심 복약·낙상 가디언 효심이',
    creator: 'OMNI Official',
    price: '2,000원',
    desc: '영양제·혈압약 복용 알림과 가속도계 낙상 충격 SOS 감지를 다정한 목소리로 수행합니다.',
    sampleVoice: '어르신, 아침 식사 후 드실 영양제 시간입니다. 혹시 어지러우시면 언제든 화면을 눌러주세요.',
    active: false
  },

  // [INTERPRETER 5종]
  {
    code: 'interp_1',
    group: 'interpreter',
    name: '마닐라·세부 로컬 생활 통역사 마리아',
    creator: 'OMNI Official',
    price: '2,000원',
    desc: '필리핀 현지 관공서, 은행, 부동산, 생활 민원 상황에서 자연스러운 타갈로그어·영어를 통역합니다.',
    sampleVoice: 'Magandang araw po! 현지 담당자에게 정중하고 정확하게 요청 사항을 전달해 드릴게요.',
    active: true
  },
  {
    code: 'interp_2',
    group: 'interpreter',
    name: '해외 병원·응급실 의료 통역 전문의 닥터 한',
    creator: 'OMNI Official',
    price: '2,500원',
    desc: '증상, 알레르기, 복용 약물, 통증 부위를 현지 의료진이 바로 이해할 수 있는 의학 용어로 전달합니다.',
    sampleVoice: '증상을 한국어로 편하게 말씀하세요. 현지 의사가 즉시 진료할 수 있도록 정확한 영어와 현지어로 바꿔드릴게요.',
    active: false
  },
  {
    code: 'interp_3',
    group: 'interpreter',
    name: '글로벌 비즈니스 협상·계약 비서 제임스',
    creator: 'OMNI Official',
    price: '3,000원',
    desc: '파트너 미팅, 단가 협상, 이메일 초안 작성 시 격식 있고 설득력 있는 비즈니스 영어를 구사합니다.',
    sampleVoice: '상대방의 제안을 정중하게 조율하면서도 우리의 핵심 조건을 지키는 비즈니스 표현으로 정리했습니다.',
    active: false
  },
  {
    code: 'interp_4',
    group: 'interpreter',
    name: '미식·식당 주문 & 알레르기 필터 셰프 켄',
    creator: 'OMNI Official',
    price: '1,000원',
    desc: '해외 로컬 식당 메뉴판 해석, 맵기/고수/알레르기 제외 요청을 현지 직원에게 정확히 전달합니다.',
    sampleVoice: '땅콩 알레르기가 있으니 조리 시 제외해 달라고 현지 스태프에게 명확하게 전달해 드리겠습니다.',
    active: false
  },
  {
    code: 'interp_5',
    group: 'interpreter',
    name: '다문화 가정 소통 브릿지 하나',
    creator: 'OMNI Official',
    price: 'FREE',
    desc: '한국어와 타갈로그어, 영어를 쓰는 가족 구성원 간 대화와 학교 가정통신문을 따뜻하게 번역합니다.',
    sampleVoice: '가족 모두의 마음이 오해 없이 따뜻하게 전해지도록 세 가지 언어로 부드럽게 이어드릴게요.',
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

  // B2P2P 캐릭터 목록 상태 (초기 15종 + 사용자 출품 캐릭터 로컬 저장)
  const [characters, setCharacters] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('omni_b2p2p_chars') || 'null');
      return saved && saved.length > 0 ? saved : INITIAL_CHARACTERS;
    } catch {
      return INITIAL_CHARACTERS;
    }
  });
  const [charFilter, setCharFilter] = useState('all');
  const [showCreatorForm, setShowCreatorForm] = useState(false);
  const [newChar, setNewChar] = useState({
    name: '',
    group: 'kids',
    price: '1,500원',
    desc: '',
    sampleVoice: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchAnswer, setSearchAnswer] = useState('');
  const [memoInput, setMemoInput] = useState('');
  const [mealInput, setMealInput] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  // 키즈 케어 데모 상태 (원격 동화 & 홈 CCTV)
  const [kidName, setKidName] = useState('지우');
  const [storyTopic, setStoryTopic] = useState('용감한 아기 공룡과 제주 바다 탐험');
  const [generatedStory, setGeneratedStory] = useState('');
  const [cctvStreamUrl, setCctvStreamUrl] = useState('rtsp://old-galaxy-cam.local:8554/kidsroom');
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

  function speakText(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang === 'en' ? 'en-US' : lang === 'tl' ? 'fil-PH' : 'ko-KR';
      utter.rate = 0.95;
      window.speechSynthesis.speak(utter);
    } else {
      alert(text);
    }
  }

  function handlePlayKidsStory() {
    const text = `옛날 옛적 푸른 바다가 반짝이는 마을에 호기심 많은 ${kidName}가 살고 있었어요. 오늘 ${kidName}는 '${storyTopic}' 모험을 떠나며 반짝이는 별빛 친구들을 만났답니다. 오늘도 건강하고 씩씩하게 자란 ${kidName}, 편안한 밤 되세요!`;
    setGeneratedStory(text);
    speakText(text);
  }

  function toggleCharacter(code) {
    const updated = characters.map(c => c.code === code ? { ...c, active: !c.active } : c);
    setCharacters(updated);
    localStorage.setItem('omni_b2p2p_chars', JSON.stringify(updated));
  }

  function handlePublishCharacter() {
    if (!newChar.name.trim() || !newChar.desc.trim()) {
      return alert('캐릭터 이름과 설명을 입력해 주세요.');
    }
    const created = {
      code: 'user_char_' + Date.now(),
      group: newChar.group,
      name: newChar.name,
      creator: 'My Creator Studio (P2P)',
      price: newChar.price || 'FREE',
      desc: newChar.desc,
      sampleVoice: newChar.sampleVoice || `안녕하세요! 새로 등록된 AI 비서 ${newChar.name}입니다.`,
      active: true
    };
    const updated = [created, ...characters];
    setCharacters(updated);
    localStorage.setItem('omni_b2p2p_chars', JSON.stringify(updated));
    setNewChar({ name: '', group: 'kids', price: '1,500원', desc: '', sampleVoice: '' });
    setShowCreatorForm(false);
    alert(`🎉 [${created.name}] 캐릭터가 B2P2P 마켓에 출품 및 장착되었습니다!`);
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
  const activeCharacters = characters.filter(c => c.active);
  const filteredCharacters = charFilter === 'all' ? characters : characters.filter(c => c.group === charFilter);

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
              <p className="text-xs text-slate-300 leading-relaxed mb-2">
                Calories: <strong className="text-cyan-400">{totalCalories} kcal</strong> · Water: <strong className="text-blue-400">{waterCups}</strong> · Active AI: <strong className="text-amber-300">{activeCharacters.length}</strong>
              </p>
              <div className="flex flex-wrap gap-1">
                {activeCharacters.map((c) => (
                  <span key={c.code} className="text-[10px] bg-indigo-950/90 border border-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full">
                    ✨ {c.name}
                  </span>
                ))}
              </div>
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
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-400" /> {t.storeTitle}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">{t.storeSub}</p>
              </div>
              <button
                onClick={() => setShowCreatorForm(!showCreatorForm)}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1 shrink-0 shadow-md"
              >
                <PlusCircle className="w-3.5 h-3.5" /> 내 캐릭터 출품
              </button>
            </div>

            {/* B2P2P 사용자 캐릭터 제작 및 출품 스튜디오 */}
            {showCreatorForm && (
              <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl p-4 space-y-2.5">
                <div className="text-xs font-bold text-cyan-300">✨ B2P2P 크리에이터 스튜디오 (새 AI 캐릭터 출품)</div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="캐릭터 이름"
                    value={newChar.name}
                    onChange={(e) => setNewChar({ ...newChar, name: e.target.value })}
                    className="col-span-2 bg-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <select
                    value={newChar.group}
                    onChange={(e) => setNewChar({ ...newChar, group: e.target.value })}
                    className="bg-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="kids">키즈</option>
                    <option value="health">헬스</option>
                    <option value="interpreter">통역</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="캐릭터 설명 및 역할"
                    value={newChar.desc}
                    onChange={(e) => setNewChar({ ...newChar, desc: e.target.value })}
                    className="col-span-2 bg-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="가격 (예: 1,500원)"
                    value={newChar.price}
                    onChange={(e) => setNewChar({ ...newChar, price: e.target.value })}
                    className="bg-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <input
                  type="text"
                  placeholder="미리듣기 샘플 대사 (음성으로 재생됩니다)"
                  value={newChar.sampleVoice}
                  onChange={(e) => setNewChar({ ...newChar, sampleVoice: e.target.value })}
                  className="w-full bg-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
                <button
                  onClick={handlePublishCharacter}
                  className="w-full bg-cyan-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs"
                >
                  마켓에 즉시 출품 및 내 폰에 장착하기
                </button>
              </div>
            )}

            {/* 키즈 & 패밀리 케어 실시간 체험 허브 */}
            <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Baby className="w-4 h-4" /> 키즈 & 패밀리 케어 허브 (KIDS PACK)
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold">CORE</span>
              </div>

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

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-cyan-400" /> 구형폰 오픈 홈 CCTV · 안전 모니터링
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
                    <div className="text-[11px] text-cyan-300 font-semibold">● LIVE SUB-PHONE CAM CONNECTED</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{cctvStreamUrl} · 움직임 및 울음소리 AI 감지 대기 중</div>
                  </div>
                )}
              </div>
            </div>

            {/* 카테고리 필터 탭 (전체 15+종) */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {[
                  { id: 'all', label: `전체 (${characters.length})` },
                  { id: 'kids', label: '키즈' },
                  { id: 'health', label: '헬스' },
                  { id: 'interpreter', label: '통역' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCharFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                      charFilter === tab.id
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-cyan-400 font-semibold">{activeCharacters.length}{t.activeCount}</span>
            </div>

            {/* 오리지널 & P2P 캐릭터 카드 리스트 */}
            <div className="space-y-2.5">
              {filteredCharacters.map((char) => (
                <div key={char.code} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          char.group === 'kids'
                            ? 'bg-amber-500/20 text-amber-300'
                            : char.group === 'health'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {char.group}
                        </span>
                        <span className="text-[10px] text-slate-400">by {char.creator}</span>
                        <span className="text-[10px] font-bold text-cyan-400">· {char.price}</span>
                      </div>
                      <div className="text-xs font-bold text-white mt-1">{char.name}</div>
                    </div>

                    <button
                      onClick={() => toggleCharacter(char.code)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all ${
                        char.active
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {char.active ? '장착됨 ✓' : '장착하기'}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">{char.desc}</p>

                  <button
                    onClick={() => speakText(char.sampleVoice)}
                    className="w-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2 text-[11px] text-slate-200 flex items-center justify-between"
                  >
                    <span className="truncate pr-2">"{char.sampleVoice}"</span>
                    <span className="text-cyan-400 font-semibold flex items-center gap-1 shrink-0">
                      <Play className="w-3 h-3" /> 미리듣기
                    </span>
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
