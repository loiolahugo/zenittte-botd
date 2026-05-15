import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '../data/storage.json');

const DEFAULT_STATE = {
  roles: {
    centralizador: null, // ID do cargo "Centralizador" (quem recebe os pontos)
    apoiador: null,      // ID do cargo "Apoiador" (quem doa os pontos)
  },
  notificationChannelId: null, // ID do canal do Discord para avisos
  seenPredictions: [],         // IDs já notificados (evita duplicata)
  tokens: {
    accessToken: null,
    refreshToken: null,
  },
};

function load() {
  if (!existsSync(DATA_PATH)) {
    save(DEFAULT_STATE);
    return structuredClone(DEFAULT_STATE);
  }
  return JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
}

function save(data) {
  const dir = join(__dirname, '../data');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function setRole(funcao, roleId) {
  const data = load();
  data.roles[funcao] = roleId;
  save(data);
}

export function getRoles() {
  return load().roles;
}

export function setNotificationChannel(channelId) {
  const data = load();
  data.notificationChannelId = channelId;
  save(data);
}

export function getNotificationChannelId() {
  return load().notificationChannelId;
}

export function isPredictionSeen(predictionId) {
  return load().seenPredictions.includes(predictionId);
}

export function markPredictionSeen(predictionId) {
  const data = load();
  if (!data.seenPredictions.includes(predictionId)) {
    data.seenPredictions.push(predictionId);
    if (data.seenPredictions.length > 100) {
      data.seenPredictions = data.seenPredictions.slice(-100);
    }
    save(data);
  }
}


export function saveTokens(accessToken, refreshToken) {
  const data = load();
  data.tokens = { accessToken, refreshToken };
  save(data);
}

export function getTokens() {
  return load().tokens;
}

export function getFullConfig() {
  const { roles, notificationChannelId } = load();
  return { roles, notificationChannelId };
}
