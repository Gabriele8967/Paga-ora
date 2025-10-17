# 🧪 Test Suite - Paga Ora

Sistema di test automatico completo per verificare tutti i flussi di pagamento e funzionalità.

## 🚀 Test Rapidi

### Test Completo
```bash
npm test
# oppure
node run-all-tests.js
```

### Test Singoli
```bash
# Test variabili d'ambiente
npm run test:env

# Test flussi di pagamento
npm run test:payments

# Test email e PDF
npm run test:email

# Test locale
npm run test:local

# Test produzione
npm run test:production
```

## 📋 Cosa Testa

### 1. **Variabili d'Ambiente** (`test-env.js`)
- ✅ Verifica che tutte le variabili d'ambiente siano configurate
- ✅ Controlla Stripe, Fatture in Cloud, Gmail, Company Info
- ✅ Valida indirizzi e configurazioni applicazione

### 2. **Flussi di Pagamento** (`test-payments.js`)
- ✅ **Stripe Checkout** - Pagamento con carta
- ✅ **Bonifico Istantaneo** - Pagamento istantaneo
- ✅ **Contanti** - Pagamento in contanti
- ✅ **POS** - Pagamento con POS
- ✅ **Altro** - Altri metodi di pagamento

### 3. **Email e PDF** (`test-email-pdf.js`)
- ✅ **Generazione PDF Privacy** - Creazione documento privacy
- ✅ **Email Centro** - Notifica al centro
- ✅ **Email Cliente** - Conferma al cliente
- ✅ **Creazione Fattura** - Generazione fattura automatica
- ✅ **Invio Fattura** - Email fattura per bonifici istantanei
- ✅ **Webhook Stripe** - Gestione notifiche Stripe

## 🔧 Configurazione

### Variabili d'Ambiente Richieste

#### Stripe
- `STRIPE_PUBLIC_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

#### Fatture in Cloud
- `FATTUREINCLOUD_ACCESS_TOKEN`
- `FATTUREINCLOUD_COMPANY_ID`
- `FATTUREINCLOUD_PAYMENT_ACCOUNT_ID`
- `FATTUREINCLOUD_EXEMPT_VAT_ID`

#### Gmail
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

#### Company Info
- `COMPANY_NAME`
- `COMPANY_LEGAL_NAME`
- `COMPANY_VAT_NUMBER`
- `COMPANY_PEC`
- `COMPANY_PHONE`
- `COMPANY_EMAIL`
- `COMPANY_SUPPORT_EMAIL`

#### Indirizzi
- `COMPANY_LEGAL_ADDRESS_*`
- `COMPANY_OPERATIONAL_ADDRESS_*`

#### App Config
- `NEXT_PUBLIC_BASE_URL`
- `NODE_ENV`
- `LOG_LEVEL`

## 🤖 CI/CD

### GitHub Actions
I test vengono eseguiti automaticamente:
- **Push su main** - Test completi
- **Pull Request** - Test di build
- **Test Produzione** - Con variabili reali

### Vercel
- Build automatico con test
- Deploy solo se i test passano
- Variabili d'ambiente validate

## 📊 Risultati Test

### ✅ Successo
```
🎉 TUTTI I TEST SUPERATI! Il sistema è funzionante.
📈 Risultato: 6/6 test superati
```

### ❌ Fallimento
```
⚠️  Alcuni test sono falliti. Controlla i log sopra.
📈 Risultato: 4/6 test superati
```

## 🐛 Debug

### Test Falliti
1. **Controlla variabili d'ambiente** - `npm run test:env`
2. **Verifica API keys** - Stripe, Fatture in Cloud, Gmail
3. **Controlla log** - Errori specifici nei test
4. **Test singoli** - Isola il problema

### Log Dettagliati
I test mostrano:
- ✅ Status di ogni operazione
- 📋 Dettagli errori
- 🔍 Informazioni di debug
- 📊 Riepilogo finale

## 🚀 Deploy

### Automatico
- Push su `main` → Test → Deploy su Vercel
- Solo se tutti i test passano

### Manuale
```bash
# Test locale
npm run test:local

# Test produzione
npm run test:production

# Deploy manuale
vercel --prod
```

## 📝 Note

- I test usano dati di test (non reali)
- Le email di test vanno a indirizzi di test
- Le fatture di test hanno prefisso "TEST"
- I pagamenti Stripe usano chiavi di test

## 🔄 Aggiornamenti

Per aggiungere nuovi test:
1. Modifica i file `test-*.js`
2. Aggiungi nuovi script in `package.json`
3. Aggiorna `.github/workflows/test.yml`
4. Testa localmente prima del commit
