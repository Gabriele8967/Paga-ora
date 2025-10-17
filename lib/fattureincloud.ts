import axios from 'axios';

/**
 * Recupera il company ID di Fatture in Cloud dalle variabili d'ambiente.
 * Se non configurato, usa il valore di default.
 */
function getCompanyId(): number {
  const companyId = process.env.FATTUREINCLOUD_COMPANY_ID;
  if (!companyId) {
    console.warn('FATTUREINCLOUD_COMPANY_ID non configurato, usando company ID di default');
    return 0; // Sarà necessario configurarlo nelle variabili d'ambiente
  }
  return parseInt(companyId, 10);
}

/**
 * Deduce il codice paese (country code) dal CAP o prefisso telefonico.
 * Default: IT (Italia)
 */
function deduceCountryCode(cap?: string, phone?: string): string {
  let country = 'IT';

  const phoneNum = phone?.trim() || '';
  if (phoneNum.startsWith('+49')) return 'DE';
  else if (phoneNum.startsWith('+39')) return 'IT';
  else if (phoneNum.startsWith('+33')) return 'FR';
  else if (phoneNum.startsWith('+34')) return 'ES';
  else if (phoneNum.startsWith('+41')) return 'CH';
  else if (phoneNum.startsWith('+43')) return 'AT';
  else if (phoneNum.startsWith('+44')) return 'GB';
  else if (phoneNum.startsWith('+32')) return 'BE';
  else if (phoneNum.startsWith('+31')) return 'NL';

  const zipCode = cap?.trim() || '';
  if (zipCode && /^\d{5}$/.test(zipCode)) {
    const zipNum = parseInt(zipCode);
    if (zipNum < 10000) country = 'DE';
  }

  return country;
}

/**
 * Recupera l'ID del conto di pagamento appropriato per Stripe/carta.
 * Cerca automaticamente un conto con "stripe", "carta" o "card" nel nome.
 * Se configurato FATTUREINCLOUD_PAYMENT_ACCOUNT_ID, usa quello.
 * Altrimenti cerca dinamicamente o usa il primo disponibile.
 * Restituisce null se non è possibile trovare un conto valido.
 */
async function getPaymentAccountId(): Promise<number | null> {
  const configuredId = process.env.FATTUREINCLOUD_PAYMENT_ACCOUNT_ID;
  if (configuredId) {
    const parsedId = parseInt(configuredId, 10);
    console.log(`✅ Payment Account ID configurato: ${parsedId}`);
    return parsedId;
  }

  console.warn('⚠️ FATTUREINCLOUD_PAYMENT_ACCOUNT_ID non configurato, cercando dinamicamente...');

  // Recupera la lista dei conti e cerca uno appropriato per Stripe
  const FIC_ACCESS_TOKEN = process.env.FATTUREINCLOUD_ACCESS_TOKEN;
  const companyId = getCompanyId();

  try {
    const response = await axios.get(
      `https://api-v2.fattureincloud.it/c/${companyId}/settings/payment_accounts`,
      {
        headers: {
          'Authorization': `Bearer ${FIC_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const accounts = response.data.data;
    if (accounts && accounts.length > 0) {
      // Cerca un conto appropriato per pagamenti con carta/Stripe
      let selectedAccount = accounts.find((acc: any) =>
        acc.name.toLowerCase().includes('stripe') ||
        acc.name.toLowerCase().includes('carta') ||
        acc.name.toLowerCase().includes('card')
      );

      // Se non trovato, usa il primo disponibile
      if (!selectedAccount) {
        selectedAccount = accounts[0];
        console.warn(`⚠️  Nessun conto Stripe/Carta trovato, usando: ${selectedAccount.name} (ID: ${selectedAccount.id})`);
      } else {
        console.log(`✅ Conto pagamento per Stripe: ${selectedAccount.name} (ID: ${selectedAccount.id})`);
      }

      return selectedAccount.id;
    }
  } catch (error) {
    console.error('❌ Errore recupero conti di pagamento:', error);
  }

  console.warn('⚠️ FATTUREINCLOUD_PAYMENT_ACCOUNT_ID non configurato e impossibile recuperare conti dinamicamente. Le fatture verranno create senza conto di pagamento specificato.');
  return null; // Nessun conto trovato
}

/**
 * Recupera l'ID dell'aliquota IVA esente da usare per le prestazioni sanitarie.
 * IMPORTANTE: Questo ID deve essere configurato su Fatture in Cloud come aliquota al 0%
 * per prestazioni sanitarie esenti (art.10 DPR 633/72)
 */
function getExemptVatId(): number {
  const exemptVatId = process.env.FATTUREINCLOUD_EXEMPT_VAT_ID;
  if (!exemptVatId) {
    console.warn('⚠️  FATTUREINCLOUD_EXEMPT_VAT_ID non configurato!');
    console.warn('   Per trovare l\'ID corretto:');
    console.warn('   1. Vai su Fatture in Cloud > Impostazioni > Aliquote IVA');
    console.warn('   2. Cerca l\'aliquota 0% per prestazioni sanitarie esenti');
    console.warn('   3. Annota l\'ID e configuralo in .env come FATTUREINCLOUD_EXEMPT_VAT_ID');
    console.warn('   Usando temporaneamente ID 0 (potrebbe causare errori)');
    return 0;
  }
  return parseInt(exemptVatId, 10);
}

/**
 * Calcola se la marca da bollo è necessaria.
 * €2,00 per fatture esenti IVA oltre €77,47
 */
export function calculateStampDuty(price: number): number {
  const STAMP_DUTY_THRESHOLD = 77.47;
  const STAMP_DUTY_AMOUNT = 2.00;
  return price > STAMP_DUTY_THRESHOLD ? STAMP_DUTY_AMOUNT : 0;
}

/**
 * Calcola il totale da pagare inclusa la marca da bollo
 */
export function calculateTotalWithStampDuty(price: number): number {
  return price + calculateStampDuty(price);
}

/**
 * Cerca un cliente per codice fiscale o email, altrimenti lo crea.
 */
interface PatientData {
  name: string;
  email: string;
  phone: string;
  fiscalCode: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
}

interface CreateClientPayload {
  data: {
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    tax_code: string;
    address_street: string;
    address_postal_code: string;
    address_city: string;
    address_province: string;
    country?: string;
  };
}

async function getOrCreateClient(companyId: number, patient: PatientData): Promise<number> {
  const FIC_ACCESS_TOKEN = process.env.FATTUREINCLOUD_ACCESS_TOKEN;
  const FIC_API_URL = 'https://api-v2.fattureincloud.it';

  console.log(`[FATTURA_TRACE] 6. getOrCreateClient chiamata con email: ${patient.email}`);
  console.log(`[FATTURA_TRACE] 7. getOrCreateClient chiamata con nome: ${patient.name}`);
  console.log(`[FATTURA_TRACE] 8. getOrCreateClient chiamata con CF: ${patient.fiscalCode}`);

  // 1. Cerca per Email (più univoco in questo contesto)
  if (patient.email) {
    try {
      const response = await axios.get(
        `${FIC_API_URL}/c/${companyId}/entities/clients?q=email = '${patient.email}'`,
        {
          headers: {
            'Authorization': `Bearer ${FIC_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data && response.data.data && response.data.data.length > 0) {
        const existingClient = response.data.data[0];
        const clientId = existingClient.id;
        console.log(`[FATTURA_TRACE] 9. Cliente trovato per EMAIL su FiC: ID ${clientId}`);
        
        // Aggiorna i dati del cliente se necessario
        const needsUpdate = (
          existingClient.name !== patient.name ||
          existingClient.phone !== patient.phone ||
          existingClient.address_street !== patient.indirizzo ||
          existingClient.address_postal_code !== patient.cap ||
          existingClient.address_city !== patient.citta ||
          existingClient.address_province !== patient.provincia
        );

        if (needsUpdate) {
          console.log(`[FATTURA_TRACE] 9.1. Aggiornamento dati cliente trovato per email...`);

          try {
            await axios.put(
              `${FIC_API_URL}/c/${companyId}/entities/clients/${clientId}`,
              {
                data: {
                  email: patient.email,
                  name: patient.name,
                  phone: patient.phone,
                  address_street: patient.indirizzo,
                  address_postal_code: patient.cap,
                  address_city: patient.citta,
                  address_province: patient.provincia,
                }
              },
              {
                headers: {
                  'Authorization': `Bearer ${FIC_ACCESS_TOKEN}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            console.log(`[FATTURA_TRACE] 9.2. Cliente aggiornato con successo su FiC`);
          } catch (updateError: any) {
            console.error('Errore durante aggiornamento cliente:', updateError.response?.data || updateError.message);
          }
        }
        
        return clientId;
      } else {
        console.log(`[FATTURA_TRACE] 9. Nessun cliente trovato per EMAIL ${patient.email} su FiC`);
      }
    } catch (error: any) {
      console.warn('Errore durante la ricerca cliente per email:', error.response?.data || error.message);
    }
  }

  // 2. Se non trovato per email, cerca per Codice Fiscale
  // MA se lo troviamo, aggiorniamo l'email per evitare discrepanze
  if (patient.fiscalCode) {
    try {
      const response = await axios.get(
        `${FIC_API_URL}/c/${companyId}/entities/clients?q=tax_code = '${patient.fiscalCode}'`,
        {
          headers: {
            'Authorization': `Bearer ${FIC_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data && response.data.data && response.data.data.length > 0) {
        const existingClient = response.data.data[0];
        const clientId = existingClient.id;
        
        console.log(`[FATTURA_TRACE] 10. Cliente trovato per CF su FiC: ID ${clientId}, Email esistente: ${existingClient.email}`);
        
        // IMPORTANTE: Aggiorniamo sempre i dati del cliente per assicurarci che siano aggiornati
        const needsUpdate = (
          existingClient.email !== patient.email ||
          existingClient.name !== patient.name ||
          existingClient.phone !== patient.phone ||
          existingClient.address_street !== patient.indirizzo ||
          existingClient.address_postal_code !== patient.cap ||
          existingClient.address_city !== patient.citta ||
          existingClient.address_province !== patient.provincia
        );

        if (needsUpdate) {
          console.log(`[FATTURA_TRACE] 11. Aggiornamento dati cliente su Fatture in Cloud...`);

          try {
            await axios.put(
              `${FIC_API_URL}/c/${companyId}/entities/clients/${clientId}`,
              {
                data: {
                  email: patient.email,
                  name: patient.name,
                  phone: patient.phone,
                  address_street: patient.indirizzo,
                  address_postal_code: patient.cap,
                  address_city: patient.citta,
                  address_province: patient.provincia,
                }
              },
              {
                headers: {
                  'Authorization': `Bearer ${FIC_ACCESS_TOKEN}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            console.log(`[FATTURA_TRACE] 12. Cliente aggiornato con successo su FiC`);
          } catch (updateError: any) {
            console.error('Errore durante aggiornamento cliente:', updateError.response?.data || updateError.message);
          }
        }
        
        return clientId;
      } else {
        console.log(`[FATTURA_TRACE] 10. Nessun cliente trovato per CF ${patient.fiscalCode} su FiC`);
      }
    } catch (error: any) {
      console.warn('Errore durante la ricerca cliente per codice fiscale:', error.response?.data || error.message);
    }
  }

  // 3. Se ancora non trovato, crea un nuovo cliente
  const [firstName, ...lastNameParts] = patient.name.split(' ');
  const lastName = lastNameParts.join(' ');

  // Deduce il paese dal CAP o dal prefisso telefonico
  const country = deduceCountryCode(patient.cap, patient.phone);
  console.log(`[FATTURA_TRACE] 13. Paese dedotto per cliente: ${country} (CAP: ${patient.cap}, Tel: ${patient.phone})`);

  // IMPORTANTE: Fatture in Cloud accetta solo 'Italia' come country, 
  // quindi per clienti esteri usiamo comunque 'Italia' come paese fiscale
  // ma mettiamo l'indirizzo estero completo
  const createClientPayload: any = {
    data: {
      name: patient.name,
      first_name: firstName,
      last_name: lastName,
      email: patient.email,
      phone: patient.phone,
      tax_code: patient.fiscalCode,
      address_street: patient.indirizzo,
      address_postal_code: patient.cap,
      address_city: patient.citta,
      address_province: patient.provincia,
    },
  };

  // Aggiungi country solo se è Italia (IT)
  // Per pazienti esteri, l'indirizzo estero è già nell'address_street/city/postal_code
  if (country === 'IT') {
    createClientPayload.data.country = 'Italia';
  }

  console.log(`[FATTURA_TRACE] 14. Payload creazione cliente:`, JSON.stringify(createClientPayload, null, 2));
  
  try {
    const response = await axios.post(
      `${FIC_API_URL}/c/${companyId}/entities/clients`,
      createClientPayload,
      {
        headers: {
          'Authorization': `Bearer ${FIC_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`[FATTURA_TRACE] 15. Cliente creato con ID: ${response.data.data.id}`);
    return response.data.data.id;
  } catch (error: any) {
    console.error('Errore durante la creazione di un nuovo cliente:', error.response?.data || error.message);
    if (error.response?.data?.error?.validation_result) {
      console.error('Dettagli validazione:', JSON.stringify(error.response.data.error.validation_result, null, 2));
    }
    throw new Error('Impossibile creare il cliente in Fatture in Cloud.');
  }
}

export type PaymentMethod = 'stripe' | 'bonifico' | 'bonifico_istantaneo' | 'contanti' | 'pos' | 'altro';

// Mapping metodi di pagamento per Fatture in Cloud (codici FatturaPA)
const PAYMENT_METHOD_CODES: { [key in PaymentMethod]: string } = {
  stripe: 'MP08',      // Carta di credito/debito
  bonifico: 'MP05',    // Bonifico bancario
  bonifico_istantaneo: 'MP05', // Bonifico istantaneo (stesso codice del bonifico)
  contanti: 'MP01',    // Contanti
  pos: 'MP08',         // POS (carta)
  altro: 'MP05',       // Altro (default bonifico)
};

const PAYMENT_METHOD_NAMES: { [key in PaymentMethod]: string } = {
  stripe: 'Stripe (Carta)',
  bonifico: 'Bonifico Bancario',
  bonifico_istantaneo: 'Bonifico Istantaneo',
  contanti: 'Contanti',
  pos: 'POS',
  altro: 'Altro',
};

interface PaymentData {
  email: string;
  name: string;
  fiscalCode: string;
  phone: string;
  indirizzo: string;
  cap: string;
  citta: string;
  provincia: string;
  birthDate: string;
  luogoNascita: string;
  serviceName: string;
  serviceDescription: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

/**
 * Crea e invia una fattura per un pagamento diretto.
 */
interface FattureInCloudError extends Error {
  response?: {
    data?: {
      error?: {
        validation_result?: {
          fields?: Record<string, unknown>;
        };
      };
    };
  };
}

/**
 * Crea e invia una fattura tramite Fatture in Cloud.
 */
export async function createAndSendInvoice(paymentData: PaymentData): Promise<{invoiceId: number | null}> {
  const FIC_ACCESS_TOKEN = process.env.FATTUREINCLOUD_ACCESS_TOKEN;
  const FIC_API_URL = 'https://api-v2.fattureincloud.it';

  try {
    const companyId = getCompanyId();

    if (paymentData.amount === 0) {
      console.log(`Skipping invoice: amount is 0.`);
      return { invoiceId: null };
    }

    const clientId = await getOrCreateClient(companyId, paymentData);
    const paymentAccountId = await getPaymentAccountId();
    const exemptVatId = getExemptVatId();

    // Calcola la marca da bollo
    const stampDuty = calculateStampDuty(paymentData.amount);
    const totalWithStampDuty = calculateTotalWithStampDuty(paymentData.amount);

    console.log(`[FATTURA_TRACE] 15. Prezzo servizio: €${paymentData.amount}`);
    console.log(`[FATTURA_TRACE] 16. Marca da bollo: €${stampDuty}`);
    console.log(`[FATTURA_TRACE] 17. Totale con marca da bollo: €${totalWithStampDuty}`);

    // Crea la fattura
    const patientCountry = deduceCountryCode(paymentData.cap, paymentData.phone);
    console.log(`[FATTURA_TRACE] 18. Paese paziente per fattura: ${patientCountry}`);

    const entityData: any = {
      id: clientId,
      name: paymentData.name,
      tax_code: paymentData.fiscalCode || '',
      // Includi l'indirizzo del paziente nella fattura
      address_street: paymentData.indirizzo || '',
      address_postal_code: paymentData.cap || '',
      address_city: paymentData.citta || '',
      address_province: paymentData.provincia || '', // OBBLIGATORIO per fatturazione elettronica
    };

    // Aggiungi country solo se è Italia
    if (patientCountry === 'IT') {
      entityData.country = 'Italia';
    }

    const isPaid = ['stripe', 'pos', 'contanti', 'bonifico_istantaneo'].includes(paymentData.paymentMethod);

    const invoiceData: any = {
      data: {
        type: 'invoice',
        entity: entityData,
        date: new Date().toISOString().slice(0, 10), // Data odierna
        language: { code: 'it' },
        currency: { id: 'EUR', exchange_rate: '1.00000', symbol: '€' },
        show_totals: 'all',
        show_payments: true,
        show_notification_button: false,
        // Fattura elettronica: true = stato "da inviare", false = stato "emessa"
        e_invoice: true,
        // Marca da bollo (obbligatoria per fatture esenti IVA oltre €77,47)
        stamp_duty: stampDuty,
        items_list: [
          {
            name: paymentData.serviceName,
            description: `Prestazione sanitaria esente IVA ai sensi dell'art. 10 DPR 633/72.${paymentData.serviceDescription ? ' ' + paymentData.serviceDescription + '.' : ''}${stampDuty > 0 ? ' Imposta di bollo assolta in modo virtuale - autorizzazione dell\'Ag. delle Entrate, Dir. Prov. II. di Roma Aut. n. 28/2025 del 29/5/2025 ai sensi art.15 del D.P.R. n° 642/72 e succ. modif. e integraz.' : ''}`,
            qty: 1,
            net_price: paymentData.amount,
            // IMPORTANTE: usa l'ID IVA esente configurato (aliquota 0% per prestazioni sanitarie)
            // Questo risolve il problema dell'importo €0,00 nell'elenco fatture
            vat: {
              id: exemptVatId, // ID dell'aliquota IVA esente (da configurare in .env)
              value: 0,
              description: 'Esente art.10'
            }
          },
        ],
        payments_list: [
            {
                // Per fatture elettroniche, il pagamento = solo servizio (la marca da bollo è separata)
                amount: paymentData.amount, // Solo il servizio, bollo in stamp_duty
                due_date: new Date().toISOString().slice(0, 10),
                paid_date: isPaid ? new Date().toISOString().slice(0, 10) : null, // FONDAMENTALE: rende la fattura "saldata"
                status: isPaid ? 'paid' : 'not_paid', // Fattura marcata come PAGATA (paziente paga con Stripe immediatamente)
                payment_terms: {
                  type: 'standard'
                },
                payment_account: (paymentAccountId && isPaid) ? { id: paymentAccountId } : null
            }
        ],
        // Payment method obbligatorio per fatture elettroniche (sistema Tessera Sanitaria)
        ei_data: {
          payment_method: PAYMENT_METHOD_CODES[paymentData.paymentMethod], // MP08 = Pagamento con carta di credito/debito (standard XML FatturaPA)
        },
        show_payment_method: true, // Mostra metodo di pagamento nella fattura
        payment_method: {
          name: PAYMENT_METHOD_NAMES[paymentData.paymentMethod]
        },
      },
    };

    console.log('Payload sent to Fatture in Cloud:', JSON.stringify(invoiceData, null, 2));

    const response = await axios.post(
      `${FIC_API_URL}/c/${companyId}/issued_documents`,
      invoiceData,
      {
        headers: {
          'Authorization': `Bearer ${FIC_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const invoiceId = response.data.data.id;

    console.log(`Fattura ${invoiceId} creata per il pagamento.`);

    return { invoiceId };

  } catch (error: any) {
    console.error("Errore durante la creazione della fattura su Fatture in Cloud:", error.response?.data || error.message);
    if (error.response?.data?.error?.validation_result?.fields) {
      console.error("Fatture in Cloud Validation Errors:", error.response.data.error.validation_result.fields);
    }
    throw error; // Rilancia l'errore per essere gestito a monte
  }
}

/**
 * Scarica il PDF della fattura da Fatture in Cloud
 */
export async function downloadInvoicePdf(companyId: number, invoiceId: number): Promise<Buffer | null> {
  try {
    await getFattureInCloudClient();
    
    // Nota: L'API di Fatture in Cloud potrebbe non avere un endpoint diretto per scaricare PDF
    // Per ora restituiamo null - la fattura viene comunque creata e inviata via email
    console.log(`✅ PDF fattura ${invoiceId} - funzione placeholder`);
    return null; // Placeholder - da implementare con l'API corretta
    
  } catch (error) {
    console.error(`❌ Errore download PDF fattura ${invoiceId}:`, error);
    return null;
  }
}
