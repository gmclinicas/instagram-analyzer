import { getStore } from '@netlify/blobs';

function getBlobStore() {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;
  if (siteID && token) {
    return getStore({ name: 'analysis-jobs', siteID, token });
  }
  return getStore('analysis-jobs');
}

// Funcao regular - frontend faz polling aqui para verificar resultado
export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const jobId = event.queryStringParameters?.jobId;

    if (!jobId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'jobId obrigatorio' }) };
    }

    const store = getBlobStore();
    const jobData = await store.get(jobId, { type: 'json' });

    if (!jobData) {
      return { statusCode: 404, headers, body: JSON.stringify({ status: 'not_found' }) };
    }

    // Se ainda esta processando, retorna status
    if (jobData.status === 'processing') {
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'processing' }) };
    }

    // Se deu erro
    if (jobData.status === 'error') {
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'error', error: jobData.error }) };
    }

    // Se completou, retorna resultado
    if (jobData.status === 'completed') {
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ status: 'completed', data: jobData.result })
      };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ status: jobData.status || 'unknown' }) };

  } catch (error) {
    console.error('[CHECK] Erro:', error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ status: 'error', error: error.message }) };
  }
};
