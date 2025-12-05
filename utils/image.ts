
export const compressImage = (file: File, options: { quality?: number, maxWidth?: number, maxHeight?: number } = {}): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const { quality = 0.75, maxWidth = 800, maxHeight = 800 } = options;

        // Augmentation de la limite à 50 Mo pour supporter les vidéos et GIFs HD
        const MAX_FILE_SIZE_MB = 50;
        const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

        if (file.size > MAX_FILE_SIZE_BYTES) {
            const fileSize = (file.size / 1024 / 1024).toFixed(1);
            return reject(new Error(`Le fichier est trop volumineux (${fileSize} Mo). Max: ${MAX_FILE_SIZE_MB} Mo.`));
        }
        
        // Pour les GIFs et les vidéos, nous les retournons directement en tant que Blob après la vérification de taille.
        // On ne peut pas compresser un GIF animé ou une vidéo via un canvas HTML5 standard sans perdre l'animation.
        if (file.type === 'image/gif' || file.type.startsWith('video/')) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            if (!e.target?.result) return reject(new Error("Impossible de lire le fichier."));
            
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                
                if (!ctx) {
                    return reject(new Error('Impossible de créer le contexte du canvas.'));
                }

                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('La conversion en Blob a échoué.'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => reject(new Error("Erreur lors du chargement de l'image."));
            img.src = e.target.result as string;
        };
        reader.onerror = () => reject(new Error("Erreur de lecture du fichier."));
        reader.readAsDataURL(file);
    });
};

export const dataURLToBlob = (dataURL: string): Blob => {
    const parts = dataURL.split(';base64,');
    if (parts.length < 2) {
      // Fallback pour les URLs simples ou non-base64
      throw new Error('Invalid Data URL');
    }
    const contentTypeMatch = parts[0].match(/:(.*?);/);
    const contentType = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream';
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
};

export const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
};
