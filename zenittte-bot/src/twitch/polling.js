import axios from 'axios';
import { getValidToken } from './auth.js';
import { isPredictionSeen, markPredictionSeen } from '../storage.js';
import { sendPredictionNotification } from '../discord/notifier.js';
import { analyzePrediction } from '../ai/analyzer.js';
import { config } from 'dotenv';

config();

const CLIENT_ID      = process.env.TWITCH_CLIENT_ID;
const CHANNEL_NAME   = process.env.TWITCH_CHANNEL_NAME;
const POLL_INTERVAL  = 10_000;
const RETRY_INTERVAL = 30_000;

async function getBroadcasterId(token) {
  const res = await axios.get('https://api.twitch.tv/helix/users', {
    params: { login: CHANNEL_NAME },
    headers: {
      'Client-Id':     CLIENT_ID,
      'Authorization': `Bearer ${token}`,
    },
  });
  return res.data.data[0]?.id ?? null;
}

async function fetchLatestPrediction(token, broadcasterId) {
  const res = await axios.get('https://api.twitch.tv/helix/predictions', {
    params: { broadcaster_id: broadcasterId, first: 1 },
    headers: {
      'Client-Id':     CLIENT_ID,
      'Authorization': `Bearer ${token}`,
    },
  });
  return res.data.data[0] ?? null;
}

async function fetchCurrentGame(token, broadcasterId) {
  try {
    const res = await axios.get('https://api.twitch.tv/helix/channels', {
      params: { broadcaster_id: broadcasterId },
      headers: {
        'Client-Id':     CLIENT_ID,
        'Authorization': `Bearer ${token}`,
      },
    });
    return res.data.data[0]?.game_name || 'jogo desconhecido';
  } catch {
    return 'jogo desconhecido';
  }
}

async function checkPredictions(client, broadcasterId) {
  const token = await getValidToken();
  if (!token) return;

  try {
    const prediction = await fetchLatestPrediction(token, broadcasterId);
    if (!prediction) return;

    if (prediction.status === 'ACTIVE' && !isPredictionSeen(prediction.id)) {
      markPredictionSeen(prediction.id);
      console.log(`🎯 [Twitch] Nova prediction detectada: "${prediction.title}"`);

      const game = await fetchCurrentGame(token, broadcasterId);
      console.log(`🎮 [Twitch] Jogo atual: ${game}`);

      const analysis = await analyzePrediction(game, prediction.title, prediction.outcomes ?? []);
      if (analysis) {
        console.log(`🤖 [AI] Favorita: "${analysis.favorita}" | Azarão: "${analysis.azarao}"`);
      }

      await sendPredictionNotification(client, prediction, analysis);
    }
  } catch (err) {
    if (err.response?.status === 401) {
      console.warn('⚠️  [Twitch] Token inválido detectado no poll. Tentando renovar...');
    } else {
      console.error('❌ [Twitch] Erro no poll:', err.response?.data ?? err.message);
    }
  }
}

export async function startPolling(client) {
  const token = await getValidToken();

  if (!token) {
    console.warn(`⏳ [Polling] Sem token Twitch. Tentando novamente em ${RETRY_INTERVAL / 1000}s...`);
    setTimeout(() => startPolling(client), RETRY_INTERVAL);
    return;
  }

  const broadcasterId = await getBroadcasterId(token).catch(() => null);
  if (!broadcasterId) {
    console.error(`❌ [Twitch] Canal "${CHANNEL_NAME}" não encontrado. Verifique TWITCH_CHANNEL_NAME no .env`);
    return;
  }

  console.log(`✅ [Polling] Monitorando predictions de "${CHANNEL_NAME}" a cada ${POLL_INTERVAL / 1000}s`);

  await checkPredictions(client, broadcasterId);
  setInterval(() => checkPredictions(client, broadcasterId), POLL_INTERVAL);
}
