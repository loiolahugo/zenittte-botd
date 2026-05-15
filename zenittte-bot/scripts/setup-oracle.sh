#!/bin/bash
set -e

# ─────────────────────────────────────────────────────────────────────────────
# Atualiza os pacotes do sistema
# ─────────────────────────────────────────────────────────────────────────────
sudo apt update && sudo apt upgrade -y

# ─────────────────────────────────────────────────────────────────────────────
# Instala curl (necessário para baixar o script do NodeSource)
# ─────────────────────────────────────────────────────────────────────────────
sudo apt install -y curl

# ─────────────────────────────────────────────────────────────────────────────
# Remove qualquer versão antiga do Node.js que possa estar instalada
# (evita conflito com versões antigas do apt)
# ─────────────────────────────────────────────────────────────────────────────
sudo apt remove -y nodejs npm 2>/dev/null || true

# ─────────────────────────────────────────────────────────────────────────────
# Instala Node.js 20 via NodeSource (repositório oficial)
# ─────────────────────────────────────────────────────────────────────────────
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# ─────────────────────────────────────────────────────────────────────────────
# Instala o PM2 globalmente para manter o bot rodando em segundo plano
# ─────────────────────────────────────────────────────────────────────────────
sudo npm install -g pm2

# ─────────────────────────────────────────────────────────────────────────────
# Configura o PM2 para iniciar automaticamente após reboot do servidor
# (execute o comando que ele mostrar na tela após esse passo)
# ─────────────────────────────────────────────────────────────────────────────
pm2 startup

echo ""
echo "─────────────────────────────────────────────────────────────────────────────"
echo "✅ Setup concluído! Próximos passos:"
echo ""
echo "  Versão do Node instalada:"
node --version
echo ""
echo "  1. Clone o repositório do bot:"
echo "     git clone <seu-repositorio>"
echo "     cd zenittte-bot"
echo ""
echo "  2. Instale as dependências:"
echo "     npm install"
echo ""
echo "  3. Configure o .env (NÃO precisa de REDIRECT_URI — use o padrão localhost):"
echo "     cp .env.example .env"
echo "     nano .env"
echo ""
echo "  4. Registre os comandos slash (uma vez):"
echo "     node src/deploy-commands.js"
echo ""
echo "  5. Inicie com PM2:"
echo "     pm2 start ecosystem.config.cjs"
echo "     pm2 save"
echo ""
echo "  6. Para autenticar a Twitch, veja o README — use SSH tunnel, não abra porta 3000."
echo "─────────────────────────────────────────────────────────────────────────────"
