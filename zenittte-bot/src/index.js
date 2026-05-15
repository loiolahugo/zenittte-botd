import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from 'dotenv';
import { startAuthServer } from './twitch/auth.js';
import { startPolling } from './twitch/polling.js';
import * as designarcargo from './commands/designarcargo.js';

config();

// ── Discord Client ────────────────────────────────────────────────────────────

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ── Carrega comandos ──────────────────────────────────────────────────────────

client.commands = new Collection();

const comandos = [designarcargo];
for (const cmd of comandos) {
  client.commands.set(cmd.data.name, cmd);
}

// ── Eventos do bot ────────────────────────────────────────────────────────────

client.once('ready', async () => {
  console.log(`✅ [Discord] Bot online como ${client.user.tag}`);
  await startPolling(client);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ [Discord] Erro no comando /${interaction.commandName}:`, error);

    const errMsg = { content: '❌ Ocorreu um erro ao executar esse comando.', ephemeral: true };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errMsg).catch(() => {});
    } else {
      await interaction.reply(errMsg).catch(() => {});
    }
  }
});

// ── Inicia tudo ───────────────────────────────────────────────────────────────

startAuthServer();
client.login(process.env.DISCORD_TOKEN);
