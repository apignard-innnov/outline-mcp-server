# Documentation Technique - Outline MCP Server

Documentation technique complète du serveur MCP (Model Context Protocol) pour l'API Outline.

## À propos de ce projet

**Outline MCP Server** est un serveur implémentant le protocole MCP (Model Context Protocol) développé par Anthropic, permettant aux assistants IA (comme Claude) d'interagir avec l'API [Outline](https://www.getoutline.com/), une plateforme collaborative de gestion de connaissances.

Le serveur expose 18 outils MCP permettant de manipuler des documents, collections, commentaires et utilisateurs via l'API Outline.

**Version actuelle** : 5.6.0
**Licence** : MIT
**Technologies principales** : TypeScript, Node.js 20+, Fastify, Axios, Zod

---

## Table des matières

### 1. [Architecture](./01-architecture.md)
Vue d'ensemble de l'architecture du projet, diagrammes des composants et flux généraux.
- Architecture globale du serveur MCP
- Modes de transport (HTTP, SSE, STDIO)
- Diagramme de composants
- Points d'entrée et structure du code

### 2. [Composants](./02-composants.md)
Description détaillée de chaque composant du système.
- Serveurs (HTTP/SSE, STDIO, DXT)
- Client Outline
- Système de registre d'outils
- Gestion du contexte de requête
- Logger et utilitaires

### 3. [Outils MCP](./03-outils.md)
Documentation exhaustive des 18 outils MCP disponibles.
- Outils de gestion des documents (9 outils)
- Outils de gestion des collections (3 outils)
- Outils de gestion des commentaires (3 outils)
- Outils de gestion des utilisateurs (1 outil)
- Outil de recherche et Q&A par IA (2 outils)

### 4. [API Outline](./04-api-outline.md)
Intégration avec l'API externe Outline.
- Endpoints utilisés
- Authentification et sécurité
- Structure des requêtes et réponses
- Gestion des erreurs
- Limitations et quotas

### 5. [Flux de données](./05-flux-donnees.md)
Flux de données et logique métier du serveur.
- Cycle de vie d'une requête MCP
- Flux d'authentification
- Traitement des outils
- Gestion des erreurs et validation
- Diagrammes de séquence

### 6. [Configuration](./06-configuration.md)
Configuration et variables d'environnement.
- Variables d'environnement requises et optionnelles
- Fichiers de configuration
- Configuration par mode de transport
- Configuration Docker et Docker Compose

### 7. [Déploiement](./07-deploiement.md)
Installation, build et déploiement du serveur.
- Installation locale
- Build TypeScript
- Déploiement Docker
- Publication NPM
- Build DXT (Desktop Extension)
- CI/CD avec GitHub Actions

### 8. [Développement](./08-developpement.md)
Guide pour développer et contribuer au projet.
- Configuration de l'environnement de développement
- Structure du code et conventions
- Ajouter un nouvel outil MCP
- Tests et debugging
- Workflow de développement

### 9. [Tests et qualité](./09-tests.md)
Organisation des tests et assurance qualité.
- Tests existants
- Outils de test
- Coverage et CI
- Bonnes pratiques de test
- ⚠️ À clarifier : couverture actuelle des tests

### 10. [Maintenance](./10-maintenance.md)
Maintenance et évolution du projet.
- Versionnement sémantique et releases
- Conventions de commit (Conventional Commits)
- Processus de contribution
- Pistes d'amélioration
- Éléments à surveiller

---

## Démarrage rapide

Pour une prise en main rapide :

1. **Installation** : `npm install` (voir [07-deploiement.md](./07-deploiement.md))
2. **Configuration** : Créer un fichier `.env` avec `OUTLINE_API_KEY` (voir [06-configuration.md](./06-configuration.md))
3. **Développement** : `npm run dev` (voir [08-developpement.md](./08-developpement.md))
4. **Build** : `npm run build` (voir [07-deploiement.md](./07-deploiement.md))

---

## Ressources externes

- [Protocole MCP (Anthropic)](https://modelcontextprotocol.io/)
- [API Outline](https://www.getoutline.com/developers)
- [Dépôt GitHub](https://github.com/mmmeff/outline-mcp-server)
- [Package NPM](https://www.npmjs.com/package/outline-mcp-server)

---

## Glossaire

- **MCP** : Model Context Protocol - protocole développé par Anthropic pour permettre aux LLM d'interagir avec des outils et services externes
- **Outline** : Plateforme collaborative de gestion de connaissances (wiki, documentation)
- **Tool** : Dans le contexte MCP, un outil est une fonction exposée que le LLM peut appeler
- **Transport** : Mécanisme de communication entre le client MCP et le serveur (HTTP, SSE, STDIO)
- **DXT** : Desktop Extension - format d'extension pour Claude Desktop
- **SSE** : Server-Sent Events - protocole de streaming HTTP unidirectionnel
- **STDIO** : Standard Input/Output - communication via les flux standards Unix

---

*Cette documentation a été générée pour faciliter la compréhension, la maintenance et l'extension du projet Outline MCP Server.*
