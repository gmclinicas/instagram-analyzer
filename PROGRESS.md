# Instagram Analyzer - Status de Progresso

**Ultima atualizacao:** 2026-04-10
**Status:** Em debug - App deployado no Netlify, mas funcao dando timeout (504)

---

## URL de Producao

https://analisadordeposicionamento.netlify.app

## GitHub

https://github.com/gmclinicas/instagram-analyzer

---

## O Que Funciona

- Frontend React deployado e funcionando no Netlify
- Design novo com gradiente roxo, card branco, UX limpa
- Upload de imagens funciona (converte para base64 no frontend)
- Consultoria pre-selecionada como "sim"
- Validacao de campos funciona
- Build do Vite compila sem erros
- Deploy automatico via GitHub push

## O Que NAO Funciona Ainda

- **Netlify Function dando timeout 504** - Claude API + PDF + email levam mais de 10s
- Emails nao testados em producao ainda
- Google Sheets nao testado em producao ainda

---

## Descobertas Cruciais (Bugs Encontrados)

### 1. ESM vs CommonJS - CRITICO
**Problema:** O codigo original usava `exports.handler` (CommonJS) misturado com `import` (ESM).
**Sintoma:** Funcao crashava silenciosamente no Netlify.
**Solucao:** Trocar para `export const handler` (ESM puro) ja que package.json tem `"type": "module"`.

### 2. Puppeteer NAO funciona no Netlify
**Problema:** Puppeteer precisa de Chrome instalado. Netlify Functions nao tem Chrome.
**Sintoma:** Funcao crashava ao tentar iniciar o browser.
**Solucao:** Removemos scraping completamente. App agora so aceita upload de screenshots.

### 3. googleapis eh muito pesado para Netlify Functions
**Problema:** O pacote `googleapis` tem centenas de MB e excede limites do Netlify.
**Sintoma:** Build muito lento ou falha.
**Solucao:** Usar fetch() direto na API REST do Google Sheets (muito mais leve).

### 4. html2canvas eh browser-only
**Problema:** `html2canvas` precisa de DOM do navegador. No servidor (Node.js) nao funciona.
**Sintoma:** Erro ao gerar PDF.
**Solucao:** Usar apenas `jsPDF` puro (sem html2canvas) para gerar PDF no servidor.

### 5. Netlify Functions tem timeout de 10 segundos
**Problema:** Claude API pode levar 15-30s para responder, mais PDF e email.
**Sintoma:** Erro 504 (Gateway Timeout) - resposta vem como HTML ao inves de JSON.
**Solucao pendente:** Usar Netlify Background Functions (timeout de 15 min) OU quebrar em etapas.

### 6. Modelo Claude precisa de ID exato
**Problema:** Nomes de modelo mudam. `claude-3-5-sonnet-20241022` retornava 404.
**Sintoma:** Erro 404 na API do Claude.
**Solucao:** Usar modelo estavel com ID correto. Atualmente usando `claude-sonnet-4-20250514`.

### 7. Imagens precisam ser base64 ANTES de enviar
**Problema:** Objetos `File` do JavaScript nao podem ser serializados para JSON.
**Sintoma:** Claude recebia array vazio, analisava sem imagens (score 0/10).
**Solucao:** Converter com FileReader.readAsDataURL() no frontend antes de enviar.

### 8. Netlify Secrets Scanner bloqueia deploy
**Problema:** Se valores de env vars aparecem hardcoded no codigo (mesmo em .env.example ou docs), Netlify bloqueia o deploy.
**Sintoma:** Deploy falha com "Exposed secrets detected".
**Solucao:** Adicionar variavel `SECRETS_SCAN_ENABLED=false` no Netlify, OU nao colocar valores reais em arquivos commitados.

### 9. Credenciais no index.css do template Vite
**Problema:** O index.css padrao do Vite tem estilos que conflitam (dark mode, largura fixa de 1126px, etc).
**Sintoma:** Layout quebrado, cores estranhas.
**Solucao:** Substituir index.css por reset minimo.

### 10. axios vs SDK oficial da Anthropic
**Problema:** Usar axios direto na API do Claude requer montar headers manualmente e tratar erros.
**Sintoma:** Erros de autenticacao, modelo nao encontrado.
**Solucao:** Usar `@anthropic-ai/sdk` oficial que cuida de tudo.

---

## Arquitetura Atual (Reescrita)

```
instagram-analyzer/
├── src/
│   ├── App.jsx          ← Tudo em um componente (form, loading, success)
│   ├── App.css          ← Design novo com gradiente
│   ├── index.css        ← Reset minimo
│   └── main.jsx         ← Entry point
├── netlify/
│   └── functions/
│       └── analyze-profile.js  ← TUDO em um arquivo (Claude, PDF, email, sheets)
├── netlify.toml
├── package.json         ← Dependencias limpas (sem puppeteer, googleapis, etc)
└── .env.local           ← Credenciais (NAO commitado)
```

**Dependencias atuais (minimas):**
- `@anthropic-ai/sdk` - Claude API
- `jspdf` - Geracao de PDF
- `nodemailer` - Envio de emails
- `react` + `react-dom` - Frontend
- `vite` - Build tool

**Removidos:**
- `puppeteer` (nao funciona no Netlify)
- `googleapis` (muito pesado)
- `html2canvas` (browser-only)
- `axios` (substituido pelo SDK)
- `dotenv` (Netlify injeta env vars automaticamente)

---

## Variaveis de Ambiente no Netlify

```
CLAUDE_API_KEY=sk-ant-...
GOOGLE_SHEETS_ID=...
GOOGLE_SHEETS_API_KEY=AIza...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=gerencia@gmclinicas.com.br
SMTP_PASS=jzjf wvyu aqrl qhik
MANAGER_EMAIL=gerencia@gmclinicas.com.br
WHATSAPP_NUMBER=5516997571842
SECRETS_SCAN_ENABLED=false
```

---

## Proximo Passo URGENTE

### Resolver timeout 504

**Opcao A: Background Functions (recomendada)**
- Renomear arquivo para `analyze-profile-background.js`
- Netlify Background Functions tem timeout de 15 minutos
- Frontend precisa fazer polling para saber quando terminou

**Opcao B: Quebrar em etapas**
- Funcao 1: Recebe imagens, salva em storage, retorna ID
- Funcao 2: Claude analisa (chamada separada)
- Funcao 3: Gera PDF e envia emails

**Opcao C: Aumentar timeout**
- Netlify Pro tem timeout de 26 segundos (free = 10s)
- Pode ser suficiente se Claude responder rapido

---

## Fluxo da Aplicacao

```
[Form] → Usuario sobe screenshots do perfil
   ↓
[Loading] → Frontend envia base64 para /.netlify/functions/analyze-profile
   ↓
[Claude] → IA analisa imagens (retorna JSON)
   ↓
[PDF] → jsPDF gera PDF com branding
   ↓
[Email] → Nodemailer envia para gerencia + usuario (NAO-FATAL se falhar)
   ↓
[Sheets] → Google Sheets API salva lead (NAO-FATAL se falhar)
   ↓
[Success] → Mostra 50% resumido + botao WhatsApp
   ↓
[WhatsApp] → Link pre-preenchido leva para contato com equipe
```

---

## Historico de Erros Resolvidos

| Data       | Erro                          | Causa                                    | Fix                                |
|------------|-------------------------------|------------------------------------------|------------------------------------|
| 2026-04-09 | git push falha                | Sem SSH key/token                        | Token pessoal no URL do remote     |
| 2026-04-09 | Exposed secrets detected      | Valores de env em .md e .env.example     | SECRETS_SCAN_ENABLED=false         |
| 2026-04-09 | Claude 404                    | Modelo inexistente                       | Trocar para modelo correto         |
| 2026-04-09 | PDF sem dados (score 0)       | Imagens File nao serializaveis           | Converter para base64 no frontend  |
| 2026-04-10 | Claude 400                    | Payload muito grande ou formato errado   | Limitar imagens + SDK oficial      |
| 2026-04-10 | Erro conectar servidor        | ESM/CJS conflito + deps quebradas        | Reescrita completa em ESM puro     |
| 2026-04-10 | 504 Gateway Timeout           | Funcao leva >10s (limite free do Netlify)| PENDENTE - background functions    |
