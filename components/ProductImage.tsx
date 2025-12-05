import React, { useMemo, useEffect } from 'react';

interface ProductImageProps {
  image: Blob | string;
  alt: string;
  className?: string;
}

const ProductImage: React.FC<ProductImageProps> = ({ image, alt, className = '' }) => {
  // Utilise useMemo pour créer de manière synchrone une URL pour les objets Blob.
  // Cela empêche le composant de rendre d'abord un placeholder, évitant ainsi le scintillement.
  const imageUrl = useMemo(() => {
    if (image instanceof Blob) {
      return URL.createObjectURL(image);
    }
    if (typeof image === 'string') {
        // Gère les data URLs, http, et https URLs.
        if (image.startsWith('data:') || image.startsWith('http')) {
            return image;
        }
    }
    // Retourne null pour les emojis ou autres chaînes non-URL.
    return null;
  }, [image]);

  // Effet pour nettoyer l'object URL afin d'éviter les fuites de mémoire.
  // S'exécute lorsque le composant est démonté ou lorsque imageUrl change.
  useEffect(() => {
    return () => {
      // Nous devons révoquer uniquement les URLs créées à partir de Blobs.
      if (imageUrl && image instanceof Blob) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl, image]);

  // Si nous avons une URL (d'un Blob ou d'une chaîne), on affiche une balise <img>.
  // L'attribut `loading="lazy"` améliore les performances pour les longues listes.
  if (imageUrl) {
    return <img src={imageUrl} alt={alt} className={className} loading="lazy" />;
  }
  
  // Sinon, on suppose que c'est un emoji et on affiche un <span>.
  if (typeof image === 'string') {
      return <span className={`${className} flex items-center justify-center`} aria-label={alt}>{image}</span>;
  }

  // Un fallback pour tout type inattendu, bien qu'il ne devrait pas être atteint.
  return <div className={`${className} bg-slate-800`} />;
};

export default React.memo(ProductImage);