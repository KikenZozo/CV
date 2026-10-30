# Enzo Bouarab — Portfolio TSSR

Portfolio de Technicien Supérieur Systèmes & Réseaux. HTML et CSS natifs, aucun framework, aucune dépendance.

## Structure

```
index.html          Portfolio (une page, 7 sections)
cv.html             CV A4 imprimable / export PDF (« Imprimer → Enregistrer en PDF »)
css/styles.css      Styles du portfolio, organisés en @layer
css/cv.css          Styles du CV
js/main.js          Interactions (menu, View Transitions, filtres, tilt 3D, formulaire) — ~9 Ko non minifié
fonts/              Polices woff2 auto-hébergées (OFL)
images/             Captures des outils (WebP), favicons, image Open Graph
docs/               Prompts Claude Design pour les assets optionnels
```

## Techniques utilisées

- **Mise en page** : grille 12 colonnes nommées propagée par `subgrid` (sections, blocs, cartes projets,
  panneaux de compétences, fiches) ; responsive entièrement en `@container` (aucune media query de layout).
- **Mouvement** : animations pilotées par le défilement (`animation-timeline: scroll()` / `view()`, timeline nommée
  `view-timeline` pour la frise), View Transitions same-document (menu, sauts de section, filtrage des projets)
  et cross-document (`@view-transition { navigation: auto }` entre le portfolio et le CV).
- **Esthétique** : palette OKLCH dérivée par `color-mix()`, typographie fluide `clamp()` + unités `cqi`,
  glassmorphism `backdrop-filter`, inclinaison 3D `perspective` pilotée par `@property`, `:has()`, `:user-invalid`.
- **Ambiance « sous la surface »** : rais de lumière ondulants (couche fixe décorative), surface d'eau animée sous le
  hero, cartes qui flottent en houle désynchronisée (un seul angle `@property --phase` par conteneur, décalé par
  `sin()` pour chaque enfant), HUD éphémère qui annonce la section atteinte puis s'efface.
- **Thème clair / sombre** : choix mémorisé, sinon préférence système ; appliqué avant la première peinture (aucun
  flash) ; bascule animée par une View Transition circulaire. Le menu reste volontairement bleu nuit dans les deux thèmes.
- **Accessibilité** : HTML sémantique, `<dialog>` modal natif, `command`/`commandfor` (le menu fonctionne sans JS),
  lien d'évitement, `aria-current`, `role="meter"`, respect de `prefers-reduced-motion` et `prefers-contrast`.

Lighthouse (local, gzip, thèmes clair et sombre) : 100 / 100 / 100 / 100 en desktop, 98-99 / 100 / 100 / 100 en mobile (4G simulée).

## À personnaliser avant publication

| Élément | Où |
|---|---|
| E-mail et téléphone (actuellement fictifs) | `index.html` section `#contact`, `cv.html` bloc Contact |
| Liens MEGA des 6 outils `.exe` | `index.html` — chercher `REMPLACER-PAR-VOTRE-LIEN` (tant qu'ils ne sont pas remplacés, les boutons affichent « Lien bientôt disponible ») |
| Identifiant Formspree | attribut `action` du formulaire dans `index.html` |
| Parcours, dates, certifications | `index.html` sections 03-04 et `cv.html` |

## Mise en ligne (GitHub Pages)

Settings → Pages → *Deploy from a branch* → branche principale, dossier `/ (root)`.
