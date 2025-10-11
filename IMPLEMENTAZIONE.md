# 📋 Riepilogo Implementazione Paga-Ora

## ✅ Funzionalità Implementate

### 1. **Selezione Metodo di Pagamento**
Aggiunta UI moderna con 5 metodi di pagamento:
- **Carta** (Stripe) - Pagamento online immediato
- **Bonifico** - Pagamento differito con istruzioni IBAN
- **Contanti** - Pagamento in sede già effettuato
- **POS** - Pagamento con terminale già effettuato
- **Altro** - Altri metodi

**File:** `app/page.tsx:230-315`

### 2. **Popup Privacy Dinamico**
Prima del submit, chiede al paziente se ha già firmato la privacy:
- **"Sì, ho già firmato"** → Privacy NON generata
- **"No, è la prima volta"** → Privacy generata e inviata

**File:** `app/page.tsx:607-641`

### 3. **Flusso Pagamento Differenziato**

#### Pagamento Stripe (Carta Online)
```typescript
// app/page.tsx:74-94
if (formData.paymentMethod === 'stripe') {
  // Redirect a Stripe Checkout
  const response = await fetch('/api/checkout', { ... });
  window.location.href = data.url;
}
```

**Processo:**
1. Redirect a Stripe Checkout
2. Pagamento completato
3. Webhook riceve evento
4. Genera privacy (se richiesta)
5. Invia email
6. Crea fattura con `status: 'paid'` e `payment_method: 'MP08'`

#### Pagamento Diretto (Non-Stripe)
```typescript
// app/page.tsx:96-114
else {
  // API diretta per bonifico/contanti/POS
  const response = await fetch('/api/direct-payment', { ... });
  window.location.href = `/success?method=${...}`;
}
```

**Processo:**
1. Chiama `/api/direct-payment`
2. Genera privacy (se richiesta)
3. Invia email
4. Crea fattura con stato basato sul metodo:
   - `paid` per contanti/POS
   - `not_paid` per bonifico

**File:** `app/api/direct-payment/route.ts` (nuovo)

### 4. **Fattura Allineata a Gestione Prenotazioni**

#### Descrizione Standardizzata
```typescript
// lib/fattureincloud.ts:430
description: `Prestazione sanitaria esente IVA ai sensi dell'art. 10 DPR 633/72.${
  paymentData.serviceDescription ? ' ' + paymentData.serviceDescription + '.' : ''
}${
  stampDuty > 0
    ? ' Imposta di bollo assolta in modo virtuale - autorizzazione dell\'Ag. delle Entrate...'
    : ''
}`
```

#### Codici FatturaPA
```typescript
// lib/fattureincloud.ts:336-342
const PAYMENT_METHOD_CODES = {
  stripe: 'MP08',      // Carta di credito/debito
  bonifico: 'MP05',    // Bonifico bancario
  contanti: 'MP01',    // Contanti
  pos: 'MP08',         // POS (carta)
  altro: 'MP05',       // Altro (default bonifico)
};
```

#### Status Pagamento
```typescript
// lib/fattureincloud.ts:412-413
const isPaid = paymentMethod === 'stripe' || paymentMethod === 'pos' || paymentMethod === 'contanti';
const paymentStatus = isPaid ? 'paid' : 'not_paid';
```

#### Account Pagamento
Solo per pagamenti immediati con Stripe:
```typescript
// lib/fattureincloud.ts:449
...(paymentAccountId && isPaid ? { payment_account: { id: paymentAccountId } } : {})
```

**File:** `lib/fattureincloud.ts:333-487`

### 5. **Pagina Success Migliorata**

#### Coordinate Bancarie per Bonifico
```typescript
// app/success/page.tsx:112-155
{paymentMethod === 'bonifico' && (
  <div className="bg-gradient-to-r from-amber-50...">
    <h3>Coordinate Bancarie per Bonifico</h3>
    <div>
      <p>Intestatario: JUNIOR S.R.L.</p>
      <p>IBAN: IT60X0542404294000000123456</p>
      <Button onClick={() => copyToClipboard(...)}>
        {copied ? <CheckCircle2 /> : <Copy />}
      </Button>
      <p>Importo: €{amount}</p>
      <p>Causale: Pagamento servizio - {name}</p>
    </div>
  </div>
)}
```

#### Messaggi Dinamici
```typescript
// app/success/page.tsx:177
La fattura sarà generata automaticamente
{paymentMethod === 'bonifico' ? ' al ricevimento del bonifico' : ' e inviata via email'}
```

**File:** `app/success/page.tsx`

---

## 📁 File Creati/Modificati

### Nuovi File
- ✅ `app/api/direct-payment/route.ts` - API per pagamenti non-Stripe
- ✅ `TEST.md` - Checklist completa di test
- ✅ `IMPLEMENTAZIONE.md` - Questo documento

### File Modificati
- ✅ `app/page.tsx` - Form con metodi pagamento + popup privacy
- ✅ `app/api/checkout/route.ts` - Gestisce `generatePrivacy`
- ✅ `app/api/webhook/route.ts` - Rispetta `generatePrivacy`, passa `paymentMethod: 'stripe'`
- ✅ `app/success/page.tsx` - Istruzioni bonifico + messaggi dinamici
- ✅ `lib/fattureincloud.ts` - Logica metodi pagamento + codici FatturaPA
- ✅ `.env.local` - Variabili corrette di produzione

---

## 🔧 Configurazione

### Variabili d'Ambiente (.env.local)
```bash
# Stripe
STRIPE_PUBLIC_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Fatture in Cloud
FATTUREINCLOUD_ACCESS_TOKEN="a/eyJ0eXAiOiJKV1QiLCJhbGc..."
FATTUREINCLOUD_COMPANY_ID="1467198"
FATTUREINCLOUD_EXEMPT_VAT_ID="6"
FATTUREINCLOUD_PAYMENT_ACCOUNT_ID="1415808"

# Gmail
GMAIL_USER="centrimanna2@gmail.com"
GMAIL_APP_PASSWORD="wffs ptmj adsv gdka"
```

### Dati Aziendali
```
Ragione Sociale: JUNIOR S.R.L.
P.IVA: 05470161000
Sede Legale: Viale Eroi di Rodi 214, 00128 Roma (RM)
Sede Operativa: Via Velletri 7, 00198 Roma (RM)
Tel: 06 841 5269
Email: centrimanna2@gmail.com
PEC: juniorsrlroma@pec.it
```

---

## 🎯 Come Funziona

### Flow Completo - Pagamento Bonifico

1. **Paziente compila form**
   - Importo: €150
   - Servizio: "Visita ginecologica"
   - Metodo: **Bonifico**
   - Dati anagrafici completi

2. **Popup Privacy**
   - "No, è la prima volta" → `generatePrivacy = true`

3. **Submit Form**
   - POST `/api/direct-payment` con tutti i dati
   - API genera privacy PDF
   - API invia email al centro (con privacy allegata)
   - API invia email al cliente
   - API crea fattura su FiC:
     - Status: `not_paid`
     - Codice FatturaPA: `MP05` (bonifico)
     - Descrizione: "Prestazione sanitaria esente IVA..."
     - Marca da bollo: €2.00 (importo > €77.47)

4. **Redirect Success**
   - URL: `/success?method=bonifico&amount=152.00&name=Mario%20Rossi`
   - Mostra box giallo con coordinate bancarie
   - IBAN copiabile: IT60X0542404294000000123456
   - Importo: €152.00
   - Causale: "Pagamento servizio - Mario Rossi"

5. **Paziente Effettua Bonifico**
   - Paziente copia IBAN e va sulla sua app bancaria
   - Effettua bonifico di €152.00
   - Inserisce causale suggerita

6. **Centro Riceve Bonifico**
   - Controlla email con dati paziente
   - Verifica bonifico su conto
   - Va su Fatture in Cloud
   - Marca fattura come "Pagata" manualmente

### Flow Completo - Pagamento Stripe

1. **Paziente compila form**
   - Metodo: **Carta**
   - Popup privacy → scelta

2. **Redirect Stripe Checkout**
   - Metadata include tutti i dati + `generatePrivacy`
   - Paziente inserisce carta: 4242 4242 4242 4242

3. **Webhook Stripe**
   - Riceve `checkout.session.completed`
   - Genera privacy se `generatePrivacy === 'true'`
   - Invia email con/senza privacy
   - Crea fattura:
     - Status: `paid`
     - Codice FatturaPA: `MP08` (carta)
     - Account pagamento: 1415808 (Stripe)
     - Data pagamento: oggi

4. **Success**
   - URL: `/success?session_id=cs_...`
   - Messaggio: "Pagamento completato"
   - Fattura emessa e inviata

---

## 🧪 Test Rapido

### Test 1: Bonifico con Privacy
```bash
# Form:
Importo: 100
Servizio: Test Bonifico
Metodo: Bonifico
Nome: Mario Rossi
Email: test@example.com
CF: RSSMRA80A01H501Z
Data: 01/01/1980
Luogo: Roma
Indirizzo: Via Roma 1, 00100, Roma, RM

# Popup: "No, è la prima volta"
# Risultato atteso:
# - Email centro CON privacy PDF
# - Fattura FiC status: not_paid, MP05
# - Success con coordinate bancarie
```

### Test 2: Contanti senza Privacy
```bash
# Form:
Importo: 50
Servizio: Test Contanti
Metodo: Contanti
[Stessi dati]

# Popup: "Sì, ho già firmato"
# Risultato atteso:
# - Email centro SENZA privacy PDF
# - Fattura FiC status: paid, MP01
# - Success senza coordinate bancarie
```

### Test 3: Stripe con Privacy
```bash
# Form:
Importo: 200
Servizio: Test Stripe
Metodo: Carta
[Stessi dati]

# Popup: "No, è la prima volta"
# Stripe: 4242 4242 4242 4242
# Risultato atteso:
# - Webhook processa pagamento
# - Email con privacy PDF
# - Fattura FiC status: paid, MP08, account: 1415808
```

---

## ⚠️ Note Importanti

### IBAN da Verificare
L'IBAN attuale è un **placeholder**:
```
IT60X0542404294000000123456
```

**TODO:** Sostituire con IBAN reale di JUNIOR S.R.L. in:
- `app/success/page.tsx:130`
- Documentazione aziendale

### Marca da Bollo
- Soglia: €77.47
- Importo: €2.00
- Applicata automaticamente su importi superiori
- Testo autorizzazione incluso nella descrizione fattura

### Privacy PDF
- Generato solo se paziente seleziona "No, è la prima volta"
- Inviato solo al centro (non al cliente)
- Contiene tutti i dati anagrafici + consenso GDPR

### Fatture in Cloud
- ID Aliquota IVA Esente: **6**
- ID Account Pagamento Stripe: **1415808**
- Company ID: **1467198**

---

## 🚀 Prossimi Passi

1. **Test Completo**
   - Seguire checklist in `TEST.md`
   - Verificare ogni metodo di pagamento
   - Controllare fatture su FiC

2. **Verifica IBAN**
   - Ottenere IBAN corretto da azienda
   - Aggiornare in `app/success/page.tsx`

3. **Deploy Produzione**
   - Configurare webhook Stripe su URL produzione
   - Aggiornare `NEXT_PUBLIC_BASE_URL`
   - Testare su staging prima

4. **Documentazione Utente**
   - Guida per staff centro
   - FAQ per pazienti

---

## 📞 Supporto

Per problemi o domande:
- Controllare logs del server: `npm run dev`
- Verificare Stripe Dashboard per pagamenti
- Controllare Fatture in Cloud per fatture
- Email logs in console Node.js

---

**Data Implementazione:** 11 Ottobre 2025
**Versione:** 1.0.0
**Status:** ✅ Pronto per test
