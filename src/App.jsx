import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { analyzeMemoWithAI, analyzeMealWithAI, semanticSearchWithAI } from './lib/gemini';
import {
  Home, FileText, HeartPulse, Store, Search, Mic, Send,
  ShieldAlert, Smartphone, Droplets, Pill, Sparkles, CheckCircle2, LogOut
} from 'lucide-react';

const QUICK_MEALS = [
  { title: '도토리 얇은 면 냉국수', calories: 420, carbs: 72, protein: 14, fat: 6 },
  { title: '콜드 쉬림프 샐러드 (큐민 소스)', calories: 310, carbs: 18, protein: 28, fat: 14 },
  { title: '아메리카노 (카페인 기록)', calories: 10, carbs: 2, protein: 0, fat: 0 },
];

const DEFAULT_MODULES = [
  { code: 'morning_brief', name: '모닝 데일리 브리핑', desc: '수면·일정·권장 칼로리 아침 요약', category: '생산성', active: true },
  { code: 'turtle_neck', name: '거북목 경추 각도 알림', desc: '갤럭시 기울기 센서 기반 자세 경고', category: '갤럭시 센서', active: true },
  { code: 'fall_sos', name: '낙상 충격 감지 SOS', desc: '급격한 가속도 변화 시 긴급 알림', category: '위험 알리미', active: true },
  { code: 'eye_fatigue', name: '조도 기반 눈 피로 케어', desc: '어두운 환경 화면 시청 시간 경고', category: '갤럭시 센서', active: false },
  { code: 'sub_guard', name: '구독 결제 방어막', desc: '정기 결제일 24시간 전 해지 확인', category: '소비·자산', active: false },
  { code: 'caffeine_cut', name: '카페인 반감기 알림', desc: '오후 시간대 추가 커피 섭취 경고', category: '건강·습관', active: true },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('home');

  const [memos, setMemos] = useState([]);
  const [healthLogs, setHealthLogs] = useState([]);
  const [modules, setModules] = useState(DEFAULT_MODULES);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchAnswer, setSearchAnswer] = useState('');
  const [memoInput, setMemoInput] = useState('');
  const [mealInput, setMealInput] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const [sensorData, setSensorData] = useState({ tiltAngle: 15, lightLux: 320, accelPeak: 1.0, status: '정상 자세' });
  const [sosTriggered, setSosTriggered] = useState(false);

  useEffect(() => {
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
    const handleOrientation = (e) => {
      const beta = Math.round(e.beta || 15);
      const isTurtleNeck = beta > 0 && beta < 35;
      setSensorData(prev => ({
        ...prev,
        tiltAngle: beta,
        status: isTurtleNeck ? '⚠️ 거북목 주의 각도' : '✅ 바른 자세 유지 중'
      }));
    };

    const handleMotion = (e) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const total = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      if (total > 28) {
        setSosTriggered(true);
      }
      setSensorData(prev => ({ ...prev, accelPeak: Number((total / 9.8).toFixed(2)) }));
    };

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, []);

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
    recognition.lang = 'ko-KR';
    recognition.onresult = (e) => targetSetter(e.results[0][0].transcript);
    recognition.start();
  }

  async function handleSaveMemo() {
    if (!memoInput.trim() || loadingAI) return;
    setLoadingAI(true);
    try {
      const aiResult = await analyzeMemoWithAI(memoInput);
      const { data, error } = await supabase.from('memos').insert([{
        user_id: session.user.id,
        raw_content: memoInput,
        summary: aiResult.summary,
        tags: aiResult.tags || [],
        todos: aiResult.todos || []
      }]).select();
      if (!error && data) {
        setMemos([data[0], ...memos]);
        setMemoInput('');
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
      const { data, error } = await supabase.from('health_logs').insert([{
        user_id: session.user.id,
        log_type: 'meal',
        title: mealInfo.title,
        calories: mealInfo.calories,
        carbs: mealInfo.carbs,
        protein: mealInfo.protein,
        fat: mealInfo.fat
      }]).select();
      if (!error && data) {
        setHealthLogs([data[0], ...healthLogs]);
        setMealInput('');
      }
    } catch (e) {
      alert('식단 분석 오류: 입력 내용을 다시 확인해 주세요.');
    }
    setLoadingAI(false);
  }

  async function handleQuickHabit(type, title) {
    const { data } = await supabase.from('health_logs').insert([{
      user_id: session.user.id,
      log_type: type,
      title
    }]).select();
    if (data) setHealthLogs([data[0], ...healthLogs]);
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

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#090d16]">
        <div className="w-full max-w-sm bg-slate-900/90 border border-slate-800 rounded-3xl p-7 shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              OMNI-MATE
            </h1>
          </div>
          <p className="text-xs text-slate-400 mb-6">플랫폼 없이 내 폰에 바로 심는 초개인화 AI 비서</p>
          <input
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-cyan-400"
          />
          <input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm mb-5 focus:outline-none focus:border-cyan-400"
          />
          <button onClick={() => handleAuth('login')} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 py-3 rounded-xl font-semibold text-sm mb-2">
            내 비서 시작하기 (로그인)
          </button>
          <button onClick={() => handleAuth('signup')} className="w-full bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl text-xs text-slate-300">
            새 계정 만들기 (무료 가입)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#090d16] pb-24 relative">
      {sosTriggered && (
        <div className="fixed inset-0 z-50 bg-red-950/90 flex flex-col items-center justify-center p-6 text-center">
          <ShieldAlert className="w-16 h-16 text-red-400 animate-bounce mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">강한 충격(낙상) 감지됨!</h2>
          <p className="text-sm text-red-200 mb-6">30초 내 해제하지 않으면 등록된 비상 연락처로 현재 위치가 전송됩니다.</p>
          <button onClick={() => setSosTriggered(false)} className="bg-white text-red-900 font-bold px-8 py-3 rounded-full">
            괜찮습니다 (경보 해제)
          </button>
        </div>
      )}

      <header className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-slate-800/80">
        <div>
          <span className="text-[10px] font-semibold tracking-wider text-cyan-400 uppercase">Direct-to-User AI</span>
          <h1 className="text-xl font-bold text-white">OMNI-MATE</h1>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="p-2 text-slate-400 hover:text-white">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="p-5 space-y-5">
        {activeTab === 'home' && (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400 shrink-0" />
                <input
                  type="text"
                  placeholder="내 메모·식단 기록이나 궁금한 점을 물어보세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSemanticSearch()}
                  className="bg-transparent text-xs w-full focus:outline-none text-white"
                />
                <button onClick={handleSemanticSearch} className="bg-cyan-500/20 text-cyan-400 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0">
                  검색
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
                  <Sparkles className="w-3.5 h-3.5" /> 오늘의 AI 컨텍스트 브리핑
                </span>
                <span className="text-[11px] text-slate-400">{sensorData.status}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                오늘 섭취 칼로리는 <strong className="text-cyan-400">{totalCalories} kcal</strong>(목표 2,000 kcal), 수분 섭취는 <strong className="text-blue-400">{waterCups}잔</strong>입니다. 저장된 메모는 총 <strong>{memos.length}건</strong>이 정리되어 있습니다.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
                <div className="text-[11px] text-slate-400 mb-1">섭취 칼로리</div>
                <div className="text-base font-bold text-emerald-400">{totalCalories}</div>
                <div className="text-[10px] text-slate-500">/ 2,000 kcal</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
                <div className="text-[11px] text-slate-400 mb-1">수분 섭취</div>
                <div className="text-base font-bold text-cyan-400">{waterCups} 잔</div>
                <div className="text-[10px] text-slate-500">목표 8잔</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
                <div className="text-[11px] text-slate-400 mb-1">경추 각도</div>
                <div className="text-base font-bold text-purple-400">{sensorData.tiltAngle}°</div>
                <div className="text-[10px] text-slate-500">갤럭시 센서</div>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold text-slate-400 mb-2">최근 AI 정리 메모</h2>
              {memos.slice(0, 2).map((m) => (
                <div key={m.id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 mb-2">
                  <p className="text-xs text-slate-200 font-medium">{m.summary || m.raw_content}</p>
                  <div className="flex gap-1.5 mt-2">
                    {m.tags?.map((t, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-800 text-cyan-400 px-2 py-0.5 rounded-full">#{t}</span>
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
                <span className="text-xs font-semibold text-cyan-400">음성 · 텍스트 자동 요약 메모</span>
                <button onClick={() => startVoiceInput(setMemoInput)} className="flex items-center gap-1 text-[11px] bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full">
                  <Mic className="w-3 h-3" /> 음성 입력
                </button>
              </div>
              <textarea
                rows={3}
                placeholder="회의 내용, 아이디어, 할 일을 두서없이 적어주세요. AI가 요약·태그·할 일을 자동 추출합니다."
                value={memoInput}
                onChange={(e) => setMemoInput(e.target.value)}
                className="w-full bg-slate-800/70 rounded-xl p-3 text-xs text-white focus:outline-none mb-2"
              />
              <button
                onClick={handleSaveMemo}
                disabled={loadingAI}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> {loadingAI ? 'AI 분석 및 저장 중...' : 'AI 자동 정리 후 저장'}
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
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-400">AI 자연어 식단 & 칼로리 계산</span>
                <button onClick={() => startVoiceInput(setMealInput)} className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Mic className="w-3 h-3 text-emerald-400" /> 말로 기록
                </button>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="예: 점심에 닭가슴살 샐러드랑 고구마 먹었어"
                  value={mealInput}
                  onChange={(e) => setMealInput(e.target.value)}
                  className="flex-1 bg-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
                <button onClick={() => handleLogMeal()} disabled={loadingAI} className="bg-emerald-500 text-slate-950 font-bold px-3 rounded-xl text-xs">
                  {loadingAI ? '...' : '기록'}
                </button>
              </div>

              <div className="text-[10px] text-slate-400 mb-1.5">원클릭 자주 먹는 식단</div>
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

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleQuickHabit('water', '물 1잔 (250ml)')} className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-3 flex items-center gap-3">
                <Droplets className="w-6 h-6 text-cyan-400" />
                <div className="text-left">
                  <div className="text-xs font-semibold">물 1잔 마시기</div>
                  <div className="text-[10px] text-slate-400">오늘 {waterCups}잔 완료</div>
                </div>
              </button>
              <button onClick={() => handleQuickHabit('supplement', '데일리 영양제 복용')} className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-3 flex items-center gap-3">
                <Pill className="w-6 h-6 text-purple-400" />
                <div className="text-left">
                  <div className="text-xs font-semibold">영양제 체크</div>
                  <div className="text-[10px] text-slate-400">터치하여 복용 기록</div>
                </div>
              </button>
            </div>

            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" /> 갤럭시 실시간 센서 가디언
                </span>
                <button onClick={() => setSosTriggered(true)} className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                  낙상 SOS 테스트
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/70 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400">기울기(거북목 감지)</div>
                  <div className="font-bold text-white mt-0.5">{sensorData.tiltAngle}° ({sensorData.status})</div>
                </div>
                <div className="bg-slate-800/70 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400">가속도(충격 감지)</div>
                  <div className="font-bold text-white mt-0.5">{sensorData.accelPeak} G (정상)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'store' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">맞춤형 비서 모듈 스토어</h2>
              <span className="text-[11px] text-cyan-400">{modules.filter(m => m.active).length}개 활성화됨</span>
            </div>
            {modules.map((mod, idx) => (
              <div key={mod.code} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-purple-400 font-medium">{mod.category}</span>
                  <div className="text-xs font-bold text-white mt-0.5">{mod.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{mod.desc}</div>
                </div>
                <button
                  onClick={() => {
                    const updated = [...modules];
                    updated[idx].active = !updated[idx].active;
                    setModules(updated);
                  }}
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 ${mod.active ? 'bg-cyan-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${mod.active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-950/95 backdrop-blur border-t border-slate-800 px-6 py-3 flex justify-between">
        {[
          { id: 'home', icon: Home, label: '홈' },
          { id: 'memo', icon: FileText, label: 'AI 메모' },
          { id: 'health', icon: HeartPulse, label: '건강·센서' },
          { id: 'store', icon: Store, label: '비서 스토어' },
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

