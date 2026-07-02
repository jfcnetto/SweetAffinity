import nodemailer from 'nodemailer';

// Vamos criar um serviço de Email configurado para Ethereal (Testes)
// Em produção, você apenas trocaria essas env vars para as do seu SMTP comum
let transporter: nodemailer.Transporter;

async function initTransporter() {
  if (transporter) return transporter;

  const isProd = process.env.NODE_ENV === 'production';
  
  if (isProd && process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true para 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Modo de Desenvolvimento (Mock / Ethereal Email)
    console.log('[EmailService] Criando conta de teste no Ethereal Email...');
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  
  return transporter;
}

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
  try {
    const mailer = await initTransporter();
    
    const info = await mailer.sendMail({
      from: '"Sweet Affinity" <noreply@sweetaffinity.com>',
      to,
      subject,
      html,
    });

    console.log(`✉️ Email enviado para ${to}: ${subject}`);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔗 Preview do Email: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return false;
  }
}
