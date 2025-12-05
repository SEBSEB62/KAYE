# 🧪 Guide de Test - PDF & Historique

## ✅ Checklist de Test

### 1. **Compilation** 
- [x] Pas d'erreurs TypeScript
- [x] Imports corrects
- [x] Types bien définis

```bash
# Vérifier
npm run build
# Résultat attendu: Build réussi sans erreurs
```

---

## 2. **Test du PDF - STANDARD Plan**

### Scénario 1: Générer PDF basique
```
1. Se connecter avec compte STANDARD
2. Aller à Statistiques
3. Choisir "7 Jours"
4. Cliquer sur bouton "PDF"
5. Fichier "rapport-kaye-YYYY-MM-DD.pdf" téléchargé

✅ Vérifier dans PDF:
- KPI Cards (4 métriques colorées)
- Résumé Financier
- Modes de Paiement
- Top 5 Produits
- Historique (50 ventes)
- Pages numérotées
- Footer KAYÉ
```

### Scénario 2: Générer PDF PRO
```
1. Se connecter avec compte PRO
2. Aller à Statistiques
3. Choisir "30 Jours"
4. Cliquer sur bouton "PDF"

✅ Vérifier sections PRO:
- Top 5 par Profit ✓
- Frais détaillés (PayPal vs Sumup) ✓
- Bénéfice Net dans KPI ✓
- Caisse Finale ✓
```

### Scénario 3: PDF ESSENTIEL (devrait échouer)
```
1. Connexion avec plan ESSENTIEL
2. Aller à Statistiques
3. Bouton PDF absent ✓
4. Si click: Toast "Fonctionnalité réservée aux plans Standard et Pro"
```

---

## 3. **Test Historique Expandable**

### Scénario 1: Vue Compacte
```
1. Scroller à "Historique des Transactions"
2. Voir liste des ventes avec:
   ✓ Montant 5.00€
   ✓ Badge mode [card]
   ✓ Profit net coloré 🟢
   ✓ Heure et client
   ✓ Articles résumés
   ✓ Bouton X supprimer
```

### Scénario 2: Expand une vente
```
1. Cliquer sur une vente
2. Voir détails expandés ▼
3. Affichage des 4 colonnes:
   ✓ Marge Brute: X.XX€ (Y%)
   ✓ Frais: -X.XX€ (type détaillé)
   ✓ Profit Net: X.XX€ (couleur)
   ✓ Coût Marchandises: X.XX€
   ✓ Durée: "instant"
   
4. Voir détail article par article:
   ✓ 2x Café → 5.00€ (Profit: 2.50€)
   ✓ 1x Pastry → 2.50€ (Profit: 1.25€)
```

### Scénario 3: Collapse
```
1. Cliquer à nouveau sur vente expandée
2. Revenir à vue compacte ▶
3. Transitions fluides
```

---

## 4. **Test Calculs Financiers**

### Scénario: Vente 10€ Carte
```
Données entrée:
- Total: 10.00€
- Mode: Carte (1.75% frais)
- Coût marchandises: 4.00€

Calculs attendus:
✓ Marge Brute = 10.00 - 4.00 = 6.00€
✓ Frais = 10.00 * 0.0175 = 0.175€ ≈ 0.18€
✓ Profit Net = 6.00 - 0.18 = 5.82€
✓ Marge % = (6.00 / 10.00) * 100 = 60%

Vérifier dans:
1. App (historique expandable)
2. PDF (historique détaillé)
```

### Scénario: Vente 20€ PayPal
```
Données:
- Total: 20.00€
- Mode: PayPal (2.9% + 0.35€)
- Coût: 8.00€

Calculs:
✓ Marge Brute = 20.00 - 8.00 = 12.00€
✓ Frais = (20.00 * 0.029) + 0.35 = 0.58 + 0.35 = 0.93€
✓ Profit Net = 12.00 - 0.93 = 11.07€

Affichage: "PayPal: 0.93€"
```

---

## 5. **Test Couleurs PDF**

### KPI Cards
```
✓ Bleu (Chiffre d'Affaires): RGB(37, 99, 235)
✓ Vert (Net Estimé): RGB(16, 185, 129)
✓ Rouge (Frais): RGB(239, 68, 68)
✓ Orange (Profit - PRO): RGB(249, 115, 22)
```

### Headers Tableaux
```
✓ Résumé Financier: Bleu + Blanc texte
✓ Modes Paiement: Bleu + Blanc texte
✓ Frais: Rouge + Blanc texte
✓ Top Produits Qty: Vert + Blanc texte
✓ Top Produits Profit: Orange + Blanc texte
✓ Catégories: Bleu + Blanc texte
✓ Historique: Cyan + Blanc texte
```

### Alternance Lignes
```
✓ Lignes paires: Blanc/Gris clair
✓ Lignes impaires: Normal/Blanc
✓ Contraste lisible
✓ Pas d'éblouissement
```

---

## 6. **Test Multi-page PDF**

### Page 1
```
✓ Logo (si présent)
✓ Titre + Date
✓ KPI Cards
✓ Résumé Financier
✓ Modes de Paiement
✓ Frais (PRO only)
```

### Page 2 (Standard+)
```
✓ Top 5 Quantité
✓ Top 5 Profit (PRO)
✓ Catégories
✓ Historique (50 ventes)
```

### Footer (Toutes pages)
```
✓ "Page X sur Y" (haut droit)
✓ Date rapport (bas gauche)
✓ Signature "KAYÉ" (bas gauche)
✓ Pagination correcte
```

---

## 7. **Test Restrictions Plans**

### ESSENTIEL
```
Statistiques page:
✓ Aucun bouton PDF
✓ Historique visible (compact seulement)

Si tentative de PDF:
✓ Toast erreur: "Fonctionnalité réservée..."
```

### STANDARD
```
Statistiques page:
✓ Bouton PDF présent et actif
✓ Historique expandable complet
✓ Voir Marge, Frais, Profit

PDF reçu:
✓ Pages 1-2 complètes
✓ Pas de "Top par Profit"
✓ Pas de "Frais détaillés"
✓ Historique 50 ventes
```

### PRO
```
Statistiques page:
✓ Tout visible
✓ Toutes colonnes actives

PDF reçu:
✓ "Top 5 par Profit" ✓
✓ "Frais détaillés" ✓
✓ Bénéfice Net dans KPI ✓
✓ Caisse Finale ✓
```

---

## 8. **Test Responsive**

### Mobile (375px)
```
✓ Tableaux scrollables
✓ Colonnes adaptées
✓ Historique: 1 colonne
✓ Expand/Collapse touchable
```

### Tablet (768px)
```
✓ Tableaux adaptés
✓ Historique: 2 colonnes
✓ Lisible sans scroll horizontal
```

### Desktop (1920px)
```
✓ Tous les tableaux affichés
✓ Historique: 3 colonnes
✓ Espacement optimal
```

---

## 9. **Test Interactions**

### Bouton PDF
```
1. Premier click:
   ✓ Toast "Rapport généré..."
   ✓ Téléchargement lancé
   
2. Avant fin téléchargement (clic rapide):
   ✓ Pas de double téléchargement
   ✓ Toast affiché une seule fois

3. Sans ventes:
   ✓ Fichier vide généré
   ✓ Structure PDF correcte
```

### Historique Expandable
```
1. Clic normal:
   ✓ Expand/Collapse
   ✓ Animation fluide
   
2. Clic sur X:
   ✓ Modal de confirmation
   ✓ "Êtes-vous sûr?"
   ✓ Suppression + Toast succès

3. Plusieurs ventes:
   ✓ Une seule expandée à la fois
   ✓ Ou plusieurs si voulu
```

---

## 10. **Test Erreurs & Edge Cases**

### Pas de ventes
```
Statistiques:
✓ "Pas encore de données" 📊
✓ PDF toujours générable (vide)
✓ Historique vide
```

### Une seule vente
```
✓ PDF généré
✓ Historique affichée
✓ Calculs corrects
```

### 100+ ventes
```
✓ Historique: 50 dernières en PDF
✓ App: Scroll performant
✓ Pas de lag
```

### Logo manquant
```
✓ PDF générré sans logo
✓ Titre aligné à droite
✓ Pas d'erreur
```

### Montant zéro
```
✓ Calcul: 0.00€
✓ Affichage: "0.00€"
✓ Pas d'erreur division
```

---

## 📋 Résumé Test

| Feature | ESSENTIEL | STANDARD | PRO | ✅ |
|---------|-----------|----------|-----|-----|
| PDF disponible | ❌ | ✅ | ✅ | ✓ |
| Historique expandable | ❌ | ✅ | ✅ | ✓ |
| Marge brute visible | ❌ | ✅ | ✅ | ✓ |
| Frais transaction | ❌ | ✅ | ✅ | ✓ |
| Profit net | ❌ | ✅ | ✅ | ✓ |
| Top par Profit | ❌ | ❌ | ✅ | ✓ |
| Frais détaillés | ❌ | ❌ | ✅ | ✓ |
| Pages PDF | - | 2 | 2 | ✓ |

---

## 🚀 Procédure Post-Déploiement

1. **Vérifier compilation**
   ```bash
   npm run build
   ```

2. **Test local**
   ```bash
   npm run dev
   ```

3. **Générer un PDF de test**
   - Accès: Statistiques → PDF
   - Résultat: `rapport-kaye-YYYY-MM-DD.pdf`

4. **Vérifier historique**
   - Scroller historique
   - Cliquer une vente
   - Voir tous les détails

5. **Tester par plan**
   - ESSENTIEL: Pas de PDF
   - STANDARD: PDF limité
   - PRO: PDF complet

---

**Status**: ✅ **Prêt pour Test**
**Estimé**: 30-45 minutes de QA
