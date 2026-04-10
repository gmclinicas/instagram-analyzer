import { getStore } from '@netlify/blobs';

// Funcao regular - recebe request, salva dados, retorna jobId imediatamente
export const handler = async (event) => {
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
      return { statusCode: 400, headers, body: JSON.stringify({ status: 'error', error: 'Campos obrigatorios faltando' }) };
    }

    if (!images || images.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ status: 'error', error: 'Envie pelo menos uma imagem' }) };
    }

    // Gerar job ID unico
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Salvar dados no Blobs para a background function processar
    const store = getStore('analysis-jobs');
    await store.setJSON(jobId, {
      status: 'processing',
      input: { name, email, whatsapp, consultoria, images },
      createdAt: new Date().toISOString()
    });

    console.log(`[JOB ${jobId}] Criado - ${name} (${email}), ${images.length} imagens`);

    // Disparar background function via fetch interno
    const siteUrl = process.env.URL || process.env.DEPLOY_URL || 'https://analisadordeposicionamento.netlify.app';
    fetch(`${siteUrl}/.netlify/functions/process-analysis-background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId })
    }).catch(err => console.error('Erro ao disparar background:', err.message));

    // Retorna imediatamente com o jobId
    return {
      statusCode: 202, headers,
      body: JSON.stringify({ status: 'processing', jobId, message: 'Analise iniciada!' })
    };

  } catch (error) {
    console.error('[ERROR]', error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ status: 'error', error: error.message }) };
  }
};
