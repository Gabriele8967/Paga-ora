/**
 * Script di test per verificare la creazione di una fattura su Fatture in Cloud
 * Usa dati di test per creare una fattura completa e verificare che funzioni correttamente
 */

import axios from 'axios';

interface TestInvoiceParams {
  customerName: string;
  customerEmail: string;
  customerFiscalCode: string;
  customerPhone: string;
  customerAddress: string;
  customerCap: string;
  customerCity: string;
  customerProvince: string;
  serviceName: string;
  servicePrice: number;
}

async function testCreateInvoice(params: TestInvoiceParams) {
  const FIC_ACCESS_TOKEN = process.env.FATTUREINCLOUD_ACCESS_TOKEN;
  const COMPANY_ID = process.env.FATTUREINCLOUD_COMPANY_ID || '1467198';
  const EXEMPT_VAT_ID = parseInt(process.env.FATTUREINCLOUD_EXEMPT_VAT_ID || '6');
  const PAYMENT_ACCOUNT_ID = parseInt(process.env.FATTUREINCLOUD_PAYMENT_ACCOUNT_ID || '1415808');
  const FIC_API_URL = 'https://api-v2.fattureincloud.it';

  console.log('\n📋 TEST CREAZIONE FATTURA SU FATTURE IN CLOUD');
  console.log('============================================\n');
  console.log('Configurazione:');
  console.log(`  Company ID: ${COMPANY_ID}`);
  console.log(`  Exempt VAT ID: ${EXEMPT_VAT_ID}`);
  console.log(`  Payment Account ID: ${PAYMENT_ACCOUNT_ID}`);
  console.log(`  Token presente: ${FIC_ACCESS_TOKEN ? 'Sì' : 'No'}\n`);

  if (!FIC_ACCESS_TOKEN) {
    console.error('❌ FATTUREINCLOUD_ACCESS_TOKEN non trovato');
    process.exit(1);
  }

  try {
    // Step 1: Cerca o crea cliente
    console.log('1️⃣  Ricerca/creazione cliente...');
    let clientId: number;

    try {
      const searchResponse = await axios.get(
        `${FIC_API_URL}/c/${COMPANY_ID}/entities/clients?q=email = '${params.customerEmail}'`,
        {
          headers: {
            'Authorization': `Bearer ${FIC_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (searchResponse.data.data && searchResponse.data.data.length > 0) {
        clientId = searchResponse.data.data[0].id;
        console.log(`   ✅ Cliente trovato: ID ${clientId}`);
      } else {
        // Crea nuovo cliente
        const [firstName, ...lastNameParts] = params.customerName.split(' ');
        const lastName = lastNameParts.join(' ');

        const createClientResponse = await axios.post(
          `${FIC_API_URL}/c/${COMPANY_ID}/entities/clients`,
          {
            data: {
              name: params.customerName,
              first_name: firstName,
              last_name: lastName,
              email: params.customerEmail,
              phone: params.customerPhone,
              tax_code: params.customerFiscalCode,
              address_street: params.customerAddress,
              address_postal_code: params.customerCap,
              address_city: params.customerCity,
              address_province: params.customerProvince,
              country: 'Italia'
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${FIC_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        clientId = createClientResponse.data.data.id;
        console.log(`   ✅ Cliente creato: ID ${clientId}`);
      }
    } catch (error: any) {
      console.error('   ❌ Errore gestione cliente:', error.response?.data || error.message);
      throw error;
    }

    // Step 2: Calcola marca da bollo
    console.log('\n2️⃣  Calcolo marca da bollo...');
    const STAMP_DUTY_THRESHOLD = 77.47;
    const STAMP_DUTY_AMOUNT = 2.00;
    const stampDuty = params.servicePrice > STAMP_DUTY_THRESHOLD ? STAMP_DUTY_AMOUNT : 0;
    console.log(`   Importo servizio: €${params.servicePrice}`);
    console.log(`   Marca da bollo: €${stampDuty}`);
    console.log(`   Totale: €${params.servicePrice + stampDuty}`);

    // Step 3: Crea fattura
    console.log('\n3️⃣  Creazione fattura...');

    const invoicePayload = {
      data: {
        type: 'invoice',
        entity: {
          id: clientId,
          name: params.customerName,
          tax_code: params.customerFiscalCode,
          address_street: params.customerAddress,
          address_postal_code: params.customerCap,
          address_city: params.customerCity,
          address_province: params.customerProvince,
          country: 'Italia'
        },
        date: new Date().toISOString().slice(0, 10),
        language: { code: 'it' },
        currency: { id: 'EUR', exchange_rate: '1.00000', symbol: '€' },
        show_totals: 'all',
        show_payments: true,
        show_notification_button: false,
        e_invoice: true,
        stamp_duty: stampDuty,
        items_list: [
          {
            name: params.serviceName,
            description: `Prestazione sanitaria esente IVA ai sensi dell'art. 10 DPR 633/72.${stampDuty > 0 ? ' Imposta di bollo assolta in modo virtuale - autorizzazione dell\'Ag. delle Entrate, Dir. Prov. II. di Roma Aut. n. 28/2025 del 29/5/2025 ai sensi art.15 del D.P.R. n° 642/72 e succ. modif. e integraz.' : ''}`,
            qty: 1,
            net_price: params.servicePrice,
            vat: {
              id: EXEMPT_VAT_ID,
              value: 0,
              description: 'Esente art.10'
            }
          }
        ],
        payments_list: [
          {
            amount: params.servicePrice,
            due_date: new Date().toISOString().slice(0, 10),
            paid_date: new Date().toISOString().slice(0, 10),
            status: 'paid',
            payment_terms: {
              type: 'standard'
            },
            payment_account: { id: PAYMENT_ACCOUNT_ID }
          }
        ],
        ei_data: {
          payment_method: 'MP08' // Carta di credito/debito
        },
        show_payment_method: true,
        payment_method: {
          name: 'Stripe (Carta)'
        }
      }
    };

    console.log('\n   Payload fattura:');
    console.log(JSON.stringify(invoicePayload, null, 2));

    const invoiceResponse = await axios.post(
      `${FIC_API_URL}/c/${COMPANY_ID}/issued_documents`,
      invoicePayload,
      {
        headers: {
          'Authorization': `Bearer ${FIC_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const invoiceId = invoiceResponse.data.data.id;
    const invoiceNumber = invoiceResponse.data.data.number;

    console.log('\n✅ FATTURA CREATA CON SUCCESSO!');
    console.log(`   ID: ${invoiceId}`);
    console.log(`   Numero: ${invoiceNumber || 'N/A'}`);
    console.log(`   Link: https://secure.fattureincloud.it/c/${COMPANY_ID}/invoices/${invoiceId}`);
    console.log('\n💡 Verifica su Fatture in Cloud:');
    console.log('   1. L\'importo nell\'elenco fatture deve essere corretto');
    console.log('   2. Aprendo la fattura, l\'importo deve corrispondere');
    console.log('   3. La voce IVA deve mostrare "Esente art.10" o simile\n');

    return { success: true, invoiceId, invoiceNumber };

  } catch (error: any) {
    console.error('\n❌ ERRORE CREAZIONE FATTURA:');
    console.error('Status:', error.response?.status);
    console.error('Messaggio:', error.response?.data?.error?.message || error.message);

    if (error.response?.data?.error?.validation_result) {
      console.error('\nErrori di validazione:');
      console.error(JSON.stringify(error.response.data.error.validation_result, null, 2));
    } else {
      console.error('Dettagli:', JSON.stringify(error.response?.data, null, 2));
    }

    return { success: false, error: error.message };
  }
}

// Dati di test
const testParams: TestInvoiceParams = {
  customerName: 'Mario Rossi Test',
  customerEmail: 'mario.rossi.test@example.com',
  customerFiscalCode: 'RSSMRA80A01H501U',
  customerPhone: '+39 333 1234567',
  customerAddress: 'Via Roma 1',
  customerCap: '00100',
  customerCity: 'Roma',
  customerProvince: 'RM',
  serviceName: 'Visita Ginecologica Test',
  servicePrice: 150.00
};

console.log('Parametri test:');
console.log(JSON.stringify(testParams, null, 2));

testCreateInvoice(testParams).then(result => {
  if (result.success) {
    console.log('\n🎉 Test completato con successo!');
    process.exit(0);
  } else {
    console.log('\n💥 Test fallito');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 Errore fatale:', error);
  process.exit(1);
});
