# Prompts Claude Design — assets du portfolio

Le site fonctionne **sans aucun de ces assets** (tout le décor est en CSS/SVG). Ils servent à monter encore d'un cran.
Direction artistique commune à coller en tête de chaque prompt :

> **DA commune** — Esthétique « menu de JRPG moderne » très contrastée : nuit profonde `#050a1c`, bleu royal `#1631b8`,
> néon aqua `#4fe3f5`, blanc papier `#f7f9ff`. Diagonales franches à ~-12°, parallélogrammes, typographie condensée
> italique extra-grasse (Barlow Condensed 800 italic), touches monospace (JetBrains Mono). Univers infrastructure IT :
> serveurs, baies, topologies réseau, fibres optiques — traité de façon luxueuse et épurée, jamais « hacker cliché »
> (pas de pluie de code Matrix, pas de cadenas, pas de capuche). Aucun logo de marque, aucun personnage de jeu existant.

---

## 1. Portrait détouré pour le hero — `images/portrait.webp`

**Où :** à droite du nom dans le hero, en remplacement (ou en superposition) de la console topologie.

```
[DA commune]
À partir de la photo jointe (moi), crée un portrait buste de 3/4 détouré sur fond transparent, format portrait
1200×1500 px. Traitement duotone : ombres bleu royal #1631b8, hautes lumières blanc papier #f7f9ff, avec un fin
liseré néon aqua #4fe3f5 (2 px) qui suit le contour du côté droit, comme un rim light. Contraste très élevé,
grain photo léger. Le sujet regarde légèrement vers la gauche (vers le texte). Coupe nette en bas du buste sur
une diagonale à -12°. Exporte en WebP avec transparence, < 120 Ko.
```

Intégration : `<img src="images/portrait.webp" width="1200" height="1500" alt="Portrait d'Enzo Bouarab" fetchpriority="high">`
dans `.hero__console` (ou une nouvelle figure), avec `mix-blend-mode: normal` et la classe `tilt`.

## 2. Image Open Graph — `images/og-cover.png`

Une version est déjà générée. Pour une version plus riche :

```
[DA commune]
Visuel de partage 1200×630 px pour LinkedIn. À gauche, sur fond nuit, le nom « ENZO » en blanc plein et
« BOUARAB » en contour néon aqua, typographie condensée italique extra-grasse, empilés. Dessous, un bandeau
parallélogramme blanc avec « TECHNICIEN SYSTÈMES & RÉSEAUX » en bleu nuit. À droite, un grand panneau bleu
royal découpé en diagonale avec un liseré néon, contenant une topologie réseau minimaliste en traits fins
(pare-feu → routeur → switch → 4 serveurs). Zone de sécurité de 60 px sur les bords. PNG, < 300 Ko.
```

## 3. Texture « éclats de verre » — `images/shards.webp`

**Où :** calque décoratif optionnel dans `body::before` (ajouter `url(../images/shards.webp)` en premier fond).

```
[DA commune]
Texture plein écran 2560×1440 px, presque noire, faite de grands éclats de verre/cristal translucides
disposés en diagonale à -12°, reflets bleu royal et arêtes néon aqua très subtiles, profondeur de champ
douce. 90 % de la surface doit rester très sombre (luminance < 10 %) pour garantir la lisibilité du texte
blanc par-dessus. Pas de motif répétitif visible. WebP qualité 70, < 180 Ko.
```

## 4. Illustration baie serveur — `images/rack.svg`

**Où :** en filigrane derrière la section Compétences ou Certification.

```
[DA commune]
Illustration vectorielle SVG en traits fins (1.5 px), vue isométrique d'une baie serveur 42U ouverte :
serveurs 1U/2U, switch avec câbles de brassage, panneau de brassage, onduleur en bas. Uniquement des
contours, couleur néon aqua #4fe3f5 à 40 % d'opacité, quelques LED pleines en vert #5df29a. Aucun texte,
aucun logo. viewBox 0 0 600 900, SVG optimisé (< 25 Ko), sans filtre ni dégradé.
```

## 5. Monogramme / favicon — `images/favicon.svg`

Le monogramme « EB » actuel est généré en SVG. Pour une version dessinée :

```
[DA commune]
Monogramme « EB » pour favicon, dans un parallélogramme blanc incliné à -12° avec un coin supérieur droit
néon aqua, lettres bleu nuit en condensé italique extra-gras. Doit rester lisible à 16×16 px.
Livre un SVG (viewBox 0 0 64 64, < 2 Ko) avec fond arrondi #050a1c.
```
