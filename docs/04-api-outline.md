# API Outline

Ce document décrit l'intégration avec l'API Outline, les endpoints utilisés, l'authentification et les conventions de communication.

---

## Vue d'ensemble de l'API Outline

**Base URL** : `https://app.getoutline.com/api` (par défaut)
**URL configurable** : Via `OUTLINE_API_URL`
**Documentation officielle** : https://www.getoutline.com/developers

L'API Outline est une API REST JSON qui utilise POST pour tous les endpoints, même pour la récupération de données (contrairement à REST classique).

---

## Configuration de l'API

### Base URL

Par défaut, le serveur utilise l'API publique d'Outline :
```
https://app.getoutline.com/api
```

Pour une instance auto-hébergée, définir `OUTLINE_API_URL` :
```bash
OUTLINE_API_URL=https://outline.monentreprise.com/api
```

**Fichier** : `/src/outline/outlineClient.ts:10`
```typescript
const API_URL = process.env.OUTLINE_API_URL || 'https://app.getoutline.com/api';
```

---

## Authentification

### Type d'authentification

L'API Outline utilise **OAuth 2.0 Bearer tokens** pour l'authentification.

### Obtenir une clé API

1. Se connecter à Outline
2. Aller dans **Settings > API Tokens**
3. Cliquer sur **Create a token**
4. Copier le token généré (format : `ol_api_...`)

### Format de la requête

Toutes les requêtes incluent un header `Authorization` :

```http
POST /documents.create HTTP/1.1
Host: app.getoutline.com
Authorization: Bearer ol_api_xxxxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
Accept: application/json

{
  "title": "Mon document",
  "text": "# Contenu",
  "collectionId": "abc123"
}
```

### Implémentation dans le serveur

**Fichier** : `/src/outline/outlineClient.ts:22-29`

```typescript
return axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});
```

---

## Endpoints utilisés

### Documents

| Endpoint | Méthode | Description | Outil MCP |
|----------|---------|-------------|-----------|
| `/documents.create` | POST | Créer un document | `create_document` |
| `/documents.info` | POST | Récupérer un document | `get_document` |
| `/documents.update` | POST | Mettre à jour un document | `update_document` |
| `/documents.delete` | POST | Supprimer un document | `delete_document` |
| `/documents.list` | POST | Lister les documents | `list_documents` |
| `/documents.search` | POST | Rechercher des documents | `search_documents` |
| `/documents.move` | POST | Déplacer un document | `move_document` |
| `/documents.archive` | POST | Archiver un document | `archive_document` |
| `/documents.answerQuestion` | POST | Q&A par IA | `ask_documents` |

### Collections

| Endpoint | Méthode | Description | Outil MCP |
|----------|---------|-------------|-----------|
| `/collections.info` | POST | Récupérer une collection | `get_collection` |
| `/collections.list` | POST | Lister les collections | `list_collections` |
| `/collections.create` | POST | Créer une collection | `create_collection` |
| `/collections.update` | POST | Mettre à jour une collection | `update_collection` |

### Commentaires

| Endpoint | Méthode | Description | Outil MCP |
|----------|---------|-------------|-----------|
| `/comments.create` | POST | Créer un commentaire | `create_comment` |
| `/comments.update` | POST | Mettre à jour un commentaire | `update_comment` |
| `/comments.delete` | POST | Supprimer un commentaire | `delete_comment` |

### Utilisateurs

| Endpoint | Méthode | Description | Outil MCP |
|----------|---------|-------------|-----------|
| `/users.list` | POST | Lister les utilisateurs | `list_users` |

---

## Format des requêtes et réponses

### Structure de requête type

```json
{
  "param1": "value1",
  "param2": "value2"
}
```

**Exemple** (`/documents.create`) :
```json
{
  "title": "Guide API",
  "text": "# Introduction\n\nContenu...",
  "collectionId": "abc123",
  "publish": true
}
```

### Structure de réponse type

Toutes les réponses suivent le même format :

```json
{
  "data": {
    // Objet retourné (document, collection, etc.)
  },
  "policies": [
    // Permissions
  ],
  "pagination": {
    // Uniquement pour les listes
    "offset": 0,
    "limit": 25,
    "total": 142
  }
}
```

**Exemple** (réponse `/documents.create`) :
```json
{
  "data": {
    "id": "doc-xyz789",
    "title": "Guide API",
    "text": "# Introduction\n\nContenu...",
    "url": "https://app.getoutline.com/doc/guide-api-xyz789",
    "collectionId": "abc123",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z",
    "publishedAt": "2025-01-15T10:30:00Z",
    "createdBy": {
      "id": "user-456",
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  "policies": [
    {
      "id": "doc-xyz789",
      "abilities": {
        "read": true,
        "update": true,
        "delete": true
      }
    }
  ]
}
```

### Extraction des données dans les outils

**Fichier** : Tous les outils dans `/src/tools/`

```typescript
const response = await client.post('/endpoint', payload);

// Extraction de l'objet principal
return {
  content: [{
    type: 'text',
    text: JSON.stringify(response.data.data) // <-- data.data
  }]
};
```

**Note** : Axios retourne `response.data`, qui contient l'objet JSON de l'API. L'objet principal est dans `response.data.data`.

---

## Gestion des erreurs

### Codes d'erreur HTTP

| Code | Signification | Cause typique |
|------|---------------|---------------|
| **200** | OK | Requête réussie |
| **400** | Bad Request | Paramètres invalides |
| **401** | Unauthorized | API key invalide ou manquante |
| **403** | Forbidden | Permissions insuffisantes |
| **404** | Not Found | Ressource introuvable |
| **422** | Unprocessable Entity | Validation échouée (ex: titre vide) |
| **429** | Too Many Requests | Rate limiting dépassé |
| **500** | Internal Server Error | Erreur serveur Outline |

### Format des erreurs API

```json
{
  "ok": false,
  "error": "unauthorized",
  "message": "Invalid API token"
}
```

### Gestion dans les outils

```typescript
try {
  const response = await client.post('/endpoint', payload);
  return { content: [{ type: 'text', text: JSON.stringify(response.data.data) }] };
} catch (error: any) {
  console.error('Error:', error.message);
  throw new McpError(ErrorCode.InvalidRequest, error.message);
}
```

**Traitement** :
1. L'erreur Axios est capturée (contient `error.response.data`)
2. Le message d'erreur est loggé sur stderr
3. Une `McpError` MCP est levée avec le message d'erreur

---

## Pagination

### Paramètres de pagination

Les endpoints de liste supportent la pagination :

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `offset` | `number` | 0 | Décalage (index de départ) |
| `limit` | `number` | 25 | Nombre maximum de résultats |

**Exemple** :
```json
{
  "offset": 50,
  "limit": 25
}
```
Retourne les résultats 51 à 75.

### Réponse paginée

```json
{
  "data": [ /* ... */ ],
  "pagination": {
    "offset": 50,
    "limit": 25,
    "total": 142
  }
}
```

**Calcul du nombre de pages** :
```javascript
const totalPages = Math.ceil(pagination.total / pagination.limit);
const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
```

### Implémentation dans `list_documents` et `list_users`

**Fichier** : `/src/tools/listDocuments.ts:63-73`

```typescript
return {
  content: [
    {
      type: 'text',
      text: `documents: ${JSON.stringify(documents)}`,
    },
    {
      type: 'text',
      text: `pagination: ${JSON.stringify(response.data.pagination)}`,
    },
  ],
};
```

**Note** : La pagination est retournée séparément pour permettre au client de la traiter.

---

## Tri

### Paramètres de tri

Les endpoints de liste supportent le tri :

| Paramètre | Type | Valeurs possibles |
|-----------|------|-------------------|
| `sort` | `string` | `"updatedAt"`, `"createdAt"`, `"title"`, etc. |
| `direction` | `"ASC"` \| `"DESC"` | Direction du tri |

**Exemple** :
```json
{
  "sort": "updatedAt",
  "direction": "DESC"
}
```

Retourne les documents les plus récemment mis à jour en premier.

---

## Filtres

### Filtres de documents

| Paramètre | Type | Description |
|-----------|------|-------------|
| `collectionId` | `string` | Limiter à une collection |
| `userId` | `string` | Documents créés/modifiés par un utilisateur |
| `template` | `boolean` | Filtrer les templates uniquement |
| `parentDocumentId` | `string` | Documents enfants d'un parent |
| `backlinkDocumentId` | `string` | Documents liés à un document |

### Filtres d'utilisateurs

| Paramètre | Type | Valeurs possibles |
|-----------|------|-------------------|
| `filter` | `enum` | `"all"`, `"invited"`, `"active"`, `"suspended"` |
| `role` | `enum` | `"admin"`, `"member"`, `"viewer"`, `"guest"` |
| `emails` | `string[]` | Liste d'emails à filtrer |

---

## Limitations et quotas

### Rate limiting

⚠️ **À clarifier** : Les limites de taux de l'API Outline ne sont pas documentées publiquement.

**Recommandations** :
- Implémenter un système de retry avec backoff exponentiel
- Limiter les requêtes concurrentes
- Cacher les données fréquemment utilisées (collections, users)

### Taille des payloads

- **Documents** : Pas de limite explicite, mais Outline recommande de découper les très gros documents
- **Requêtes** : Les requêtes POST doivent rester raisonnables (< 10 MB)

### Permissions

L'API key utilisée détermine les permissions :
- **Admin** : Accès complet
- **Member** : Lecture/écriture des collections accessibles
- **Viewer** : Lecture seule
- **Guest** : Lecture limitée

**Note** : Le serveur MCP hérite des permissions de l'API key configurée.

---

## Fonctionnalités avancées

### AI Answers

**Endpoint** : `POST /documents.answerQuestion`
**Outil MCP** : `ask_documents`

**Prérequis** :
- Fonctionnalité "AI Answers" activée dans les paramètres du workspace
- Plan Outline supportant l'IA (Business ou Enterprise)

**Exemple** :
```json
{
  "query": "Comment configurer l'authentification SSO ?",
  "collectionId": "col-engineering"
}
```

**Réponse** :
```json
{
  "data": {
    "answer": "Pour configurer SSO, suivez ces étapes...",
    "sources": [
      {
        "documentId": "doc-abc",
        "title": "Guide SSO",
        "url": "https://..."
      }
    ]
  }
}
```

**Comment ça marche** :
1. Outline recherche dans les documents accessibles
2. Un modèle d'IA analyse les documents pertinents
3. Une réponse synthétique est générée avec les sources

---

## Webhooks et temps réel

⚠️ **Non supporté** : Le serveur MCP actuel ne supporte pas les webhooks Outline.

**Fonctionnalités manquantes** :
- Notifications de changements de documents
- Synchronisation en temps réel
- Événements de collaboration

**Pistes d'amélioration** :
- Implémenter un endpoint pour recevoir les webhooks Outline
- Exposer des outils MCP pour s'abonner aux événements
- Cacher les données et invalider le cache sur webhook

---

## Sécurité

### Protection de l'API key

✅ **Bonnes pratiques implémentées** :
- L'API key n'est jamais loggée
- En mode HTTP, l'API key est isolée par requête (RequestContext)
- En mode STDIO, l'API key est validée au démarrage

❌ **Points d'attention** :
- Ne jamais committer un fichier `.env` avec l'API key
- Utiliser des variables d'environnement en production
- Rotation régulière des API keys

### HTTPS

Le serveur MCP communique avec l'API Outline uniquement en **HTTPS**.

**Fichier** : `/src/outline/outlineClient.ts:10`
```typescript
const API_URL = process.env.OUTLINE_API_URL || 'https://app.getoutline.com/api';
```

**Note** : Pour une instance auto-hébergée, s'assurer que `OUTLINE_API_URL` utilise HTTPS.

### Validation des entrées

Tous les paramètres sont validés par Zod avant d'être envoyés à l'API :

```typescript
inputSchema: {
  documentId: z.string().describe('ID du document'),
  title: z.string().min(1).describe('Titre').optional(),
}
```

Cela protège contre :
- Injection de paramètres malveillants
- Erreurs de typage
- Requêtes mal formées

---

## Tests de l'API

### Tester avec curl

```bash
curl -X POST https://app.getoutline.com/api/collections.list \
  -H "Authorization: Bearer ol_api_xxxxxx" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Tester avec l'inspector MCP

```bash
npm run dev
# Ouvre l'inspector MCP dans le navigateur
# Appeler les outils et voir les requêtes/réponses
```

### Tester avec Postman

Importer la collection Outline depuis :
https://www.getoutline.com/developers

---

## Ressources externes

- **Documentation API Outline** : https://www.getoutline.com/developers
- **Postman Collection** : https://www.postman.com/outlinewiki
- **Support Outline** : https://www.getoutline.com/support

---

## Prochaines étapes

Consultez les documents suivants pour approfondir :
- [05-flux-donnees.md](./05-flux-donnees.md) : Flux de données et diagrammes de séquence
- [03-outils.md](./03-outils.md) : Documentation des 18 outils MCP
- [06-configuration.md](./06-configuration.md) : Configuration des variables d'environnement
