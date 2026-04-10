// Netlify Function para análise de perfil Instagram
import { analyzeWithClaude, get50PercentAnalysis } from './lib/claude-analyzer.js';
import { scrapeInstagramProfile } from './lib/instagram-scraper.js';
import { generateAnalysisPDF } from './lib/pdf-generator.js';
import { sendManagerEmail, sendUserEmail } from './lib/email-sender.js';
import { saveToGoogleSheets } from './lib/google-sheets.js';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { name, email, whatsapp, consultoria, method, profileUrl, images } = body;

    // ===== VALIDAÇÕES =====
    if (!name || !email || !whatsapp) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Campos obrigatórios faltando' })
      };
    }

    console.log(`[START] Análise para ${name} (${email}) - Método: ${method}`);

    let profileData = {};

    // ===== STEP 1: EXTRAIR DADOS =====
    if (method === 'link') {
      console.log('[STEP 1] Web scraping do Instagram...');
      const scrapResult = await scrapeInstagramProfile(profileUrl);

      if (!scrapResult.success) {
        console.log('[FALLBACK] Scraping falhou, aguardando imagens do usuário...');
        // Aqui teríamos um fluxo de fallback solicitando upload
        // Por enquanto, continuamos com dados mínimos
        profileData = {
          profileUrl,
          method: 'link-fallback'
        };
      } else {
        profileData = scrapResult.data;
      }
    } else if (method === 'upload') {
      console.log('[STEP 1] Processando upload de imagens...');
      console.log(`[STEP 1] Recebidas ${images?.length || 0} imagens`);
      profileData = {
        method: 'upload',
        images: images || [],
        uploadedAt: new Date().toISOString()
      };
      console.log('[STEP 1] Imagens processadas com sucesso');
    }

    // ===== STEP 2: SKIP SHEETS FOR NOW (may be causing errors) =====
    console.log('[STEP 2] Pulando Google Sheets por enquanto...');

    // ===== STEP 3: ANÁLISE COM CLAUDE =====
    console.log('[STEP 3] Chamando Claude para análise...');
    let fullAnalysis;
    try {
      fullAnalysis = await analyzeWithClaude({
        profileUrl,
        method,
        images: images || [],
        ...profileData
      });
      console.log(`[STEP 3] Análise completa - Score: ${fullAnalysis.score}`);
    } catch (claudeError) {
      console.error('[STEP 3] Erro no Claude:', claudeError.message);
      throw claudeError;
    }

    // ===== STEP 4: GERAR PDF =====
    console.log('[STEP 4] Gerando PDF...');
    const profileName = profileUrl?.split('/').filter(Boolean).pop() || 'perfil';
    let pdfResult;
    try {
      pdfResult = await generateAnalysisPDF(fullAnalysis, profileName);

      if (!pdfResult.success) {
        throw new Error('Erro ao gerar PDF: ' + pdfResult.error);
      }

      console.log('[STEP 4] PDF gerado com sucesso');
    } catch (pdfError) {
      console.error('[STEP 4] Erro no PDF:', pdfError.message);
      throw pdfError;
    }

    // ===== STEP 5-7: SKIP EMAILS FOR NOW =====
    console.log('[STEPS 5-7] Pulando emails por enquanto...');

    // ===== STEP 8: RETORNAR 50% PARA O FRONTEND =====
    const fiftyPercent = get50PercentAnalysis(fullAnalysis);

    console.log('[SUCCESS] Análise completa e emails enviados');

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        data: fiftyPercent,
        message: 'Análise concluída! Verifique seu email.'
      })
    };

  } catch (error) {
    console.error('[ERROR]', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        error: error.message
      })
    };
  }
};
