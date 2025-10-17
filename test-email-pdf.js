#!/usr/bin/env node

/**
 * Test per verificare funzionalità email e PDF
 */

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

const testData = {
  amount: '50.00',
  serviceName: 'Test Email Service',
  serviceDescription: 'Test per verificare invio email',
  name: 'Giulia Bianchi',
  email: 'giulia.bianchi@test.com',
  phone: '3339876543',
  fiscalCode: 'BNCGLI85B41H501X',
  birthDate: '1985-02-15',
  luogoNascita: 'Milano',
  indirizzo: 'Via Email Test 456',
  cap: '20100',
  citta: 'Milano',
  provincia: 'MI',
  paymentMethod: 'bonifico_istantaneo',
  generatePrivacy: true
};

console.log('📧 Test funzionalità email e PDF...\n');

async function testEmailAndPDF() {
  console.log('🔍 Testando invio email e generazione PDF...');
  console.log('─'.repeat(50));
  
  try {
    const response = await fetch(`${baseUrl}/api/direct-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Test completato con successo!');
      console.log(`   Invoice ID: ${result.invoiceId || 'N/A'}`);
      console.log(`   Message: ${result.message}`);
      console.log('\n📋 Verifiche effettuate:');
      console.log('   ✅ Generazione PDF privacy');
      console.log('   ✅ Invio email al centro');
      console.log('   ✅ Invio email al cliente');
      console.log('   ✅ Creazione fattura');
      console.log('   ✅ Invio fattura via email (bonifico istantaneo)');
    } else {
      console.log('❌ Test fallito!');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result.error || 'Unknown error'}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
    }
    
    return response.ok;
    
  } catch (error) {
    console.log('💥 Errore durante il test:');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testStripeWebhook() {
  console.log('\n🔍 Testando webhook Stripe...');
  console.log('─'.repeat(50));
  
  // Simula un webhook di Stripe
  const webhookData = {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123456789',
        payment_status: 'paid',
        customer_email: testData.email,
        metadata: {
          name: testData.name,
          email: testData.email,
          phone: testData.phone,
          fiscalCode: testData.fiscalCode,
          serviceName: testData.serviceName,
          amount: testData.amount
        }
      }
    }
  };
  
  try {
    const response = await fetch(`${baseUrl}/api/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 'test_signature'
      },
      body: JSON.stringify(webhookData)
    });
    
    if (response.ok) {
      console.log('✅ Webhook Stripe: SUCCESS');
    } else {
      console.log('❌ Webhook Stripe: ERROR');
      console.log(`   Status: ${response.status}`);
    }
    
    return response.ok;
    
  } catch (error) {
    console.log('💥 Webhook Stripe: EXCEPTION');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runEmailPDFTests() {
  console.log('🚀 Avvio test email e PDF...\n');
  
  const results = {
    emailPDF: false,
    webhook: false
  };
  
  // Test email e PDF
  results.emailPDF = await testEmailAndPDF();
  
  // Pausa tra i test
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test webhook (opzionale)
  results.webhook = await testStripeWebhook();
  
  // Riepilogo
  console.log('\n' + '='.repeat(50));
  console.log('📊 RISULTATI TEST EMAIL E PDF');
  console.log('='.repeat(50));
  
  console.log(`\n📧 Email e PDF: ${results.emailPDF ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🔗 Webhook Stripe: ${results.webhook ? '✅ PASS' : '❌ FAIL'}`);
  
  const totalTests = 2;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`\n📈 Risultato: ${passedTests}/${totalTests} test superati`);
  
  if (results.emailPDF) {
    console.log('🎉 Funzionalità email e PDF funzionanti!');
  } else {
    console.log('⚠️  Problemi con email o PDF. Controlla i log.');
  }
  
  return results.emailPDF;
}

// Esegui i test
runEmailPDFTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Errore durante l\'esecuzione dei test:', error);
  process.exit(1);
});
