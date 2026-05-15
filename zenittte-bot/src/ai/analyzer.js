import axios from 'axios';
import { config } from 'dotenv';

config();

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

export async function analyzePrediction(game, predictionTitle, outcomes) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  [AI] GEMINI_API_KEY não configurada. Pulando análise.');
    return null;
  }

  const optionsText = outcomes
    .map((o, i) => `${String.fromCharCode(65 + i)}) ${o.title}`)
    .join(' / ');

  const titlesJson = JSON.stringify(outcomes.map(o => o.title));

  const prompt =
    `Você é um analista de apostas de streams. O streamer é zenittte, brasileiro, é um gamer a bastante tempo e já jogou/zerou muitos jogos, tem um bom conhecimento e desenvoltura em puzzles e contra bosses, sabe jogar jogo de tiro e tem uma mira boa. Lembrando que ele é um jogador casual e não tanto competitivo/tryhard. ` +
    `Está jogando ${game} e a prediction aberta é: '${predictionTitle}'. ` +
    `As opções são: ${optionsText}. ` +
    `Os títulos exatos das opções são: ${titlesJson}. ` +
    `Com base no contexto, qual opção tem MAIS chance de acontecer e qual tem MENOS? ` +
    `Responda APENAS em JSON válido, sem markdown, sem texto fora do JSON: ` +
    `{"favorita":"título exato da opção com mais chance","azarao":"título exato da opção com menos chance","raciocinio":"explicação breve em português (máximo 200 caracteres)","porcentagens":{"título exato da opção":número de 0 a 100}}`;

  try {
    const response = await axios.post(
      `${GEMINI_URL}?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
      }
    );

    const raw = response.data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const cleaned = raw.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('❌ [AI] Erro ao analisar prediction:', err.response?.data ?? err.message);
    return null;
  }
}
