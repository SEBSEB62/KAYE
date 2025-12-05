# Guide des Tests Automatisés pour Buvette+

Ce document décrit la stratégie de test mise en place pour assurer la qualité, la fiabilité et la non-régression de l'application Buvette+.

---

### 1. Philosophie et Objectifs

Les tests automatisés sont essentiels pour :
- **Prévenir les régressions** : S'assurer que les nouvelles fonctionnalités ne cassent pas les anciennes.
- **Valider la logique métier** : Garantir que les calculs financiers (bénéfices, CA) et les logiques de sécurité (authentification) sont corrects.
- **Faciliter la maintenance et le refactoring** : Permettre de modifier le code en toute confiance.
- **Servir de documentation vivante** : Les tests décrivent comment les composants et les fonctions sont censés se comporter.

---

### 2. Outils Utilisés

- **[Vitest](https://vitest.dev/)** : Un framework de test nouvelle génération, extrêmement rapide et compatible avec Vite.
- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** : Une bibliothèque pour tester les composants React de la manière dont un utilisateur les utiliserait.
- **[JSDOM](https://github.com/jsdom/jsdom)** : Une implémentation JavaScript pure de nombreuses APIs web, utilisée par Vitest pour simuler un environnement de navigateur.

---

### 3. Stratégie de Test

#### a) Mocks des Services Externes

Pour garantir des tests rapides et fiables, les services externes comme **Firebase** et **Gemini API** sont "mockés" (simulés). Cela signifie que nous n'appelons pas réellement ces services pendant les tests. À la place, nous utilisons des versions factices qui nous permettent de contrôler leurs réponses (succès, erreur) et de tester comment notre application réagit. Cette configuration est gérée dans le fichier `setupTests.ts`.

#### b) Tests Unitaires et d'Intégration

Nous avons mis en place une série de tests qui couvrent les aspects les plus critiques de l'application :

- **`hooks/useBuvette.functionality.test.tsx`** : Teste la logique métier principale (gestion du panier, traitement des ventes, mise à jour du stock).
- **`hooks/useEventAnalytics.test.ts`** : Valide la précision des calculs financiers (CA, bénéfice net, etc.).
- **`services/geminiService.test.ts`** : Vérifie la logique de génération de clé, y compris le mécanisme de secours en cas d'échec de l'API.
- **`pages/AuthPage.test.tsx`** : Simule l'inscription et la connexion d'un utilisateur pour tester le flux d'authentification.
- **`pages/SalePage.test.tsx` & `pages/CartPage.test.tsx`** : Testent le parcours de vente, de l'ajout d'un produit au panier jusqu'au paiement.

---

### 4. Comment Lancer les Tests

Lancer la suite de tests est très simple.

1.  **Ouvrez un terminal** à la racine du projet.
2.  **Exécutez la commande suivante** :
    ```bash
    npm test
    ```

Vitest se lancera en mode "watch", ré-exécutant automatiquement les tests à chaque modification de fichier. Vous verrez les résultats et le **rapport de couverture de code** (indiquant quel pourcentage de votre code est testé) directement dans votre terminal.

Pour quitter le mode "watch", appuyez sur `q`.

### 5. Écrire un Nouveau Test

Lorsque vous ajoutez une nouvelle fonctionnalité, suivez ce modèle pour créer un test de composant :

```tsx
// Exemple : MonComposant.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../test-utils'; // Notre utilitaire de rendu personnalisé
import MonComposant from './MonComposant';

describe('MonComposant', () => {
  it('devrait afficher le titre et réagir au clic', () => {
    // 1. Affiche le composant dans l'environnement de test
    render(<MonComposant />);

    // 2. Recherche des éléments dans le DOM simulé
    const titre = screen.getByRole('heading', { name: /Titre du Composant/i });
    const bouton = screen.getByRole('button', { name: /Cliquez-moi/i });

    // 3. Vérifie que les éléments sont bien présents
    expect(titre).toBeInTheDocument();
    expect(bouton).toBeInTheDocument();

    // 4. Simule une interaction utilisateur
    fireEvent.click(bouton);

    // 5. Vérifie le résultat de l'interaction (ex: un nouveau texte apparaît)
    const messageSucces = screen.getByText(/Bouton cliqué !/i);
    expect(messageSucces).toBeInTheDocument();
  });
});
```
