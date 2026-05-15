/**
 * Execute esse arquivo UMA VEZ para registrar os comandos slash no Discord:
 *   node src/deploy-commands.js
 */

import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { data as designarcargoData } from './commands/designarcargo.js';

config();

const commands = [designarcargoData.toJSON()];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('📡 Registrando comandos slash no servidor...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID,
        process.env.DISCORD_GUILD_ID,
      ),
      { body: commands },
    );

    console.log('✅ Comandos registrados com sucesso!');
    console.log('   /designarcargo já está disponível no seu servidor.');
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
  }
})();
