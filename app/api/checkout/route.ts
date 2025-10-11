import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { calculateStampDuty } from '@/lib/fattureincloud';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

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
      generatePrivacy,
    } = body;

    if (!amount || !serviceName || !name || !email || !phone || !fiscalCode) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    // Calcola la marca da bollo
    const stampDuty = calculateStampDuty(amount);
    const serviceAmountInCents = Math.round(amount * 100);
    const stampDutyInCents = Math.round(stampDuty * 100);

    console.log(`💰 [CHECKOUT] Servizio: €${amount} | Marca da bollo: €${stampDuty} | Totale: €${amount + stampDuty}`);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Line items per Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: serviceName,
            description: serviceDescription || 'Prestazione sanitaria',
          },
          unit_amount: serviceAmountInCents,
        },
        quantity: 1,
      },
    ];

    if (stampDuty > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Marca da Bollo',
            description: 'Imposta di bollo ai sensi art. 15 DPR 642/72',
          },
          unit_amount: stampDutyInCents,
        },
        quantity: 1,
      });
    }

    // Ottieni l'IP address del cliente
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // Crea sessione Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?cancelled=true`,
      customer_email: email,
      metadata: {
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
        serviceName,
        serviceDescription: serviceDescription || '',
        amount: amount.toString(),
        stampDuty: stampDuty.toString(),
        ipAddress,
        generatePrivacy: generatePrivacy ? generatePrivacy.toString() : 'true',
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error('Errore creazione sessione Stripe:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    return NextResponse.json({ error: 'Errore interno', details: errorMessage }, { status: 500 });
  }
}
