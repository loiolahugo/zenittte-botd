# 🤖 Zenittte Prediction Bot

Bot do Discord que monitora as predictions do canal **zenittte** na Twitch e notifica os cargos configurados quando uma aposta é aberta.

---

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- Conta no [Discord Developer Portal](https://discord.com/developers/applications)
- Conta no [Twitch Developer Console](https://dev.twitch.tv/console)

---

## 🚀 Setup passo a passo

### Passo 1 — Clone e instale as dependências

```bash
git clone <seu-repositorio>
cd zenittte-bot
npm install
```

---

### Passo 2 — Crie o Bot do Discord

1. Acesse [discord.com/developers/applications](https://discord.com/developers/applications)
2. Clique em **New Application** → dê um nome (ex: `Prediction Bot`)
3. Vá em **Bot** → clique em **Reset Token** → copie o token
4. Ainda em **Bot**, ative:
   - ✅ `SERVER MEMBERS INTENT`
5. Vá em **OAuth2 > URL Generator**:
   - Escopos: `bot`, `applications.commands`
   - Permissões de bot: `Send Messages`, `Embed Links`, `Mention Everyone`
   - Copie a URL gerada e abra no navegador para adicionar o bot ao seu servidor

> **Onde encontrar o `DISCORD_CLIENT_ID`:** General Information → Application ID
> **Onde encontrar o `DISCORD_GUILD_ID`:** No Discord, clique com botão direito no servidor → Copiar ID (ative Modo Desenvolvedor em Configurações > Avançado)

---

### Passo 3 — Crie o App na Twitch

1. Acesse [dev.twitch.tv/console/apps](https://dev.twitch.tv/console/apps)
2. Clique em **Register Your Application**
3. Preencha:
   - **Name:** qualquer nome (ex: `Prediction Monitor`)
   - **OAuth Redirect URLs:** `http://localhost:3000/callback`
   - **Category:** Application Integration
4. Clique em **Create**
5. Clique em **Manage** → copie o **Client ID** e gere um **Client Secret**

---

### Passo 4 — Configure o .env

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
DISCORD_TOKEN=seu_bot_token_aqui
DISCORD_CLIENT_ID=id_do_app_aqui
DISCORD_GUILD_ID=id_do_servidor_aqui

TWITCH_CLIENT_ID=seu_client_id_twitch
TWITCH_CLIENT_SECRET=seu_client_secret_twitch
TWITCH_CHANNEL_NAME=zenittte
```

---

### Passo 5 — Registre os comandos slash

Execute isso **uma única vez** para registrar o `/designarcargo` no servidor:

```bash
node src/deploy-commands.js
```

---

### Passo 6 — Inicie o bot

```bash
npm start
```

---

### Passo 7 — Autenticação com a Twitch *(importante!)*

Como o bot monitora as predictions do canal do **zenittte**, ele precisa da autorização do broadcaster.

Com o bot rodando, **zenittte deve acessar**:

```
http://localhost:3000/auth
```

Ele será redirecionado para a Twitch, autoriza o app, e pronto — o token é salvo automaticamente. O bot renova o token sozinho após isso.

> ⚠️ **Isso precisa ser feito apenas uma vez.** Os tokens ficam salvos em `data/storage.json`.

---

### Passo 8 — Configure os cargos no Discord

No servidor do Discord, use os comandos slash:

```
/designarcargo canal   canal:#predictions
/designarcargo cargo   função:Centralizador   cargo:@NomeDoCargo
/designarcargo cargo   função:Apoiador         cargo:@NomeDoCargo
```

Para ver a configuração atual:
```
/designarcargo ver
```

---

## 🎮 Como funciona

```
Twitch abre prediction
       ↓
Bot faz GET na API da Twitch a cada 10s
       ↓
Detecta prediction com status ACTIVE
       ↓
Envia embed no canal configurado do Discord
       ↓
Menciona @Centralizador e @Apoiador com as opções de voto
```

---

## 📁 Estrutura do projeto

```
zenittte-bot/
├── src/
│   ├── index.js                  # Entry point
│   ├── deploy-commands.js        # Registra comandos slash
│   ├── storage.js                # Persistência em JSON
│   ├── commands/
│   │   └── designarcargo.js      # Comando /designarcargo
│   ├── twitch/
│   │   ├── auth.js               # OAuth + renovação de token
│   │   └── polling.js            # Loop de monitoramento
│   └── discord/
│       └── notifier.js           # Monta e envia o embed
├── data/
│   └── storage.json              # Tokens e config (gerado automaticamente)
├── .env                          # Suas credenciais (NÃO commitar!)
├── .env.example
└── package.json
```

---

## ⚠️ Observações importantes

- **Não commite o `.env`** nem o `data/storage.json` (contém tokens) — adicione ambos ao `.gitignore`
- O bot usa **polling** (verifica a cada 10s), então pode ter até 10s de delay para detectar uma prediction nova — aceitável para uso local
- Se o zenittte fechar o app Twitch ou revogar o acesso, será necessário autenticar novamente

---

## 🌐 Deploy na Oracle Cloud (Always Free)

### Passo 1 — Criar conta Oracle Cloud

1. Acesse [cloud.oracle.com](https://cloud.oracle.com) e crie uma conta gratuita
2. Ative o **Always Free** tier (não precisa de cartão de crédito para os recursos gratuitos)

---

### Passo 2 — Criar a VM

1. No painel Oracle: **Compute > Instances > Create Instance**
2. Configure:
   - **Shape:** Ampere A1 (ARM, Always Free) ou VM.Standard.E2.1.Micro
   - **OS:** Ubuntu 22.04
   - **SSH Keys:** gere ou importe sua chave — **baixe o arquivo `.key` gerado**
3. Clique em **Create** e aguarde a VM ficar com status *Running*
4. Anote o **IP Público** da instância

---

### Passo 3 — Liberar porta 3000 no firewall

**No painel Oracle:**
1. Acesse **Networking > Virtual Cloud Networks** > sua VCN
2. Clique em **Security Lists > Default Security List**
3. Adicione uma **Ingress Rule**:
   - Protocol: TCP | Source: `0.0.0.0/0` | Destination Port: `3000`

**No Ubuntu (via SSH):**
```bash
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
```

---

### Passo 4 — Conectar via SSH

```bash
ssh -i chave.key ubuntu@SEU_IP
```

---

### Passo 5 — Rodar o script de setup

```bash
bash scripts/setup-oracle.sh
```

---

### Passo 6 — Clonar o repo e configurar

```bash
git clone <seu-repositorio>
cd zenittte-bot
npm install
cp .env.example .env
nano .env  # preencha todas as variáveis
```

No `.env`, defina:
```
REDIRECT_URI=http://SEU_IP:3000/callback
```

---

### Passo 7 — Atualizar Redirect URI na Twitch

1. Acesse [dev.twitch.tv/console/apps](https://dev.twitch.tv/console/apps) > seu app > **Manage**
2. Em **OAuth Redirect URLs**, adicione: `http://SEU_IP:3000/callback`
3. Salve

---

### Passo 8 — Registrar os comandos slash

```bash
node src/deploy-commands.js
```

---

### Passo 9 — Iniciar com PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

---

### Passo 10 — Autenticar a Twitch (uma única vez)

**Zenittte acessa no navegador:**
```
http://SEU_IP:3000/auth
```

Ele autoriza o app na Twitch e os tokens são salvos automaticamente. Após isso, o bot renova o token sozinho — **nunca mais precisa repetir esse passo**.

---

### Passo 11 — Fechar porta 3000 (segurança)

Após a autenticação, feche a porta para não deixá-la exposta:

**No painel Oracle:** remova a Ingress Rule da porta 3000

**No Ubuntu:**
```bash
sudo iptables -D INPUT -p tcp --dport 3000 -j ACCEPT
```

---

> ✅ **Bot rodando 24/7 gratuitamente.** O PM2 reinicia automaticamente se cair e sobrevive a reboots do servidor.
