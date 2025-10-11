import nodemailer from 'nodemailer';

interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer; contentType: string; }>;
}

function createTransporter() {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

async function sendEmail(mailOptions: MailOptions) {
  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email inviata a: ${mailOptions.to}`);
  } catch (error) {
    console.error(`❌ Errore invio email a ${mailOptions.to}:`, error);
  }
}

interface PaymentConfirmationData {
  name: string;
  email: string;
  phone: string;
  fiscalCode: string;
  serviceName: string;
  serviceDescription: string;
  amount: number;
  stampDuty: number;
  ipAddress?: string;
}

export async function sendPaymentConfirmationToAdmin(data: PaymentConfirmationData, privacyPdf: Buffer | null) {
  const attachments = [];
  let allegatiHtml = '<p style="margin: 0; color: #92400e;">Nessun nuovo modulo privacy compilato.</p>';

  if (privacyPdf) {
    attachments.push({
      filename: `Modulo_Privacy_${data.name.replace(/ /g, '_')}.pdf`,
      content: privacyPdf,
      contentType: 'application/pdf',
    });
    allegatiHtml = '<p style="margin: 0; color: #92400e;">📎 <strong>Allegati:</strong> Modulo privacy compilato.</p>';
  }

  const adminMailOptions: MailOptions = {
    from: `"Biofertility Paga-Ora" <${process.env.GMAIL_USER}>`,
    to: 'centrimanna2@gmail.com',
    subject: `💳 Nuovo Pagamento Ricevuto: ${data.name} - €${data.amount.toFixed(2)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #2563eb; margin-bottom: 20px; border-bottom: 3px solid #2563eb; padding-bottom: 10px;">
            💳 Nuovo Pagamento Ricevuto
          </h1>

          <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1e40af; margin-top: 0; font-size: 18px;">👤 Dati Cliente</h2>
            <p style="margin: 5px 0;"><strong>Nome:</strong> ${data.name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
            <p style="margin: 5px 0;"><strong>Telefono:</strong> ${data.phone || 'N/D'}</p>
            <p style="margin: 5px 0;"><strong>Codice Fiscale:</strong> ${data.fiscalCode || 'N/D'}</p>
          </div>

          <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #15803d; margin-top: 0; font-size: 18px;">💰 Dettagli Pagamento</h2>
            <p style="margin: 5px 0;"><strong>Servizio:</strong> ${data.serviceName}</p>
            <p style="margin: 5px 0;"><strong>Descrizione:</strong> ${data.serviceDescription}</p>
            <p style="margin: 5px 0;"><strong>Importo:</strong> €${data.amount.toFixed(2)}</p>
            ${data.stampDuty > 0 ? `<p style="margin: 5px 0;"><strong>Marca da bollo:</strong> €${data.stampDuty.toFixed(2)}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Totale:</strong> €${(data.amount + data.stampDuty).toFixed(2)}</p>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            ${allegatiHtml}
          </div>
        </div>
      </div>
    `,
    attachments,
  };

  await sendEmail(adminMailOptions);
}

export async function sendPaymentConfirmationToClient(data: PaymentConfirmationData) {
  const firstName = data.name.split(' ')[0];

  const clientMailOptions: MailOptions = {
    from: `"Centro Biofertility" <${process.env.GMAIL_USER}>`,
    to: data.email,
    subject: `✅ Pagamento Confermato - ${data.serviceName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
                      ✅ Pagamento Confermato
                    </h1>
                    <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">
                      Il pagamento è stato completato con successo
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 30px 30px 20px 30px;">
                    <p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin: 0;">
                      Gentile <strong>${firstName}</strong>,
                    </p>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 10px 0 0 0;">
                      La ringraziamo per aver scelto il <strong>Centro Biofertility</strong>. Il suo pagamento è stato ricevuto e confermato.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 0 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 10px; border-left: 4px solid #2563eb;">
                      <tr>
                        <td style="padding: 25px;">
                          <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 20px;">
                            💳 Dettagli del Pagamento
                          </h2>

                          <table width="100%" cellpadding="8" cellspacing="0">
                            <tr>
                              <td style="color: #1e3a8a; font-weight: 600; font-size: 14px;">Servizio:</td>
                              <td style="color: #1e40af; font-size: 14px;"><strong>${data.serviceName}</strong></td>
                            </tr>
                            <tr>
                              <td style="color: #1e3a8a; font-weight: 600; font-size: 14px;">Descrizione:</td>
                              <td style="color: #1e40af; font-size: 14px;">${data.serviceDescription}</td>
                            </tr>
                            <tr>
                              <td style="color: #1e3a8a; font-weight: 600; font-size: 14px;">Importo:</td>
                              <td style="color: #1e40af; font-size: 14px;"><strong>€${data.amount.toFixed(2)}</strong></td>
                            </tr>
                            ${data.stampDuty > 0 ? `
                            <tr>
                              <td style="color: #1e3a8a; font-weight: 600; font-size: 14px;">Marca da bollo:</td>
                              <td style="color: #1e40af; font-size: 14px;">€${data.stampDuty.toFixed(2)}</td>
                            </tr>` : ''}
                            <tr>
                              <td style="color: #1e3a8a; font-weight: 600; font-size: 14px;">Totale pagato:</td>
                              <td style="color: #1e40af; font-size: 14px;"><strong>€${(data.amount + data.stampDuty).toFixed(2)}</strong></td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 20px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
                      <tr>
                        <td style="padding: 20px;">
                          <h3 style="color: #065f46; margin: 0 0 12px 0; font-size: 16px;">
                            ℹ️ Informazioni Importanti
                          </h3>
                          <ul style="color: #047857; margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li>Riceverà a breve la <strong>fattura fiscale</strong> via email</li>
                            <li>Il modulo privacy è stato inviato al centro</li>
                            <li>Per qualsiasi domanda, non esiti a contattarci</li>
                          </ul>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 20px 30px 30px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 8px;">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">
                            📞 Hai domande?
                          </h3>
                          <p style="color: #78350f; margin: 0; font-size: 14px; line-height: 1.6;">
                            Contattaci per qualsiasi informazione:<br>
                            <strong>Email:</strong> centrimanna2@gmail.com<br>
                            <strong>Telefono:</strong> 06 841 5269
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="background-color: #1f2937; padding: 25px 30px; text-align: center;">
                    <p style="color: #9ca3af; margin: 0 0 5px 0; font-size: 14px;">
                      Grazie per la fiducia,
                    </p>
                    <p style="color: #e5e7eb; margin: 0; font-size: 16px; font-weight: 600;">
                      Il Team di Centro Biofertility
                    </p>
                    <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 12px;">
                      Questa è una email automatica, si prega di non rispondere.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await sendEmail(clientMailOptions);
}
