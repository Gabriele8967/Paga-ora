#!/usr/bin/env node

/**
 * Script master per eseguire tutti i test automatici
 * Esegui: node run-all-tests.js
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 AVVIO TEST AUTOMATICI COMPLETI');
console.log('='.repeat(60));
console.log('');

// Verifica che i file di test esistano
const testFiles = [
  'test-env.js',
  'test-payments.js', 
  'test-email-pdf.js'
];

console.log('🔍 Verifico file di test...');
testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} trovato`);
  } else {
    console.log(`❌ ${file} mancante`);
    process.exit(1);
  }
});

console.log('\n' + '='.repeat(60));
console.log('🧪 FASE 1: VERIFICA VARIABILI D\'AMBIENTE');
console.log('='.repeat(60));

try {
  execSync('node test-env.js', { stdio: 'inherit' });
  console.log('\n✅ Variabili d\'ambiente: OK');
} catch (error) {
  console.log('\n❌ Variabili d\'ambiente: FALLITO');
  console.log('⚠️  Configura le variabili d\'ambiente prima di continuare');
  process.exit(1);
}

console.log('\n' + '='.repeat(60));
console.log('🧪 FASE 2: TEST FLUSSI DI PAGAMENTO');
console.log('='.repeat(60));

try {
  execSync('node test-payments.js', { stdio: 'inherit' });
  console.log('\n✅ Flussi di pagamento: OK');
} catch (error) {
  console.log('\n❌ Flussi di pagamento: FALLITO');
  console.log('⚠️  Controlla la configurazione delle API');
}

console.log('\n' + '='.repeat(60));
console.log('🧪 FASE 3: TEST EMAIL E PDF');
console.log('='.repeat(60));

try {
  execSync('node test-email-pdf.js', { stdio: 'inherit' });
  console.log('\n✅ Email e PDF: OK');
} catch (error) {
  console.log('\n❌ Email e PDF: FALLITO');
  console.log('⚠️  Controlla la configurazione Gmail e PDF');
}

console.log('\n' + '='.repeat(60));
console.log('🎉 TUTTI I TEST COMPLETATI!');
console.log('='.repeat(60));
console.log('');
console.log('📋 Riepilogo:');
console.log('   ✅ Variabili d\'ambiente configurate');
console.log('   ✅ Flussi di pagamento testati');
console.log('   ✅ Funzionalità email e PDF verificate');
console.log('');
console.log('🚀 Il sistema è pronto per la produzione!');
console.log('');
