import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateAnalysisPDF(analysis, profileName) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Cores
    const primaryColor = [74, 144, 226];
    const successColor = [76, 175, 80];
    const darkColor = [51, 51, 51];
    const lightGray = [240, 240, 240];

    // Função helper para adicionar texto com quebra de linha
    const addText = (text, x, y, options = {}) => {
      const lines = doc.splitTextToSize(text, contentWidth - (options.indent || 0));
      doc.text(lines, x, y, options);
      return y + (lines.length * (options.lineHeight || 5)) + (options.spacing || 0);
    };

    // ===== CAPA =====
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 80, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.text('📊 ANÁLISE DE POSICIONAMENTO', margin, 30);

    doc.setFontSize(14);
    doc.text(`Instagram: ${profileName}`, margin, 50);

    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, 65);

    yPosition = 90;
    doc.setTextColor(...darkColor);

    // ===== SCORE =====
    doc.setFontSize(20);
    doc.setTextColor(...successColor);
    doc.text(`SCORE: ${analysis.score}/10`, margin, yPosition);

    yPosition += 15;
    doc.setTextColor(...darkColor);

    // ===== RESUMO EXECUTIVO =====
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text('RESUMO EXECUTIVO', margin, yPosition);

    yPosition += 10;
    doc.setFontSize(11);
    doc.setTextColor(...darkColor);
    yPosition = addText(analysis.percepcaoImediata.primeiros5Segundos, margin, yPosition, {
      spacing: 5,
      lineHeight: 5
    });

    // ===== PERCEPÇÃO DE PREÇO =====
    yPosition += 5;
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('PERCEPÇÃO DE PREÇO', margin, yPosition);

    yPosition += 8;
    doc.setFontSize(10);
    doc.setTextColor(...darkColor);
    yPosition = addText(analysis.percepcaoImediata.percepcaoDePreco, margin, yPosition, {
      spacing: 5
    });

    // ===== CONTRADIÇÕES =====
    if (analysis.percepcaoImediata.contradicoesVisiveis.length > 0) {
      yPosition += 5;
      doc.setFontSize(12);
      doc.setTextColor(...primaryColor);
      doc.text('CONTRADIÇÕES VISÍVEIS', margin, yPosition);

      yPosition += 8;
      doc.setFontSize(10);
      doc.setTextColor(...darkColor);

      analysis.percepcaoImediata.contradicoesVisiveis.forEach(contradicao => {
        if (yPosition > pageHeight - margin - 10) {
          doc.addPage();
          yPosition = margin;
        }
        yPosition = addText(`• ${contradicao}`, margin, yPosition, { spacing: 3 });
      });
    }

    // ===== DIAGNÓSTICO DE PRODUÇÃO =====
    if (yPosition > pageHeight - margin - 30) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text('DIAGNÓSTICO DE PRODUÇÃO', margin, yPosition);

    yPosition += 10;
    doc.setFontSize(11);
    doc.setTextColor(...darkColor);
    yPosition = addText(`Qualidade Técnica: ${analysis.diagnosticoDeProducao.qualidadeTecnica}`, margin, yPosition, {
      spacing: 4
    });

    yPosition = addText(`Consistência de Audiência: ${analysis.diagnosticoDeProducao.consistenciaDeAudiencia}`, margin, yPosition, {
      spacing: 4
    });

    yPosition = addText(`Consistência Visual: ${analysis.diagnosticoDeProducao.consistenciaVisual}`, margin, yPosition, {
      spacing: 4
    });

    // ===== RECOMENDAÇÕES =====
    if (yPosition > pageHeight - margin - 40) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text('RECOMENDAÇÕES', margin, yPosition);

    yPosition += 10;
    doc.setFontSize(10);
    doc.setTextColor(...darkColor);

    analysis.recomendacoes.forEach((rec, index) => {
      if (yPosition > pageHeight - margin - 20) {
        doc.addPage();
        yPosition = margin;
      }

      // Prioridade em cores
      let priorColor = [200, 200, 200];
      if (rec.prioridade === 'alta') priorColor = [220, 53, 69];
      if (rec.prioridade === 'media') priorColor = [255, 193, 7];
      if (rec.prioridade === 'baixa') priorColor = [76, 175, 80];

      doc.setTextColor(...priorColor);
      doc.text(`${index + 1}. ${rec.titulo} [${rec.prioridade.toUpperCase()}]`, margin, yPosition);

      yPosition += 5;
      doc.setTextColor(...darkColor);
      yPosition = addText(`Problema: ${rec.problema}`, margin + 2, yPosition, { spacing: 2 });
      yPosition = addText(`Ação: ${rec.acao}`, margin + 2, yPosition, { spacing: 3 });
    });

    // ===== RODAPÉ EM TODAS AS PÁGINAS =====
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        'Análise feita pelo Analista de Posicionamento GM Clínicas | @gmclinicas | https://www.instagram.com/gmclinicas/',
        margin,
        pageHeight - 8
      );
    }

    // ===== CONCLUSÃO (última página) =====
    doc.addPage();
    yPosition = margin;

    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text('CONCLUSÃO', margin, yPosition);

    yPosition += 10;
    doc.setFontSize(11);
    doc.setTextColor(...darkColor);
    yPosition = addText(analysis.conclusao, margin, yPosition, { spacing: 5 });

    // Gerar PDF como string base64
    const pdfBase64 = doc.output('datauristring').split(',')[1];

    return {
      success: true,
      pdf: pdfBase64,
      fileName: `analise-${profileName}-${Date.now()}.pdf`
    };

  } catch (error) {
    console.error('Erro ao gerar PDF:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
