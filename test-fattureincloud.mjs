import axios from 'axios';

async function testFattureInCloud() {
  const token = process.env.FATTUREINCLOUD_ACCESS_TOKEN;
  const companyId = process.env.FATTUREINCLOUD_COMPANY_ID;

  console.log('🔍 Test connessione Fatture in Cloud...');
  console.log('Company ID:', companyId);
  console.log('Token presente:', token ? 'Sì' : 'No');

  if (!token || !companyId) {
    console.error('❌ Variabili d\'ambiente mancanti');
    return;
  }

  try {
    // Test 1: Verifica autenticazione
    console.log('\n1️⃣ Test autenticazione...');
    const userInfo = await axios.get('https://api-v2.fattureincloud.it/user/info', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Autenticazione riuscita');
    console.log('   User:', userInfo.data.data.email);

    // Test 2: Verifica company
    console.log('\n2️⃣ Test company...');
    const companies = userInfo.data.data.companies || [];
    const company = companies.find(c => c.id === parseInt(companyId));
    console.log('✅ Company:', company ? company.name : '❌ Non trovata');

    // Test 3: Recupera conti di pagamento
    console.log('\n3️⃣ Test conti di pagamento...');
    const paymentAccounts = await axios.get(
      `https://api-v2.fattureincloud.it/c/${companyId}/settings/payment_accounts`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Conti di pagamento recuperati:', paymentAccounts.data.data.length);
    paymentAccounts.data.data.forEach(acc => {
      console.log(`   - ${acc.name} (ID: ${acc.id}, Type: ${acc.type})`);
    });

    // Test 4: Recupera aliquote IVA
    console.log('\n4️⃣ Test aliquote IVA...');
    const vatTypes = await axios.get(
      `https://api-v2.fattureincloud.it/c/${companyId}/settings/vat_types`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Aliquote IVA recuperate:', vatTypes.data.data.length);
    const exemptVats = vatTypes.data.data.filter(v => v.value === 0);
    console.log('   Aliquote esenti (0%):');
    exemptVats.forEach(v => {
      console.log(`   - ${v.description} (ID: ${v.id})`);
    });

    // Test 5: Recupera clienti (primi 5)
    console.log('\n5️⃣ Test recupero clienti...');
    const clients = await axios.get(
      `https://api-v2.fattureincloud.it/c/${companyId}/entities/clients?per_page=5`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Clienti recuperati:', clients.data.data.length);

    // Test 6: Recupera fatture recenti (ultime 5)
    console.log('\n6️⃣ Test recupero fatture...');
    const invoices = await axios.get(
      `https://api-v2.fattureincloud.it/c/${companyId}/issued_documents?type=invoice&per_page=5`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Fatture recuperate:', invoices.data.data.length);
    invoices.data.data.forEach(inv => {
      console.log(`   - Fattura #${inv.number || 'N/A'}: €${inv.amount_net || 0} (${inv.entity?.name || 'N/A'})`);
    });

    console.log('\n✅ Tutti i test completati con successo!');

  } catch (error) {
    console.error('\n❌ Errore durante il test:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.error?.message || error.message);
    console.error('Details:', JSON.stringify(error.response?.data, null, 2));
  }
}

testFattureInCloud();
