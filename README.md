# Johan Yang — Portfolio

Portfolio bilingue français / anglais réalisé à partir du CV de novembre 2026. Design responsive, thèmes clair et sombre, 14 fiches projets et 2 fiches de travaux pratiques, filtres, parcours, compétences, contact et CV imprimable. Les illustrations sont conceptuelles : elles ne représentent pas des mesures ou des captures des projets.

Le front est en **HTML, CSS et JavaScript natifs**. Le backend optionnel utilise **Node.js**, sans dépendance npm. Il n’y a ni base de données à gérer ni service obligatoire pour afficher le site.

## Voir le site immédiatement

Ouvrir **`dist/index.html`** dans un navigateur. Ce fichier contient le CSS et le JavaScript : il fonctionne par double-clic, sans serveur. Garder le dossier `dist/public` à côté pour les liens vers le CV et l’icône.

Pour travailler sur les sources, avec **Node.js 22.14+** (Node 24 recommandé) :

```sh
npm run dev
```

Puis ouvrir **http://127.0.0.1:5173**. Aucune commande `npm install` n’est nécessaire. Après une modification, rafraîchir la page. Arrêter avec `Ctrl+C`.

```sh
npm run check   # vérifier la syntaxe
npm run build   # reconstruire dist/ et le CV
npm test        # tests backend et contrôles de rendu de l’export
npm run preview # servir dist/ sur le port 5173
```

Exécuter `npm run build` avant `npm test` : les contrôles du front portent sur le fichier effectivement exporté. `npm run dev` et `npm run preview` utilisent le même port ; en arrêter un avant de lancer l’autre. Pour changer le port : `DEV_PORT=5174 npm run dev`.

## Mettre en ligne sur GitHub Pages

### Déploiement automatique conseillé

1. Créer un dépôt GitHub, puis y envoyer le contenu du projet sur la branche `main`.
2. Dans le dépôt : **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Le workflow `.github/workflows/deploy.yml` vérifie le code, construit le site, exécute les tests et publie uniquement `dist/`.
4. Le premier lancement peut être relancé depuis **Actions → Deploy portfolio to GitHub Pages → Run workflow**.
5. L’adresse du site apparaît dans **Settings → Pages** et dans le résultat du déploiement.

Les chemins sont relatifs : le site fonctionne aussi dans un sous-dossier, par exemple `https://UTILISATEUR.github.io/NOM-DU-DEPOT/`. Si la branche principale s’appelle autrement, modifier `branches: [main]` dans le workflow.

### Déploiement manuel possible

Exécuter `npm run build`, puis copier **le contenu de `dist/`** à la racine d’un dépôt dédié à la publication. Choisir cette branche comme source dans les paramètres Pages. Conserver `index.html`, le dossier `public` et `.nojekyll` ensemble. Ne publier que ces fichiers ; les sources du backend et `.env` ne sont pas nécessaires.

## Modifier les informations

| Fichier | Contenu |
| --- | --- |
| `src/config.js` | E-mail, LinkedIn, lien GitHub optionnel, lien du CV, dates de recherche, adresse de l’API |
| `src/content.js` | Textes FR/EN, projets, expériences, formation, compétences et langues |
| `src/styles.css` | Couleurs, typographie, responsive et thème sombre |
| `src/visuals.js` | Icônes et illustrations vectorielles originales |
| `src/app.js` | Affichage, filtres, dialogues, langue, thème et formulaire |
| `scripts/generate-cv.mjs` | Mise en page du CV imprimable FR/EN |

Après les modifications, exécuter `npm run build`. Le contenu des projets et du CV reste centralisé. Les traductions doivent être modifiées dans les deux langues.

Le lien GitHub n’est affiché que si `github` est renseigné dans `src/config.js`. Aucun faux lien de dépôt n’a été ajouté aux projets.

### Catalogue des réalisations

Le site comprend 14 projets et 2 TP. Les deux premiers projets restent mis en avant ; la vue « Tous » présente d’abord cinq projets, puis le bouton « Voir les 9 autres projets » déplie la suite. La section des TP reste accessible en dessous. Les filtres par domaine affichent tous les résultats correspondants ; le filtre « TP » affiche uniquement l’arène Python et les interfaces STM32.

Dans `src/content.js` :

- `kind` distingue `research`, `project` et `lab`. Les entrées `lab` apparaissent dans la section « Travaux pratiques ».
- `category` conserve le domaine (`signal`, `embedded`, `software`), y compris pour les TP.
- `status` peut indiquer `exploration`, `prototype` ou `study`. Les explications se trouvent dans `fr.note` / `en.note`.
- `repository` ajoute un lien vers le code dans la fiche ; `references` permet de créditer une source externe. Aucun lien n’est inventé pour les projets sans dépôt connu.
- `includeInCv` sélectionne les projets du CV imprimable. Les quatre projets déjà présents sur le CV sont conservés pour ne pas transformer le CV en catalogue de 16 réalisations.

WiFiScanner inclut le lien du dépôt fourni. Le projet Pokémon est présenté comme une exploration collaborative basée sur StyleGAN2-ADA, avec un lien vers l’implémentation NVIDIA. Le prototype BPM et l’étude multicycle restent décrits avec les limites constatées dans les versions disponibles.


La recherche de stage est affichée jusqu’au 30 avril 2027. Ensuite le contact devient général. Les mentions de Kyoto et de cinquième année sont du contenu éditorial : les mettre à jour quand le parcours évolue.

### CV

Le bouton ouvre une version web FR/EN du CV, reconstruite à partir des informations du CV fourni. **Imprimer / Enregistrer en PDF** ouvre le dialogue d’impression du navigateur ; choisir « Enregistrer en PDF » et désactiver les en-têtes/pieds de page du navigateur si nécessaire. Le résultat peut varier légèrement selon les polices et le navigateur.

Pour utiliser le PDF original à la place, le placer dans `public/`, puis modifier par exemple :

```js
cv: './public/CV_Johan_Yang_FR.pdf',
```

Le PDF original n’est pas inclus : son téléchargement n’a pas abouti dans l’environnement de création. Le CV web fourni est consultable et imprimable. Le site affiche l’e-mail professionnel et le profil LinkedIn du CV ; il n’affiche pas le numéro de téléphone ni l’adresse personnelle.

## Contact : deux modes

### Mode GitHub Pages, sans backend — activé par défaut

`contactEndpoint` est vide dans `src/config.js`. Le formulaire valide les champs et ouvre la messagerie du visiteur avec un brouillon. Le visiteur doit ensuite envoyer cet e-mail lui-même. Le bouton indique **Préparer l’e-mail**, jamais un faux succès d’envoi. Le lien d’e-mail et sa copie restent accessibles si aucune application de messagerie n’est configurée. Certaines applications limitent la longueur d’un lien `mailto:` ; pour les longs messages, utiliser l’adresse directement ou activer l’API.

### Mode backend — envoi direct via Resend

GitHub Pages n’exécute pas un serveur Node. Ce backend doit être hébergé séparément sur un hébergement Node avec HTTPS et accès Internet sortant. Un compte Resend et un expéditeur autorisé/vérifié sont nécessaires.

1. Copier `.env.example` vers `.env`.
2. Compléter `RESEND_API_KEY`, `CONTACT_FROM` et `CONTACT_TO`.
3. Renseigner `ALLOWED_ORIGINS`, par exemple `https://UTILISATEUR.github.io`. Mettre **l’origine uniquement**, sans le chemin du dépôt ni barre oblique finale. Plusieurs origines sont séparées par des virgules.
4. Déployer `server/` et `package.json` sur l’hébergement Node. Définir les variables dans les paramètres de l’hébergeur, `HOST=0.0.0.0`, puis utiliser **`npm run server`** comme commande de démarrage. Le port est lu dans `PORT`.
5. Dans `src/config.js`, renseigner `contactEndpoint: 'https://VOTRE-API/api/contact'`.
6. Reconstruire et republier le front. Le bouton devient **Envoyer le message**.

En local, `npm run dev` sert déjà les routes `/api/` : renseigner `contactEndpoint: '/api/contact'` et les variables dans `.env`. Le serveur séparé sur 3001 n’est alors pas nécessaire.

**Ne jamais mettre la clé Resend dans `src/config.js`**, dans le HTML ou dans un fichier publié. `.env` est ignoré par Git et exclu du build. L’API utilise l’adresse du visiteur en `reply_to` ; le destinataire reste défini côté serveur.

Routes :

| Route | Comportement |
| --- | --- |
| `GET /api/health` | Disponibilité du processus, sans révéler la configuration ; ne garantit pas la livraison d’e-mails |
| `OPTIONS /api/contact` | Autorisation CORS pour les origines configurées |
| `POST /api/contact` | Validation des champs et envoi du message à l’adresse configurée |

La validation impose un nom de 2 à 100 caractères, un e-mail valide et un message de 10 à 3 000 caractères. Le corps est limité à 16 Ko. Protection simple par champ piège et plafond de 5 tentatives par adresse de connexion sur 15 minutes. Cette limite est en mémoire et propre à chaque processus : derrière un proxy, les visiteurs peuvent partager la même adresse de connexion. Pour un trafic public important ou plusieurs instances, configurer une limitation au niveau du proxy/hébergeur. Le serveur ne fait pas confiance à `X-Forwarded-For` fourni par le visiteur.

Le serveur ne stocke pas les messages sur disque. L’e-mail, le nom et le message sont transmis à Resend lors de l’envoi et peuvent être conservés par ce prestataire et dans la boîte mail destinataire. Aucun outil d’analytics ni cookie publicitaire n’est intégré ; seuls la langue et le thème sont mémorisés localement dans le navigateur.

## Vérifications réalisées

- Validation syntaxique du JavaScript.
- Build statique sans dépendances externes.
- Tests du backend : validation, destinataire fixe, origines, limites de taille, débit, champ piège, erreurs et absence de configuration.
- Tests du serveur statique : fichiers publics, méthodes, protection des fichiers privés, traversée de chemins et liens symboliques.
- Exécution de l’export FR/EN dans un environnement JavaScript simulé : 16 fiches, séparation projets/TP, filtres, dépliage, dialogues, liens, traduction, ancres et labels de formulaire. Vérification que le CV conserve une sélection courte.

**Limites de vérification :** le serveur HTTP local et l’ouverture d’un fichier dans le navigateur automatisé ont été bloqués par l’environnement. Les contrôles JavaScript ne remplacent pas une validation visuelle réelle sur ordinateur et mobile. L’envoi de vrais e-mails n’a pas été effectué, faute de configuration Resend ; les tests remplacent le prestataire par une réponse simulée.

Avant publication, ouvrir le site, essayer les 16 fiches, les filtres, les deux langues, le thème, le menu mobile, le CV et le contact. Si l’API est activée, vérifier un véritable envoi avec la configuration finale.

Documentation officielle : [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) · [API Resend](https://resend.com/docs/api-reference/emails/send-email).
# Portfolio_YJ
