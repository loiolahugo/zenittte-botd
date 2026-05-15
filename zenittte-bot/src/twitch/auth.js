import express from 'express';
import axios from 'axios';
import { saveTokens, getTokens } from '../storage.js';
import { config } from 'dotenv';

config();

const CLIENT_ID     = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const REDIRECT_URI  = process.env.REDIRECT_URI ?? 'http://localhost:3000/callback';
const SCOPES        = 'channel:read:predictions';

export function startAuthServer() {
  const app = express();

  app.get('/auth', (_req, res) => {
    const url =
      `https://id.twitch.tv/oauth2/authorize` +
      `?client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(SCOPES)}`;
    res.redirect(url);
  });

  app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
      return res.send('❌ Erro: código de autorização não encontrado na URL.');
    }

    try {
      const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
          client_id:     CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          grant_type:    'authorization_code',
          redirect_uri:  REDIRECT_URI,
        },
      });

      const { access_token, refresh_token } = response.data;
      saveTokens(access_token, refresh_token);

      console.log('✅ [Twitch] Tokens salvos com sucesso! Bot está pronto.');
      res.send(`
        <h2>✅ Autenticado com sucesso!</h2>
        <p>Pode fechar essa aba. O bot já está monitorando as predictions do canal.</p>
      `);
    } catch (err) {
      console.error('❌ [Twitch] Erro ao trocar código por token:', err.response?.data || err.message);
      res.send('❌ Erro na autenticação. Veja o console do bot.');
    }
  });

  app.listen(3000, () => {
    const base = REDIRECT_URI.replace('/callback', '');
    console.log('');
    console.log('─────────────────────────────────────────────────');
    console.log('🔐 Servidor de autenticação rodando!');
    console.log('');
    console.log('👉 Para autenticar, zenittte deve acessar:');
    console.log(`   ${base}/auth`);
    console.log('');
    console.log('   (Se você for o zenittte, abra esse link no navegador)');
    console.log('─────────────────────────────────────────────────');
    console.log('');
  });
}

async function refreshAccessToken() {
  const { refreshToken } = getTokens();
  if (!refreshToken) {
    throw new Error('Sem refresh token. Faça a autenticação em http://localhost:3000/auth');
  }

  const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
    },
  });

  const { access_token, refresh_token } = response.data;
  saveTokens(access_token, refresh_token);
  console.log('🔄 [Twitch] Access token renovado automaticamente.');
  return access_token;
}

export async function getValidToken() {
  const { accessToken } = getTokens();

  if (!accessToken) {
    console.warn('⚠️  [Twitch] Sem token. Acesse http://localhost:3000/auth para autenticar.');
    return null;
  }

  try {
    await axios.get('https://id.twitch.tv/oauth2/validate', {
      headers: { Authorization: `OAuth ${accessToken}` },
    });
    return accessToken;
  } catch {
    try {
      return await refreshAccessToken();
    } catch (err) {
      console.error('❌ [Twitch] Erro ao renovar token:', err.message);
      return null;
    }
  }
}
