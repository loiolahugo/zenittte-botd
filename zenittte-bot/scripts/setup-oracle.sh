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
echo "  1. Clone o repositório do bot:"
echo "     git clone <seu-repositorio>"
echo "     cd zenittte-bot"
echo ""
echo "  2. Instale as dependências:"
echo "     npm install"
echo ""
echo "  3. Configure o .env:"
echo "     cp .env.example .env"
echo "     nano .env"
echo "     # Defina REDIRECT_URI=http://SEU_IP:3000/callback"
echo ""
echo "  4. Registre os comandos slash (uma vez):"
echo "     node src/deploy-commands.js"
echo ""
echo "  5. Inicie com PM2:"
echo "     pm2 start ecosystem.config.cjs"
echo "     pm2 save"
echo ""
echo "  6. Autentique a Twitch acessando no navegador:"
echo "     http://SEU_IP:3000/auth"
echo ""
echo "  7. Após autenticar, feche a porta 3000 no firewall da Oracle e no Ubuntu."
echo "─────────────────────────────────────────────────────────────────────────────"
