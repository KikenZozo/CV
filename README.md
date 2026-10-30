# Enzo Bouarab — Portfolio TSSR

> **Branche `claude/eye-candy`** — version expérimentale « captivante » superposée au site de base
> (`css/fx.css`, `js/fx.js`, `js/ocean.js`). Voir la section *Couche eye candy* plus bas.

Portfolio de Technicien Supérieur Systèmes & Réseaux. HTML et CSS natifs, aucun framework, aucune dépendance.

## Structure

```
index.html          Portfolio (une page, 7 sections)
cv.html             CV A4 imprimable / export PDF (« Imprimer → Enregistrer en PDF »)
css/styles.css      Styles du portfolio, organisés en @layer
css/cv.css          Styles du CV
js/main.js          Interactions (menu, View Transitions, thème, tilt 3D, formulaire) — ~9 Ko non minifié
fonts/              Polices woff2 auto-hébergées (OFL)
images/             Photo du CV, favicons, image Open Graph
docs/               Prompts Claude Design pour les assets optionnels
```

## Techniques utilisées

- **Mise en page** : grille 12 colonnes nommées propagée par `subgrid` (sections, blocs, cartes,
  panneaux de compétences, fiches) ; responsive entièrement en `@container` (aucune media query de layout).
- **Mouvement** : animations pilotées par le défilement (`animation-timeline: scroll()` / `view()`, timeline nommée
  `view-timeline` pour la frise), View Transitions same-document (menu, sauts de section, changement de thème)
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

## Mettre à jour le contenu

Le contenu reprend le CV d'Enzo (stage XEFI, expériences, formation, langues). Il est écrit en dur dans deux fichiers :

| Élément | Où |
|---|---|
| Profil, expériences, formation, langues, contact | `index.html` (sections `#profil` à `#contact`) et `cv.html` |
| Niveaux de compétences (barres « LV » et radar) | `index.html`, section `#competences` : attribut `--lvl` et `aria-valuenow` de chaque barre ; valeurs du radar dans le `<polygon class="radar__shape">` |
| Photo du CV imprimable | `images/portrait.webp` (360 × 360) |
| Identifiant Formspree | attribut `action` du formulaire dans `index.html` |

## Mise en ligne (GitHub Pages)

Settings → Pages → *Deploy from a branch* → branche principale, dossier `/ (root)`.

## Couche eye candy (branche `claude/eye-candy`)

Tout est additionnel : retirer les deux balises `fx` du `<head>` d'`index.html` rend le site de base.

- **Océan « Dark Hour » (WebGL)** — `js/ocean.js` : lune géante et reflets scintillants ; en défilant, la caméra
  plonge sous la surface (caustiques, rais de lumière) ; ondes au pointeur ; aube en mode clair.
  Rendu à demi-résolution, pause onglet masqué, résolution adaptative puis image figée si la machine peine.
  Refuse le rendu logiciel (pas de GPU) et retombe alors sur le décor CSS. `?ocean=force` lève ces garde-fous pour tester.
- **Séquence de démarrage** — journal système, nom, volet diagonal ; une fois par session, passable (clic / touche),
  jamais jouée si « réduire les animations » est actif.
- **Typographie cinétique** — lettres du nom en rotation 3D, glitch chromatique périodique, entrée des titres à durée fixe
  et libellés monospace décodés (largeur stable : zéro décalage de mise en page).
- **Radar de compétences** (pentagone SVG), **bandeaux typographiques** liés au défilement, **curseur** et **boutons
  magnétiques** (pointeur fin uniquement), **grain** de pellicule.

Lighthouse (local, gzip, sans GPU donc océan désactivé) : 99 / 100 / 100 / 100 en desktop, 97 / 100 / 100 / 100 en mobile.
