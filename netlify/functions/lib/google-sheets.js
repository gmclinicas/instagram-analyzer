import { google } from 'googleapis';

export async function saveToGoogleSheets(formData, analysisScore, status = 'Concluído') {
  try {
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const sheetsId = process.env.GOOGLE_SHEETS_ID;

    if (!apiKey || !sheetsId) {
      console.error('Google Sheets credentials não configurados');
      return {
        success: false,
        error: 'Google Sheets credentials não configurados'
      };
    }

    const sheets = google.sheets({
      version: 'v4',
      auth: apiKey
    });

    // Dados para inserir
    const row = [
      new Date().toLocaleString('pt-BR'),
      formData.name,
      formData.email,
      formData.whatsapp,
      formData.consultoria === 'sim' ? 'Sim' : 'Não',
      formData.method === 'link' ? 'Link' : 'Upload',
      formData.profileUrl || 'Upload de imagens',
      analysisScore ? analysisScore.toFixed(1) : 'N/A',
      status
    ];

    // Adicionar à próxima linha disponível
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetsId,
      range: 'Sheet1!A:I',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [row]
      }
    });

    console.log(`Dados salvos no Google Sheets: ${result.data.updates.updatedRows} linha(s) adicionada(s)`);

    return {
      success: true,
      message: 'Dados salvos no Google Sheets com sucesso'
    };

  } catch (error) {
    console.error('Erro ao salvar no Google Sheets:', error.message);

    // Fallback: log para auditoria
    console.log('FALLBACK - Dados que deveriam estar no Sheets:', JSON.stringify(formData, null, 2));

    return {
      success: false,
      error: error.message,
      note: 'Dados foram registrados em log para auditoria'
    };
  }
}

// Função alternativa usando API key diretamente (sem autenticação OAuth)
export async function saveToGoogleSheetsSimple(formData, analysisScore, status = 'Concluído') {
  try {
    const sheetsId = process.env.GOOGLE_SHEETS_ID;
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

    if (!sheetsId || !apiKey) {
      console.error('Google Sheets config faltando');
      return { success: false, error: 'Config faltando' };
    }

    const row = [
      new Date().toLocaleString('pt-BR'),
      formData.name,
      formData.email,
      formData.whatsapp,
      formData.consultoria === 'sim' ? 'Sim' : 'Não',
      formData.method === 'link' ? 'Link' : 'Upload',
      formData.profileUrl || 'Upload de imagens',
      analysisScore ? analysisScore.toFixed(1) : 'N/A',
      status
    ];

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/'Sheet1'!A:I:append?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [row],
          majorDimension: 'ROWS'
        })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Dados salvos no Google Sheets');
    return { success: true, message: 'Dados salvos com sucesso' };

  } catch (error) {
    console.error('Erro ao salvar no Google Sheets:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
