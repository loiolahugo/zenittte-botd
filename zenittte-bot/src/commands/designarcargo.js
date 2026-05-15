import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { setRole, setNotificationChannel, getFullConfig } from '../storage.js';

// ── Definição do comando ──────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName('designarcargo')
  .setDescription('Configura os cargos e canal para notificações de predictions da Twitch')

  // Subcomando: definir cargo por função
  .addSubcommand(sub =>
    sub
      .setName('cargo')
      .setDescription('Define qual cargo do Discord representa cada função nas predictions')
      .addStringOption(opt =>
        opt
          .setName('função')
          .setDescription('Qual função esse cargo vai representar nas predictions?')
          .setRequired(true)
          .addChoices(
            {
              name: '🔵 Centralizador — quem recebe os pontos dos apoiadores',
              value: 'centralizador',
            },
            {
              name: '🔴 Apoiador — quem doa os pontos para o centralizador',
              value: 'apoiador',
            },
          )
      )
      .addRoleOption(opt =>
        opt
          .setName('cargo')
          .setDescription('O cargo do Discord a ser marcado quando a prediction abrir')
          .setRequired(true)
      )
  )

  // Subcomando: definir canal de notificação
  .addSubcommand(sub =>
    sub
      .setName('canal')
      .setDescription('Define em qual canal do Discord as notificações de prediction serão enviadas')
      .addChannelOption(opt =>
        opt
          .setName('canal')
          .setDescription('Canal de texto onde os avisos vão aparecer')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )

  // Subcomando: ver configuração atual
  .addSubcommand(sub =>
    sub
      .setName('ver')
      .setDescription('Mostra a configuração atual de cargos e canal')
  )

  // Só quem pode gerenciar o servidor usa esse comando
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

// ── Handler ───────────────────────────────────────────────────────────────────

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();

  // ── /designarcargo cargo ──────────────────────────────────────────────────
  if (sub === 'cargo') {
    const funcao = interaction.options.getString('função');
    const role   = interaction.options.getRole('cargo');

    setRole(funcao, role.id);

    const labels = {
      centralizador: '🔵 Centralizador *(quem recebe os pontos)*',
      apoiador:      '🔴 Apoiador *(quem doa os pontos)*',
    };

    await interaction.reply({
      content: `✅ O cargo ${role} foi definido como **${labels[funcao]}**.\nEle será mencionado quando uma prediction abrir!`,
      ephemeral: true,
    });
    return;
  }

  // ── /designarcargo canal ──────────────────────────────────────────────────
  if (sub === 'canal') {
    const canal = interaction.options.getChannel('canal');

    setNotificationChannel(canal.id);

    await interaction.reply({
      content: `✅ As notificações de prediction serão enviadas em ${canal}!`,
      ephemeral: true,
    });
    return;
  }

  // ── /designarcargo ver ────────────────────────────────────────────────────
  if (sub === 'ver') {
    const { roles, notificationChannelId } = getFullConfig();

    const fmt = {
      centralizador: roles.centralizador
        ? `<@&${roles.centralizador}>`
        : '`não configurado`',
      apoiador: roles.apoiador
        ? `<@&${roles.apoiador}>`
        : '`não configurado`',
      canal: notificationChannelId
        ? `<#${notificationChannelId}>`
        : '`não configurado`',
    };

    await interaction.reply({
      content: [
        '**⚙️ Configuração atual das predictions:**',
        '',
        `🔵 **Centralizador** (recebe pontos) → ${fmt.centralizador}`,
        `🔴 **Apoiador** (doa pontos) → ${fmt.apoiador}`,
        `📢 **Canal de notificação** → ${fmt.canal}`,
      ].join('\n'),
      ephemeral: true,
    });
    return;
  }
}
