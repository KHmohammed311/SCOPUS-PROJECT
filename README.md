# SCOPUS Research Explorer — Université Mohammed V de Rabat

Application web Angular permettant de rechercher et d'analyser les publications scientifiques des chercheurs de l'Université Mohammed V de Rabat via l'API Scopus (Elsevier).

---

## Fonctionnalités

### 🔍 Recherche d'auteurs
- Recherche par prénom et/ou nom, filtrée automatiquement sur les affiliés à l'Université Mohammed V (Maroc)
- Sélection d'un auteur pour charger l'ensemble de ses publications

### 📊 Synthèse auteur (carte de résumé)
- Tableau récapitulatif affiché en haut des résultats
- Décompte par type de publication : Article, Conference Paper, Book Chapter, Review
- Colonnes : 1er auteur / 2ème auteur / Total
- Seules les publications où l'auteur est en 1ère ou 2ème position sont comptabilisées

### 🎯 Tri et filtres
- Tri par date de publication décroissante par défaut
- **Filtre rang auteur** : Tous / 1er auteur / 2ème auteur
- **Filtre année** : dropdown dynamique généré à partir des résultats
- **Filtre type** : cases à cocher multiples (Article, Conference, Book Chapter, Review)
- Filtres combinables, réactifs et réinitialisables
- La carte de synthèse reflète toujours les totaux globaux (non affectée par les filtres)

### 👥 Gestion d'équipes
- Créer des équipes nommées et y ajouter des chercheurs (recherche via Scopus)
- Équipes persistées en localStorage (pas de backend nécessaire)
- Lister, modifier et supprimer des équipes
- **Recherche équipe** : récupération parallèle (`Promise.all`) des publications de tous les membres, avec déduplication par EID (un article co-signé par deux membres n'apparaît qu'une fois)
- **Carte de synthèse équipe** : total unique, répartition par type, top contributeurs (publications + 1er auteur), plage d'années d'activité
- Mêmes filtres disponibles dans la vue équipe

### 📈 Classement SJR des journaux
- Pour chaque Article ou Review, un bouton "Voir classement journal ▾" (replié par défaut)
- Affiche l'évolution du quartile SJR sur ±2 ans autour de l'année de publication
- Données via l'API SCImago (proxy Express pour contourner le CORS)
- Couleurs : Q1 = vert foncé · Q2 = vert clair · Q3 = orange · Q4 = rouge
- Dégradation gracieuse si le journal n'est pas indexé dans SCImago

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Angular 21 (standalone components) |
| Rendu | Angular SSR (`@angular/ssr`) |
| Serveur | Express 5 |
| API données | Scopus / Elsevier REST API |
| API classements | SCImago Journal Rank (proxy Express) |
| Persistance équipes | localStorage |
| Styles | CSS inline (sans bibliothèque UI) |

---

## Prérequis

- **Node.js** ≥ 20
- **npm** ≥ 9
- Une **clé API Scopus** valide (déjà configurée dans `src/app/services/scopus.service.ts`)
- Accès réseau direct à `api.elsevier.com` (VPN désactivé recommandé)

---

## Installation

```bash
git clone https://github.com/KHmohammed311/SCOPUS-PROJECT.git
cd SCOPUS-PROJECT
npm install
```

---

## Lancer l'application

### Mode développement

```bash
npm start
# → http://localhost:4200
```

### Mode production (SSR complet)

```bash
npm run build
node dist/scopus/server/server.mjs
# → http://localhost:4000
```

---

## Structure du projet

```
src/
├── app/
│   ├── components/
│   │   ├── author-summary/        # Carte de synthèse auteur (F1)
│   │   ├── sjr-timeline/          # Timeline SJR par journal (F4)
│   │   ├── publication-list/      # Liste des publications + filtres (F2)
│   │   ├── author-list/           # Liste des auteurs trouvés
│   │   ├── search/                # Formulaire de recherche
│   │   ├── header/                # En-tête + navigation
│   │   ├── team-modal/            # Modal création/édition équipe (F3)
│   │   ├── team-list/             # Liste des équipes (F3)
│   │   └── team-publications/     # Publications + synthèse équipe (F3)
│   ├── services/
│   │   ├── scopus.service.ts      # Appels API Scopus (auteurs + publications)
│   │   └── team.service.ts        # CRUD équipes (localStorage)
│   ├── app.ts                     # Composant racine
│   ├── app.html                   # Template principal
│   └── app.css                    # Styles globaux de l'app
├── server.ts                      # Express SSR + proxy SCImago
└── styles.css                     # Styles globaux (reset, fonts)
```

---

## Configuration de la clé API

La clé Scopus est définie dans `src/app/services/scopus.service.ts` :

```typescript
private readonly API_KEY = 'VOTRE_CLE_API';
```

> ⚠️ Pour un déploiement public, déplacez la clé dans une variable d'environnement et ne la commitez pas en clair.

---

## Auteur

Développé pour l'Université Mohammed V de Rabat.  
Données scientifiques fournies par [Scopus / Elsevier](https://www.scopus.com) et [SCImago Journal Rank](https://www.scimagojr.com).
