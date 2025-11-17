# Outils MCP

Ce document documente de manière exhaustive les **18 outils MCP** exposés par le serveur Outline MCP. Chaque outil permet d'interagir avec une fonctionnalité spécifique de l'API Outline.

---

## Vue d'ensemble

Les outils sont organisés en **5 catégories fonctionnelles** :

| Catégorie | Nombre d'outils | Description |
|-----------|----------------|-------------|
| **Documents** | 9 | Création, lecture, mise à jour, suppression, déplacement, archivage de documents |
| **Collections** | 3 | Gestion des collections (espaces de documents) |
| **Commentaires** | 3 | Création, mise à jour et suppression de commentaires |
| **Utilisateurs** | 1 | Listage et filtrage des utilisateurs |
| **Recherche/Q&A** | 2 | Recherche textuelle et questions en langage naturel avec IA |

---

## Structure commune des outils

Tous les outils suivent le même pattern d'implémentation :

```typescript
// Fichier: /src/tools/{nom_outil}.ts

import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

toolRegistry.register('nom_outil', {
  name: 'nom_outil',
  description: 'Description de l\'outil',
  inputSchema: {
    param1: z.string().describe('Description du paramètre 1'),
    param2: z.number().describe('Description du paramètre 2').optional(),
  },
  async callback(args) {
    try {
      const client = getOutlineClient();
      const response = await client.post('/endpoint.api', args);
      return { content: [{ type: 'text', text: JSON.stringify(response.data.data) }] };
    } catch (error: any) {
      console.error('Error:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
```

**Éléments communs** :
- **Auto-enregistrement** : Chaque outil s'enregistre via `toolRegistry.register()` à l'import
- **Validation Zod** : Les paramètres d'entrée sont validés par des schémas Zod
- **Client dynamique** : `getOutlineClient()` récupère l'API key du contexte de requête
- **Gestion d'erreur** : Les erreurs sont capturées et transformées en `McpError`
- **Réponse JSON** : Les données sont retournées au format JSON stringifié

---

## 1. Outils de gestion des documents

### 1.1. `create_document`

**Fichier** : `/src/tools/createDocument.ts`
**Endpoint API** : `POST /documents.create`

**Description** : Crée un nouveau document dans une collection Outline.

#### Paramètres d'entrée

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `title` | `string` | ✅ | Titre du document |
| `text` | `string` | ✅ | Contenu du document au format Markdown |
| `collectionId` | `string` | ✅ | ID de la collection dans laquelle créer le document |
| `parentDocumentId` | `string` | ❌ | ID du document parent (pour créer un document imbriqué) |
| `publish` | `boolean` | ❌ | Publier le document immédiatement (défaut : false) |
| `template` | `boolean` | ❌ | Marquer ce document comme un template |

#### Exemple d'utilisation

```json
{
  "title": "Guide d'utilisation de l'API",
  "text": "# Introduction\n\nCe guide explique comment utiliser l'API Outline...",
  "collectionId": "abc123",
  "publish": true
}
```

#### Réponse

Retourne l'objet document créé avec tous ses champs (id, url, createdAt, etc.).

---

### 1.2. `get_document`

**Fichier** : `/src/tools/getDocument.ts`
**Endpoint API** : `POST /documents.info`

**Description** : Récupère les détails d'un document spécifique par son ID.

#### Paramètres d'entrée

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `id` | `string` | ✅ | ID du document à récupérer |

#### Exemple d'utilisation

```json
{
  "id": "doc-xyz789"
}
```

#### Réponse

Retourne l'objet document complet (titre, contenu, métadonnées, permissions, etc.).

---

### 1.3. `update_document`

**Fichier** : `/src/tools/updateDocument.ts`
**Endpoint API** : `POST /documents.update`

**Description** : Met à jour un document existant (titre, contenu, statut).

#### Paramètres d'entrée

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `documentId` | `string` | ✅ | ID du document à mettre à jour |
| `title` | `string` | ❌ | Nouveau titre du document |
| `text` | `string` | ❌ | Nouveau contenu du document (Markdown) |
| `publish` | `boolean` | ❌ | Publier ou dépublier le document |
| `done` | `boolean` | ❌ | Marquer le document comme terminé |

**Note** : Au moins un des paramètres optionnels doit être fourni.

#### Exemple d'utilisation

```json
{
  "documentId": "doc-xyz789",
  "title": "Guide d'utilisation de l'API (mis à jour)",
  "text": "# Introduction (mise à jour)\n\nCe guide...",
  "publish": true
}
```

#### Réponse

Retourne l'objet document mis à jour.

---

### 1.4. `delete_document`

**Fichier** : `/src/tools/deleteDocument.ts`
**Endpoint API** : `POST /documents.delete`

**Description** : Supprime définitivement un document.

⚠️ **Attention** : Cette action est irréversible. Préférer `archive_document` pour une suppression réversible.

#### Paramètres d'entrée

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `id` | `string` | ✅ | ID du document à supprimer |

#### Exemple d'utilisation

```json
{
  "id": "doc-xyz789"
}
```

#### Réponse

Retourne une confirmation de suppression.

---

### 1.5. `list_documents`

**Fichier** : `/src/tools/listDocuments.ts`
**Endpoint API** : `POST /documents.list`

**Description** : Liste les documents dans le workspace avec des filtres et options de pagination.

#### Paramètres d'entrée

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `query` | `string` | ✅ | Requête de recherche pour filtrer les documents |
| `collectionId` | `string` | ❌ | Filtrer par ID de collection |
| `limit` | `number` | ❌ | Nombre maximum de résultats à retourner (défaut : 25) |
| `offset` | `number` | ❌ | Décalage pour la pagination (défaut : 1) |
| `sort` | `string` | ❌ | Champ de tri (ex: "updatedAt", "createdAt") (défaut : "updatedAt") |
| `direction` | `"ASC"` \| `"DESC"` | ❌ | Direction du tri (défaut : "DESC") |
| `template` | `boolean` | ❌ | Filtrer uniquement les templates |
| `userId` | `string` | ❌ | Filtrer par ID d'utilisateur |
| `parentDocumentId` | `string` | ❌ | Filtrer par ID de document parent |
| `backlinkDocumentId` | `string` | ❌ | Filtrer par ID de document avec backlink |

#### Exemple d'utilisation

```json
{
  "query": "",
  "collectionId": "abc123",
  "limit": 50,
  "sort": "updatedAt",
  "direction": "DESC"
}
```

#### Réponse

Retourne deux contenus :
1. Liste des documents trouvés (`documents: [...]`)
2. Informations de pagination (`pagination: { offset, limit, total }`)

---

### 1.6. `search_documents`

**Fichier** : `/src/tools/searchDocuments.ts`
**Endpoint API** : `POST /documents.search`

**Description** : Recherche des documents par mots-clés dans tout le workspace.

#### Paramètres d'entrée

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `query` | `string` | ✅ | Requête de recherche (mots-clés) |
| `collectionId` | `string` | ❌ | Limiter la recherche à une collection |
| `limit` | `number` | ❌ | Nombre maximum de résultats |

#### Exemple d'utilisation

```json
{
  "query": "authentification OAuth",
  "collectionId": "abc123",
  "limit": 10
}
```

#### Réponse

Retourne les documents correspondants avec les résultats surlignés et la pagination.

---

### 1.7. `move_document`

**Fichier** : `/src/tools/moveDocument.ts`
**Endpoint API** : `POST /documents.move`

**Description** : Déplace un document vers une autre collection ou sous un autre document parent.

#### Paramètres d'entrée

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `id` | `string` | ✅ | ID du document à déplacer |
| `collectionId` | `string` | ❌ | ID de la collection de destination |
| `parentDocumentId` | `string` | ❌ | ID du document parent de destination |

**Note** : Au moins un des paramètres optionnels doit être fourni.

#### Exemple d'utilisation

```json
{
  "id": "doc-xyz789",
  "collectionId": "col-new123",
  "parentDocumentId": null
}
```

#### Réponse

Retourne le document avec ses nouvelles métadonnées (collection, parent).

---

### 1.8. `archive_document`

**Fichier** : `/src/tools/archiveDocument.ts`
**Endpoint API** : `POST /documents.archive`

**Description** : Archive un document (suppression réversible).

⚠️ **Note** : Les documents archivés peuvent être restaurés ultérieurement, contrairement à `delete_document`.

#### Paramètres d'entrée

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `id` | `string` | ✅ | ID du document à archiver |

#### Exemple d'utilisation

```json
{
  "id": "doc-xyz789"
}
```

#### Réponse

Retourne le document archivé.

---

### 1.9. `create_template_from_document`

**Fichier** : `/src/tools/createTemplateFromDocument.ts`
**Endpoint API** : `POST /documents.create` (avec `template: true`)

**Description** : Crée un template à partir d'un document existant.

#### Paramètres d'entrée

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `documentId` | `string` | ✅ | ID du document source |
| `title` | `string` | ✅ | Titre du template |
| `collectionId` | `string` | ✅ | ID de la collection dans laquelle créer le template |
| `publish` | `boolean` | ❌ | Publier le template immédiatement |

⚠️ **À clarifier** : Le code actuel ne récupère pas le contenu du document source. Il est probable qu'il manque un appel à `documents.info` pour copier le contenu.

---

## 2. Outils de gestion des collections

### 2.1. `get_collection`

**Fichier** : `/src/tools/getCollection.ts`
**Endpoint API** : `POST /collections.info`

**Description** : Récupère les détails d'une collection spécifique.

#### Paramètres d'entrée

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `id` | `string` | ✅ | ID de la collection à récupérer |

#### Exemple d'utilisation

```json
{
  "id": "col-abc123"
}
```

#### Réponse

Retourne l'objet collection (nom, description, permissions, documents, etc.).

---

### 2.2. `list_collections`

**Fichier** : `/src/tools/listCollections.ts`
**Endpoint API** : `POST /collections.list`

**Description** : Liste toutes les collections du workspace.

#### Paramètres d'entrée

Aucun paramètre requis. L'outil envoie un objet vide à l'API.

#### Exemple d'utilisation

```json
{}
```

#### Réponse

Retourne la liste complète des collections accessibles à l'utilisateur.

---

### 2.3. `create_collection` et `update_collection`

**Fichiers** :
- `/src/tools/createCollection.ts`
- `/src/tools/updateCollection.ts`

**Endpoints API** :
- `POST /collections.create`
- `POST /collections.update`

**Description** : Crée ou met à jour une collection.

#### Paramètres d'entrée (create_collection)

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `name` | `string` | ✅ | Nom de la collection |
| `description` | `string` | ❌ | Description de la collection |
| `color` | `string` | ❌ | Couleur de la collection (hex) |
| `private` | `boolean` | ❌ | Collection privée ou publique |

#### Paramètres d'entrée (update_collection)

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `id` | `string` | ✅ | ID de la collection à mettre à jour |
| `name` | `string` | ❌ | Nouveau nom |
| `description` | `string` | ❌ | Nouvelle description |
| `color` | `string` | ❌ | Nouvelle couleur |

⚠️ **À clarifier** : Les fichiers sources de ces outils n'ont pas été lus. La documentation ci-dessus est basée sur les conventions de l'API Outline.

---

## 3. Outils de gestion des commentaires

### 3.1. `create_comment`

**Fichier** : `/src/tools/createComment.ts`
**Endpoint API** : `POST /comments.create`

**Description** : Crée un commentaire sur un document.

#### Paramètres d'entrée

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `documentId` | `string` | ✅ | ID du document à commenter |
| `text` | `string` | ✅ | Texte du commentaire (Markdown) |
| `parentCommentId` | `string` | ❌ | ID du commentaire parent (pour les réponses) |

⚠️ **À clarifier** : Le fichier source n'a pas été lu. Paramètres déduits des conventions API Outline.

---

### 3.2. `update_comment`

**Fichier** : `/src/tools/updateComment.ts`
**Endpoint API** : `POST /comments.update`

**Description** : Met à jour un commentaire existant.

#### Paramètres d'entrée

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `id` | `string` | ✅ | ID du commentaire à mettre à jour |
| `text` | `string` | ✅ | Nouveau texte du commentaire |

⚠️ **À clarifier** : Le fichier source n'a pas été lu. Paramètres déduits des conventions API Outline.

---

### 3.3. `delete_comment`

**Fichier** : `/src/tools/deleteComment.ts`
**Endpoint API** : `POST /comments.delete`

**Description** : Supprime un commentaire.

#### Paramètres d'entrée

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `id` | `string` | ✅ | ID du commentaire à supprimer |

⚠️ **À clarifier** : Le fichier source n'a pas été lu. Paramètres déduits des conventions API Outline.

---

## 4. Outils de gestion des utilisateurs

### 4.1. `list_users`

**Fichier** : `/src/tools/listUsers.ts`
**Endpoint API** : `POST /users.list`

**Description** : Liste les utilisateurs du workspace avec des filtres avancés.

#### Paramètres d'entrée

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `offset` | `number` | ❌ | Décalage pour la pagination |
| `limit` | `number` | ❌ | Nombre maximum d'utilisateurs à retourner |
| `sort` | `string` | ❌ | Champ de tri (ex: "name", "email", "createdAt") |
| `direction` | `"ASC"` \| `"DESC"` | ❌ | Direction du tri |
| `query` | `string` | ❌ | Requête de recherche pour filtrer les utilisateurs |
| `emails` | `string[]` | ❌ | Filtrer par adresses email |
| `filter` | `"all"` \| `"invited"` \| `"active"` \| `"suspended"` | ❌ | Filtrer par statut d'utilisateur |
| `role` | `"admin"` \| `"member"` \| `"viewer"` \| `"guest"` | ❌ | Filtrer par rôle d'utilisateur |

#### Exemple d'utilisation

```json
{
  "filter": "active",
  "role": "member",
  "limit": 50
}
```

#### Réponse

Retourne deux contenus :
1. Liste des utilisateurs (`users: [...]`)
2. Informations de pagination (`pagination: { offset, limit, total }`)

---

## 5. Outils de recherche et Q&A

### 5.1. `search_documents`

**Voir section 1.6**

---

### 5.2. `ask_documents`

**Fichier** : `/src/tools/askDocuments.ts`
**Endpoint API** : `POST /documents.answerQuestion`

**Description** : Pose une question en langage naturel à propos des documents, avec réponse générée par IA.

⚠️ **Prérequis** : La fonctionnalité "AI Answers" doit être activée dans les paramètres du workspace Outline.

#### Paramètres d'entrée

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `query` | `string` | ✅ | Question en langage naturel |
| `userId` | `string` | ❌ | Filtrer uniquement les documents modifiés par cet utilisateur |
| `collectionId` | `string` | ❌ | Limiter la recherche à une collection |
| `documentId` | `string` | ❌ | Limiter la recherche à un document spécifique |
| `statusFilter` | `"draft"` \| `"archived"` \| `"published"` | ❌ | Filtrer par statut de document |
| `dateFilter` | `"day"` \| `"week"` \| `"month"` \| `"year"` | ❌ | Filtrer les documents modifiés récemment |

#### Exemple d'utilisation

```json
{
  "query": "Comment configurer l'authentification OAuth ?",
  "collectionId": "col-engineering",
  "statusFilter": "published"
}
```

#### Réponse

Retourne une réponse générée par l'IA basée sur le contenu des documents pertinents.

**Comment ça marche** :
1. Outline recherche dans les documents accessibles par l'API key
2. L'IA d'Outline analyse les documents pertinents
3. Une réponse synthétique est générée et retournée

---

## Récapitulatif des endpoints API utilisés

| Outil MCP | Endpoint API Outline |
|-----------|----------------------|
| `create_document` | `POST /documents.create` |
| `get_document` | `POST /documents.info` |
| `update_document` | `POST /documents.update` |
| `delete_document` | `POST /documents.delete` |
| `list_documents` | `POST /documents.list` |
| `search_documents` | `POST /documents.search` |
| `move_document` | `POST /documents.move` |
| `archive_document` | `POST /documents.archive` |
| `create_template_from_document` | `POST /documents.create` (template: true) |
| `get_collection` | `POST /collections.info` |
| `list_collections` | `POST /collections.list` |
| `create_collection` | `POST /collections.create` |
| `update_collection` | `POST /collections.update` |
| `create_comment` | `POST /comments.create` |
| `update_comment` | `POST /comments.update` |
| `delete_comment` | `POST /comments.delete` |
| `list_users` | `POST /users.list` |
| `ask_documents` | `POST /documents.answerQuestion` |

---

## Conventions de nommage

- **Noms d'outils** : snake_case (ex: `create_document`, `list_users`)
- **Paramètres Zod** : camelCase (ex: `documentId`, `collectionId`)
- **Payloads API** : camelCase (ex: `collectionId`, `parentDocumentId`)
- **Fichiers** : camelCase (ex: `createDocument.ts`, `listUsers.ts`)

---

## Validation et gestion d'erreurs

### Validation Zod

Chaque outil définit un schéma Zod pour valider les paramètres d'entrée :

```typescript
inputSchema: {
  documentId: z.string().describe('ID du document'),
  title: z.string().describe('Titre').optional(),
}
```

Si les paramètres ne respectent pas le schéma, une erreur de validation est levée avant l'exécution du callback.

### Gestion d'erreurs API

Toutes les erreurs API sont capturées et transformées en `McpError` :

```typescript
try {
  const response = await client.post('/endpoint', payload);
  return { content: [{ type: 'text', text: JSON.stringify(response.data.data) }] };
} catch (error: any) {
  console.error('Error:', error.message);
  throw new McpError(ErrorCode.InvalidRequest, error.message);
}
```

**Types d'erreurs possibles** :
- **401 Unauthorized** : API key invalide ou expirée
- **403 Forbidden** : Permissions insuffisantes
- **404 Not Found** : Ressource introuvable
- **422 Unprocessable Entity** : Paramètres invalides
- **500 Internal Server Error** : Erreur serveur Outline

---

## Bonnes pratiques d'utilisation

### 1. Toujours spécifier les IDs complets

Les IDs de documents, collections, etc. doivent être complets et valides.

❌ **Mauvais** :
```json
{ "id": "123" }
```

✅ **Bon** :
```json
{ "id": "doc-abc123xyz789" }
```

### 2. Utiliser `archive_document` plutôt que `delete_document`

L'archivage est réversible, contrairement à la suppression.

### 3. Limiter les résultats de pagination

Pour éviter les timeouts, toujours spécifier une limite raisonnable :

```json
{
  "limit": 50,
  "offset": 0
}
```

### 4. Filtrer autant que possible

Utiliser les filtres pour réduire la charge API :

```json
{
  "collectionId": "col-xyz",
  "statusFilter": "published"
}
```

---

## Ajouter un nouvel outil

Pour ajouter un nouvel outil MCP :

1. **Créer un fichier dans `/src/tools/`** (ex: `myNewTool.ts`)

2. **Définir le schéma Zod et le callback** :

```typescript
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

toolRegistry.register('my_new_tool', {
  name: 'my_new_tool',
  description: 'Description de mon nouvel outil',
  inputSchema: {
    param1: z.string().describe('Premier paramètre'),
  },
  async callback(args) {
    try {
      const client = getOutlineClient();
      const response = await client.post('/endpoint', args);
      return { content: [{ type: 'text', text: JSON.stringify(response.data.data) }] };
    } catch (error: any) {
      console.error('Error:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
```

3. **Build et test** :

```bash
npm run build
npm run dev  # Tester avec l'inspector MCP
```

4. **L'outil sera automatiquement chargé** par `loadAllTools.ts`.

---

## Points d'amélioration identifiés

### ⚠️ À clarifier

1. **`create_template_from_document`** : Ne semble pas copier le contenu du document source
2. **Outils de commentaires** : Schémas Zod à valider (fichiers non lus)
3. **Outils de collections** : Schémas Zod à valider (fichiers non lus)

### 💡 Améliorations possibles

1. **Output schemas** : Ajouter des schémas Zod pour les réponses
2. **Retry logic** : Ajouter une logique de retry pour les erreurs temporaires
3. **Rate limiting** : Gérer les limitations de taux de l'API Outline
4. **Caching** : Cache pour les requêtes fréquentes (collections, users)
5. **Batch operations** : Support pour les opérations en masse

---

## Prochaines étapes

Consultez les documents suivants pour approfondir :
- [04-api-outline.md](./04-api-outline.md) : Détails de l'intégration avec l'API Outline
- [05-flux-donnees.md](./05-flux-donnees.md) : Diagrammes de flux détaillés
- [08-developpement.md](./08-developpement.md) : Guide pour développer de nouveaux outils
