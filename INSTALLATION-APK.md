# Installation de l'APK (fitness-tracker)

Ce guide explique comment compiler et installer l'application **fitness-tracker**
sur Android **sans Android Studio** et **sans Android SDK installé en local**.

Tout (Java, Gradle, Android SDK) est installé et configuré automatiquement
dans **GitHub Actions** (le cloud de GitHub).

---

## 1. Aucun outil Android requis

À 100 % : le build se fait **uniquement** dans GitHub Actions.
- Aucun Android Studio à installer.
- Aucun Android SDK à installer en local.
- Aucun JDK à installer en local.
- Tu n'as besoin que de **Node.js/npm** pour pousser le code sur GitHub.

---

## 2. Pousser le projet sur GitHub

Depuis le dossier du projet **sur Windows (PowerShell)** :

```powershell
git init
git add .
git commit -m "CI: build Android RELEASE APK with GitHub Actions"
git branch -M main
git remote add origin https://github.com/<TON-USER>/<TON-REPO>.git
git push -u origin main
```

---

## 3. Lancer le workflow

1. Va sur ton dépôt : `https://github.com/<TON-USER>/<TON-REPO>`
2. Onglet **Actions** (dans la barre du haut).
3. Dans la liste de gauche, clique sur **Build Android APK**.
4. Clique sur **Run workflow** → bouton vert.

Le workflow se lance aussi **automatiquement** à chaque push vers `main`.

Le build exécute, dans l'ordre :
- Checkout du code → Node.js 18 → npm ci
- Java 17 + Android SDK + NDK
- Vérifications (`tsc`, `expo-doctor`)
- `npx expo prebuild --platform android --clean`
- Vérification post-prebuild (dossier, gradlew, splash, JS bundle)
- `./gradlew assembleRelease --stacktrace`
- Publication de l'APK

Un build dure **15-30 minutes** au premier lancement.

---

## 4. Récupérer l'APK

Une fois le workflow terminé avec succès (icône ✅ verte) :

1. Onglet **Actions** → clic sur le run terminé.
2. En bas, section **Artifacts** → clic sur **fitness-tracker-release-apk**.
3. Télécharge le fichier `.zip`.
4. Décompresse → tu obtiens **`app-release.apk`**.

---

## 5. Installer l'APK sur Android

1. Copie `app-release.apk` sur ton téléphone (USB, Google Drive, e-mail, …).
2. Sur le téléphone, ouvre le fichier `.apk`.
3. Autorise l'installation depuis des sources inconnues si demandé :
   - **Paramètres → Applications → Accès spécial → Installer des applications inconnues**
4. Confirme l'installation.
5. Ouvre **fitness-tracker** — l'application fonctionne **directement**.

> Compatible : Android 6.0 (API 23) et plus récent.

---

## 6. APK Release vs APK Debug

| | **Release APK** | **Debug APK** |
|---|---|---|
| Bundle JS | Embarqué dans l'APK | Absent (dépend de Metro) |
| Fonctionne sans PC | ✅ Oui | ❌ Non (localhost:8081) |
| Fonctionne sans Metro | ✅ Oui | ❌ Non |
| Optimisations | Minification possible | Code de debug inclus |
| Publication Play Store | Avec keystore release | Impossible |

L'APK **release** (`app-release.apk`) est le fichier à utiliser :
- Il embarque le bundle JavaScript.
- Il fonctionne **sans Metro**, **sans npm start**, **sans PC**.
- Il fonctionne directement après installation sur Android.

---

## 7. Générer plus tard un APK signé Play Store

Pour publier sur Google Play, il faut :

1. **Générer une clé de signature Android** (une seule fois) :
   ```bash
   keytool -genkey -v -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
   ```
2. **Configurer la signature** dans `android/app/build.gradle` :
   ```groovy
   signingConfigs {
       release {
           storeFile file('release.keystore')
           storePassword 'mot_de_passe'
           keyAlias 'release'
           keyPassword 'mot_de_passe'
       }
   }
   ```
3. **Ajouter les secrets** dans GitHub (Settings → Secrets → Actions).
4. **Adapter le workflow** : ajouter la configuration de signature et publier `app-release.apk`.

Le passage de debug → release est simple : c'est la même chaîne de build,
seule la signature change.
