# HobbitDex — mise en ligne

Le site tient en 5 fichiers : `index.html`, `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`.
Garde-les ensemble dans le même dossier.

## Option 1 — GitHub Pages (gratuit, toujours en ligne)

1. Crée un compte sur github.com si tu n'en as pas.
2. Crée un nouveau dépôt public, par exemple `hobbitdex`.
3. Clique sur « uploading an existing file » et dépose les 5 fichiers, puis « Commit changes ».
4. Va dans Settings → Pages → Source : « Deploy from a branch », branche `main`, dossier `/ (root)`, Save.
5. Après une minute, ton site est à l'adresse `https://<ton-pseudo>.github.io/hobbitdex/`.

## Option 2 — sur ton propre serveur

Copie les 5 fichiers dans un dossier servi par ton serveur web (nginx, Caddy, Apache…).
Le mode hors connexion et l'installation sur téléphone demandent du **https**.

## Installer sur le téléphone

- Android (Chrome) : ouvre le site → menu ⋮ → « Installer l'application ».
- iPhone (Safari) : ouvre le site → bouton Partager → « Sur l'écran d'accueil ».

Ensuite, dans l'onglet **Sauvegarde**, touche « Télécharger les images » pour pouvoir feuilleter le classeur sans réseau.

## Où sont tes données

La collection est enregistrée dans le navigateur de chaque appareil.
Pour la copier d'un appareil à l'autre : Sauvegarde → Exporter, puis Importer sur l'autre appareil.
Fais un export de temps en temps pour garder une copie de secours.

## Données des cartes

Les cartes, images et prix viennent de Scryfall (api.scryfall.com) et se mettent à jour une fois par jour.
Si Scryfall n'est pas joignable au premier lancement, le site utilise une copie intégrée (sans images, prix du 11.10.2026).

## Riftbound (cartes et prix)

Les cartes Riftbound viennent de Riftcodex et les prix de Cardmarket. Une tâche GitHub les récupère chaque nuit
et met à jour le fichier `riftbound.json` du dépôt. Fichiers concernés :

- `.github/workflows/riftbound.yml` : la tâche automatique (chaque nuit + bouton « Run workflow »)
- `scripts/build-riftbound.mjs` : le script qui assemble cartes et prix

Pour la lancer à la main : onglet **Actions** du dépôt → « Cartes et prix Riftbound » → **Run workflow**.

## Scanner de cartes

Bouton **📷 Scanner** en bas à droite du classeur. Le site lit le nom et le numéro de la carte avec la caméra
(lecteur de texte Tesseract, chargé une seule fois, environ 5 Mo) et retrouve la bonne carte et la bonne version.
Il fonctionne seulement sur le site en ligne (https), pas en ouvrant le fichier directement.
