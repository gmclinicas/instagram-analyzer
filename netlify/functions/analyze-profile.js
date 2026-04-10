import Anthropic from '@anthropic-ai/sdk';
import { jsPDF } from 'jspdf';
import nodemailer from 'nodemailer';

// ==================== CLAUDE PROMPT ====================
const CLAUDE_PROMPT = `Você é um consultor de posicionamento digital especializado em clínicas odontológicas e profissionais de saúde estética brasileiros de alto ticket.

Analise as imagens do perfil do Instagram enviadas e retorne APENAS JSON válido (sem markdown, sem blocos de código, sem texto antes ou depois):

{
  "score": <número de 0 a 10, uma casa decimal>,
  "percepcaoImediata": {
    "primeiros5Segundos": "<string — descreva em 2 parágrafos o que uma pessoa sente ao chegar nesse perfil>",
    "percepcaoDePreco": "<string — 1 parágrafo sobre a faixa de preço percebida>",
    "contradicoesVisiveis": ["<contradição 1>", "<contradição 2>"]
  },
  "perfilDoPacienteAtual": {
    "arquetipo": "<string — nome do arquétipo>",
    "descricao": "<string — 2 parágrafos sobre quem se conecta com esse perfil>",
    "sequenciaDeConfianca": "<string — identidade pessoal → prova de sucesso → autoridade técnica>",
    "alertasComportamentais": ["<alerta 1>"]
  },
  "diagnosticoDeProducao": {
    "qualidadeTecnica": "<string — câmera, iluminação, edição, áudio>",
    "consistenciaDeAudiencia": "<string>",
    "consistenciaVisual": "<string>"
  },
  "sinaisDeAltoTicket": {
    "presentes": ["<sinal 1>"],
    "ausentes": ["<sinal 1>"],
    "ruidos": ["<ruido 1>"]
  },
  "recomendacoes": [
    {
      "titulo": "<string>",
      "problema": "<string>",
      "acao": "<string>",
      "prioridade": "alta",
      "impacto": "<string>"
    }
  ],
  "conclusao": "<string — 1 parágrafo direto ao dono do perfil>"
}

IMPORTANTE: Retorne APENAS o JSON. Nada mais.`;

// ==================== HANDLER ====================
export const handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { name, email, whatsapp, consultoria, images } = body;

    if (!name || !email || !whatsapp) {
      return {
        statusCode: 400, headers,
        body: JSON.stringify({ status: 'error', error: 'Campos obrigatórios faltando' })
      };
    }

    console.log(`[START] Análise para ${name} (${email})`);
    console.log(`[INFO] Imagens recebidas: ${images?.length || 0}`);

    // ===== STEP 1: ANÁLISE COM CLAUDE =====
    console.log('[STEP 1] Chamando Claude para análise...');
    const fullAnalysis = await callClaude(images || []);
    console.log(`[STEP 1] Score: ${fullAnalysis.score}`);

    // ===== STEP 2: GERAR PDF =====
    console.log('[STEP 2] Gerando PDF...');
    const pdfResult = generatePDF(fullAnalysis, name);
    console.log('[STEP 2] PDF gerado');

    // ===== STEP 3: ENVIAR EMAILS =====
    console.log('[STEP 3] Enviando emails...');
    try {
      await sendEmails({ name, email, whatsapp, consultoria }, fullAnalysis, pdfResult);
      console.log('[STEP 3] Emails enviados');
    } catch (emailErr) {
      console.error('[STEP 3] Erro nos emails (não-fatal):', emailErr.message);
    }

    // ===== STEP 4: GOOGLE SHEETS =====
    console.log('[STEP 4] Salvando no Google Sheets...');
    try {
      await saveToSheets({ name, email, whatsapp, consultoria }, fullAnalysis.score);
      console.log('[STEP 4] Sheets atualizado');
    } catch (sheetsErr) {
      console.error('[STEP 4] Erro no Sheets (não-fatal):', sheetsErr.message);
    }

    // ===== RETORNAR 50% PARA O FRONTEND =====
    const preview = {
      score: fullAnalysis.score,
      resumoExecutivo: fullAnalysis.percepcaoImediata?.primeiros5Segundos?.split('.').slice(0, 2).join('.') + '.' || 'Análise concluída.',
      percepcaoDePreco: fullAnalysis.percepcaoImediata?.percepcaoDePreco || '',
      insights: [
        `Score: ${fullAnalysis.score}/10`,
        fullAnalysis.perfilDoPacienteAtual?.arquetipo || 'Perfil analisado',
        fullAnalysis.diagnosticoDeProducao?.qualidadeTecnica?.split('.')[0] || 'Qualidade avaliada',
        fullAnalysis.recomendacoes?.[0]?.titulo || 'Recomendações disponíveis'
      ]
    };

    console.log('[SUCCESS] Tudo concluído!');

    return {
      statusCode: 200, headers,
      body: JSON.stringify({ status: 'success', data: preview, message: 'Análise concluída!' })
    };

  } catch (error) {
    console.error('[ERROR]', error.message);
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ status: 'error', error: error.message })
    };
  }
};

// ==================== CLAUDE API ====================
async function callClaude(images) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('CLAUDE_API_KEY não configurada');

  const client = new Anthropic({ apiKey });

  // Montar content com texto + imagens
  const content = [];

  // Adicionar até 5 imagens
  const maxImages = Math.min(images.length, 5);
  for (let i = 0; i < maxImages; i++) {
    const img = images[i];
    if (img.base64) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.type || 'image/jpeg',
          data: img.base64
        }
      });
    }
  }

  content.push({ type: 'text', text: CLAUDE_PROMPT });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content }]
  });

  const responseText = message.content[0].text;

  // Parse JSON
  try {
    return JSON.parse(responseText);
  } catch {
    const match = responseText.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Resposta do Claude não é JSON válido');
  }
}

// ==================== PDF GENERATOR ====================
function generatePDF(analysis, profileName) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  const blue = [74, 144, 226];
  const green = [76, 175, 80];
  const dark = [51, 51, 51];

  const addWrapped = (text, x, startY, fontSize = 10) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(String(text || ''), contentWidth);
    for (const line of lines) {
      if (startY > pageHeight - 20) { doc.addPage(); startY = margin; }
      doc.text(line, x, startY);
      startY += fontSize * 0.5;
    }
    return startY + 3;
  };

  const addSection = (title, startY) => {
    if (startY > pageHeight - 40) { doc.addPage(); startY = margin; }
    doc.setFontSize(14);
    doc.setTextColor(...blue);
    doc.text(title, margin, startY);
    startY += 10;
    doc.setTextColor(...dark);
    return startY;
  };

  // CAPA
  doc.setFillColor(...blue);
  doc.rect(0, 0, pageWidth, 80, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('ANALISE DE POSICIONAMENTO', margin, 30);
  doc.setFontSize(14);
  doc.text(`Instagram: ${profileName}`, margin, 50);
  doc.setFontSize(10);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, 65);

  // SCORE
  y = 95;
  doc.setFontSize(22);
  doc.setTextColor(...green);
  doc.text(`SCORE: ${analysis.score}/10`, margin, y);
  y += 15;
  doc.setTextColor(...dark);

  // RESUMO
  y = addSection('RESUMO EXECUTIVO', y);
  y = addWrapped(analysis.percepcaoImediata?.primeiros5Segundos, margin, y, 11);

  // PRECO
  y = addSection('PERCEPCAO DE PRECO', y);
  y = addWrapped(analysis.percepcaoImediata?.percepcaoDePreco, margin, y, 10);

  // CONTRADICOES
  if (analysis.percepcaoImediata?.contradicoesVisiveis?.length > 0) {
    y = addSection('CONTRADICOES VISIVEIS', y);
    for (const c of analysis.percepcaoImediata.contradicoesVisiveis) {
      y = addWrapped(`- ${c}`, margin, y, 10);
    }
  }

  // DIAGNOSTICO
  y = addSection('DIAGNOSTICO DE PRODUCAO', y);
  y = addWrapped(`Qualidade Tecnica: ${analysis.diagnosticoDeProducao?.qualidadeTecnica}`, margin, y);
  y = addWrapped(`Consistencia de Audiencia: ${analysis.diagnosticoDeProducao?.consistenciaDeAudiencia}`, margin, y);
  y = addWrapped(`Consistencia Visual: ${analysis.diagnosticoDeProducao?.consistenciaVisual}`, margin, y);

  // RECOMENDACOES
  y = addSection('RECOMENDACOES', y);
  (analysis.recomendacoes || []).forEach((rec, i) => {
    if (y > pageHeight - 30) { doc.addPage(); y = margin; }
    doc.setFontSize(11);
    const priorColor = rec.prioridade === 'alta' ? [220, 53, 69] : rec.prioridade === 'media' ? [255, 153, 0] : [76, 175, 80];
    doc.setTextColor(...priorColor);
    doc.text(`${i + 1}. ${rec.titulo} [${(rec.prioridade || '').toUpperCase()}]`, margin, y);
    y += 6;
    doc.setTextColor(...dark);
    y = addWrapped(`Problema: ${rec.problema}`, margin + 3, y, 10);
    y = addWrapped(`Acao: ${rec.acao}`, margin + 3, y, 10);
  });

  // CONCLUSAO
  doc.addPage();
  y = margin;
  y = addSection('CONCLUSAO', y);
  y = addWrapped(analysis.conclusao, margin, y, 11);

  // RODAPE
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Analise feita pelo Analista de Posicionamento GM Clinicas | @gmclinicas', margin, pageHeight - 8);
  }

  const pdfBase64 = doc.output('datauristring').split(',')[1];
  return { pdf: pdfBase64, fileName: `analise-${profileName}-${Date.now()}.pdf` };
}

// ==================== EMAIL SENDER ====================
async function sendEmails(formData, analysis, pdfResult) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const managerEmail = process.env.MANAGER_EMAIL;

  if (!host || !user || !pass) {
    console.log('[EMAIL] SMTP não configurado, pulando emails');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user, pass }
  });

  const pdfBuffer = Buffer.from(pdfResult.pdf, 'base64');

  // Email para gerencia
  if (managerEmail) {
    await transporter.sendMail({
      from: user,
      to: managerEmail,
      subject: `Nova Analise - ${formData.name}`,
      html: `
        <h2>Nova Analise de Posicionamento</h2>
        <p><strong>Nome:</strong> ${formData.name}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>WhatsApp:</strong> ${formData.whatsapp}</p>
        <p><strong>Consultoria:</strong> ${formData.consultoria === 'sim' ? 'SIM' : 'NAO'}</p>
        <p><strong>Score:</strong> ${analysis.score}/10</p>
        <p>PDF em anexo.</p>
      `,
      attachments: [{ filename: pdfResult.fileName, content: pdfBuffer, contentType: 'application/pdf' }]
    });
    console.log('[EMAIL] Enviado para gerencia');
  }

  // Email para usuario
  await transporter.sendMail({
    from: user,
    to: formData.email,
    subject: 'Sua Analise de Perfil esta pronta!',
    html: `
      <h2>Ola ${formData.name}!</h2>
      <p>Sua analise de posicionamento do Instagram esta pronta!</p>
      <p>Em breve voce recebera a analise completa via WhatsApp da equipe da GM Clinicas.</p>
      <p>PDF em anexo.</p>
      <p><strong>GM Clinicas</strong> | @gmclinicas</p>
    `,
    attachments: [{ filename: pdfResult.fileName, content: pdfBuffer, contentType: 'application/pdf' }]
  });
  console.log('[EMAIL] Enviado para usuario');
}

// ==================== GOOGLE SHEETS ====================
async function saveToSheets(formData, score) {
  const sheetsId = process.env.GOOGLE_SHEETS_ID;
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  if (!sheetsId || !apiKey) {
    console.log('[SHEETS] Credenciais nao configuradas, pulando');
    return;
  }

  const row = [
    new Date().toLocaleString('pt-BR'),
    formData.name,
    formData.email,
    formData.whatsapp,
    formData.consultoria === 'sim' ? 'Sim' : 'Nao',
    'Upload',
    score?.toFixed?.(1) || 'N/A',
    'Concluido'
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/Sheet1!A:H:append?valueInputOption=USER_ENTERED&key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [row] })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Sheets API error: ${response.status} - ${err}`);
  }
  console.log('[SHEETS] Dados salvos');
}
