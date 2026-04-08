# 🧪 Guia de Testes Locais - Instagram Analyzer

## Pré-requisitos para Testar

Você precisa ter as seguintes credenciais no arquivo `.env.local`:

```
CLAUDE_API_KEY=sk-ant-seu-token-aqui
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app-gmail
GOOGLE_SHEETS_ID=sua-planilha-id
GOOGLE_SHEETS_API_KEY=sua-api-key
MANAGER_EMAIL=gerencia@gmclinicas.com.br
WHATSAPP_NUMBER=5516997571842
```

Se você ainda não tem essas credenciais, a aplicação vai falhar ao tentar fazer análise. Mas você pode testar a interface (UI) sem elas.

---

## ✅ Opção 1: Testar só a Interface (SEM credenciais)

Isso testa o frontend, mas não a análise da IA:

```bash
npm run dev
```

Acessa: `http://localhost:5173`

**O que você pode testar:**
- ✅ Fluxo das telas (Home → Formulário → Loading → Success)
- ✅ Validações dos campos
- ✅ Responsividade
- ✅ Layout das telas

**O que NÃO funciona:**
- ❌ Análise com Claude
- ❌ Web scraping do Instagram
- ❌ Geração de PDF
- ❌ Envio de emails
- ❌ Google Sheets

---

## 🚀 Opção 2: Testar Completo (COM credenciais) - RECOMENDADO

### Step 1: Preencher `.env.local`

```bash
cp .env.example .env.local
```

Editar `.env.local` e preencher com suas credenciais reais:
- Claude API Key
- Gmail credentials (SMTP)
- Google Sheets ID e API Key

### Step 2: Rodar `netlify dev`

```bash
npm run dev:netlify
```

Isso vai:
1. Instalar Netlify CLI (se não estiver)
2. Emular as Netlify Functions localmente
3. Rodar o frontend React
4. Conectar frontend ↔ functions via `/.netlify/functions/...`

**Saída esperada:**
```
◈ Netlify Dev ◈
‣ Live Reload enabled
‣ Server started on http://localhost:8888
‣ Functions available at http://localhost:8888/.netlify/functions/
```

### Step 3: Abrir no navegador

Acessa: `http://localhost:8888`

### Step 4: Testar o fluxo completo

1. **Home** → Clique "Cole o Link" ou "Suba os Screenshots"
2. **Formulário** → Preencha com dados de teste:
   - Nome: "João Teste"
   - Email: **seu-email-real** (pois receberá PDF)
   - WhatsApp: "(16) 99999-9999"
   - Consultoria: "Sim"
   - Link: "instagram.com/gmclinicas" (ou upload uma imagem)
3. **Loading** → Aguarde (pode levar 10-30 segundos)
4. **Success** → Veja 50% da análise + botão WhatsApp

---

## 📊 O que verificar durante teste

### Frontend
- [ ] Todas as telas carregam corretamente
- [ ] Validações de campo funcionam
- [ ] Botão "Analisar Perfil" é clicável
- [ ] Loading spinner anima
- [ ] Success mostra 50% do resumo

### Backend (Console)
- [ ] `netlify dev` mostra logs das functions sendo chamadas
- [ ] Claude API retorna análise (checar console do VS Code)
- [ ] PDF é gerado (arquivo temporário)
- [ ] Emails são enviados (checar seu email)

### Dados
- [ ] Seus dados aparecem no Google Sheets
- [ ] Email chegou em seu inbox (gerência)
- [ ] Email chegou em seu inbox (com PDF anexo)
- [ ] Link WhatsApp na tela abre o chat corretamente

---

## 🐛 Troubleshooting

### Erro: "CLAUDE_API_KEY não configurada"
**Solução:** Preencher CLAUDE_API_KEY no `.env.local` e reiniciar `netlify dev`

### Erro: "400 Bad Request" ao submeter formulário
**Solução:** Abrir DevTools (F12) e ver qual é o erro exato no console

### Erro: "Web scraping falhou"
**Solução:** Instagram pode estar bloqueando scraping. Usar método Upload de screenshots

### Emails não chegam
**Solução:** 
1. Verificar se SMTP_USER e SMTP_PASS estão corretos
2. Gmail requer "Senhas de App" (não senha normal)
3. Habilitar 2FA em Google Account

### Google Sheets não atualiza
**Solução:**
1. Verificar se GOOGLE_SHEETS_ID está correto
2. Verificar se a API está habilitada em Google Cloud Console
3. Tentar criar nova chave de API

---

## 📱 Testar no Celular/Outro PC

`netlify dev` roda em `localhost:8888` por padrão (apenas local).

Para acessar de outro dispositivo:

```bash
netlify dev --live
```

Isso cria um link público (tipo `https://xxx--instagram-analyzer.netlify.live`) que você pode acessar de qualquer lugar.

---

## ✨ Depois de Testar

Quando tudo estiver funcionando:

```bash
git add .
git commit -m "test: Verify all features working locally"
git push origin main
```

Netlify fará deploy automático. 🚀

---

## 📝 Checklist Final

- [ ] npm run dev:netlify executa sem erros
- [ ] Frontend carrega em http://localhost:8888
- [ ] Formulário valida corretamente
- [ ] Análise completa (link ou upload) funciona
- [ ] PDF é gerado com branding GM
- [ ] Emails chegam em ambas as caixas
- [ ] Google Sheets recebe os dados
- [ ] Botão WhatsApp funciona
- [ ] Responsividade OK em mobile

Após confirmar tudo, seu app está **100% pronto para produção**! 🎉
