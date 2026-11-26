const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function analyzeMemoWithAI(text) {
  const prompt = `다음 사용자의 메모를 분석해서 JSON으로만 응답해줘.
메모: "${text}"
형식: {"summary": "핵심 1~2줄 요약", "tags": ["태그1", "태그2"], "todos": ["추출된 할 일(없으면 빈 배열)"]}`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });
  const data = await res.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

export async function analyzeMealWithAI(mealText) {
  const prompt = `사용자가 먹은 음식 설명을 보고 칼로리와 탄수화물/단백질/지방(g)을 추정해서 JSON으로만 응답해줘.
음식: "${mealText}"
형식: {"title": "정리된 메뉴명", "calories": 숫자, "carbs": 숫자, "protein": 숫자, "fat": 숫자}`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });
  const data = await res.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

export async function semanticSearchWithAI(query, memos, healthLogs) {
  const context = JSON.stringify({ memos: memos.slice(0, 20), healthLogs: healthLogs.slice(0, 20) });
  const prompt = `너는 개인 비서 OMNI-MATE야. 아래 사용자의 과거 기록(메모, 식단/건강)을 참고해서 질문에 친절하고 간결하게 답해줘. 기록에 없는 일반적인 질문이라면 네 지식으로 답해줘.
기록 데이터: ${context}
질문: "${query}"`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}
