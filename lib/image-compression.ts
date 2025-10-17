/**
 * Comprime un'immagine per ridurne le dimensioni mantenendo qualità accettabile
 * @param file File da comprimere
 * @param maxSizeMB Dimensione massima in MB (default 1MB)
 * @param maxWidthOrHeight Larghezza/altezza massima in pixel (default 1920)
 * @returns Promise con file compresso in base64
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 1,
  maxWidthOrHeight: number = 1920
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Errore nella lettura del file'));

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Errore nel caricamento dell\'immagine'));

      img.onload = () => {
        // Calcola nuove dimensioni mantenendo aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = (height * maxWidthOrHeight) / width;
            width = maxWidthOrHeight;
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = (width * maxWidthOrHeight) / height;
            height = maxWidthOrHeight;
          }
        }

        // Crea canvas per compressione
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossibile ottenere il contesto del canvas'));
          return;
        }

        // Disegna immagine ridimensionata
        ctx.drawImage(img, 0, 0, width, height);

        // Converti in base64 con compressione progressiva
        let quality = 0.9;
        let result = canvas.toDataURL('image/jpeg', quality);
        const targetSize = maxSizeMB * 1024 * 1024 * 1.37; // base64 è ~37% più grande

        // Riduci qualità finché non raggiungiamo dimensione target
        while (result.length > targetSize && quality > 0.1) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(result);
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Converte un file in base64 senza compressione
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Ottiene le dimensioni di un file in MB
 */
export function getFileSizeMB(file: File): number {
  return file.size / (1024 * 1024);
}

/**
 * Prepara file per upload, comprimendo se necessario
 */
export async function prepareFileForUpload(
  file: File,
  maxSizeMB: number = 1
): Promise<{ data: string; size: number; compressed: boolean }> {
  const originalSizeMB = getFileSizeMB(file);

  // Se è un PDF o file non immagine, converti senza compressione
  if (!file.type.startsWith('image/')) {
    if (originalSizeMB > maxSizeMB) {
      throw new Error(`Il file ${file.name} supera il limite di ${maxSizeMB}MB`);
    }
    const data = await fileToBase64(file);
    return { data, size: originalSizeMB, compressed: false };
  }

  // Se l'immagine è già sotto il limite, non comprimere
  if (originalSizeMB <= maxSizeMB) {
    const data = await fileToBase64(file);
    return { data, size: originalSizeMB, compressed: false };
  }

  // Comprimi l'immagine
  const data = await compressImage(file, maxSizeMB);
  const compressedSizeMB = data.length / (1024 * 1024 * 1.37);

  return { data, size: compressedSizeMB, compressed: true };
}
