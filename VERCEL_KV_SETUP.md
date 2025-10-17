# Configurazione Vercel KV per Upload Documenti

## 📋 Panoramica

Vercel KV (basato su Redis) viene utilizzato per salvare temporaneamente i documenti di identità durante il processo di checkout Stripe, poiché i metadata di Stripe hanno un limite di ~500 caratteri.

## 🔧 Setup Produzione (Vercel)

### 1. Crea Database KV

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il tuo progetto `paga-ora`
3. Vai su **Storage** → **Create Database**
4. Seleziona **KV** (Redis)
5. Dai un nome (es: `paga-ora-documents`)
6. Scegli la regione più vicina (es: `Frankfurt, Germany - fra1`)
7. Clicca **Create**

### 2. Collega al Progetto

1. Nella pagina del database appena creato
2. Vai su **Settings** → **Connect**
3. Seleziona il progetto `paga-ora`
4. Seleziona gli ambienti: `Production`, `Preview`, `Development`
5. Clicca **Connect**

✅ **Le variabili d'ambiente vengono configurate automaticamente!**

### 3. Deploy

```bash
git push origin main
```

Vercel farà automaticamente il deploy con le nuove variabili d'ambiente.

## 🧪 Setup Locale (Opzionale)

Per testare in locale, puoi usare Upstash Redis gratuito:

### 1. Crea Account Upstash

1. Vai su [upstash.com](https://upstash.com)
2. Crea account gratuito
3. Crea nuovo database Redis
4. Seleziona regione più vicina
5. Copia le credenziali REST API

### 2. Configura `.env.local`

Crea `.env.local` e aggiungi:

```bash
KV_REST_API_URL=https://your-database.upstash.io
KV_REST_API_TOKEN=your-token-here
```

## 🔍 Come Funziona

### Flusso Pagamento con Carta (Stripe)

1. **Checkout** (`/api/checkout`)
   - Utente carica documenti (fronte/retro)
   - Documenti compressi lato client (max 1.5MB ciascuno)
   - Salvati in KV con chiave `docs:{session.id}`
   - Scadono automaticamente dopo 1 ora

2. **Webhook** (`/api/webhook`)
   - Pagamento completato
   - Recupera documenti da KV usando `session.id`
   - Allega documenti all'email
   - Elimina documenti da KV

### Flusso Pagamento Diretto (Bonifico/Contanti)

1. **Direct Payment** (`/api/direct-payment`)
   - Documenti inviati direttamente nel payload
   - Convertiti in buffer e allegati all'email
   - Nessun uso di KV necessario

## 📊 Limiti Piano Gratuito

| Caratteristica | Limite Gratuito |
|----------------|-----------------|
| Storage | 256 MB |
| Richieste/giorno | 10,000 |
| Bandwidth | 200 MB/giorno |
| TTL (Time To Live) | Sì (usato: 1h) |

**Stima utilizzo:**
- Documento fronte: ~500KB compressi
- Documento retro: ~500KB compressi
- Totale per transazione: ~1MB
- **Capacità:** ~256 transazioni in memoria simultanea
- Con TTL 1h e auto-eliminazione: praticamente illimitato

## 🛡️ Sicurezza

- ✅ Documenti scadono dopo 1 ora (TTL)
- ✅ Eliminazione automatica dopo invio email
- ✅ Nessun salvataggio permanente
- ✅ Connessione TLS crittografata
- ✅ Solo accessibile da backend Vercel

## 🐛 Troubleshooting

### Errore: "KV is not configured"

**Soluzione:**
1. Verifica che KV sia collegato al progetto su Vercel
2. Controlla variabili d'ambiente in Vercel Dashboard
3. Rideploy il progetto

### Documenti non allegati alle email

**Controllo:**
1. Verifica logs Vercel: `vercel logs`
2. Cerca: `"📎 Documenti salvati in KV"`
3. Cerca: `"📎 Documenti recuperati da KV"`

Se vedi solo il primo ma non il secondo, potrebbe esserci un problema di sincronizzazione webhook.

### In locale: "Cannot connect to KV"

È normale se non hai configurato Upstash. L'app funziona comunque senza documenti.

**Per testare con documenti in locale:**
1. Segui setup Upstash sopra
2. Configura `.env.local`
3. Riavvia dev server: `npm run dev`

## 📝 Note Tecniche

- Chiavi KV: `docs:{stripe_session_id}`
- Formato dati: JSON con `documentFrontData`, `documentBackData`, ecc.
- Encoding: Base64 nel KV, convertito in Buffer per email
- Compressione: Lato client prima dell'upload

## 🆘 Supporto

Per problemi con Vercel KV:
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
