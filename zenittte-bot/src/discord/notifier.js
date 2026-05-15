import { EmbedBuilder } from 'discord.js';
import { getRoles, getNotificationChannelId } from '../storage.js';

const OUTCOME_COLORS = ['🔵', '🔴', '🟢', '🟡', '🟣', '🟠'];

function findOutcome(outcomes, title) {
  if (!title) return null;
  const exact = outcomes.find(o => o.title === title);
  if (exact) return exact;
  return outcomes.find(o => o.title.toLowerCase() === title.toLowerCase()) ?? null;
}

export async function sendPredictionNotification(client, prediction, analysis) {
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
  const centralizadorMencao = roles.centralizador ? `<@&${roles.centralizador}>` : null;
  const apoiadorMencao      = roles.apoiador      ? `<@&${roles.apoiador}>`      : null;
  const mencoes = [centralizadorMencao, apoiadorMencao].filter(Boolean).join(' ');

  const outcomes = prediction.outcomes ?? [];

  // Com análise: centralizador = maior chance, apoiador = menor chance
  // Sem análise: mantém comportamento original (primeiro e último)
  const favoritaOutcome = analysis
    ? findOutcome(outcomes, analysis.favorita)
    : outcomes[0] ?? null;
  const azaraoOutcome = analysis
    ? findOutcome(outcomes, analysis.azarao)
    : outcomes[outcomes.length - 1] ?? null;

  const votoFields = outcomes.map((o, i) => {
    const pct = analysis?.porcentagens?.[o.title];
    const pctStr = pct != null ? ` (${pct}%)` : '';
    const nameStr = `${OUTCOME_COLORS[i] ?? '⚪'} ${o.title}${pctStr}`;

    let roleValue;
    if (o === favoritaOutcome) {
      roleValue = centralizadorMencao
        ? `👑 ${centralizadorMencao} vota aqui *(Centralizador — maior chance)*`
        : '👑 Centralizador vota aqui *(cargo não configurado)*';
    } else if (o === azaraoOutcome) {
      roleValue = apoiadorMencao
        ? `🎲 ${apoiadorMencao} vota aqui *(Apoiador — menor chance)*`
        : '🎲 Apoiador vota aqui *(cargo não configurado)*';
    } else {
      roleValue = '*(sem cargo configurado)*';
    }

    return { name: nameStr, value: roleValue, inline: false };
  });

  if (analysis?.raciocinio) {
    votoFields.push({
      name: '🤖 Análise da IA',
      value: analysis.raciocinio,
      inline: false,
    });
  }

  const minutos  = Math.floor((prediction.prediction_window ?? 60) / 60);
  const segundos = (prediction.prediction_window ?? 60) % 60;
  const tempoStr = segundos > 0 ? `${minutos}m ${segundos}s` : `${minutos} minuto(s)`;

  const embed = new EmbedBuilder()
    .setColor(0x9146FF)
    .setTitle('🔮 Nova Prediction Aberta!')
    .setDescription(`## ${prediction.title}`)
    .addFields(...votoFields)
    .addFields({ name: '⏱️ Tempo para votar', value: tempoStr, inline: true })
    .setFooter({ text: `Vote agora na Twitch • Canal: ${process.env.TWITCH_CHANNEL_NAME}` })
    .setTimestamp();

  const conteudo = mencoes
    ? `${mencoes} — Uma prediction foi aberta! Vote agora! 🎯`
    : '🎯 Uma nova prediction foi aberta!';

  await channel.send({ content: conteudo, embeds: [embed] });
  console.log(`📢 [Discord] Notificação enviada para o canal "${channel.name}"`);
}
