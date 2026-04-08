import nodemailer from 'nodemailer';

export async function sendManagerEmail(analysisData, pdfBase64, fileName) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const managerEmail = process.env.MANAGER_EMAIL || 'gerencia@gmclinicas.com.br';

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: managerEmail,
      subject: `Nova Análise Concluída - ${analysisData.profileName}`,
      html: `
        <h2>📊 Nova Análise de Posicionamento Concluída</h2>

        <h3>Dados do Contato:</h3>
        <ul>
          <li><strong>Nome:</strong> ${analysisData.name}</li>
          <li><strong>Email:</strong> ${analysisData.email}</li>
          <li><strong>WhatsApp:</strong> ${analysisData.whatsapp}</li>
          <li><strong>Deseja consultoria:</strong> ${analysisData.consultoria === 'sim' ? '✅ SIM' : '❌ NÃO'}</li>
        </ul>

        <h3>Perfil Analisado:</h3>
        <ul>
          <li><strong>Método:</strong> ${analysisData.method === 'link' ? 'Web Scraping (Link)' : 'Upload de Screenshots'}</li>
          <li><strong>Perfil/URL:</strong> ${analysisData.profileUrl || 'Upload de imagens'}</li>
          <li><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</li>
        </ul>

        <h3>Resultado:</h3>
        <ul>
          <li><strong>Score:</strong> ${analysisData.score}/10</li>
          <li><strong>Status:</strong> ✅ Pronto para enviar ao cliente</li>
        </ul>

        <p style="background: #f0f0f0; padding: 15px; border-radius: 5px;">
          <strong>📎 PDF Completo (100% da análise):</strong> Anexado neste email.
          Pronto para copiar e compartilhar com o cliente via WhatsApp ou email.
        </p>

        <hr/>
        <p style="color: #999; font-size: 12px;">
          Este é um email automático do Analista de Posicionamento GM Clínicas.
        </p>
      `,
      attachments: [
        {
          filename: fileName,
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email enviado para gerência: ${info.response}`);

    return {
      success: true,
      message: 'Email enviado para gerência com sucesso'
    };

  } catch (error) {
    console.error('Erro ao enviar email para gerência:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function sendUserEmail(email, name, pdfBase64, fileName) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: '📊 Sua Análise de Perfil está pronta!',
      html: `
        <h2>Olá ${name}! 👋</h2>

        <p>Sua análise de posicionamento do Instagram está pronta!</p>

        <p>Em breve você receberá a análise completa via WhatsApp da equipe da GM Clínicas.</p>

        <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;">
            <strong>💡 Próximo passo:</strong> Abra a conversa com nosso especialista no WhatsApp
            para receber a análise detalhada e discutir as melhores estratégias para seu perfil.
          </p>
        </div>

        <p>Estamos aqui para ajudar! 🚀</p>

        <p>
          <strong>GM Clínicas</strong><br/>
          Analista de Posicionamento Instagram<br/>
          📱 WhatsApp: (16) 99757-1842<br/>
          📱 Instagram: <a href="https://www.instagram.com/gmclinicas/">@gmclinicas</a>
        </p>
      `,
      attachments: [
        {
          filename: fileName,
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email enviado para usuário (${email}): ${info.response}`);

    return {
      success: true,
      message: 'Email enviado para usuário com sucesso'
    };

  } catch (error) {
    console.error('Erro ao enviar email para usuário:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
