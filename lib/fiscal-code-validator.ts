/**
 * Validatore intelligente del Codice Fiscale Italiano
 * Verifica sia la correttezza formale che la coerenza con i dati anagrafici
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface PersonData {
  name: string;
  birthDate: string;
  fiscalCode: string;
}

// Tabella conversione mesi
const MONTH_CODES: { [key: number]: string } = {
  1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'H',
  7: 'L', 8: 'M', 9: 'P', 10: 'R', 11: 'S', 12: 'T'
};

// Tabella per il carattere di controllo
const ODD_CHARS: { [key: string]: number } = {
  '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
  'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
  'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
  'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
};

const EVEN_CHARS: { [key: string]: number } = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
  'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
  'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
};

const CHECK_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Estrae le consonanti da una stringa
 */
function getConsonants(str: string): string {
  return str.toUpperCase().replace(/[^BCDFGHJKLMNPQRSTVWXYZ]/g, '');
}

/**
 * Estrae le vocali da una stringa
 */
function getVowels(str: string): string {
  return str.toUpperCase().replace(/[^AEIOU]/g, '');
}

/**
 * Calcola il carattere di controllo del codice fiscale
 */
function calculateCheckChar(fiscalCode: string): string {
  const code = fiscalCode.substring(0, 15).toUpperCase();
  let sum = 0;

  for (let i = 0; i < 15; i++) {
    const char = code[i];
    if (i % 2 === 0) {
      sum += ODD_CHARS[char] || 0;
    } else {
      sum += EVEN_CHARS[char] || 0;
    }
  }

  return CHECK_CHARS[sum % 26];
}

/**
 * Valida il formato del codice fiscale
 */
function validateFormat(fiscalCode: string): { valid: boolean; error?: string } {
  const fc = fiscalCode.toUpperCase().trim();

  if (fc.length !== 16) {
    return { valid: false, error: 'Il codice fiscale deve essere di 16 caratteri' };
  }

  if (!/^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/.test(fc)) {
    return { valid: false, error: 'Formato del codice fiscale non valido' };
  }

  // Verifica carattere di controllo
  const expectedCheck = calculateCheckChar(fc);
  if (fc[15] !== expectedCheck) {
    return { valid: false, error: `Carattere di controllo errato (atteso: ${expectedCheck})` };
  }

  return { valid: true };
}

/**
 * Estrae la data di nascita dal codice fiscale
 */
function extractBirthDate(fiscalCode: string): Date | null {
  try {
    const fc = fiscalCode.toUpperCase();
    let year = parseInt(fc.substring(6, 8), 10);
    const monthChar = fc[8];
    let day = parseInt(fc.substring(9, 11), 10);

    // Determina il sesso e correggi il giorno
    const isFemale = day > 40;
    if (isFemale) {
      day -= 40;
    }

    // Trova il mese
    const month = Object.keys(MONTH_CODES).find(
      key => MONTH_CODES[parseInt(key)] === monthChar
    );
    if (!month) return null;

    // Determina l'anno completo (assumiamo 1900-2099)
    const currentYear = new Date().getFullYear() % 100;
    if (year > currentYear) {
      year += 1900;
    } else {
      year += 2000;
    }

    return new Date(year, parseInt(month) - 1, day);
  } catch {
    return null;
  }
}

/**
 * Determina il sesso dal codice fiscale
 */
function extractGender(fiscalCode: string): 'M' | 'F' | null {
  try {
    const day = parseInt(fiscalCode.substring(9, 11), 10);
    return day > 40 ? 'F' : 'M';
  } catch {
    return null;
  }
}

/**
 * Valida la coerenza del codice fiscale con i dati anagrafici
 */
export function validateFiscalCode(data: PersonData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fc = data.fiscalCode.toUpperCase().trim();

  // 1. Validazione formato
  const formatCheck = validateFormat(fc);
  if (!formatCheck.valid) {
    errors.push(formatCheck.error || 'Formato non valido');
    return { valid: false, errors, warnings };
  }

  // 2. Valida data di nascita
  if (data.birthDate) {
    const inputDate = new Date(data.birthDate);
    const extractedDate = extractBirthDate(fc);

    if (extractedDate) {
      if (
        inputDate.getDate() !== extractedDate.getDate() ||
        inputDate.getMonth() !== extractedDate.getMonth() ||
        inputDate.getFullYear() !== extractedDate.getFullYear()
      ) {
        errors.push(
          `La data di nascita nel CF (${extractedDate.toLocaleDateString('it-IT')}) non corrisponde a quella fornita (${inputDate.toLocaleDateString('it-IT')})`
        );
      }
    } else {
      warnings.push('Non è stato possibile estrarre la data di nascita dal codice fiscale');
    }
  }

  // 3. Valida coerenza nome/cognome (controllo base)
  if (data.name) {
    const nameParts = data.name.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      const surname = nameParts[nameParts.length - 1];
      const surnameConsonants = getConsonants(surname);
      const surnameVowels = getVowels(surname);

      // I primi 3 caratteri del CF dovrebbero corrispondere al cognome
      const cfSurnamePart = fc.substring(0, 3);
      const expectedSurname = `${surnameConsonants}${surnameVowels}`.padEnd(3, 'X');

      if (cfSurnamePart !== expectedSurname.substring(0, 3)) {
        warnings.push(
          'Il cognome potrebbe non corrispondere al codice fiscale. Verifica che l\'ordine sia corretto (Nome Cognome)'
        );
      }
    }
  }

  // 4. Controlli aggiuntivi
  const gender = extractGender(fc);
  if (gender) {
    // Potremmo aggiungere un campo sesso nel form per validare anche questo
    warnings.push(`Sesso dedotto dal CF: ${gender === 'M' ? 'Maschile' : 'Femminile'}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Formatta il codice fiscale in maiuscolo e senza spazi
 */
export function formatFiscalCode(fiscalCode: string): string {
  return fiscalCode.toUpperCase().replace(/\s/g, '');
}

/**
 * Validazione real-time (semplificata)
 */
export function validateFiscalCodeRealtime(fiscalCode: string): {
  valid: boolean;
  message?: string;
} {
  const fc = fiscalCode.toUpperCase().trim();

  if (fc.length === 0) {
    return { valid: true };
  }

  if (fc.length < 16) {
    return { valid: false, message: `Caratteri: ${fc.length}/16` };
  }

  const formatCheck = validateFormat(fc);
  if (!formatCheck.valid) {
    return { valid: false, message: formatCheck.error };
  }

  return { valid: true, message: '✓ Formato valido' };
}
