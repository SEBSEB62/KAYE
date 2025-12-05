import { useState, useEffect } from 'react';

/**
 * Gère l'état d'activation de la licence de l'application.
 * Au chargement, il vérifie le localStorage pour une activation préalable.
 * @returns Un objet avec l'état de chargement et l'état de la licence.
 */
export const useLicense = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLicensed, setIsLicensed] = useState(false);

  useEffect(() => {
    /**
     * C'est la fonction "checkLicense" demandée.
     * Elle est exécutée une seule fois au montage du composant principal.
     */
    const checkLicenseStatus = () => {
      // Pour des raisons de performance et de fonctionnement hors ligne,
      // nous nous fions UNIQUEMENT au localStorage après la première activation.
      const licenseStatus = localStorage.getItem('license_activated');
      
      if (licenseStatus === 'true') {
        setIsLicensed(true);
      } else {
        setIsLicensed(false);
      }
      setIsLoading(false);
    };

    // Un petit délai pour éviter un flash de l'écran de chargement si la vérification est trop rapide
    const timer = setTimeout(checkLicenseStatus, 500);

    return () => clearTimeout(timer);
  }, []);

  return { isLoading, isLicensed, setIsLicensed };
};