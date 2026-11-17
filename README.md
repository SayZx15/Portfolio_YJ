# Johan Yang — Portfolio

Mon portfolio personnel, consacré à mon parcours en électronique et informatique à Polytech Sorbonne, à mes expériences et aux projets que je développe autour du traitement du signal, des systèmes embarqués et du logiciel.

Le site est disponible en **français et en anglais**, avec une interface adaptée aux ordinateurs, tablettes et mobiles.

## Au fil du portfolio

- **À propos** — mon profil, mes domaines d’intérêt et ma spécialisation en hyperfréquences et télécommunications.
- **Projets** — recherche, réalisations académiques et projets personnels, avec des fiches détaillées et des filtres par domaine.
- **Travaux pratiques** — une section dédiée aux exercices de programmation et de systèmes embarqués.
- **Parcours** — expériences professionnelles, formation et échange à l’Université de Kyoto.
- **CV et contact** — CV bilingue consultable et imprimable, liens professionnels et formulaire de contact.

Parmi les réalisations présentées : simulation radar FMCW, serre connectée, WiFiScanner, génération d’images avec StyleGAN2-ADA et jeu d’échecs en réseau. **CraneGameSimulator** et **MyWidget** sont des projets personnels en cours de développement.

## Technologies

**HTML · CSS · JavaScript · Node.js · GitHub Pages**

Le site utilise HTML, CSS et JavaScript natifs, sans framework ni dépendance npm. Il propose un thème clair et un thème sombre, des illustrations SVG et une version statique prête à être publiée sur GitHub Pages.

## Lancer en local

Prérequis : **Node.js 22.14 ou supérieur**.

```sh
npm run dev
```

Le portfolio est accessible sur [localhost:5173](http://127.0.0.1:5173). Aucune installation de dépendances n’est nécessaire.

Pour générer la version à publier :

```sh
npm run build
```

Les fichiers sont générés dans `dist/`. Pour prévisualiser cette version, arrêter le serveur de développement puis lancer :

```sh
npm run preview
```

Il est aussi possible d’ouvrir directement `dist/index.html` dans un navigateur, en conservant le dossier `dist/public/` à côté.

## Publier sur GitHub Pages

Le dépôt contient un workflow de déploiement automatique.

1. Envoyer le projet sur la branche `main` du dépôt GitHub.
2. Ouvrir **Settings → Pages → Build and deployment**.
3. Sélectionner **GitHub Actions** dans le champ **Source**.
4. Dans l’onglet **Actions**, lancer **Deploy portfolio to GitHub Pages → Run workflow**, ou envoyer une nouvelle modification sur `main`.

Le workflow génère le site et publie le contenu de `dist/`. L’adresse du portfolio apparaît dans **Settings → Pages** une fois le déploiement terminé. Les mises à jour suivantes sont publiées automatiquement à chaque push sur `main`.

## Personnaliser le contenu

| Fichier | Rôle |
| --- | --- |
| `src/content.js` | Textes FR/EN, projets, parcours et compétences |
| `src/config.js` | Coordonnées, liens professionnels et configuration du contact |
| `src/styles.css` | Mise en page, couleurs et thèmes |
| `src/visuals.js` | Icônes et illustrations SVG |
| `scripts/generate-cv.mjs` | Génération du CV imprimable |

Les contenus sont regroupés dans les deux langues. Après une modification, `npm run build` met à jour la version statique et le CV.

## Contact

Sur GitHub Pages, le formulaire ouvre la messagerie du visiteur avec un message prérempli.

Un backend Node.js optionnel permet l’envoi direct via Resend. Il s’héberge séparément de GitHub Pages et se configure à partir de `.env.example`, puis de `contactEndpoint` dans `src/config.js`. Les identifiants restent dans les variables d’environnement du serveur.
