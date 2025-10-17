import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createAndSendInvoice } from '@/lib/fattureincloud';
import { sendPaymentConfirmationToAdmin, sendPaymentConfirmationToClient } from '@/lib/email';
import { generatePaymentPrivacyPdf } from '@/lib/pdf';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`❌ Errore firma webhook: ${errorMessage}`);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (!metadata) {
      console.error('❌ Metadata non presente nella sessione Stripe');
      return NextResponse.json({ received: true });
    }

    console.log(`✅ Pagamento completato per: ${metadata.name}`);

    try {
      const amount = parseFloat(metadata.amount);
      const stampDuty = parseFloat(metadata.stampDuty);
      const generatePrivacy = metadata.generatePrivacy === 'true';

      let privacyPdf: Buffer | null = null;
      if (generatePrivacy) {
        // 1. Genera PDF privacy
        const pdfUint8Array = await generatePaymentPrivacyPdf({
          name: metadata.name,
          email: metadata.email,
          phone: metadata.phone,
          fiscalCode: metadata.fiscalCode,
          birthDate: metadata.birthDate,
          luogoNascita: metadata.luogoNascita,
          indirizzo: metadata.indirizzo,
          cap: metadata.cap,
          citta: metadata.citta,
          provincia: metadata.provincia,
          ipAddress: metadata.ipAddress,
        });
        privacyPdf = Buffer.from(pdfUint8Array);
        console.log('✅ PDF privacy generato');
      } else {
        console.log('⏩ Generazione PDF privacy saltata come richiesto.');
      }

      // 2. Invia email al centro con privacy allegata (se generata)
      await sendPaymentConfirmationToAdmin(
        {
          name: metadata.name,
          email: metadata.email,
          phone: metadata.phone,
          fiscalCode: metadata.fiscalCode,
          serviceName: metadata.serviceName,
          serviceDescription: metadata.serviceDescription || metadata.serviceName,
          amount,
          stampDuty,
          ipAddress: metadata.ipAddress,
        },
        privacyPdf
      );

      console.log('✅ Email inviata al centro');

      // 3. Invia email al cliente
      await sendPaymentConfirmationToClient({
        name: metadata.name,
        email: metadata.email,
        phone: metadata.phone,
        fiscalCode: metadata.fiscalCode,
        serviceName: metadata.serviceName,
        serviceDescription: metadata.serviceDescription || metadata.serviceName,
        amount,
        stampDuty,
        ipAddress: metadata.ipAddress,
      });

      console.log('✅ Email inviata al cliente');

      // 4. Crea e invia fattura
      try {
        const { invoiceId } = await createAndSendInvoice({
          email: metadata.email,
          name: metadata.name,
          fiscalCode: metadata.fiscalCode,
          phone: metadata.phone,
          indirizzo: metadata.indirizzo,
          cap: metadata.cap,
          citta: metadata.citta,
          provincia: metadata.provincia,
          birthDate: metadata.birthDate,
          luogoNascita: metadata.luogoNascita,
          serviceName: metadata.serviceName,
          serviceDescription: metadata.serviceDescription || metadata.serviceName,
          amount,
          paymentMethod: 'stripe', // Pagamento Stripe sempre con carta
        });

        if (invoiceId) {
          console.log(`✅ Fattura ${invoiceId} creata`);
        } else {
          console.warn('⚠️ Fattura non creata (importo 0?)');
        }
      } catch (invoiceError) {
        console.error(`❌ Errore creazione fattura:`, invoiceError);
        // Non bloccare il flusso per errori fattura
      }

    } catch (error) {
      console.error(`❌ Errore nel processo post-pagamento:`, error);
      return NextResponse.json({ received: true });
    }
  } else {
    console.warn(`🤷 Evento non gestito: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
