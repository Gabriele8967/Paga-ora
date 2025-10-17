import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createAndSendInvoice } from '@/lib/fattureincloud';
import { sendPaymentConfirmationToAdmin, sendPaymentConfirmationToClient } from '@/lib/email';
import { generatePaymentPrivacyPdf } from '@/lib/pdf';
import { kv } from '@vercel/kv';

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
      const hasCompiledPrivacy = metadata.hasCompiledPrivacy === 'true';

      // 1. Recupera documenti da KV se presenti
      let documentsData = null;
      const documentsAttachments: Array<{ filename: string; content: Buffer }> = [];

      if (!hasCompiledPrivacy) {
        try {
          documentsData = await kv.get(`docs:${session.id}`) as {
            documentFrontData: string;
            documentBackData: string;
            profession: string;
            documentNumber: string;
            documentExpiry: string;
          } | null;

          if (documentsData) {
            console.log(`📎 Documenti recuperati da KV per sessione ${session.id}`);

            // Converti base64 in buffer
            const frontBuffer = Buffer.from(documentsData.documentFrontData.split(',')[1] || documentsData.documentFrontData, 'base64');
            const backBuffer = Buffer.from(documentsData.documentBackData.split(',')[1] || documentsData.documentBackData, 'base64');

            documentsAttachments.push(
              { filename: 'documento_identita_fronte.jpg', content: frontBuffer },
              { filename: 'documento_identita_retro.jpg', content: backBuffer }
            );

            // Elimina documenti da KV dopo il recupero
            await kv.del(`docs:${session.id}`);
            console.log(`🗑️ Documenti eliminati da KV (sessione ${session.id})`);
          }
        } catch (error) {
          console.error('❌ Errore recupero documenti da KV:', error);
          // Continua senza documenti
        }
      }

      // 2. Genera PDF privacy
      let privacyPdf: Buffer | null = null;
      if (generatePrivacy) {
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
          // Dati aggiuntivi da metadata o da documentsData
          profession: metadata.profession || documentsData?.profession,
          documentNumber: metadata.documentNumber || documentsData?.documentNumber,
          documentExpiry: metadata.documentExpiry || documentsData?.documentExpiry,
        });
        privacyPdf = Buffer.from(pdfUint8Array);
        console.log('✅ PDF privacy generato');
      } else {
        console.log('⏩ Generazione PDF privacy saltata come richiesto.');
      }

      // 3. Invia email al centro con privacy e documenti allegati
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
        privacyPdf,
        documentsAttachments.length > 0 ? documentsAttachments : undefined
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
