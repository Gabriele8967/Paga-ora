#!/usr/bin/env node

/**
 * Test completo per tutti i flussi di pagamento
 * Simula tutti i metodi di pagamento possibili
 */

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Dati di test
const testData = {
  amount: '100.00',
  serviceName: 'Test Service',
  serviceDescription: 'Test Description',
  name: 'Mario Rossi',
  email: 'mario.rossi@test.com',
  phone: '3331234567',
  fiscalCode: 'RSSMRA80A01H501U',
  birthDate: '1980-01-01',
  luogoNascita: 'Roma',
  indirizzo: 'Via Test 123',
  cap: '00100',
  citta: 'Roma',
  provincia: 'RM',
  generatePrivacy: true
};

const paymentMethods = [
  'stripe',
  'bonifico_istantaneo', 
  'contanti',
  'pos',
  'altro'
];

console.log('🧪 Avvio test completo flussi di pagamento...\n');

async function testPaymentMethod(method) {
  console.log(`\n🔍 Testando metodo: ${method.toUpperCase()}`);
  console.log('─'.repeat(40));
  
  try {
    const response = await fetch(`${baseUrl}/api/direct-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...testData,
        paymentMethod: method
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${method}: SUCCESS`);
      console.log(`   Invoice ID: ${result.invoiceId || 'N/A'}`);
      console.log(`   Message: ${result.message}`);
    } else {
      console.log(`❌ ${method}: ERROR`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result.error || 'Unknown error'}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
    }
    
    return response.ok;
    
  } catch (error) {
    console.log(`💥 ${method}: EXCEPTION`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testStripeCheckout() {
  console.log(`\n🔍 Testando Stripe Checkout...`);
  console.log('─'.repeat(40));
  
  try {
    const response = await fetch(`${baseUrl}/api/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Stripe Checkout: SUCCESS`);
      console.log(`   Session ID: ${result.sessionId}`);
      console.log(`   URL: ${result.url}`);
    } else {
      console.log(`❌ Stripe Checkout: ERROR`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result.error || 'Unknown error'}`);
    }
    
    return response.ok;
    
  } catch (error) {
    console.log(`💥 Stripe Checkout: EXCEPTION`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Avvio test automatici...\n');
  
  const results = {
    stripe: false,
    directPayments: {}
  };
  
  // Test Stripe Checkout
  results.stripe = await testStripeCheckout();
  
  // Test tutti i metodi di pagamento diretto
  for (const method of paymentMethods) {
    results.directPayments[method] = await testPaymentMethod(method);
    // Pausa tra i test per evitare rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Riepilogo risultati
  console.log('\n' + '='.repeat(60));
  console.log('📊 RIEPILOGO RISULTATI TEST');
  console.log('='.repeat(60));
  
  console.log(`\n💳 Stripe Checkout: ${results.stripe ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log('\n💰 Pagamenti Diretti:');
  Object.entries(results.directPayments).forEach(([method, success]) => {
    console.log(`   ${method}: ${success ? '✅ PASS' : '❌ FAIL'}`);
  });
  
  const totalTests = 1 + paymentMethods.length;
  const passedTests = (results.stripe ? 1 : 0) + Object.values(results.directPayments).filter(Boolean).length;
  
  console.log(`\n📈 Risultato: ${passedTests}/${totalTests} test superati`);
  
  if (passedTests === totalTests) {
    console.log('🎉 TUTTI I TEST SUPERATI! Il sistema è funzionante.');
  } else {
    console.log('⚠️  Alcuni test sono falliti. Controlla i log sopra.');
  }
  
  return passedTests === totalTests;
}

// Esegui i test
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Errore durante l\'esecuzione dei test:', error);
  process.exit(1);
});
