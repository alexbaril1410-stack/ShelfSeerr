# ShelfSeerr — Cahier des charges et feuille de route

## Vision

ShelfSeerr est une interface de découverte et de gestion de livres et de livres audio, inspirée de l'expérience utilisateur de Seerr. Le projet conserve autant que possible l'architecture, les règles métier et les fonctionnalités de Shelfmark.

L'objectif n'est pas de réécrire Shelfmark, mais de faire évoluer progressivement son interface et d'ajouter les fonctionnalités nécessaires aux livres audio.

## Décisions fonctionnelles validées

### Expérience utilisateur
- Interface visuelle très proche de Seerr, adaptée aux livres.
- Accueil présentant nouveautés et popularité depuis Audible.fr et les fournisseurs de métadonnées ebook disponibles.
- Navigation cible : Accueil, Livres, Livres audio, Recherche, Demandes, Utilisateurs et Paramètres.
- Interface responsive avec une véritable expérience mobile.
- Français et anglais au lancement, architecture d'internationalisation extensible.

### Ebooks
- Préserver strictement le fonctionnement actuel de recherche ebook de Shelfmark.
- Conserver les fournisseurs et filtres existants.
- Améliorer la présentation et la pertinence des filtres sans réécrire le moteur de recherche.
- Ajouter une préférence globale pour masquer ou afficher les résultats à zéro seeder et un filtre directement dans les résultats.

### Livres audio
- Audible.fr est le catalogue de référence.
- Recherche par titre, auteur, narrateur, série et ASIN.
- Fiche détaillée : jaquette, titre, auteur, narrateur, durée, langue, série, description, ASIN et lien Audible.
- Les ebooks et les livres audio restent deux types de contenus distincts, avec leurs recherches, résultats et fiches respectifs.

### Demandes, utilisateurs et bibliothèque
- Reprendre le système actuel de demandes avec une présentation inspirée de Seerr.
- Conserver les comptes, rôles et permissions existants.
- Afficher clairement si un livre est disponible dans les bibliothèques connectées.

### Téléchargements et bibliothèques
- Prowlarr devient la source de recherche des releases.
- qBittorrent reste le client de téléchargement.
- Audiobookshelf reste la bibliothèque cible des livres audio.
- Conserver le principe de hardlink : le fichier audio n'est pas dupliqué.
- Dans le dossier de destination du livre audio, générer uniquement un fichier NFO en complément du hardlink. Ne pas générer automatiquement de jaquette, desc.txt ou reader.txt dans le périmètre initial.
- Le NFO doit conserver les métadonnées utiles, notamment l'ASIN Audible, afin de faciliter l'identification dans Audiobookshelf.
- Le format, le nommage et le comportement réel du NFO devront être validés par un test d'import Audiobookshelf avant généralisation.

### Distribution
- Installation avec Docker Compose.
- Publication d'une image sur GitHub Container Registry (GHCR).

## Principes d'architecture

1. Préserver le backend Flask, les API et les règles métier existantes de Shelfmark.
2. Faire évoluer le frontend React/TypeScript par composants et étapes cohérentes.
3. Ne pas modifier le moteur de recherche ebook lors de la refonte visuelle.
4. Intégrer Audible.fr comme fournisseur de métadonnées pour le type audiobook, en réutilisant les abstractions existantes lorsque cela est adapté.
5. Séparer les rôles des intégrations : Prowlarr pour la recherche de releases, qBittorrent pour le téléchargement, Audiobookshelf pour la bibliothèque.
6. Éviter toute régression sur les demandes, les permissions, les téléchargements, le suivi d'activité et les préférences utilisateur.

## Feuille de route

### Étape 1 — Refonte de l'interface Seerr
- Définir les tokens visuels et l'identité ShelfSeerr.
- Repenser la navigation et la structure générale.
- Créer l'accueil catalogue.
- Revoir les cartes de livres et les fiches détaillées.
- Adapter les principaux écrans au mobile.
- Conserver les appels API et interactions métier existants.

**Critères de validation :** l'utilisateur peut toujours rechercher, consulter une fiche, demander ou télécharger un contenu, suivre l'activité et accéder aux paramètres. Les deux types de contenus restent distincts.

### Étape 2 — Fournisseur Audible.fr
- Étudier et documenter la méthode d'accès au catalogue Audible.fr.
- Implémenter recherche, pagination si disponible, détails par ASIN et normalisation des métadonnées.
- Ajouter cache, gestion des erreurs et tests unitaires.
- Enregistrer le fournisseur dans le système de métadonnées existant et l'associer au type audiobook.

**Critères de validation :** recherche par titre, auteur, narrateur et ASIN ; fiche détaillée correctement renseignée ; aucun impact sur les fournisseurs ebook.

### Étape 3 — Catalogue d'accueil
- Alimenter les sections nouveautés et popularité depuis Audible.fr et les fournisseurs ebook qui exposent réellement ces capacités.
- Ne pas inventer de recommandations ou de classements lorsque les sources ne les proposent pas.
- Prévoir des états vides et des erreurs par source.

### Étape 4 — Prowlarr et livraison audiobook
- Vérifier les capacités de recherche Prowlarr et les mécanismes actuels de Shelfmark.
- Remplacer ou adapter la recherche des releases après comparaison fonctionnelle.
- Conserver qBittorrent comme client de téléchargement.
- Préserver les hardlinks et générer le NFO dans le dossier de destination.
- Tester l'import et le rapprochement dans Audiobookshelf.

### Étape 5 — Filtres de recherche
- Conserver les filtres ebook existants.
- Améliorer leur ergonomie.
- Ajouter le réglage global et le filtre local pour les résultats à zéro seeder.

### Étape 6 — Internationalisation
- Finaliser les traductions françaises et anglaises.
- Sortir les chaînes visibles des composants.
- Préparer l'ajout d'autres langues.

### Étape 7 — Docker et publication
- Vérifier Dockerfile, Compose, volumes, permissions et variables de configuration.
- Construire et tester l'image.
- Publier l'image GHCR et documenter la mise à jour.

## Méthode de travail

- Développement sur la branche `feature/seerr-ui`, jamais directement sur `main`.
- Avancer par grandes fonctionnalités et demander une validation à chaque étape.
- Faire des commits cohérents et explicites.
- Vérifier les changements et lancer les tests disponibles avant d'annoncer une fonctionnalité comme validée.
- Ne jamais déclarer un test exécuté s'il ne l'a pas réellement été.
