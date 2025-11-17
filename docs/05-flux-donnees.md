# Flux de données

Ce document décrit les flux de données au sein du serveur Outline MCP, avec des diagrammes de séquence détaillés pour les scénarios principaux.

---

## Cycle de vie d'une requête MCP

### Vue d'ensemble

```mermaid
sequenceDiagram
    participant Client as Client MCP<br/>(Claude, Cursor)
    participant Transport as Transport Layer<br/>(HTTP/STDIO)
    participant Server as MCP Server
    participant Tool as Outil MCP
    participant OutlineAPI as API Outline

    Client->>Transport: 1. Requête MCP (tools/call)
    Transport->>Server: 2. Deserialisation
    Server->>Server: 3. Validation paramètres (Zod)
    Server->>Tool: 4. Exécution callback
    Tool->>OutlineAPI: 5. Requête HTTP POST
    OutlineAPI-->>Tool: 6. Réponse JSON
    Tool-->>Server: 7. Résultat MCP
    Server-->>Transport: 8. Sérialisation
    Transport-->>Client: 9. Réponse MCP
```

---

## Flux détaillés par mode

### 1. Mode HTTP Stateless (S-HTTP)

```mermaid
sequenceDiagram
    participant Client as Client HTTP
    participant Fastify as Fastify Server
    participant Context as RequestContext
    participant Factory as getMcpServer()
    participant McpServer as MCP Server
    participant Tool as Outil
    participant Outline as API Outline

    Client->>Fastify: POST /mcp (headers + body)

    Note over Fastify: Extraction API key
    Fastify->>Fastify: extractApiKey(request)
    Fastify->>Context: setApiKey(apiKey)

    Note over Fastify: Création serveur frais
    Fastify->>Factory: getMcpServer()
    Factory->>Factory: loadAllTools()
    Factory-->>Fastify: nouveau McpServer

    Note over Fastify: Connexion transport
    Fastify->>McpServer: connect(httpTransport)
    Fastify->>McpServer: handleRequest(body)

    Note over McpServer: Traitement requête MCP
    McpServer->>Tool: callback(args)
    Tool->>Context: getApiKey()
    Context-->>Tool: apiKey
    Tool->>Outline: POST /endpoint (Bearer apiKey)
    Outline-->>Tool: JSON response
    Tool-->>McpServer: MCP result

    McpServer-->>Fastify: MCP response
    Fastify->>Context: resetInstance()
    Note over Context: Nettoyage du contexte
    Fastify-->>Client: HTTP 200 + JSON
```

**Points clés** :
- **Stateless** : Nouveau serveur MCP créé par requête
- **Isolation** : Chaque requête a son propre `RequestContext`
- **Cleanup** : `RequestContext.resetInstance()` évite les fuites d'API key

---

### 2. Mode STDIO (Cursor, CLI)

```mermaid
sequenceDiagram
    participant Client as Client STDIO<br/>(Cursor)
    participant Process as stdio.ts
    participant Context as RequestContext
    participant McpServer as MCP Server
    participant Tool as Outil
    participant Outline as API Outline

    Note over Process: Démarrage
    Process->>Process: Validation OUTLINE_API_KEY
    alt API key absente
        Process->>Client: exit(1)
    end

    Process->>Context: setApiKey(env.OUTLINE_API_KEY)
    Process->>McpServer: getMcpServer()
    Process->>McpServer: connect(stdioTransport)

    Note over Process,Client: Session active

    loop Pour chaque requête MCP
        Client->>Process: Requête via stdin
        Process->>McpServer: Traitement
        McpServer->>Tool: callback(args)
        Tool->>Context: getApiKey()
        Context-->>Tool: apiKey (toujours la même)
        Tool->>Outline: POST /endpoint
        Outline-->>Tool: JSON response
        Tool-->>McpServer: MCP result
        McpServer-->>Process: Réponse
        Process-->>Client: Réponse via stdout
    end

    Note over Client: Fermeture
    Client->>Process: SIGTERM / SIGINT
    Process->>Process: Cleanup & exit(0)
```

**Points clés** :
- **Stateful** : Un seul serveur MCP pour toute la session
- **API key unique** : Configurée au démarrage, jamais changée
- **Validation stricte** : Échec immédiat si API key absente
- **Stdout réservé** : Logs uniquement sur stderr (spec MCP)

---

### 3. Mode DXT (Extension Desktop)

Similaire au mode STDIO avec des ajouts :

```mermaid
sequenceDiagram
    participant Claude as Claude Desktop
    participant DXT as dxt.ts
    participant Logger as Logger
    participant McpServer as MCP Server

    Note over DXT: Installation gestionnaires d'erreurs
    DXT->>DXT: process.on('uncaughtException')
    DXT->>DXT: process.on('unhandledRejection')
    DXT->>DXT: process.on('SIGINT/SIGTERM')

    Note over DXT: Démarrage identique à STDIO
    DXT->>DXT: Validation API key
    DXT->>McpServer: getMcpServer()
    DXT->>McpServer: connect(stdioTransport)
    DXT->>Logger: info('Started')

    loop Session active
        Claude->>DXT: Requêtes MCP
        DXT->>McpServer: Traitement
        McpServer-->>DXT: Réponses
        DXT-->>Claude: via stdout
    end

    alt Erreur non gérée
        DXT->>Logger: error('Uncaught exception')
        DXT->>DXT: exit(1)
    end

    alt Signal SIGTERM
        DXT->>Logger: info('Shutting down')
        DXT->>DXT: exit(0)
    end
```

**Différences avec STDIO** :
- Gestion avancée des erreurs et signaux
- Logger dédié pour debugging
- Meilleure intégration avec Claude Desktop

---

## Flux d'authentification

### Extraction et utilisation de l'API key

```mermaid
graph TB
    Start[Requête entrante]

    Start --> ModeCheck{Mode ?}

    ModeCheck -->|HTTP/SSE| ExtractHeader[Extraire API key<br/>des headers]
    ModeCheck -->|STDIO/DXT| ExtractEnv[Lire OUTLINE_API_KEY<br/>depuis env]

    ExtractHeader --> HeaderCheck{API key<br/>dans header ?}
    HeaderCheck -->|Oui| SetContextHeader[Context.setApiKey<br/>headerApiKey]
    HeaderCheck -->|Non| CheckEnvHTTP{OUTLINE_API_KEY<br/>dans env ?}
    CheckEnvHTTP -->|Oui| SetContextEnv[Context.setApiKey<br/>env.OUTLINE_API_KEY]
    CheckEnvHTTP -->|Non| ErrorHTTP[Erreur 500<br/>API key requise]

    ExtractEnv --> EnvCheck{API key<br/>présente ?}
    EnvCheck -->|Oui| SetContextStdio[Context.setApiKey<br/>env.OUTLINE_API_KEY]
    EnvCheck -->|Non| ErrorStdio[exit 1<br/>API key requise]

    SetContextHeader --> ExecuteTool[Exécuter outil MCP]
    SetContextEnv --> ExecuteTool
    SetContextStdio --> ExecuteTool

    ExecuteTool --> GetClient[getOutlineClient]
    GetClient --> GetFromContext[Context.getApiKey]
    GetFromContext --> CreateAxios[Créer client Axios<br/>avec Bearer token]
    CreateAxios --> CallAPI[Appeler API Outline]

    CallAPI --> Success{Succès ?}
    Success -->|Oui| Return[Retourner résultat]
    Success -->|Non| HandleError[Capturer erreur]
    HandleError --> ThrowMcp[Throw McpError]
```

---

## Traitement d'un outil MCP

### Exemple : `create_document`

```mermaid
sequenceDiagram
    participant MCP as MCP Server
    participant Zod as Validation Zod
    participant Tool as createDocument.ts
    participant Client as outlineClient
    participant Context as RequestContext
    participant API as API Outline

    MCP->>Zod: Valider args (inputSchema)

    alt Validation échoue
        Zod-->>MCP: Erreur de validation
        MCP-->>MCP: Throw McpError
    end

    Zod-->>MCP: Args validés

    MCP->>Tool: callback(args)

    Note over Tool: Construction payload
    Tool->>Tool: payload = {<br/>  title, text,<br/>  collectionId, ...<br/>}

    Tool->>Client: getOutlineClient()
    Client->>Context: getApiKey()
    Context-->>Client: apiKey
    Client->>Client: createOutlineClient(apiKey)
    Client-->>Tool: axiosInstance

    Tool->>API: POST /documents.create<br/>Authorization: Bearer {apiKey}<br/>Body: payload

    alt Succès (200)
        API-->>Tool: {data: {document}, policies}
        Tool->>Tool: JSON.stringify(data.data)
        Tool-->>MCP: {content: [{type:'text', text}]}
        MCP-->>MCP: Retour au client
    else Erreur (401, 403, 404, 500...)
        API-->>Tool: {ok: false, error, message}
        Tool->>Tool: console.error(error.message)
        Tool->>Tool: throw McpError(InvalidRequest)
        Tool-->>MCP: McpError
        MCP-->>MCP: Retour erreur au client
    end
```

---

## Chargement dynamique des outils

### Au démarrage du serveur

```mermaid
sequenceDiagram
    participant Main as index.ts / stdio.ts / dxt.ts
    participant Factory as getMcpServer()
    participant Loader as loadAllTools()
    participant FS as Système de fichiers
    participant ToolFile as createDocument.ts
    participant Registry as toolRegistry

    Main->>Factory: getMcpServer()
    Factory->>Factory: new McpServer({...})

    Factory->>Loader: loadAllTools(callback)

    Loader->>FS: readdirSync('/src/tools/')
    FS-->>Loader: ['createDocument.ts',<br/>'listDocuments.ts', ...]

    loop Pour chaque fichier
        Loader->>ToolFile: import('./tools/createDocument.ts')

        Note over ToolFile: Exécution du toplevel
        ToolFile->>Registry: toolRegistry.register('create_document', {...})
        Registry->>Registry: registry.set('create_document', def)

        ToolFile-->>Loader: Module chargé
    end

    Note over Loader: Tous les outils importés

    Loader->>Registry: toolRegistry.tools
    Registry-->>Loader: [tool1, tool2, ..., tool18]

    loop Pour chaque outil
        Loader->>Factory: callback(tool)
        Factory->>Factory: server.registerTool(tool)
    end

    Factory-->>Main: McpServer configuré
```

**Mécanisme d'auto-enregistrement** :
1. `loadAllTools()` importe tous les fichiers `.ts`/`.js` de `/src/tools/`
2. L'import exécute le code toplevel du fichier
3. Le toplevel appelle `toolRegistry.register()`
4. Le registre stocke la définition de l'outil
5. `loadAllTools()` parcourt le registre et enregistre chaque outil dans le serveur MCP

---

## Gestion des erreurs

### Flux d'erreur complet

```mermaid
graph TB
    Start[Erreur levée]

    Start --> Source{Source ?}

    Source -->|Validation Zod| ZodError[ZodError]
    Source -->|Axios API| AxiosError[AxiosError]
    Source -->|Logique outil| GenericError[Error générique]

    ZodError --> Catch[Bloc catch de l'outil]
    AxiosError --> Catch
    GenericError --> Catch

    Catch --> Log[console.error message]
    Log --> Throw[throw new McpError<br/>ErrorCode.InvalidRequest<br/>error.message]

    Throw --> MCPServer[MCP Server catch]
    MCPServer --> Format[Formater erreur MCP]
    Format --> Send[Envoyer au client]

    Send --> ClientHTTP{Mode ?}
    ClientHTTP -->|HTTP| JSONResponse[HTTP 500<br/>JSON-RPC error]
    ClientHTTP -->|STDIO| StdoutError[Erreur sur stdout<br/>JSON MCP]
```

### Exemple de gestion d'erreur

```typescript
// Dans un outil
try {
  const client = getOutlineClient();
  const response = await client.post('/documents.create', payload);
  return { content: [{ type: 'text', text: JSON.stringify(response.data.data) }] };
} catch (error: any) {
  // 1. Logger l'erreur (stderr)
  console.error('Error creating document:', error.message);

  // 2. Transformer en McpError
  throw new McpError(ErrorCode.InvalidRequest, error.message);
}
```

**Types d'erreurs capturées** :
- **ZodError** : Paramètres invalides (capturé par le serveur MCP avant le callback)
- **AxiosError** : Erreurs API Outline (401, 403, 404, 500, etc.)
- **Error générique** : Erreurs de logique métier

---

## Validation des données

### Pipeline de validation

```mermaid
graph LR
    Input[Paramètres MCP]

    Input --> Zod[Validation Zod<br/>inputSchema]
    Zod -->|Échec| ZodError[ZodError]
    Zod -->|Succès| TypedArgs[Args typés]

    TypedArgs --> Business[Logique métier<br/>de l'outil]
    Business --> Payload[Construction payload]
    Payload --> APIValidation[Validation API Outline]

    APIValidation -->|Échec| APIError[422 Unprocessable Entity]
    APIValidation -->|Succès| Response[Réponse API]

    ZodError --> ErrorResponse[Erreur MCP]
    APIError --> ErrorResponse
```

### Exemple de schéma Zod

```typescript
inputSchema: {
  title: z.string()
    .min(1, 'Le titre ne peut pas être vide')
    .describe('Titre du document'),

  text: z.string()
    .describe('Contenu du document en markdown'),

  collectionId: z.string()
    .uuid('ID de collection invalide')
    .describe('ID de la collection'),

  publish: z.boolean()
    .optional()
    .describe('Publier immédiatement'),
}
```

**Avantages** :
- Validation avant l'exécution du callback
- Messages d'erreur explicites
- Typage TypeScript automatique
- Documentation auto-générée (descriptions)

---

## Pagination et streaming

### Flux de pagination

```mermaid
sequenceDiagram
    participant Client as Client MCP
    participant Tool as list_documents
    participant API as API Outline

    Note over Client: Requête initiale
    Client->>Tool: {limit: 25, offset: 0}
    Tool->>API: POST /documents.list
    API-->>Tool: {data: [...25 docs],<br/>pagination: {total: 142}}
    Tool-->>Client: documents + pagination

    Note over Client: Analyser pagination
    Client->>Client: total=142, offset=0, limit=25<br/>=> 6 pages au total

    Note over Client: Requête page 2
    Client->>Tool: {limit: 25, offset: 25}
    Tool->>API: POST /documents.list
    API-->>Tool: {data: [...25 docs],<br/>pagination: {total: 142}}
    Tool-->>Client: documents + pagination

    Note over Client: Etc. jusqu'à la dernière page
```

**Gestion dans les outils** :
```typescript
// list_documents.ts
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

Le client MCP peut :
1. Lire les informations de pagination
2. Calculer le nombre de pages restantes
3. Effectuer d'autres requêtes avec `offset` incrémenté

---

## Performance et optimisations

### Points de performance identifiés

| Opération | Temps estimé | Goulot d'étranglement |
|-----------|--------------|------------------------|
| **Validation Zod** | < 1ms | CPU (négligeable) |
| **Création serveur MCP** (HTTP stateless) | ~5-10ms | CPU + Imports |
| **Requête API Outline** | 100-500ms | Réseau + Traitement API |
| **Parsing JSON** | < 5ms | CPU (négligeable) |

**Optimisations possibles** :
1. **Cache de serveur MCP** : Réutiliser le serveur en mode HTTP (perdre le stateless)
2. **Cache de données** : Cacher les collections, users fréquemment demandés
3. **Batch requests** : Grouper plusieurs requêtes API en une seule
4. **Connection pooling** : Réutiliser les connexions HTTP (déjà fait par Axios)

---

## Diagramme de données

### Entités principales

```mermaid
erDiagram
    WORKSPACE ||--o{ COLLECTION : contains
    WORKSPACE ||--o{ USER : has
    COLLECTION ||--o{ DOCUMENT : contains
    DOCUMENT ||--o{ DOCUMENT : "has children"
    DOCUMENT ||--o{ COMMENT : has
    DOCUMENT }o--|| USER : "created by"
    DOCUMENT }o--o{ USER : "edited by"
    COMMENT }o--|| USER : "created by"
    COMMENT ||--o{ COMMENT : "has replies"

    WORKSPACE {
        string id PK
        string name
        string url
    }

    COLLECTION {
        string id PK
        string workspaceId FK
        string name
        string description
        string color
        boolean private
    }

    DOCUMENT {
        string id PK
        string collectionId FK
        string parentDocumentId FK
        string title
        string text
        string url
        datetime createdAt
        datetime updatedAt
        datetime publishedAt
        boolean template
    }

    COMMENT {
        string id PK
        string documentId FK
        string parentCommentId FK
        string createdById FK
        string text
        datetime createdAt
    }

    USER {
        string id PK
        string workspaceId FK
        string name
        string email
        enum role
        enum status
    }
```

---

## Prochaines étapes

Consultez les documents suivants pour approfondir :
- [06-configuration.md](./06-configuration.md) : Configuration et variables d'environnement
- [07-deploiement.md](./07-deploiement.md) : Déploiement et build
- [08-developpement.md](./08-developpement.md) : Guide de développement
