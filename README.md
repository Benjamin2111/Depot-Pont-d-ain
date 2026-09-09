# Dépôt Pont-d'Ain — Gestion de stock

Application de gestion de stock (Next.js + Supabase), déployable gratuitement sur Netlify.

Ce guide est écrit pour quelqu'un qui n'est pas développeur. Suivez les étapes dans l'ordre.

---

## 1. Créer le projet Supabase (la base de données)

1. Allez sur https://supabase.com et créez un compte gratuit.
2. Cliquez sur **New project**. Donnez-lui un nom (ex : `depot-pont-dain`), choisissez un mot de passe de base de données (notez-le quelque part), choisissez une région proche de vous (ex : Europe).
3. Attendez 1 à 2 minutes que le projet soit prêt.
4. Dans le menu de gauche, allez dans **SQL Editor** → **New query**.
5. Ouvrez le fichier `supabase/schema.sql` fourni avec ce projet, copiez tout son contenu, collez-le dans l'éditeur, puis cliquez sur **Run**.
   - Cela crée toutes les tables, les règles de sécurité, le calcul automatique du stock, et quelques produits/chantiers de démonstration.
6. Allez dans **Project Settings** (roue crantée) → **API**. Vous y trouverez trois informations à garder de côté :
   - **Project URL**
   - **anon public** (clé publique)
   - **service_role** (clé secrète — ne la partagez jamais, ne la mettez jamais dans un site public)

---

## 2. Créer le premier compte responsable

Comme il n'y a pas encore d'utilisateur, le tout premier compte se crée directement dans Supabase :

1. Dans Supabase, allez dans **Authentication** → **Users** → **Add user** → **Create new user**.
2. Renseignez un e-mail et un mot de passe pour vous-même, cochez **Auto Confirm User**, validez.
3. Allez ensuite dans **Table Editor** → table `profiles`. Vous devriez voir une ligne créée automatiquement pour ce compte.
4. Cliquez sur cette ligne et changez la colonne `role` de `ouvrier` à `responsable`, et `first_name` / `last_name` avec votre prénom/nom. Sauvegardez.

Vous pourrez ensuite créer tous les autres comptes (ouvriers et responsables) directement depuis l'application, dans **Gestion → Utilisateurs**.

---

## 3. Installer le projet sur votre ordinateur (pour le tester avant de le mettre en ligne)

Prérequis : installez **Node.js** (version 18 ou plus) depuis https://nodejs.org si ce n'est pas déjà fait.

1. Décompressez le dossier du projet.
2. Ouvrez un terminal dans ce dossier.
3. Copiez le fichier `.env.example` en `.env.local` et remplissez-le avec les 3 valeurs récupérées à l'étape 1 :
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
4. Installez les dépendances :
   ```
   npm install
   ```
5. Lancez l'application en local :
   ```
   npm run dev
   ```
6. Ouvrez http://localhost:3000 dans votre navigateur et connectez-vous avec le compte créé à l'étape 2.

---

## 4. Mettre l'application en ligne avec Netlify

1. Créez un compte gratuit sur https://netlify.com.
2. Mettez le code du projet sur GitHub (créez un dépôt, envoyez-y tous les fichiers) — ou utilisez **Netlify CLI** / le glisser-déposer si vous préférez ne pas utiliser GitHub.
3. Sur Netlify, cliquez sur **Add new site** → **Import an existing project**, choisissez votre dépôt GitHub.
4. Netlify détecte automatiquement Next.js. Avant de déployer, allez dans **Site configuration → Environment variables** et ajoutez les 3 mêmes variables que dans `.env.local` :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Cliquez sur **Deploy**. Après quelques minutes, Netlify vous donne une adresse du type `https://votre-appli.netlify.app`.

C'est cette adresse que vous partagerez à vos ouvriers et responsables — elle fonctionne sur téléphone comme sur ordinateur, avec une vraie connexion sécurisée (https).

---

## 5. Accéder à l'application depuis les téléphones

- Envoyez le lien Netlify (par SMS, WhatsApp, etc.) à chaque personne.
- Sur téléphone, on peut ouvrir le lien dans le navigateur puis choisir **"Ajouter à l'écran d'accueil"** pour avoir une icône comme une vraie application.
- Chaque personne reste connectée automatiquement une fois son mot de passe saisi une première fois (pas besoin de le retaper à chaque usage).
- Le scan de QR code demande l'autorisation d'utiliser la caméra la première fois : il faut l'accepter.

---

## 6. Créer les comptes ouvriers

Connectez-vous avec le compte responsable, puis allez dans **Gestion → Utilisateurs → + Ajouter un utilisateur**. Donnez à chaque personne son e-mail et un mot de passe provisoire (elle pourra le garder, ou vous pouvez lui indiquer de le changer plus tard depuis Supabase si besoin).

---

## 7. Ajouter vos premiers produits

**Gestion → Produits → + Ajouter un produit.** Remplissez référence, désignation, famille, unité, stocks (initial / minimum / sécurité / maximum), emplacement. Le QR code est généré automatiquement et visible dans la fiche produit.

---

## 8. Imprimer les QR codes

**Gestion → QR codes.** Filtrez par famille si besoin, puis cliquez sur **Imprimer les étiquettes de cette sélection** : la fenêtre d'impression de votre navigateur s'ouvre avec toutes les étiquettes prêtes à découper.

---

## Notes techniques (pour information)

- Le stock ne peut **jamais** être modifié directement dans la base : chaque entrée/sortie/correction passe par un mouvement, et c'est la base de données elle-même (pas seulement l'application) qui calcule le nouveau stock et vérifie les droits de chacun. Un ouvrier ne peut donc pas contourner la règle même en modifiant l'application.
- Les mises à jour de stock apparaissent en temps réel sur tous les appareils connectés (Supabase Realtime), sans avoir besoin de recharger la page.
- Ce projet n'a pas pu être testé par une exécution réelle (`npm run build`) dans l'environnement où il a été écrit, faute d'accès réseau. Faites bien l'étape 3 (test en local) avant de le déployer, et si une erreur apparaît, copiez-la ici pour que je la corrige.
