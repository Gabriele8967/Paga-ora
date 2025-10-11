# Test Paga-Ora - Checklist Completa

## 🧪 Test da Eseguire

### 1. Test UI - Selezione Metodo di Pagamento
- [ ] Aprire http://localhost:3000
- [ ] Verificare che siano visibili 5 metodi di pagamento
- [ ] Cliccare su ogni metodo e verificare il cambio di selezione (bordo blu)
- [ ] Verificare che il testo descrittivo cambi per ogni metodo

**Metodi da testare:**
- Carta (default)
- Bonifico
- Contanti
- POS
- Altro

---

### 2. Test Validazione Codice Fiscale
- [ ] Compilare i campi con dati di test
- [ ] Inserire CF valido: `RSSMRA80A01H501Z`
- [ ] Verificare icona verde ✓
- [ ] Inserire CF non valido: `ABCDEF12G34H567I`
- [ ] Verificare icona rossa ✗ e messaggio di errore

---

### 3. Test Popup Privacy
- [ ] Compilare tutto il form con importo €100
- [ ] Cliccare su "Procedi al Pagamento"
- [ ] Verificare che appaia il popup privacy
- [ ] Testare entrambe le opzioni:
  - "Sì, ho già firmato" → `generatePrivacy = false`
  - "No, è la prima volta" → `generatePrivacy = true`
- [ ] Verificare che "Annulla" chiuda il popup

---

### 4. Test Pagamento con BONIFICO (non-Stripe)

**Dati di test:**
```
Importo: €150.00
Servizio: Visita ginecologica
Metodo: Bonifico
Nome: Mario Rossi
Email: test@example.com
CF: RSSMRA80A01H501Z
Data nascita: 01/01/1980
Luogo nascita: Roma
Indirizzo: Via Roma 1, 00100, Roma, RM
```

**Verifiche:**
- [ ] Dopo submit, redirect a `/success?method=bonifico&amount=152.00&name=Mario%20Rossi`
- [ ] Pagina success mostra box giallo con coordinate bancarie
- [ ] IBAN copiabile con pulsante
- [ ] Importo mostrato: €152.00 (include marca da bollo €2)
- [ ] Causale suggerita presente

**Backend (controllare logs):**
- [ ] API `/api/direct-payment` chiamata
- [ ] Privacy PDF generata (se richiesta)
- [ ] Email inviata al centro
- [ ] Email inviata al cliente
- [ ] Fattura creata su FiC con status `not_paid`
- [ ] Codice pagamento FatturaPA: `MP05` (bonifico)

---

### 5. Test Pagamento con CONTANTI (non-Stripe)

**Dati di test:**
```
Importo: €50.00
Servizio: Ecografia
Metodo: Contanti
[Stessi dati anagrafici]
```

**Verifiche:**
- [ ] Redirect a success con `method=contanti`
- [ ] Nessun box coordinate bancarie
- [ ] Messaggio: "Pagamento in contanti già effettuato in sede"
- [ ] Fattura creata con status `paid`
- [ ] Codice pagamento FatturaPA: `MP01` (contanti)
- [ ] Account pagamento NON impostato (contanti)

---

### 6. Test Pagamento con POS (non-Stripe)

**Dati di test:**
```
Importo: €200.00
Servizio: Visita specialistica
Metodo: POS
```

**Verifiche:**
- [ ] Redirect a success con `method=pos`
- [ ] Fattura creata con status `paid`
- [ ] Codice pagamento FatturaPA: `MP08` (carta)
- [ ] Account pagamento NON impostato

---

### 7. Test Pagamento con STRIPE (carta online)

**Dati di test:**
```
Importo: €100.00
Servizio: Consulenza
Metodo: Carta (Stripe)
```

**Verifiche:**
- [ ] Redirect a Stripe Checkout
- [ ] Usare carta di test: `4242 4242 4242 4242`, exp `12/34`, CVV `123`
- [ ] Dopo pagamento, redirect a `/success?session_id=...`
- [ ] Webhook ricevuto e processato
- [ ] Fattura creata con status `paid`
- [ ] Codice pagamento FatturaPA: `MP08` (carta)
- [ ] Account pagamento ID: `1415808` (Stripe)

---

### 8. Test Privacy Condizionale

**Test A - CON generazione privacy:**
- [ ] Form compilato, popup → "No, è la prima volta"
- [ ] Verificare nei logs: `✅ PDF privacy generato`
- [ ] Email al centro contiene allegato PDF privacy
- [ ] Email al cliente menziona privacy

**Test B - SENZA generazione privacy:**
- [ ] Form compilato, popup → "Sì, ho già firmato"
- [ ] Verificare nei logs: `⏩ Generazione PDF privacy saltata`
- [ ] Email al centro NON contiene allegato PDF
- [ ] Fattura comunque creata normalmente

---

### 9. Test Fattura - Verifica su Fatture in Cloud

Accedere a https://fattureincloud.it e verificare:

**Campi fattura:**
- [ ] Cliente trovato/creato correttamente
- [ ] Descrizione: "Prestazione sanitaria esente IVA ai sensi dell'art. 10 DPR 633/72..."
- [ ] IVA: Esente art.10 (ID: 6)
- [ ] Marca da bollo: €2.00 (solo se importo > €77.47)
- [ ] Testo marca da bollo presente nella descrizione
- [ ] Metodo pagamento visualizzato correttamente
- [ ] Codice FatturaPA corretto (ei_data.payment_method)
- [ ] Status pagamento:
  - `paid` per Stripe, POS, Contanti
  - `not_paid` per Bonifico
- [ ] Account pagamento (solo per Stripe se paid)

---

### 10. Test Email

**Email al centro (centrimanna2@gmail.com):**
- [ ] Subject: "Nuovo Pagamento Ricevuto - [Nome Paziente]"
- [ ] Contiene tutti i dati del paziente
- [ ] Contiene codice fiscale
- [ ] Allegato PDF privacy (solo se generata)

**Email al cliente:**
- [ ] Subject: "Conferma Pagamento - Centro Biofertility"
- [ ] Ringraziamento
- [ ] Riepilogo servizio e importo
- [ ] Menzione fattura
- [ ] Contatti del centro

---

### 11. Test Calcolo Marca da Bollo

| Importo | Marca da Bollo | Totale | Note |
|---------|----------------|--------|------|
| €50.00  | €0.00         | €50.00 | < soglia |
| €77.47  | €0.00         | €77.47 | = soglia |
| €77.48  | €2.00         | €79.48 | > soglia |
| €100.00 | €2.00         | €102.00 | > soglia |
| €150.00 | €2.00         | €152.00 | > soglia |

- [ ] Verificare calcoli corretti nel form
- [ ] Verificare totali corretti su Stripe
- [ ] Verificare marca da bollo su fattura FiC

---

### 12. Test Responsività

- [ ] Desktop (> 1024px)
- [ ] Tablet (768px - 1024px)
- [ ] Mobile (< 768px)
- [ ] Selezione metodi pagamento responsive (2 col → 3 col)
- [ ] Form leggibile e utilizzabile

---

### 13. Test Errori

**Validazione form:**
- [ ] Submit con campi vuoti → errori visibili
- [ ] CF non valido → blocco submit con messaggio
- [ ] CF non coerente con dati → warning

**Errori API:**
- [ ] Token FiC non valido → log errore, messaggio utente
- [ ] Stripe key non valida → errore creazione sessione
- [ ] Gmail credentials errate → log errore invio email

---

## 📊 Checklist Finale

### Funzionalità Core
- [ ] Selezione metodo pagamento funzionante
- [ ] Popup privacy dinamico funzionante
- [ ] Pagamento Stripe (carta) funzionante
- [ ] Pagamento bonifico con istruzioni
- [ ] Pagamento contanti registrato
- [ ] Pagamento POS registrato
- [ ] Validazione CF intelligente

### Integrazioni
- [ ] Fatture in Cloud: fatture create correttamente
- [ ] Stripe: checkout e webhook funzionanti
- [ ] Gmail: email inviate correttamente
- [ ] PDF Privacy: generato quando richiesto

### Design
- [ ] UI moderna e professionale
- [ ] Form leggibili con buon contrasto
- [ ] Animazioni fluide
- [ ] Icone appropriate
- [ ] Responsive su tutti i device

### Sicurezza & Privacy
- [ ] Variabili sensibili in .env
- [ ] GDPR: consenso privacy richiesto
- [ ] Dati sensibili non loggati
- [ ] HTTPS in produzione

---

## 🚀 Deploy Production

Prima del deploy:
- [ ] Aggiornare `NEXT_PUBLIC_BASE_URL` con URL produzione
- [ ] Verificare webhook Stripe configurato
- [ ] Verificare IBAN corretto nella pagina success
- [ ] Test completo su staging
- [ ] Backup database (se presente)

---

## 📝 Note

**Coordinate Bancarie Attuali (da verificare):**
- Intestatario: JUNIOR S.R.L.
- IBAN: IT60X0542404294000000123456 ⚠️ **DA VERIFICARE CON AZIENDA**

**Contatti Centro:**
- Tel: 06 841 5269
- Email: centrimanna2@gmail.com
- PEC: juniorsrlroma@pec.it
