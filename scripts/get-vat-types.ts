/**
 * Script per recuperare le aliquote IVA disponibili su Fatture in Cloud
 * Usa questo script per trovare l'ID corretto dell'aliquota IVA esente da configurare in .env
 */

import axios from 'axios';

async function getVatTypes() {
  const FIC_ACCESS_TOKEN = process.env.FATTUREINCLOUD_ACCESS_TOKEN;
  const COMPANY_ID = process.env.FATTUREINCLOUD_COMPANY_ID || '1467198';
  const FIC_API_URL = 'https://api-v2.fattureincloud.it';

  console.log('Token presente:', FIC_ACCESS_TOKEN ? 'Sì' : 'No');
  console.log('Company ID:', COMPANY_ID);

  if (!FIC_ACCESS_TOKEN) {
    console.error('❌ FATTUREINCLOUD_ACCESS_TOKEN non trovato nelle variabili d\'ambiente');
    console.error('Assicurati di esportare le variabili d\'ambiente prima di eseguire questo script:');
    console.error('export FATTUREINCLOUD_ACCESS_TOKEN="il-tuo-token"');
    console.error('export FATTUREINCLOUD_COMPANY_ID="il-tuo-company-id"');
    process.exit(1);
  }

  try {
    console.log(`\n🔍 Recupero aliquote IVA per company ID: ${COMPANY_ID}...\n`);

    // IMPORTANTE: Usa /info/vat_types invece di /settings/vat_types
    const response = await axios.get(
      `${FIC_API_URL}/c/${COMPANY_ID}/info/vat_types`,
      {
        headers: {
          'Authorization': `Bearer ${FIC_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Aliquote IVA disponibili:\n`);

    const vatTypes = response.data.data;

    // Mostra tutte le aliquote
    console.log(`📋 TUTTE LE ALIQUOTE (${vatTypes.length} totali):`);
    vatTypes.forEach((vat: any) => {
      console.log(`\n  ID: ${vat.id}`);
      console.log(`  Valore: ${vat.value}%`);
      console.log(`  Descrizione: ${vat.description || 'N/D'}`);
      console.log(`  Note: ${vat.notes || 'N/D'}`);
      console.log(`  Default: ${vat.is_default ? 'Sì' : 'No'}`);
    });

    // Filtra e evidenzia le aliquote esenti
    console.log(`\n\n🔍 ALIQUOTE ESENTI (valore = 0%):`);
    const exemptVats = vatTypes.filter((vat: any) => vat.value === 0);

    if (exemptVats.length === 0) {
      console.log(`  ⚠️  Nessuna aliquota esente trovata!`);
      console.log(`  💡 Potrebbe essere necessario crearla manualmente su Fatture in Cloud:`);
      console.log(`     1. Vai su Fatture in Cloud > Impostazioni > Aliquote IVA`);
      console.log(`     2. Crea una nuova aliquota 0% per prestazioni sanitarie esenti`);
      console.log(`     3. Aggiungi nota: "art.10 DPR 633/72 - Prestazioni sanitarie esenti"`);
    } else {
      exemptVats.forEach((vat: any, index: number) => {
        console.log(`\n  ✅ OPZIONE ${index + 1}:`);
        console.log(`     ID: ${vat.id}`);
        console.log(`     Descrizione: ${vat.description || 'Esente'}`);
        console.log(`     Note: ${vat.notes || 'N/D'}`);
        console.log(`     Default: ${vat.is_default ? 'Sì' : 'No'}`);
      });

      console.log(`\n\n💡 ISTRUZIONI PER CONFIGURARE IL SISTEMA:`);
      console.log(`   1. Scegli l'ID dell'aliquota appropriata per prestazioni sanitarie`);
      console.log(`      (cerca quella con "art.10" o "sanitarie" nella descrizione/note)`);
      console.log(`   2. Aggiungi questa riga al tuo file .env.local:`);
      console.log(`      FATTUREINCLOUD_EXEMPT_VAT_ID="${exemptVats[0].id}"`);
      console.log(`   3. Riavvia l'applicazione`);
    }

    // Mostra anche le aliquote più comuni
    console.log(`\n\n📊 ALIQUOTE IVA COMUNI:`);
    const commonVats = vatTypes.filter((vat: any) => [0, 4, 5, 10, 22].includes(vat.value));
    commonVats.forEach((vat: any) => {
      console.log(`  ${vat.value}% - ${vat.description} (ID: ${vat.id})`);
    });

  } catch (error: any) {
    console.error('\n❌ Errore durante il recupero aliquote IVA:');
    console.error('Status:', error.response?.status);
    console.error('Messaggio:', error.response?.data?.error?.message || error.message);
    console.error('Dettagli:', JSON.stringify(error.response?.data, null, 2));

    if (error.response?.status === 403) {
      console.error('\n⚠️  ERRORE 403 - Permessi insufficienti:');
      console.error('   Il token OAuth potrebbe non avere i permessi necessari.');
      console.error('   Verifica che il token abbia accesso a:');
      console.error('   - entity.clients:r (lettura clienti)');
      console.error('   - entity.clients:w (scrittura clienti)');
      console.error('   - issued_documents.invoices:r (lettura fatture)');
      console.error('   - issued_documents.invoices:w (scrittura fatture)');
      console.error('   - settings:r (lettura impostazioni, incluse aliquote IVA)');
    }

    throw error;
  }
}

getVatTypes().catch(error => {
  console.error('\n💥 Errore fatale durante l\'esecuzione dello script');
  process.exit(1);
});
