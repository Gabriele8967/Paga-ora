#!/usr/bin/env node

/**
 * Test script per verificare che tutte le variabili d'ambiente siano configurate
 * Esegui: node test-env.js
 */

console.log('🔍 Verifico configurazione variabili d\'ambiente...\n');

const requiredEnvVars = [
  // Stripe
  'STRIPE_PUBLIC_KEY',
  'STRIPE_SECRET_KEY', 
  'STRIPE_WEBHOOK_SECRET',
  
  // Fatture in Cloud
  'FATTUREINCLOUD_ACCESS_TOKEN',
  'FATTUREINCLOUD_COMPANY_ID',
  'FATTUREINCLOUD_PAYMENT_ACCOUNT_ID',
  'FATTUREINCLOUD_EXEMPT_VAT_ID',
  
  // Gmail
  'GMAIL_USER',
  'GMAIL_APP_PASSWORD',
  
  // Company Info
  'COMPANY_NAME',
  'COMPANY_LEGAL_NAME',
  'COMPANY_VAT_NUMBER',
  'COMPANY_PEC',
  'COMPANY_PHONE',
  'COMPANY_EMAIL',
  'COMPANY_SUPPORT_EMAIL',
  
  // Addresses
  'COMPANY_LEGAL_ADDRESS_STREET',
  'COMPANY_LEGAL_ADDRESS_CITY',
  'COMPANY_LEGAL_ADDRESS_PROVINCE',
  'COMPANY_LEGAL_ADDRESS_POSTAL_CODE',
  'COMPANY_LEGAL_ADDRESS_COUNTRY',
  'COMPANY_OPERATIONAL_ADDRESS_STREET',
  'COMPANY_OPERATIONAL_ADDRESS_CITY',
  'COMPANY_OPERATIONAL_ADDRESS_PROVINCE',
  'COMPANY_OPERATIONAL_ADDRESS_POSTAL_CODE',
  'COMPANY_OPERATIONAL_ADDRESS_COUNTRY',
  
  // App Config
  'NEXT_PUBLIC_BASE_URL',
  'NODE_ENV',
  'LOG_LEVEL'
];

let allConfigured = true;

console.log('📋 Variabili obbligatorie:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
  } else {
    console.log(`❌ ${envVar}: NON CONFIGURATA`);
    allConfigured = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allConfigured) {
  console.log('🎉 Tutte le variabili d\'ambiente sono configurate correttamente!');
  console.log('✅ Il progetto è pronto per il deploy.');
} else {
  console.log('⚠️  Alcune variabili d\'ambiente mancano!');
  console.log('❌ Configura le variabili mancanti su Vercel prima del deploy.');
  process.exit(1);
}

console.log('\n🚀 Test completato con successo!');
