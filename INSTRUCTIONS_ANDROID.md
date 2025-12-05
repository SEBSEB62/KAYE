# Guide de Packaging : de l'App Web à l'APK/AAB Android via TWA

Bonjour ! Voici votre guide complet pour transformer votre "Buvette +" en une application Android native grâce à une **Trusted Web Activity (TWA)**. Suivez ces étapes attentivement.

---

### Prérequis

1.  **Node.js et npm** installés sur votre machine.
2.  **Android Studio** (dernière version) installé.
3.  Votre application web déployée sur une URL publique (ex: Netlify, Vercel, Firebase Hosting). La TWA a besoin d'une URL HTTPS live pour fonctionner.

---

### Étape 1 : Obtenir les fichiers compilés (Build)

Google AI Studio fournit les sources. Vous devez compiler le projet vous-même pour le déployer.

1.  **Installez les dépendances** : Dans le terminal, à la racine de votre projet, lancez :
    ```bash
    npm install
    ```

2.  **Configurez les variables d'environnement** : L'application utilise des services externes qui nécessitent des clés API. Celles-ci doivent être configurées dans votre environnement de déploiement (ex: Netlify, Vercel).
    *   **Clé API Gemini (`API_KEY`)** : Cette clé est **obligatoire** pour les fonctionnalités IA (génération d'idées, génération de clés de licence via le panneau `admin.html`). Elle doit être disponible en tant que variable d'environnement nommée `API_KEY`. Dans votre service d'hébergement (Netlify, Vercel), configurez cette variable. Elle sera accessible dans le code via `process.env.API_KEY`.
    *   **Configuration Firebase** : Les clés de configuration pour Firebase (utilisé pour la validation des licences) sont actuellement définies directement dans le fichier `services/firebaseService.ts`. Pour une application en production, il est recommandé de les externaliser également en variables d'environnement.

    **Note sur les Rôles Administrateur** :
    *   **Super Administrateur (Développeur)** : L'accès à la page `admin.html` est protégé par un mot de passe codé en dur dans `admin.tsx`. Cette page est destinée à votre usage exclusif pour générer des clés de licence pour vos clients.
    *   **Administrateur (Client)** : Dans l'application principale, le rôle "Administrateur" est protégé par un mot de passe défini dans les paramètres de la buvette (`Paramètres > Sécurité`). Cet administrateur gère l'inventaire, l'équipe et les finances de sa buvette.

3.  **Compilez le projet** :
    ```bash
    npm run build
    ```
    Cette commande va créer un dossier `dist` contenant tous les fichiers statiques (HTML, JS, CSS, images) prêts à être déployés.

4.  **Déployez vos fichiers** : Uploadez le contenu du dossier `dist` sur votre service d'hébergement (Netlify, Vercel, etc.). Vous obtiendrez une URL publique, par exemple : `https://buvette-plus.netlify.app`. **Cette URL est fondamentale pour la suite.**

---

### Étape 2 : Préparer la liaison entre le site et l'app (Digital Asset Links)

Pour qu'Android fasse confiance à votre site et l'ouvre en plein écran, vous devez prouver que vous possédez les deux.

1.  **Le fichier `assetlinks.json`** :
    Vous avez déjà un fichier `public/.well-known/assetlinks.json`. Ce fichier doit être accessible publiquement à l'adresse `https://VOTRE_URL/.well-known/assetlinks.json`.
    Le contenu est un template :
    ```json
    [{
      "relation": ["delegate_permission/common.handle_all_urls"],
      "target": {
        "namespace": "android_app",
        "package_name": "app.netlify.sailor_buvette_oignies.twa",
        "sha256_cert_fingerprints": ["REMPLACER_PAR_VOTRE_EMPREINTE_SHA256"]
      }
    }]
    ```
    Vous remplirez `package_name` et `sha256_cert_fingerprints` dans les étapes suivantes.

---

### Étape 3 : Créer le projet Android avec Android Studio

Nous allons utiliser un template officiel pour les TWA.

1.  **Ouvrez Android Studio.**
2.  Allez dans `File > New > New Project...`.
3.  Sélectionnez l'onglet **Phone and Tablet**, puis choisissez **No Activity**. Cliquez sur `Next`.
4.  **Configurez votre projet** :
    *   **Name**: `Buvette +`
    *   **Package name**: C'est l'identifiant unique de votre app. Choisissez un nom en suivant la convention `com.votredomaine.nomapp`. Par exemple : `com.oignies.buvetteplus`. **Notez-le, vous en aurez besoin pour `assetlinks.json`**.
    *   **Save location**: Choisissez où enregistrer le projet.
    *   **Language**: Kotlin
    *   **Minimum SDK**: Choisissez `API 23: Android 6.0 (Marshmallow)`.
    *   **Build configuration language**: Groovy DSL.
5.  Cliquez sur `Finish`.

---

### Étape 4 : Configurer le projet pour la TWA

1.  **Ajouter la dépendance TWA** :
    Ouvrez le fichier `build.gradle` (celui du `Module :app`). Ajoutez la ligne suivante dans le bloc `dependencies`:
    ```groovy
    dependencies {
        // ... autres dépendances
        implementation "androidx.browser:browser:1.8.0"
    }
    ```
    Android Studio vous proposera de synchroniser le projet (`Sync Now`). Acceptez.

2.  **Configurer l'AndroidManifest.xml** :
    Ouvrez `app/src/main/AndroidManifest.xml`.

    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <manifest xmlns:android="http://schemas.android.com/apk/res/android"
        xmlns:tools="http://schemas.android.com/tools">
    
        <application
            android:allowBackup="true"
            android:dataExtractionRules="@xml/data_extraction_rules"
            android:fullBackupContent="@xml/backup_rules"
            android:icon="@mipmap/ic_launcher"
            android:label="@string/app_name"
            android:roundIcon="@mipmap/ic_launcher_round"
            android:supportsRtl="true"
            android:theme="@style/Theme.AppCompat.Light.NoActionBar"
            tools:targetApi="31">
    
            <activity
                android:name="androidx.browser.trusted.TrustedWebActivity"
                android:exported="true">
    
                <intent-filter>
                    <action android:name="android.intent.action.MAIN" />
                    <category android:name="android.intent.category.LAUNCHER" />
                </intent-filter>
    
                <intent-filter android:autoVerify="true">
                    <action android:name="android.intent.action.VIEW" />
                    <category android:name="android.intent.category.DEFAULT" />
                    <category android:name="android.intent.category.BROWSABLE" />
                    <!-- Remplacez par votre domaine ! -->
                    <data android:scheme="https" android:host="buvette-plus.netlify.app"/>
                </intent-filter>
            </activity>

            <meta-data
                android:name="android.support.customtabs.trusted.DEFAULT_URL"
                android:value="https://buvette-plus.netlify.app" />
    
        </application>
    </manifest>
    ```

    **Points importants à modifier** :
    *   Dans `<data android:host="..." />`, mettez **uniquement le domaine** de votre site.
    *   Dans `<meta-data android:value="..." />`, mettez l'**URL complète** de votre site.
    *   Changez `android:theme` pour `@style/Theme.AppCompat.Light.NoActionBar`.

3.  **Ajouter les icônes de l'application** :
    *   Dans `app/src/main/res`, vous avez des dossiers `mipmap-xxxx`.
    *   Faites un clic droit sur `res` -> `New` -> `Image Asset`.
    *   Utilisez cet outil pour générer les différentes tailles d'icônes à partir d'une image haute résolution (512x512).

---

### Étape 5 : Signer l'application et obtenir l'empreinte SHA-256

1.  **Générez une clé de signature (Keystore)** :
    *   Dans Android Studio, allez dans `Build > Generate Signed Bundle / APK...`.
    *   Sélectionnez **Android App Bundle (AAB)**. Cliquez sur `Next`.
    *   Cliquez sur `Create new...` et remplissez les informations. **Conservez ce fichier de clé et ses mots de passe en lieu sûr.**

2.  **Obtenez l'empreinte SHA-256** :
    *   Ouvrez un terminal dans Android Studio.
    *   Lancez `keytool -list -v -keystore /CHEMIN/VERS/VOTRE/keystore.jks -alias VOTRE_ALIAS`.
    *   Entrez le mot de passe. Copiez la valeur de `SHA256`.

3.  **Mettez à jour `assetlinks.json`** :
    *   Retournez dans votre projet web.
    *   Ouvrez `public/.well-known/assetlinks.json`.
    *   Remplacez `REMPLACER_PAR_VOTRE_EMPREINTE_SHA256` par l'empreinte copiée.
    *   Remplacez `package_name` par celui de votre projet Android.
    *   **Déployez à nouveau votre site web** avec ce fichier mis à jour.

---

### Étape 6 : Compiler l'APK / AAB signé

1.  **Retournez dans `Build > Generate Signed Bundle / APK...`**.
2.  Sélectionnez AAB ou APK, choisissez `release`, et cliquez sur `Finish`.
3.  Android Studio va compiler votre application. Cliquez sur "locate" pour trouver votre fichier `app-release.aab` ou `app-release.apk`.

---

### Étape 7 : Préparer la publication sur le Play Store

1.  **Créez un compte Google Play Console**.
2.  **Créez une nouvelle application** et remplissez la fiche.
3.  **Uploadez votre AAB**.
4.  **Signature par Google Play** : Google re-signe votre AAB. Vous devez récupérer l'empreinte SHA-256 de **cette nouvelle clé** et l'ajouter à votre `assetlinks.json`.
    *   Dans la Play Console, allez dans `Release > Setup > App integrity`.
    *   Copiez l'empreinte `SHA-256 certificate fingerprint`.
    *   Ajoutez cette nouvelle empreinte à votre `assetlinks.json`.
    ```json
    [{... "sha256_cert_fingerprints": ["EMPREINTE_LOCALE", "EMPREINTE_GOOGLE_PLAY"] }]
    ```
    *   Redéployez votre site web.

Et voilà ! Vous avez une application Android sécurisée, performante et publiable.