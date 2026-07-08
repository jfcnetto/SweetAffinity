import nodemailer from "nodemailer";

export class EmailService {
  static async sendVerificationEmail(email: string, token: string) {
    const verificationLink = `http://localhost:3000/auth/verify?token=${token}`;
    
    // Mostra o link destacado no console para facilitar o teste local
    console.log("\n==================================================");
    console.log(`✉️ E-mail de confirmação enviado para: ${email}`);
    console.log(`🔗 Link de Verificação: ${verificationLink}`);
    console.log("==================================================\n");

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && apiKey !== "your_resend_api_key" && !apiKey.includes("dummy") && !apiKey.includes("12345")) {
      try {
        const transporter = nodemailer.createTransport({
          host: "smtp.resend.com",
          port: 465,
          secure: true,
          auth: {
            user: "resend",
            pass: apiKey,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || "onboarding@resend.dev",
          to: email,
          subject: "Confirme seu cadastro no Sweet Affinity",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #FF5864;">Sweet Affinity</h2>
              <p>Olá! Para continuar o seu cadastro e começar a conhecer pessoas incríveis, confirme seu endereço de e-mail clicando no link abaixo:</p>
              <p style="margin: 30px 0;">
                <a href="${verificationLink}" style="background-color: #FF5864; color: white; padding: 12px 24px; text-decoration: none; border-radius: 24px; font-weight: bold; display: inline-block;">Confirmar meu E-mail</a>
              </p>
              <p>Se o botão acima não funcionar, copie e cole o link a seguir no seu navegador:</p>
              <p>${verificationLink}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #777;">Este e-mail foi enviado automaticamente. Se você não iniciou este cadastro, por favor desconsidere.</p>
            </div>
          `,
        });
      } catch (err) {
        console.error("Erro ao enviar e-mail via Resend:", err);
      }
    }
  }
}
