# HobbitDex — mise en ligne

Classeur de collection pour Magic: The Gathering · The Hobbit et pour Riftbound.

Le site tient en 6 fichiers : `index.html`, `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `riftbound-prices.json`.
Garde-les ensemble dans le même dossier.

## Option 1 — GitHub Pages (gratuit, toujours en ligne)

1. Crée un compte sur github.com si tu n'en as pas.
2. Crée un nouveau dépôt public, par exemple `hobbitdex`.
3. Clique sur « uploading an existing file » et dépose les fichiers (avec les dossiers `scripts/` et `.github/`), puis « Commit changes ».
4. Va dans Settings → Pages → Source : « Deploy from a branch », branche `main`, dossier `/ (root)`, Save.
5. Après une minute, ton site est à l'adresse `https://<ton-pseudo>.github.io/hobbitdex/`.

## Option 2 — sur ton propre serveur

Copie les fichiers dans un dossier servi par ton serveur web (nginx, Caddy, Apache…).
Le mode hors connexion et l'installation sur téléphone demandent du **https**.
Les prix Riftbound ne se mettent alors à jour que si tu recopies `riftbound-prices.json` (ou lances `node scripts/build-riftbound.mjs`).

## Installer sur le téléphone

- Android (Chrome) : ouvre le site → menu ⋮ → « Installer l'application ».
- iPhone (Safari) : ouvre le site → bouton Partager → « Sur l'écran d'accueil ».

Ensuite, dans l'onglet **Sauvegarde**, touche « Télécharger les images » pour pouvoir feuilleter le classeur sans réseau.

## Où sont tes données

La collection et les achats sont enregistrés dans le navigateur de chaque appareil.
Avec un compte (bouton « Se connecter »), ils sont aussi gardés dans Firebase et synchronisés entre tes appareils ; tu peux alors partager tes échanges ou ta collection avec tes amis.
Sans compte : Sauvegarde → Exporter, puis Importer sur l'autre appareil.
Fais un export de temps en temps pour garder une copie de secours.

Les règles de sécurité Firestore sont dans `firestore-regles.txt` (pas versionné) : après une modification, colle-les dans la console Firebase → Firestore → Règles → Publier.

## Données des cartes

- The Hobbit : cartes, images et prix viennent de Scryfall (api.scryfall.com) et se mettent à jour une fois par jour.
  Si Scryfall n'est pas joignable au premier lancement, le site utilise une copie intégrée (sans images, prix du 11.10.2026).
- Riftbound : les cartes viennent de Riftcodex (chargées par le site), les prix de Cardmarket.
  La tâche GitHub `.github/workflows/riftbound.yml` refait `riftbound-prices.json` chaque nuit.
