#!/usr/bin/env node
/**
 * Test End-to-End Automatico
 * Testa tutte le funzionalità del sistema Paga Ora
 */

const BASE_URL = process.env.BASE_URL || 'https://paga-ora.vercel.app';

// Dati di test
const TEST_DATA = {
  // Test 1: Bonifico senza partner
  bonificoNoPartner: {
    amount: '100',
    serviceName: 'Test Bonifico Senza Partner',
    serviceDescription: 'Test automatico E2E',
    paymentMethod: 'bonifico_istantaneo',
    name: 'Mario Rossi Test',
    email: 'test@example.com',
    phone: '+39 333 1234567',
    fiscalCode: 'RSSMRA80A01H501U',
    birthDate: '1980-01-01',
    luogoNascita: 'Roma',
    indirizzo: 'Via Test 1',
    cap: '00100',
    citta: 'Roma',
    provincia: 'RM',
    hasCompiledPrivacy: false,
    profession: 'Ingegnere',
    documentNumber: 'AA123456',
    documentExpiry: '2030-12-31',
    includePartner: false,
    gdprConsent: true,
    privacyConsent: true,
  },

  // Test 2: Bonifico con partner
  bonificoWithPartner: {
    amount: '150',
    serviceName: 'Test Bonifico Con Partner',
    serviceDescription: 'Test automatico E2E con partner',
    paymentMethod: 'bonifico_istantaneo',
    name: 'Maria Bianchi Test',
    email: 'test@example.com',
    phone: '+39 333 7654321',
    fiscalCode: 'BNCMRA85B45H501Z',
    birthDate: '1985-02-05',
    luogoNascita: 'Milano',
    indirizzo: 'Via Test 2',
    cap: '20100',
    citta: 'Milano',
    provincia: 'MI',
    hasCompiledPrivacy: false,
    profession: 'Medico',
    documentNumber: 'BB789012',
    documentExpiry: '2029-06-30',
    includePartner: true,
    partnerName: 'Giuseppe Verdi Test',
    partnerFiscalCode: 'VRDGPP80C10H501W',
    partnerBirthDate: '1980-03-10',
    partnerLuogoNascita: 'Napoli',
    partnerIndirizzo: 'Via Partner 3',
    partnerCap: '80100',
    partnerCitta: 'Napoli',
    partnerProvincia: 'NA',
    partnerProfession: 'Avvocato',
    partnerDocumentNumber: 'CC345678',
    partnerDocumentExpiry: '2028-09-15',
    partnerEmail: 'partner@example.com',
    partnerPhone: '+39 333 9876543',
    gdprConsent: true,
    privacyConsent: true,
  },
};

// Funzione per creare immagine test base64 (1x1 pixel trasparente PNG)
function createTestImageBase64() {
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
}

async function testDirectPayment(testName, data) {
  console.log(`\n🧪 Test: ${testName}`);
  console.log('━'.repeat(60));

  try {
    // Prepara payload
    const payload = {
      ...data,
      generatePrivacy: true,
    };

    // Aggiungi documenti finti se privacy non compilata
    if (!data.hasCompiledPrivacy) {
      payload.documentFrontData = createTestImageBase64();
      payload.documentBackData = createTestImageBase64();

      if (data.includePartner) {
        payload.partnerDocumentFrontData = createTestImageBase64();
        payload.partnerDocumentBackData = createTestImageBase64();
      }
    }

    const response = await fetch(`${BASE_URL}/api/direct-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Test PASSED');
      console.log(`   Status: ${response.status}`);
      console.log(`   Invoice ID: ${result.invoiceId || 'N/A'}`);
      console.log(`   Message: ${result.message || result.success}`);
      return true;
    } else {
      console.log('❌ Test FAILED');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result.error}`);
      console.log(`   Details: ${result.details || 'N/A'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Test FAILED (Exception)');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Esegui tutti i test
async function runAllTests() {
  console.log('\n🚀 Avvio Test End-to-End');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log('═'.repeat(60));

  const results = [];

  // Test 1: Bonifico senza partner
  results.push(await testDirectPayment(
    'Bonifico Istantaneo SENZA Partner',
    TEST_DATA.bonificoNoPartner
  ));

  await new Promise(resolve => setTimeout(resolve, 2000)); // Pausa 2s

  // Test 2: Bonifico con partner
  results.push(await testDirectPayment(
    'Bonifico Istantaneo CON Partner',
    TEST_DATA.bonificoWithPartner
  ));

  // Riepilogo
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RIEPILOGO TEST');
  console.log('═'.repeat(60));

  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;

  console.log(`✅ Superati: ${passed}/${results.length}`);
  console.log(`❌ Falliti: ${failed}/${results.length}`);

  if (failed === 0) {
    console.log('\n🎉 TUTTI I TEST SUPERATI!');
    console.log('\n📧 Controlla la email centrimanna2@gmail.com');
    console.log('   Dovresti aver ricevuto 2 email con:');
    console.log('   • Email 1: PDF privacy + 2 documenti (paziente)');
    console.log('   • Email 2: PDF privacy + 4 documenti (paziente + partner)');
  } else {
    console.log('\n⚠️ ALCUNI TEST SONO FALLITI');
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error('\n💥 Errore fatale:', error);
  process.exit(1);
});
