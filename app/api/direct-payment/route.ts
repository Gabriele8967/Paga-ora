import { NextRequest, NextResponse } from 'next/server';
import { createAndSendInvoice, type PaymentMethod } from '@/lib/fattureincloud';
import { sendEmailToAdmin, sendEmailToClient } from '@/lib/email';
import { generatePrivacyPDF } from '@/lib/privacy-pdf';

export const dynamic = 'force-dynamic';

/**
 * API per pagamenti diretti (non Stripe): bonifico, contanti, POS, altro
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      amount,
      serviceName,
      serviceDescription,
      paymentMethod,
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
      generatePrivacy = true,
    } = body;

    // Validazione base
    if (!amount || !serviceName || !name || !email || !fiscalCode || !paymentMethod) {
      return NextResponse.json(
        { error: 'Dati mancanti nel form' },
        { status: 400 }
      );
    }

    // Genera privacy PDF se richiesto
    let privacyPdfBuffer: Buffer | null = null;
    if (generatePrivacy) {
      privacyPdfBuffer = await generatePrivacyPDF({
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
      });
    }

    // Invia email all'admin con privacy (se generata)
    await sendEmailToAdmin({
      patientName: name,
      patientEmail: email,
      serviceName,
      amount: parseFloat(amount),
      privacyPdf: privacyPdfBuffer,
    });

    // Invia email al cliente
    await sendEmailToClient({
      patientName: name,
      patientEmail: email,
      serviceName,
      amount: parseFloat(amount),
    });

    // Crea fattura su Fatture in Cloud
    const { invoiceId } = await createAndSendInvoice({
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
      serviceDescription: serviceDescription || '',
      amount: parseFloat(amount),
      paymentMethod: paymentMethod as PaymentMethod,
    });

    console.log(`✅ Pagamento diretto registrato - Fattura ID: ${invoiceId}`);

    return NextResponse.json({
      success: true,
      invoiceId,
      message: 'Pagamento registrato con successo',
    });

  } catch (error: any) {
    console.error('❌ Errore API direct-payment:', error);
    return NextResponse.json(
      { error: error.message || 'Errore nella registrazione del pagamento' },
      { status: 500 }
    );
  }
}
