import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour "débouncer" une valeur.
 * Il ne met à jour la valeur retournée qu'après un certain délai sans changement
 * dans la valeur d'entrée. C'est très utile pour des opérations coûteuses
 * comme les appels API ou le filtrage de grandes listes basés sur la saisie utilisateur.
 *
 * @template T Le type de la valeur à débouncer.
 * @param {T} value La valeur d'entrée à débouncer (ex: un terme de recherche).
 * @param {number} delay Le délai en millisecondes à attendre avant de mettre à jour.
 * @returns {T} La valeur "débouncée", qui ne changera qu'après que `value` soit restée stable pendant `delay` ms.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(
    () => {
      // Met en place un minuteur pour mettre à jour la valeur débouncée après le délai spécifié.
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // La fonction de nettoyage est la clé du mécanisme.
      // Elle est appelée chaque fois que `value` ou `delay` change, avant que le nouvel effet ne s'exécute.
      // Cela annule le minuteur précédent, empêchant la mise à jour si l'utilisateur continue de taper.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // L'effet se ré-exécute uniquement si la valeur d'entrée ou le délai change.
  );

  return debouncedValue;
}