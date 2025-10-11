# Paga-Ora - Centro Biofertility

Sistema di pagamento standalone per pazienti che hanno già usufruito di un servizio presso il Centro Biofertility.

## Caratteristiche

- ✅ Form di pagamento con dati anagrafici completi
- ✅ Inserimento importo e causale personalizzati
- ✅ Pagamento sicuro tramite Stripe
- ✅ Generazione automatica fattura con Fatture in Cloud
- ✅ Invio email conferma cliente e centro
- ✅ Generazione e invio modulo privacy
- ✅ Calcolo automatico marca da bollo
- ✅ Ottimizzato per deploy su Vercel

## Installazione

```bash
npm install
```

## Configurazione

1. Copia `.env.example` in `.env.local`:
```bash
cp .env.example .env.local
```

2. Compila le variabili d'ambiente nel file `.env.local`:

### Stripe
- Ottieni le chiavi da: https://dashboard.stripe.com/apikeys
- Configura il webhook endpoint su: https://dashboard.stripe.com/webhooks
- Eventi webhook necessari: `checkout.session.completed`

### Fatture in Cloud
- `FATTUREINCLOUD_ACCESS_TOKEN`: Token API da Impostazioni > API
- `FATTUREINCLOUD_COMPANY_ID`: ID azienda
- `FATTUREINCLOUD_PAYMENT_ACCOUNT_ID`: ID conto pagamento Stripe/Carta
- `FATTUREINCLOUD_EXEMPT_VAT_ID`: ID aliquota IVA esente (0% per prestazioni sanitarie)

### Gmail
- Abilita autenticazione a 2 fattori sul tuo account Gmail
- Crea una "Password per le app": https://myaccount.google.com/apppasswords
- Usa quella password per `GMAIL_APP_PASSWORD`

## Sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

## Deploy su Vercel

1. Fai il push del progetto su GitHub

2. Importa il progetto su Vercel:
```bash
vercel
```

3. Configura le variabili d'ambiente su Vercel Dashboard:
   - Settings > Environment Variables
   - Aggiungi tutte le variabili da `.env.local`
   - **IMPORTANTE**: Imposta `NEXT_PUBLIC_BASE_URL` con l'URL production (es: `https://paga-ora.vercel.app`)

4. Configura il webhook Stripe:
   - Vai su https://dashboard.stripe.com/webhooks
   - Aggiungi endpoint: `https://your-domain.vercel.app/api/webhook`
   - Seleziona evento: `checkout.session.completed`
   - Copia il webhook secret e aggiornalo su Vercel

## Testing Webhook in Locale

Per testare i webhook Stripe in locale, usa Stripe CLI:

```bash
# Installa Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhook a localhost
stripe listen --forward-to localhost:3000/api/webhook
```

## Stack Tecnologico

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Pagamenti**: Stripe
- **Fatturazione**: Fatture in Cloud API
- **Email**: Nodemailer (Gmail)
- **PDF**: pdf-lib

## Flusso di Pagamento

1. Cliente compila form con importo, causale e dati anagrafici
2. Viene creata una sessione Stripe Checkout
3. Cliente effettua pagamento su Stripe
4. Webhook Stripe riceve conferma pagamento
5. Sistema genera:
   - PDF modulo privacy
   - Email conferma al cliente
   - Email notifica al centro con privacy allegata
   - Fattura su Fatture in Cloud
6. Cliente reindirizzato a pagina successo

## Note Importanti

- Le fatture includono automaticamente la marca da bollo (€2,00) per importi superiori a €77,47
- I dati sensibili sono trattati secondo GDPR
- Il sistema NON salva i dati su database (stateless)
- Tutti i dati sono trasmessi via metadata Stripe e poi scartati dopo l'elaborazione

## Supporto

Per problemi o domande:
- Email: centrimanna2@gmail.com
- Tel: 06 841 5269
