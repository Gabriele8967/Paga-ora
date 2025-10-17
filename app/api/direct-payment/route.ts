import { NextRequest, NextResponse } from 'next/server';
import { createAndSendInvoice, calculateStampDuty } from '@/lib/fattureincloud';
import { sendPaymentConfirmationToAdmin, sendPaymentConfirmationToClient, sendInvoiceToClient } from '@/lib/email';
import { generatePaymentPrivacyPdf } from '@/lib/pdf';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      amount,
      serviceName,
      serviceDescription,
      name,
      email,
      phone,
      fiscalCode,
      birthDate,
      luogoNascita,
      indirizzo,
      cap,
      citta,
      provincia,
      paymentMethod,
      generatePrivacy,
      hasCompiledPrivacy,
      profession,
      documentNumber,
      documentExpiry,
      documentFrontData,
      documentBackData,
      // Dati partner
      includePartner,
      partnerName,
      partnerEmail,
      partnerPhone,
      partnerFiscalCode,
      partnerBirthDate,
      partnerLuogoNascita,
      partnerIndirizzo,
      partnerCap,
      partnerCitta,
      partnerProvincia,
      partnerProfession,
      partnerDocumentNumber,
      partnerDocumentExpiry,
      partnerDocumentFrontData,
      partnerDocumentBackData,
    } = body;

    if (!amount || !serviceName || !name || !email || !phone || !fiscalCode || !paymentMethod) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    console.log(`💰 [DIRECT-PAYMENT] ${paymentMethod.toUpperCase()}: €${amount} - ${name}`);

    // Ottieni l'IP address del cliente
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // 1. Genera PDF privacy se richiesto
    let privacyPdf: Buffer | null = null;
    const documentsAttachments: Array<{ filename: string; content: Buffer }> = [];

    if (generatePrivacy) {
      try {
        const pdfUint8Array = await generatePaymentPrivacyPdf({
          name,
          email,
          phone,
          fiscalCode,
          birthDate,
          luogoNascita,
          indirizzo,
          cap,
          citta,
          provincia,
          ipAddress,
          // Campi aggiuntivi per privacy completa
          profession,
          documentNumber,
          documentExpiry,
        });
        privacyPdf = Buffer.from(pdfUint8Array);
        console.log('✅ PDF privacy generato');
      } catch (error) {
        console.error('❌ Errore generazione PDF privacy:', error);
        // Continua senza privacy PDF
      }
    }

    // 2. Prepara allegati documenti paziente principale se presenti
    if (!hasCompiledPrivacy && documentFrontData && documentBackData) {
      try {
        // Converti base64 in buffer
        const frontBuffer = Buffer.from(documentFrontData.split(',')[1] || documentFrontData, 'base64');
        const backBuffer = Buffer.from(documentBackData.split(',')[1] || documentBackData, 'base64');

        documentsAttachments.push(
          { filename: 'documento_identita_fronte.jpg', content: frontBuffer },
          { filename: 'documento_identita_retro.jpg', content: backBuffer }
        );
        console.log('✅ Documenti identità paziente preparati per invio');
      } catch (error) {
        console.error('❌ Errore preparazione documenti paziente:', error);
        // Continua senza documenti
      }
    }

    // 3. Prepara allegati documenti partner se presenti
    if (includePartner && !hasCompiledPrivacy && partnerDocumentFrontData && partnerDocumentBackData) {
      try {
        // Converti base64 in buffer
        const partnerFrontBuffer = Buffer.from(partnerDocumentFrontData.split(',')[1] || partnerDocumentFrontData, 'base64');
        const partnerBackBuffer = Buffer.from(partnerDocumentBackData.split(',')[1] || partnerDocumentBackData, 'base64');

        documentsAttachments.push(
          { filename: 'documento_identita_partner_fronte.jpg', content: partnerFrontBuffer },
          { filename: 'documento_identita_partner_retro.jpg', content: partnerBackBuffer }
        );
        console.log('✅ Documenti identità partner preparati per invio');
      } catch (error) {
        console.error('❌ Errore preparazione documenti partner:', error);
        // Continua senza documenti partner
      }
    }

    // 3. Invia email al centro con privacy e documenti allegati
    try {
      await sendPaymentConfirmationToAdmin(
        {
          name,
          email,
          phone,
          fiscalCode,
          serviceName,
          serviceDescription: serviceDescription || serviceName,
          amount: parseFloat(amount),
          stampDuty: 0, // Calcolato automaticamente in fattura
          ipAddress,
        },
        privacyPdf,
        documentsAttachments.length > 0 ? documentsAttachments : undefined
      );
      console.log('✅ Email inviata al centro');
    } catch (error) {
      console.error('❌ Errore invio email centro:', error);
      // Continua anche se l'email fallisce
    }

    // 3. Invia email al cliente
    try {
      await sendPaymentConfirmationToClient({
        name,
        email,
        phone,
        fiscalCode,
        serviceName,
        serviceDescription: serviceDescription || serviceName,
        amount: parseFloat(amount),
        stampDuty: 0, // Calcolato automaticamente in fattura
        ipAddress,
      });
      console.log('✅ Email inviata al cliente');
    } catch (error) {
      console.error('❌ Errore invio email cliente:', error);
      // Continua anche se l'email fallisce
    }

    // 4. Crea e invia fattura
    let invoiceId: number | null = null;
    try {
      const { invoiceId: createdInvoiceId } = await createAndSendInvoice({
        email,
        name,
        fiscalCode,
        phone,
        indirizzo,
        cap,
        citta,
        provincia,
        birthDate,
        luogoNascita,
        serviceName,
        serviceDescription: serviceDescription || serviceName,
        amount: parseFloat(amount),
        paymentMethod: paymentMethod as 'stripe' | 'bonifico' | 'bonifico_istantaneo' | 'contanti' | 'pos' | 'altro',
      });

      invoiceId = createdInvoiceId;
      if (invoiceId) {
        console.log(`✅ Fattura ${invoiceId} creata`);
        
        // 5. Invia fattura via email per bonifici istantanei
        if (paymentMethod === 'bonifico_istantaneo') {
          try {
            const stampDuty = calculateStampDuty(parseFloat(amount));
            await sendInvoiceToClient({
              name,
              email,
              serviceName,
              amount: parseFloat(amount),
              stampDuty,
              invoiceId,
            });
            console.log(`✅ Fattura ${invoiceId} inviata via email al cliente`);
          } catch (error) {
            console.error('❌ Errore invio fattura via email:', error);
            // Non bloccare il flusso per errori email
          }
        }
      } else {
        console.warn('⚠️ Fattura non creata (importo 0?)');
      }
    } catch (error) {
      console.error('❌ Errore creazione fattura:', error);
      // Non bloccare il flusso per errori fattura
    }

    return NextResponse.json({ 
      success: true, 
      invoiceId,
      message: 'Pagamento registrato con successo'
    });

  } catch (error) {
    console.error('❌ Errore API direct-payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    return NextResponse.json({ 
      error: 'Errore interno', 
      details: errorMessage 
    }, { status: 500 });
  }
}