import axios from 'axios';

const CLAUDE_PROMPT = `Você é um consultor de posicionamento digital especializado em clínicas odontológicas e profissionais de saúde estética brasileiros de alto ticket.

Analise o seguinte perfil do Instagram e retorne APENAS JSON válido (sem markdown, sem blocos de código):

{
  "score": <número de 0 a 10, uma casa decimal>,
  "percepcaoImediata": {
    "primeiros5Segundos": <string — descreva em 2 parágrafos o que uma pessoa sente ao chegar nesse perfil>,
    "percepcaoDePreco": <string — 1 parágrafo sobre a faixa de preço percebida>,
    "contradicoesVisiveis": <array de strings — contradições que enfraquecem o posicionamento>
  },
  "perfilDoPacienteAtual": {
    "arquetipo": <string — nome do arquétipo>,
    "descricao": <string — 2 parágrafos sobre quem se conecta com esse perfil>,
    "sequenciaDeConfianca": <string — identidade pessoal → prova de sucesso → autoridade técnica>,
    "alertasComportamentais": <array de strings>
  },
  "diagnosticoDeProducao": {
    "qualidadeTecnica": <string — câmera, iluminação, edição, áudio>,
    "consistenciaDeAudiencia": <string>,
    "consistenciaVisual": <string>
  },
  "sinaisDeAltoTicket": {
    "presentes": <array de strings>,
    "ausentes": <array de strings>,
    "ruidos": <array de strings>
  },
  "recomendacoes": [
    {
      "titulo": <string>,
      "problema": <string>,
      "acao": <string>,
      "prioridade": <"alta" | "media" | "baixa">,
      "impacto": <string>
    }
  ],
  "conclusao": <string — 1 parágrafo direto ao dono do perfil>
}

DADOS DO PERFIL RECEBIDO:
`;

export async function analyzeWithClaude(profileData) {
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    throw new Error('CLAUDE_API_KEY não configurada');
  }

  // Montar mensagem com dados + imagens
  const content = [
    {
      type: 'text',
      text: CLAUDE_PROMPT + JSON.stringify(profileData, null, 2)
    }
  ];

  // Se houver imagens, adicionar ao prompt
  if (profileData.images && profileData.images.length > 0) {
    for (const image of profileData.images) {
      if (image.base64) {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: image.base64
          }
        });
      }
    }
  }

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: content
          }
        ]
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    // Extrair o texto da resposta
    const analysisText = response.data.content[0].text;

    // Tentar fazer parse do JSON
    try {
      const analysis = JSON.parse(analysisText);
      return analysis;
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON do Claude:', parseError);
      // Se falhar, tentar extrair JSON de dentro do texto
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Resposta do Claude não é um JSON válido');
    }

  } catch (error) {
    console.error('Erro ao chamar Claude API:', error.response?.data || error.message);
    throw new Error(`Erro na análise do Claude: ${error.message}`);
  }
}

// Função para extrair 50% do resultado para exibir ao usuário
export function get50PercentAnalysis(fullAnalysis) {
  return {
    score: fullAnalysis.score,
    resumoExecutivo: fullAnalysis.percepcaoImediata.primeiros5Segundos.split('\n')[0],
    percepcaoDePreco: fullAnalysis.percepcaoImediata.percepcaoDePreco,
    insights: [
      `Score: ${fullAnalysis.score}/10`,
      fullAnalysis.perfilDoPacienteAtual.arquetipo,
      fullAnalysis.diagnosticoDeProducao.qualidadeTecnica.split('.')[0],
      fullAnalysis.recomendacoes[0]?.titulo || 'Análise em andamento...'
    ]
  };
}
