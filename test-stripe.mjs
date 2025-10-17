#!/usr/bin/env node
/**
 * Test Stripe Checkout + Fatture
 * Crea sessioni Stripe per testare il flusso completo
 */

const BASE_URL = process.env.BASE_URL || 'https://paga-ora.vercel.app';

// Funzione per creare immagine test base64
function createTestImageBase64() {
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
}

async function testStripeCheckout(testName, includePartner = false) {
  console.log(`\n🧪 Test: ${testName}`);
  console.log('━'.repeat(60));

  try {
    const payload = {
      amount: includePartner ? '200' : '150',
      serviceName: testName,
      serviceDescription: 'Test automatico Stripe + Fatture',
      paymentMethod: 'stripe',
      name: includePartner ? 'Laura Verdi Test Stripe' : 'Paolo Neri Test Stripe',
      email: 'test-stripe@example.com',
      phone: '+39 333 5555555',
      fiscalCode: includePartner ? 'VRDLRA90D45H501A' : 'NREPLA88C15H501B',
      birthDate: includePartner ? '1990-04-05' : '1988-03-15',
      luogoNascita: includePartner ? 'Torino' : 'Bologna',
      indirizzo: 'Via Stripe Test 10',
      cap: '10100',
      citta: 'Torino',
      provincia: 'TO',
      hasCompiledPrivacy: false,
      profession: 'Developer',
      documentNumber: 'ST123456',
      documentExpiry: '2030-12-31',
      includePartner: includePartner,
      gdprConsent: true,
      privacyConsent: true,
      generatePrivacy: true,
      // Documenti paziente
      documentFrontData: createTestImageBase64(),
      documentBackData: createTestImageBase64(),
    };

    // Aggiungi dati partner se richiesto
    if (includePartner) {
      payload.partnerName = 'Marco Bianchi Partner';
      payload.partnerFiscalCode = 'BNCMRC85H10H501C';
      payload.partnerBirthDate = '1985-06-10';
      payload.partnerLuogoNascita = 'Firenze';
      payload.partnerIndirizzo = 'Via Partner 5';
      payload.partnerCap = '50100';
      payload.partnerCitta = 'Firenze';
      payload.partnerProvincia = 'FI';
      payload.partnerProfession = 'Designer';
      payload.partnerDocumentNumber = 'PT789012';
      payload.partnerDocumentExpiry = '2029-06-30';
      payload.partnerEmail = 'partner-test@example.com';
      payload.partnerPhone = '+39 333 6666666';
      payload.partnerDocumentFrontData = createTestImageBase64();
      payload.partnerDocumentBackData = createTestImageBase64();
    }

    const response = await fetch(`${BASE_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok && result.url) {
      console.log('✅ Sessione Stripe creata con successo');
      console.log(`   Status: ${response.status}`);
      console.log(`   Session ID: ${result.sessionId}`);
      console.log(`   Checkout URL: ${result.url}`);
      console.log('');
      console.log('🔗 APRI QUESTO LINK NEL BROWSER:');
      console.log(`   ${result.url}`);
      console.log('');
      console.log('💳 Usa carta test Stripe:');
      console.log('   Numero: 4242 4242 4242 4242');
      console.log('   Scadenza: 12/34');
      console.log('   CVC: 123');
      console.log('');
      console.log(`📎 Documenti salvati in Redis: ${includePartner ? '4 documenti (paziente + partner)' : '2 documenti (paziente)'}`);
      console.log('⏰ Scadenza Redis: 1 ora');
      console.log('');
      return { success: true, url: result.url, sessionId: result.sessionId };
    } else {
      console.log('❌ Test FAILED');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result.error}`);
      console.log(`   Details: ${result.details || 'N/A'}`);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Test FAILED (Exception)');
    console.log(`   Error: ${error.message}`);
    return { success: false };
  }
}

async function runStripeTests() {
  console.log('\n🚀 Avvio Test Stripe + Fatture');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log('═'.repeat(60));

  const results = [];

  // Test 1: Stripe senza partner
  console.log('\n📌 TEST 1: Pagamento Stripe SENZA Partner');
  const test1 = await testStripeCheckout('Test Stripe Senza Partner', false);
  results.push(test1);

  if (test1.success) {
    console.log('⏸️  Attendi di completare questo pagamento prima di procedere...');
    console.log('   Dopo il pagamento, controlla:');
    console.log('   1. Email centrimanna2@gmail.com (3 allegati)');
    console.log('   2. Fatture in Cloud (nuova fattura creata)');
    console.log('   3. Logs Vercel (documenti recuperati da Redis)');
  }

  // Pausa tra test
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Test 2: Stripe con partner
  console.log('\n📌 TEST 2: Pagamento Stripe CON Partner');
  const test2 = await testStripeCheckout('Test Stripe Con Partner', true);
  results.push(test2);

  if (test2.success) {
    console.log('⏸️  Attendi di completare questo pagamento prima di chiudere...');
    console.log('   Dopo il pagamento, controlla:');
    console.log('   1. Email centrimanna2@gmail.com (5 allegati)');
    console.log('   2. Fatture in Cloud (nuova fattura creata)');
    console.log('   3. Logs Vercel (documenti partner recuperati da Redis)');
  }

  // Riepilogo
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RIEPILOGO TEST STRIPE');
  console.log('═'.repeat(60));

  const created = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Sessioni create: ${created}/${results.length}`);
  console.log(`❌ Fallite: ${failed}/${results.length}`);

  if (created > 0) {
    console.log('\n🎯 AZIONI DA COMPLETARE:');
    console.log('');
    console.log('1. 💳 Apri i link Stripe sopra e completa i pagamenti');
    console.log('   Carta test: 4242 4242 4242 4242');
    console.log('');
    console.log('2. 📧 Controlla email centrimanna2@gmail.com');
    console.log('   Dovresti ricevere 2 nuove email dopo i pagamenti');
    console.log('');
    console.log('3. 📄 Verifica fatture su Fatture in Cloud');
    console.log('   Vai su: https://secure.fattureincloud.it');
    console.log('   Cerca fatture di oggi per "Test Stripe"');
    console.log('');
    console.log('4. 🔍 Controlla logs Vercel');
    console.log('   Cerca: "📎 Documenti recuperati da KV"');
    console.log('   Cerca: "✅ PDF privacy generato"');
    console.log('   Cerca: "✅ Fattura [ID] creata"');
    console.log('');
  }

  console.log('━'.repeat(60));
  console.log('⚠️  NOTA: I test Stripe richiedono completamento manuale');
  console.log('━'.repeat(60));
}

runStripeTests().catch(error => {
  console.error('\n💥 Errore fatale:', error);
  process.exit(1);
});
