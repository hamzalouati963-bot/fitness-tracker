# Installation de l'APK (fitness-tracker)

Ce guide explique comment compiler et installer l'application **fitness-tracker**
sur Android **sans Android Studio** et **sans Android SDK installé en local**.

Tout (Java, Gradle, Android SDK) est installé et configuré automatiquement
dans **GitHub Actions** (le cloud de GitHub).

---

## 1. Pousser le projet sur GitHub

> ⚠️ **Important :** vérifie que `node_modules/` et `android/` ne sont **pas** poussés
> sur GitHub. Consulte la section [`.gitignore`](#gitignore) ci-dessous.

Créer un dépôt sur [github.com/new](https://github.com/new) puis, depuis le
dossier du projet **sur Windows (PowerShell)** :

```powershell
git init
git add .
git commit -m "Initial commit fitness-tracker"
git branch -M main
git remote add origin https://github.com/<TON-USER>@github.com/<TON-USER>/<TON-REPO>.git
git push -u origin main
```

Remplace `<TON-USER>` et `<TON-REPO>` par tes identifiants (ou utilise l'URL
fournie par GitHub au moment de créer le dépôt).

> Si GitHub te demande une authentification, utilise un **Personal Access Token**
> (Settings → Developer settings → Personal access tokens) comme mot de passe,
> ou configure `gh auth login`.

---

## 2. Lancer le workflow

1. Va sur ton dépôt : `https://github.com/<TON-USER>/<TON-REPO>`
2. Onglet **Actions** (dans la barre du haut).
3. Dans la liste de gauche, clique sur **Build Android APK**.
4. Clique sur **Run workflow** → bouton vert.
   - Le build se lance automatiquement aussi à chaque **push** vers `main`.

Le workflow exécute, dans l'ordre :
- Checkout du code
- Node.js 18
- `npm ci` (installation des dépendances)
- Java 17
- Android SDK (via `android-actions/setup-android`) + NDK 25.1.8937393
- Vérifications (`java -version`, `adb`, `sdkmanager`, `tsc`)
- `npx expo-doctor` (informatif, non bloquant)
- `npx expo prebuild --platform android --clean` (régénération du dossier natif)
- Vérification native (dossier `android/`, `gradlew`, `splashscreen_background`)
- `./gradlew assembleDebug --stacktrace` → produit `app-debug.apk`
- Publication de l'APK

Un build dure généralement entre **15 et 30 minutes** au premier lancement.

---

## 3. Où récupérer l'artifact APK

Une fois le workflow terminé avec succès (icône ✅ verte) :

1. Onglet **Actions**.
2. Clique sur le run terminé.
3. Tout en bas de la page, section **Artifacts**.
4. Clique sur **fitness-tracker-apk** pour télécharger le fichier `.zip`.

---

## 4. Télécharger / décompresser `app-debug.apk`

L'artifact est livré dans une archive `.zip` :

1. Télécharge `fitness-tracker-apk` (un fichier `fitness-tracker-apk.zip`).
2. Décompresse l'archive.
3. Tu obtiens le fichier **`app-debug.apk`**.

---

## 5. Installer l'APK sur Android

1. Copie `app-debug.apk` sur ton téléphone (USB, Google Drive, e-mail, …).
2. Sur le téléphone, ouvre le fichier `.apk` (via « Mes fichiers », Explorateur, …).
3. Autorise l'installation depuis des sources inconnues si demandé :
   - **Paramètres → Applications → Accès spécial → Installer des applications inconnues**
   - et active l'option (ou accepte l'avertissement système).
4. Confirme l'installation.
5. Ouvre l'application **fitness-tracker**.

> Compatible : Android 6.0 (API 23) et plus récent.

---

## 6. Différence entre APK debug et APK release

| | **Debug APK** | **Release APK** |
|---|---|---|
| Utilisation | Tests et développement | Publication / partage public |
| Signature | Clé de debug générique (`debug.keystore`) | Clé release personnelle & sécurisée |
| Performance | Plus lent, contient du code de debug | Optimisé (minification, Proguard/R8) |
| Taille | Plus grosse | Plus petite |
| Partage recommandé | Non (mais installable) | Oui |

Le workflow actuel produit un **APK debug** (`app-debug.apk`), parfait pour
installer et tester l'application sur son propre téléphone.

> ⚠️ L'APK **debug** est destiné **uniquement aux tests** : il ne doit **pas**
> être publié sur le Google Play Store (non signé avec une clé de release,
> moins optimisé). Pour une publication éventuelle, voir la section 7.

---

## 7. Générer plus tard un APK release signé

Pour produire un APK release, il faudra :

1. **Générer une clé de signature Android** (une seule fois) :
   ```
   keytool -genkey -v -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
   ```
2. **Configurer la signature** dans `android/app/build.gradle` (bloc `signingConfigs.release`).
3. **Ajouter les secrets** dans GitHub (Settings → Secrets and variables → Actions) :
   - `ANDROID_KEYSTORE_FILE` (fichier `.jks` encodé en base64)
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`
4. **Adapter le workflow** : remplacer `./gradlew assembleDebug` par
   `./gradlew assembleRelease` et publier `app-release.apk`.

Le passage de debug → release est simple : c'est la même chaîne de build,
seule la commande Gradle et la signature changent.

---

## 8. Android Studio n'est PAS nécessaire

À 100 % : le build se fait **uniquement** dans GitHub Actions.
- Aucun Android Studio à installer.
- Aucun Android SDK à installer en local.
- Aucun JDK à installer en local.
- Tu n'as besoin que de **Node.js/npm** (déjà utilisé pour le projet) pour
  pousser le code sur GitHub.

---

## 9. Android SDK local n'est PAS nécessaire

Idem : l'environnement Android (SDK, NDK, Build Tools, Java 17, Gradle) est
recréé à chaque build sur les serveurs de GitHub. Ton ordinateur n'a **rien**
à installer pour compiler l'APK.

---

## <a name="gitignore"></a>Annexe — Fichiers à ne pas pousser

Le `.gitignore` du projet exclut déjà :

```
node_modules/
.expo/
dist/
*.log
```

Bonne pratique : les dossiers natifs **`android/`** (et `ios/`) sont régénérés
automatiquement par `npx expo prebuild` dans le workflow CI. Si tu souhaites un
dépôt plus propre, tu peux ajouter `android/` (et `ios/`) au `.gitignore` :
le workflow les régénère à chaque build. (Voir la section suivante.)

### Option : ignorer `android/` (recommandé si le dossier natif est régénéré en CI)

Ajoute ces lignes à la fin du `.gitignore` :

```
# Dossiers natifs régénérés automatiquement par prebuild en CI
/android/
/ios/
```

> Le workflow fait déjà `npx expo prebuild --platform android` → le dossier
> `android/` est reconstruit à chaque build, donc l'ignorer pose aucun problème.
