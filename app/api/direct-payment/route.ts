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
        });
        privacyPdf = Buffer.from(pdfUint8Array);
        console.log('✅ PDF privacy generato');
      } catch (error) {
        console.error('❌ Errore generazione PDF privacy:', error);
        // Continua senza privacy PDF
      }
    }

    // 2. Invia email al centro con privacy allegata (se generata)
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
        privacyPdf
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