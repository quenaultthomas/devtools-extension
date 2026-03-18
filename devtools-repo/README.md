# DevTools — Extension Chrome / Edge

Boîte à outils pour développeurs et testeurs. 9 outils accessibles en un clic.

---

## Sommaire

- [Installation (première fois)](#installation-première-fois)
- [Mise à jour automatique](#mise-à-jour-automatique)
- [Outils inclus](#outils-inclus)
- [Setup du repo (mainteneur)](#setup-du-repo-mainteneur)
- [Publier une nouvelle version](#publier-une-nouvelle-version)

---

## Installation (première fois)

> Fonctionne sur Chrome, Edge, Brave, Arc.

1. Téléchargez le fichier **`devtools-extension.zip`** depuis ce repo
2. Décompressez-le
3. Ouvrez `chrome://extensions` (ou `edge://extensions`)
4. Activez le **mode développeur** (toggle en haut à droite)
5. Cliquez **"Charger l'extension non empaquetée"** → sélectionnez le dossier décompressé
6. Épinglez l'icône via le puzzle 🧩

> ✅ Une fois installée, l'extension **se met à jour automatiquement** — plus besoin de réinstaller.

---

## Mise à jour automatique

Chrome vérifie le fichier `updates.xml` hébergé sur GitHub Pages toutes les **quelques heures** (max 5h).

Quand une nouvelle version est disponible :
- Chrome télécharge et installe le ZIP automatiquement en arrière-plan
- L'extension est rechargée au prochain redémarrage du navigateur

**Pour forcer une mise à jour immédiate :**
```
chrome://extensions → bouton "Mettre à jour les extensions"
```

---

## Outils inclus

| Catégorie | Outil |
|-----------|-------|
| Formatters | JSON, XML, SQL |
| Encodage | Base64, JWT Decoder |
| Temps | Timestamp converter |
| Texte | Diff texte |
| Génération | UUID Generator |
| Formulaires | Form Tools (extraction + remplissage automatique) |

### Form Tools — mode d'emploi

**Extraction**
1. Naviguez sur la page contenant le formulaire
2. Ouvrez l'extension → **Form Tools** → **Extraction**
3. Cliquez **"Extraire les champs de la page"**
4. Le bloc `données` est généré et copié dans l'onglet Remplissage

**Remplissage**
1. Allez dans l'onglet **Remplissage**
2. Modifiez les valeurs
3. Cliquez **"Exécuter sur la page"**
4. Un rapport s'affiche (champs remplis / ignorés / introuvables)

---

## Setup du repo (mainteneur)

> À faire une seule fois lors de la création du repo.

### 1. Créer le repo GitHub

```bash
git init
git remote add origin https://github.com/TON_PSEUDO/TON_REPO.git
```

### 2. Activer GitHub Pages

Dans le repo GitHub :
- **Settings** → **Pages**
- Source : **Deploy from a branch**
- Branch : `main` / `(root)`
- Sauvegarder

GitHub Pages sera disponible sur : `https://TON_PSEUDO.github.io/TON_REPO/`

### 3. Remplacer les placeholders

Dans les fichiers suivants, remplacez `TON_PSEUDO` et `TON_REPO` par vos vraies valeurs :

| Fichier | Ligne à modifier |
|---------|-----------------|
| `extension/manifest.json` | `"update_url"` |
| `updates.xml` | attribut `codebase` |
| `build.sh` | variable `REPO` |

### 4. Récupérer l'Extension ID

L'ID est généré par Chrome lors de la première installation en mode développeur.

1. Installez l'extension une première fois (voir section Installation)
2. Ouvrez `chrome://extensions`
3. Copiez l'**ID** affiché sous le nom de l'extension (ex: `abcdefghijklmnopabcdefghijklmnop`)
4. Collez-le dans `updates.xml` à la place de `__EXTENSION_ID__`

### 5. Premier push

```bash
chmod +x build.sh
git add .
git commit -m "chore: initial setup v1.2.0"
git push origin main
```

---

## Publier une nouvelle version

```bash
./build.sh 1.3.0
git push origin main --tags
```

Le script :
1. Met à jour la version dans `manifest.json` et `updates.xml`
2. Repackage le ZIP
3. Crée un commit + tag Git

Après le push, GitHub Pages sert le nouveau `updates.xml` et `devtools-extension.zip` — Chrome récupère la mise à jour automatiquement.

---

## Structure du repo

```
/
├── extension/
│   ├── manifest.json        ← déclaration MV3 + update_url
│   ├── devtools.html        ← interface popup
│   ├── popup.js             ← logique des outils
│   ├── content_script.js    ← injecté dans la page active
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── updates.xml              ← lu par Chrome pour les mises à jour auto
├── devtools-extension.zip   ← ZIP de la version courante
├── build.sh                 ← script de release
└── README.md
```

---

## Compatibilité

| Navigateur | Support |
|-----------|---------|
| Chrome 102+ | ✅ |
| Edge 102+ | ✅ |
| Brave | ✅ |
| Arc | ✅ |
| Firefox | ❌ (MV3 partiel) |
