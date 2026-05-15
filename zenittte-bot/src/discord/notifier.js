import { EmbedBuilder } from 'discord.js';
import { getRoles, getNotificationChannelId } from '../storage.js';

const OUTCOME_COLORS = ['🔵', '🔴', '🟢', '🟡', '🟣', '🟠'];

/**
 * Monta e envia a notificação de prediction para o Discord.
 * @param {import('discord.js').Client} client
 * @param {object} prediction - objeto retornado pela API da Twitch
 */
export async function sendPredictionNotification(client, prediction) {
  const channelId = getNotificationChannelId();

  if (!channelId) {
    console.warn('⚠️  [Discord] Canal de notificação não configurado. Use /designarcargo canal');
    return;
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) {
    console.error(`❌ [Discord] Canal ID "${channelId}" não encontrado.`);
    return;
  }

  const roles = getRoles();

  // ── Monta as menções ──────────────────────────────────────────────────────
  const centralizadorMencao = roles.centralizador ? `<@&${roles.centralizador}>` : null;
  const apoiadorMencao      = roles.apoiador      ? `<@&${roles.apoiador}>`      : null;

  const mencoes = [centralizadorMencao, apoiadorMencao].filter(Boolean).join(' ');

  // ── Monta as opções da prediction ─────────────────────────────────────────
  const outcomes = prediction.outcomes ?? [];
  const outcomesText = outcomes
    .map((o, i) => `${OUTCOME_COLORS[i] ?? '⚪'} **${o.title}**`)
    .join('\n') || '*Sem opções*';

  // ── Monta o campo de "quem vota em quê" ──────────────────────────────────
  // Associação dinâmica: outcome[0] → Centralizador, outcome[1] → Apoiador
  const votoFields = [];

  if (outcomes[0]) {
    votoFields.push({
      name: `${OUTCOME_COLORS[0]} ${outcomes[0].title}`,
      value: centralizadorMencao
        ? `👉 Vote aqui se você é ${centralizadorMencao} *(Centralizador)*`
        : '*(cargo Centralizador não configurado)*',
      inline: false,
    });
  }

  if (outcomes[1]) {
    votoFields.push({
      name: `${OUTCOME_COLORS[1]} ${outcomes[1].title}`,
      value: apoiadorMencao
        ? `👉 Vote aqui se você é ${apoiadorMencao} *(Apoiador)*`
        : '*(cargo Apoiador não configurado)*',
      inline: false,
    });
  }

  // Outcomes extras (caso tenha mais de 2)
  for (let i = 2; i < outcomes.length; i++) {
    votoFields.push({
      name: `${OUTCOME_COLORS[i] ?? '⚪'} ${outcomes[i].title}`,
      value: '*(sem cargo configurado)*',
      inline: false,
    });
  }

  const minutos = Math.floor((prediction.prediction_window ?? 60) / 60);
  const segundos = (prediction.prediction_window ?? 60) % 60;
  const tempoStr = segundos > 0
    ? `${minutos}m ${segundos}s`
    : `${minutos} minuto(s)`;

  // ── Embed ─────────────────────────────────────────────────────────────────
  const embed = new EmbedBuilder()
    .setColor(0x9146FF) // roxo Twitch
    .setTitle('🔮 Nova Prediction Aberta!')
    .setDescription(`## ${prediction.title}`)
    .addFields(...votoFields)
    .addFields({
      name: '⏱️ Tempo para votar',
      value: tempoStr,
      inline: true,
    })
    .setFooter({ text: `Vote agora na Twitch • Canal: ${process.env.TWITCH_CHANNEL_NAME}` })
    .setTimestamp();

  // ── Envia ─────────────────────────────────────────────────────────────────
  const conteudo = mencoes
    ? `${mencoes} — Uma prediction foi aberta! Vote agora! 🎯`
    : '🎯 Uma nova prediction foi aberta!';

  await channel.send({ content: conteudo, embeds: [embed] });
  console.log(`📢 [Discord] Notificação enviada para o canal "${channel.name}"`);
}
