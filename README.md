# 📊 Instagram Analyzer - GM Clínicas

Aplicação web para análise de posicionamento de perfis Instagram com IA (Claude).

## 🎯 Funcionalidades

- ✅ Análise via link do Instagram (web scraping)
- ✅ Análise via upload de screenshots
- ✅ Relatório PDF completo (100%) gerado automaticamente
- ✅ Preview de 50% na tela do usuário
- ✅ Envio automático de emails para gerência e usuário
- ✅ Integração com Google Sheets para registro de dados
- ✅ WhatsApp integration para contato pós-análise

## 🚀 Setup Local

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação

```bash
npm install
```

### Criar arquivo .env.local

Copie `.env.example` para `.env.local` e preencha com suas credenciais:

```bash
cp .env.example .env.local
```

**Credenciais necessárias:**
- `CLAUDE_API_KEY` — [Obter em console.anthropic.com](https://console.anthropic.com/)
- `SMTP_USER` e `SMTP_PASS` — Seu email Gmail + Senha de App
- `GOOGLE_SHEETS_ID` — ID da sua planilha Google Sheets
- `GOOGLE_SHEETS_API_KEY` — [Obter em Google Cloud](https://console.cloud.google.com/)

### Rodar em desenvolvimento

```bash
npm run dev
```

Acessa: `http://localhost:5173`

## 🏗️ Arquitetura

```
instagram-analyzer/
├── src/
│   ├── pages/          # 4 telas da aplicação
│   ├── App.jsx         # Componente principal (state machine)
│   └── App.css         # Estilos
├── netlify/
│   └── functions/      # Backend serverless
│       ├── analyze-profile.js    # Orquestrador principal
│       └── lib/
│           ├── claude-analyzer.js    # Integração Claude API
│           ├── instagram-scraper.js  # Web scraping
│           ├── pdf-generator.js      # Geração de PDF
│           ├── email-sender.js       # Envio de emails
│           └── google-sheets.js      # Integração Sheets
└── netlify.toml        # Config Netlify
```

## 📋 Fluxo da Aplicação

1. **Home** → Usuário escolhe Link ou Upload
2. **Formulário** → Preenche dados (name, email, whatsapp, consultoria)
3. **Loading** → Análise acontecendo (IA processando)
4. **Success** → Mostra 50% do resultado + botão WhatsApp

## 🔗 URLs e Endpoints

- **Frontend**: Qualquer hospedagem (recomendado Netlify)
- **Backend**: Netlify Functions (`.netlify/functions/analyze-profile`)
- **IA**: Claude API (Anthropic)
- **Email**: SMTP (Gmail)
- **Dados**: Google Sheets + Netlify Blobs

## 🚢 Deploy no Netlify

### 1. Conectar repo

```bash
# Fazer push para GitHub
git remote add origin <seu-repo>
git push -u origin main
```

### 2. Conectar Netlify

1. Acesse [netlify.com](https://app.netlify.com)
2. "New site from Git"
3. Selecione seu repo
4. Build command: `npm run build`
5. Publish directory: `dist`

### 3. Configurar variáveis de ambiente

Em Netlify → Site settings → Build & deploy → Environment:

```
CLAUDE_API_KEY = sk-ant-...
SMTP_USER = seu-email@gmail.com
SMTP_PASS = sua-senha-de-app
GOOGLE_SHEETS_ID = ...
GOOGLE_SHEETS_API_KEY = ...
MANAGER_EMAIL = gerencia@gmclinicas.com.br
WHATSAPP_NUMBER = 5516997571842
```

### 4. Deploy

Netlify fará deploy automático a cada push no branch `main`.

## 📄 Checklist pré-produção

- [ ] Claude API key testada
- [ ] Credenciais SMTP (Gmail) configuradas
- [ ] Google Sheets criada e API habilitada
- [ ] Variáveis de ambiente no Netlify
- [ ] Testar fluxo completo (link e upload)
- [ ] Verificar emails (gerência + usuário)
- [ ] Testar link WhatsApp
- [ ] Verificar dados no Google Sheets

## 🔐 Segurança

- ✅ Credenciais **NUNCA** commitadas (.env.local + .gitignore)
- ✅ Validações no frontend + backend
- ✅ Rate limiting em consideração
- ✅ CORS configurado para Netlify

## 📞 Suporte

Para dúvidas sobre a implementação, revisar a spec: `../docs/superpowers/specs/2026-04-08-instagram-analyzer-design.md`
