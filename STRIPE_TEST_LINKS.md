# 🔗 Link Test Stripe + Fatture

**Data generazione:** 17 Ottobre 2025
**Stato:** ✅ Sessioni create, in attesa di pagamento

---

## 💳 Test 1: Pagamento SENZA Partner

**Session ID:** `cs_live_b1WnoTm310Sxu1tZ3IDuj8KOxtH36lc3nD6A4b2xu4xHmwU1DPD7SXxQSF`

**Link Checkout:**
```
https://checkout.stripe.com/c/pay/cs_live_b1WnoTm310Sxu1tZ3IDuj8KOxtH36lc3nD6A4b2xu4xHmwU1DPD7SXxQSF
```

**Dati Test:**
- Importo: €150
- Paziente: Paolo Neri Test Stripe
- Documenti salvati in Redis: 2 (fronte + retro)
- Partner: ❌ No

**Carta Test Stripe:**
- Numero: `4242 4242 4242 4242`
- Scadenza: `12/34`
- CVC: `123`

**Cosa Verificare Dopo Pagamento:**
- ✅ Email con 3 allegati (PDF + 2 documenti)
- ✅ Fattura creata su Fatture in Cloud
- ✅ Documenti recuperati da Redis
- ✅ Webhook Stripe eseguito correttamente

---

## 💳 Test 2: Pagamento CON Partner

**Session ID:** `cs_live_b1x42wFuuiwV1kiXjQbRCu8xbdg0NAY65QIUa5gPzhtWDdq4wLzVDjIj1b`

**Link Checkout:**
```
https://checkout.stripe.com/c/pay/cs_live_b1x42wFuuiwV1kiXjQbRCu8xbdg0NAY65QIUa5gPzhtWDdq4wLzVDjIj1b
```

**Dati Test:**
- Importo: €200
- Paziente: Laura Verdi Test Stripe
- Partner: Marco Bianchi Partner
- Documenti salvati in Redis: 4 (paziente + partner)

**Carta Test Stripe:**
- Numero: `4242 4242 4242 4242`
- Scadenza: `12/34`
- CVC: `123`

**Cosa Verificare Dopo Pagamento:**
- ✅ Email con 5 allegati (PDF + 4 documenti)
- ✅ Fattura creata su Fatture in Cloud
- ✅ Documenti paziente + partner recuperati da Redis
- ✅ PDF con sezione DATI PARTNER
- ✅ Webhook Stripe eseguito correttamente

---

## 📋 Checklist Verifica Manuale

### 1. Completa Pagamenti Stripe
- [ ] Apri Link Test 1
- [ ] Completa pagamento con carta test
- [ ] Attendi redirect a pagina success
- [ ] Apri Link Test 2
- [ ] Completa pagamento con carta test
- [ ] Attendi redirect a pagina success

### 2. Verifica Email
- [ ] Apri inbox: `centrimanna2@gmail.com`
- [ ] Cerca email con subject: "Nuovo Pagamento Ricevuto - Paolo Neri Test Stripe"
- [ ] Verifica 3 allegati:
  - [ ] `Modulo_Privacy_Paolo_Neri_Test_Stripe.pdf`
  - [ ] `documento_identita_fronte.jpg`
  - [ ] `documento_identita_retro.jpg`
- [ ] Cerca email con subject: "Nuovo Pagamento Ricevuto - Laura Verdi Test Stripe"
- [ ] Verifica 5 allegati:
  - [ ] `Modulo_Privacy_Laura_Verdi_Test_Stripe.pdf`
  - [ ] `documento_identita_fronte.jpg`
  - [ ] `documento_identita_retro.jpg`
  - [ ] `documento_identita_partner_fronte.jpg`
  - [ ] `documento_identita_partner_retro.jpg`

### 3. Verifica PDF Privacy
- [ ] Apri PDF Test 1
- [ ] Verifica sezione "DATI PAZIENTE PRINCIPALE"
- [ ] Verifica campi: professione, documento, scadenza
- [ ] Apri PDF Test 2
- [ ] Verifica sezione "DATI PAZIENTE PRINCIPALE"
- [ ] **Verifica sezione "DATI PARTNER"** ⭐
- [ ] Verifica tutti campi partner presenti

### 4. Verifica Fatture in Cloud
- [ ] Vai su: https://secure.fattureincloud.it
- [ ] Login con credenziali
- [ ] Cerca fatture di oggi
- [ ] Verifica fattura per "Paolo Neri Test Stripe" (€150)
- [ ] Verifica fattura per "Laura Verdi Test Stripe" (€200)
- [ ] Controlla marca da bollo calcolata correttamente
- [ ] Verifica stato: "Emessa"

### 5. Verifica Logs Vercel
- [ ] Vai su: https://vercel.com/dashboard
- [ ] Seleziona progetto `paga-ora`
- [ ] Vai su **Functions** → Cerca logs webhook
- [ ] Cerca: `📎 Documenti recuperati da KV per sessione cs_live_b1...`
- [ ] Cerca: `📎 Documenti partner recuperati da KV` (solo Test 2)
- [ ] Cerca: `✅ PDF privacy generato (con dati partner)` (solo Test 2)
- [ ] Cerca: `✅ Fattura [ID] creata`
- [ ] Cerca: `🗑️ Documenti eliminati da KV`
- [ ] Verifica nessun errore

### 6. Verifica Redis (Opzionale)
- [ ] Vai su Vercel Dashboard → Storage → Redis
- [ ] Verifica che chiavi `docs:cs_live_b1...` NON esistono più
- [ ] (Devono essere state eliminate dal webhook)

---

## 🔍 Troubleshooting

### ❌ Email non ricevuta
1. Controlla spam/posta indesiderata
2. Verifica logs Vercel per errori invio email
3. Controlla variabile `GMAIL_APP_PASSWORD` configurata

### ❌ Fattura non creata
1. Verifica logs Vercel per errori Fatture in Cloud
2. Controlla variabile `FATTUREINCLOUD_ACCESS_TOKEN`
3. Verifica credenziali API Fatture in Cloud

### ❌ Documenti non allegati
1. Verifica logs: "📎 Documenti recuperati da KV"
2. Se non presente, controlla configurazione Redis
3. Verifica variabile `REDIS_URL` su Vercel

### ❌ Webhook non eseguito
1. Vai su Stripe Dashboard → Developers → Webhooks
2. Verifica endpoint configurato: `https://paga-ora.vercel.app/api/webhook`
3. Controlla eventi ricevuti e risposte
4. Verifica variabile `STRIPE_WEBHOOK_SECRET`

---

## 📊 Risultati Attesi

| Test | Importo | Allegati Email | Fattura | Documenti Redis |
|------|---------|----------------|---------|-----------------|
| Test 1 (No Partner) | €150 | 3 file | ✅ Creata | 2 recuperati + eliminati |
| Test 2 (Con Partner) | €200 | 5 file | ✅ Creata | 4 recuperati + eliminati |

---

## ⚠️ Note Importanti

1. **Carte Test Stripe:** Solo in modalità test. Carte reali non funzioneranno.
2. **Redis TTL:** Documenti scadono dopo 1 ora se webhook non viene eseguito.
3. **Fatture Test:** Le fatture create sono reali su Fatture in Cloud. Puoi eliminarle manualmente se necessario.
4. **Email Test:** Le email vengono inviate realmente a centrimanna2@gmail.com.

---

## ✅ Quando Tutto Funziona

Se tutti i check sono ✅, il sistema è **completamente funzionante** per:
- Pagamenti Stripe con carta
- Upload documenti paziente + partner
- Storage temporaneo Redis
- Generazione PDF dinamico
- Email con allegati multipli
- Fatturazione automatica

🎉 **Sistema pronto per pazienti reali!**
