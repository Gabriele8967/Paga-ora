import axios from 'axios';

interface FICAccount {
  id: number;
  name: string;
}

interface FICAccountsResponse {
  data: FICAccount[];
}

interface FICClient {
  id: number;
  name: string;
  email: string;
  phone: string;
  address_street: string;
  address_postal_code: string;
  address_city: string;
  address_province: string;
}

interface FICClientsResponse {
  data: FICClient[];
}

interface FICClientResponse {
  data: FICClient;
}

/**
 * Recupera il company ID di Fatture in Cloud dalle variabili d'ambiente.
 */
function getCompanyId(): number {
  const companyId = process.env.FATTUREINCLOUD_COMPANY_ID;
  if (!companyId) {
    console.warn('FATTUREINCLOUD_COMPANY_ID non configurato, usando company ID di default');
    return 0;
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
 */
async function getPaymentAccountId(): Promise<number | null> {
  const configuredId = process.env.FATTUREINCLOUD_PAYMENT_ACCOUNT_ID;
  if (configuredId) {
    return parseInt(configuredId, 10);
  }

  const FIC_ACCESS_TOKEN = process.env.FATTUREINCLOUD_ACCESS_TOKEN;
  const companyId = getCompanyId();

  try {
    const response = await axios.get<FICAccountsResponse>(
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
      let selectedAccount = accounts.find((acc) =>
        acc.name.toLowerCase().includes('stripe') ||
        acc.name.toLowerCase().includes('carta') ||
        acc.name.toLowerCase().includes('card')
      );

      if (!selectedAccount) {
        selectedAccount = accounts[0];
        console.warn(`⚠️  Nessun conto Stripe/Carta trovato, usando: ${selectedAccount.name}`);
      } else {
        console.log(`✅ Conto pagamento per Stripe: ${selectedAccount.name}`);
      }

      return selectedAccount.id;
    }
  } catch (error) {
    console.error('❌ Errore recupero conti di pagamento:', error);
  }

  console.warn('⚠️ FATTUREINCLOUD_PAYMENT_ACCOUNT_ID non configurato');
  return null;
}

/**
 * Recupera l'ID dell'aliquota IVA esente per prestazioni sanitarie.
 */
function getExemptVatId(): number {
  const exemptVatId = process.env.FATTUREINCLOUD_EXEMPT_VAT_ID;
  if (!exemptVatId) {
    console.warn('⚠️  FATTUREINCLOUD_EXEMPT_VAT_ID non configurato!');
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

async function getOrCreateClient(companyId: number, patient: PatientData): Promise<number> {
  const FIC_ACCESS_TOKEN = process.env.FATTUREINCLOUD_ACCESS_TOKEN;
  const FIC_API_URL = 'https://api-v2.fattureincloud.it';

  // 1. Cerca per Email
  if (patient.email) {
    try {
      const response = await axios.get<FICClientsResponse>(
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
        console.log(`✅ Cliente trovato per EMAIL su FiC: ID ${clientId}`);

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
            console.log(`✅ Cliente aggiornato con successo su FiC`);
          } catch (updateError: any) {
            console.error('Errore durante aggiornamento cliente:', updateError.response?.data || updateError.message);
          }
        }

        return clientId;
      }
    } catch (error: any) {
      console.warn('Errore durante la ricerca cliente per email:', error.response?.data || error.message);
    }
  }

  // 2. Cerca per Codice Fiscale
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

        console.log(`✅ Cliente trovato per CF su FiC: ID ${clientId}`);

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
            console.log(`✅ Cliente aggiornato con successo su FiC`);
          } catch (updateError: any) {
            console.error('Errore durante aggiornamento cliente:', updateError.response?.data || updateError.message);
          }
        }

        return clientId;
      }
    } catch (error: any) {
      console.warn('Errore durante la ricerca cliente per codice fiscale:', error.response?.data || error.message);
    }
  }

  // 3. Crea un nuovo cliente
  const [firstName, ...lastNameParts] = patient.name.split(' ');
  const lastName = lastNameParts.join(' ');
  const country = deduceCountryCode(patient.cap, patient.phone);

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

  if (country === 'IT') {
    createClientPayload.data.country = 'Italia';
  }

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
    console.log(`✅ Cliente creato con ID: ${response.data.data.id}`);
    return response.data.data.id;
  } catch (error: any) {
    console.error('Errore durante la creazione cliente:', error.response?.data || error.message);
    throw new Error('Impossibile creare il cliente in Fatture in Cloud.');
  }
}

export type PaymentMethod = 'stripe' | 'bonifico' | 'contanti' | 'pos' | 'altro';

// Mapping metodi di pagamento per Fatture in Cloud (codici FatturaPA)
const PAYMENT_METHOD_CODES: { [key in PaymentMethod]: string } = {
  stripe: 'MP08',      // Carta di credito/debito
  bonifico: 'MP05',    // Bonifico bancario
  contanti: 'MP01',    // Contanti
  pos: 'MP08',         // POS (carta)
  altro: 'MP05',       // Altro (default bonifico)
};

const PAYMENT_METHOD_NAMES: { [key in PaymentMethod]: string } = {
  stripe: 'Stripe (Carta)',
  bonifico: 'Bonifico Bancario',
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

    const stampDuty = calculateStampDuty(paymentData.amount);
    const totalWithStampDuty = calculateTotalWithStampDuty(paymentData.amount);

    console.log(`Prezzo servizio: €${paymentData.amount}`);
    console.log(`Marca da bollo: €${stampDuty}`);
    console.log(`Totale: €${totalWithStampDuty}`);

    const patientCountry = deduceCountryCode(paymentData.cap, paymentData.phone);

    const entityData: any = {
      id: clientId,
      name: paymentData.name,
      tax_code: paymentData.fiscalCode || '',
      address_street: paymentData.indirizzo || '',
      address_postal_code: paymentData.cap || '',
      address_city: paymentData.citta || '',
      address_province: paymentData.provincia || '',
    };

    if (patientCountry === 'IT') {
      entityData.country = 'Italia';
    }

    // Determina se il pagamento è già stato effettuato
    const isPaid = paymentData.paymentMethod === 'stripe' || paymentData.paymentMethod === 'pos' || paymentData.paymentMethod === 'contanti';
    const paymentStatus = isPaid ? 'paid' : 'not_paid';

    const invoiceData: any = {
      data: {
        type: 'invoice',
        entity: entityData,
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
            name: paymentData.serviceName,
            description: `Prestazione sanitaria esente IVA ai sensi dell'art. 10 DPR 633/72.${paymentData.serviceDescription ? ' ' + paymentData.serviceDescription + '.' : ''}${stampDuty > 0 ? ' Imposta di bollo assolta in modo virtuale - autorizzazione dell\'Ag. delle Entrate, Dir. Prov. II. di Roma Aut. n. 28/2025 del 29/5/2025 ai sensi art.15 del D.P.R. n° 642/72 e succ. modif. e integraz.' : ''}`,
            qty: 1,
            net_price: paymentData.amount,
            vat: {
              id: exemptVatId,
              value: 0,
              description: 'Esente art.10'
            }
          },
        ],
        payments_list: [
          {
            amount: paymentData.amount,
            due_date: new Date().toISOString().slice(0, 10),
            ...(isPaid ? { paid_date: new Date().toISOString().slice(0, 10) } : {}),
            status: paymentStatus,
            payment_terms: {
              type: 'standard'
            },
            ...(paymentAccountId && isPaid ? { payment_account: { id: paymentAccountId } } : {}),
          }
        ],
        ei_data: {
          payment_method: PAYMENT_METHOD_CODES[paymentData.paymentMethod],
        },
        show_payment_method: true,
        payment_method: {
          name: PAYMENT_METHOD_NAMES[paymentData.paymentMethod]
        },
      },
    };

    console.log('Payload inviato a Fatture in Cloud:', JSON.stringify(invoiceData, null, 2));

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
    console.log(`✅ Fattura ${invoiceId} creata.`);

    return { invoiceId };

  } catch (error: any) {
    console.error("Errore creazione fattura:", error.response?.data || error.message);
    if (error.response?.data?.error?.validation_result?.fields) {
      console.error("Validation Errors:", error.response.data.error.validation_result.fields);
    }
    throw error;
  }
}
