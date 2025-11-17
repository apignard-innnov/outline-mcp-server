# Guide de développement

Ce document décrit comment configurer un environnement de développement, contribuer au projet et étendre ses fonctionnalités.

---

## Configuration de l'environnement

### Prérequis

- **Node.js** : ≥ 20.0.0
- **NPM** : ≥ 9.0.0
- **Git** : Dernière version
- **Bun** (optionnel) : Pour le watch mode rapide
- **VSCode** (recommandé) : Avec extensions TypeScript

### Cloner le dépôt

```bash
git clone https://github.com/mmmeff/outline-mcp-server.git
cd outline-mcp-server
```

### Installer les dépendances

```bash
npm install
```

**Dépendances installées** :
- **Production** : `@modelcontextprotocol/sdk`, `axios`, `fastify`, `zod`, `dotenv`
- **Développement** : `typescript`, `prettier`, `bun`, `semantic-release`, `concurrently`

### Configurer l'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer et ajouter votre API key
nano .env
```

**Contenu** :
```bash
OUTLINE_API_KEY=ol_api_xxxxxxxxxxxxxxxxxxxxxxxxxx
OUTLINE_API_URL=https://app.getoutline.com/api  # Optionnel
```

---

## Structure du projet

```
outline-mcp-server/
├── src/                    # Code source TypeScript
│   ├── index.ts           # Point d'entrée HTTP/SSE
│   ├── stdio.ts           # Point d'entrée STDIO
│   ├── dxt.ts             # Point d'entrée DXT
│   ├── outline/           # Client API Outline
│   │   └── outlineClient.ts
│   ├── tools/             # 18 outils MCP
│   │   ├── createDocument.ts
│   │   ├── listDocuments.ts
│   │   └── ...
│   └── utils/             # Utilitaires
│       ├── getMcpServer.ts
│       ├── loadAllTools.ts
│       ├── logger.ts
│       └── toolRegistry.ts
├── scripts/               # Scripts de build
│   ├── build-dxt.sh
│   ├── generate-dxt-manifest.js
│   └── build-all-assets.js
├── .github/workflows/     # CI/CD
├── docs/                  # Documentation technique
├── build/                 # Sortie de compilation (gitignored)
├── dist/                  # Build DXT temporaire (gitignored)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## Commandes de développement

### Build

```bash
# Build TypeScript → JavaScript
npm run build

# Sortie : /build/
```

### Watch mode (développement)

```bash
# Mode complet : serveur + inspector MCP
npm run dev

# Mode HTTP uniquement
npm run watch

# Mode STDIO uniquement
npm run watch:stdio
```

**Détails de `npm run dev`** :
```bash
concurrently -n 'build,inspector' -c 'blue.bold,green.bold' \
  'npm run watch' \
  'npm run inspector'
```

- Lance le serveur HTTP en watch mode (Bun)
- Lance l'inspector MCP (http://localhost:5173)

### Formater le code

```bash
npm run format
# Utilise Prettier sur tous les fichiers .ts, .tsx, .js, .jsx, .json
```

### Démarrer le serveur compilé

```bash
npm start
# Exécute : bun build/index.js
```

---

## Workflow de développement

### 1. Créer une branche

```bash
git checkout -b feature/mon-amelioration
```

### 2. Développer

```bash
# Lancer en watch mode
npm run dev

# Éditer le code dans src/
# Le serveur redémarre automatiquement
```

### 3. Tester

```bash
# Avec l'inspector MCP (http://localhost:5173)
# - Appeler les outils modifiés
# - Vérifier les réponses

# Ou avec curl
curl -X POST http://localhost:6060/mcp \
  -H "Content-Type: application/json" \
  -H "x-outline-api-key: $OUTLINE_API_KEY" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

### 4. Formater et commiter

```bash
# Formater le code
npm run format

# Vérifier les changements
git status
git diff

# Commiter (Conventional Commits)
git add .
git commit -m "feat(tools): add new tool for..."
```

### 5. Pousser et créer une PR

```bash
git push origin feature/mon-amelioration

# Créer une PR sur GitHub
gh pr create --title "Add new tool..." --body "..."
```

---

## Ajouter un nouvel outil MCP

### Étape 1 : Créer le fichier

```bash
touch src/tools/myNewTool.ts
```

### Étape 2 : Implémenter l'outil

**Fichier** : `/src/tools/myNewTool.ts`

```typescript
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';
import z from 'zod';

// Auto-enregistrement
toolRegistry.register('my_new_tool', {
  name: 'my_new_tool',
  description: 'Description claire de ce que fait l\'outil',

  // Schéma de validation Zod
  inputSchema: {
    param1: z.string()
      .min(1, 'Le paramètre ne peut pas être vide')
      .describe('Description du paramètre 1'),

    param2: z.number()
      .optional()
      .describe('Description du paramètre 2 (optionnel)'),

    param3: z.enum(['option1', 'option2'])
      .optional()
      .describe('Choix entre option1 et option2'),
  },

  // Callback asynchrone
  async callback(args) {
    try {
      // 1. Récupérer le client Outline (avec API key du contexte)
      const client = getOutlineClient();

      // 2. Construire le payload
      const payload: Record<string, any> = {
        param1: args.param1,
      };

      if (args.param2 !== undefined) {
        payload.param2 = args.param2;
      }

      if (args.param3) {
        payload.param3 = args.param3;
      }

      // 3. Appeler l'API Outline
      const response = await client.post('/endpoint.action', payload);

      // 4. Retourner le résultat au format MCP
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data.data)
          }
        ]
      };

    } catch (error: any) {
      // 5. Gérer les erreurs
      console.error('Error in my_new_tool:', error.message);
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    }
  },
});
```

### Étape 3 : Tester

```bash
# Rebuild
npm run build

# Tester avec l'inspector
npm run dev
# Appeler my_new_tool depuis l'inspector
```

### Étape 4 : Documenter

Ajouter l'outil dans `/docs/03-outils.md` avec :
- Description
- Paramètres d'entrée
- Exemple d'utilisation
- Endpoint API correspondant

---

## Conventions de code

### TypeScript

```typescript
// ✅ Bon : Types explicites pour les paramètres publics
export function createClient(apiKey: string): AxiosInstance {
  // ...
}

// ❌ Mauvais : Pas de types
export function createClient(apiKey) {
  // ...
}
```

### Nommage

| Élément | Convention | Exemple |
|---------|------------|---------|
| **Fichiers** | camelCase | `createDocument.ts` |
| **Fonctions** | camelCase | `getOutlineClient()` |
| **Classes** | PascalCase | `RequestContext` |
| **Variables** | camelCase | `apiKey`, `mcpServer` |
| **Constantes** | UPPER_SNAKE_CASE | `API_URL` |
| **Outils MCP** | snake_case | `create_document` |
| **Paramètres Zod** | camelCase | `collectionId` |

### Imports

```typescript
// ✅ Bon : Imports explicites avec extensions .js (ESM)
import { getOutlineClient } from '../outline/outlineClient.js';
import toolRegistry from '../utils/toolRegistry.js';

// ❌ Mauvais : Sans extension
import { getOutlineClient } from '../outline/outlineClient';
```

**Raison** : TypeScript en mode ESM requiert les extensions `.js` dans les imports.

### Gestion d'erreurs

```typescript
// ✅ Bon : Capture, log et throw McpError
try {
  const response = await client.post('/endpoint', payload);
  return { content: [{ type: 'text', text: JSON.stringify(response.data.data) }] };
} catch (error: any) {
  console.error('Error description:', error.message);
  throw new McpError(ErrorCode.InvalidRequest, error.message);
}

// ❌ Mauvais : Pas de gestion d'erreur
const response = await client.post('/endpoint', payload);
return { content: [{ type: 'text', text: JSON.stringify(response.data.data) }] };
```

### Commentaires

```typescript
// ✅ Bon : Commentaires pour la logique complexe
/**
 * Creates an Outline API client with the specified API key.
 * Falls back to environment variable if no key is provided.
 */
export function createOutlineClient(apiKey?: string): AxiosInstance {
  // ...
}

// ❌ Mauvais : Commentaires évidents
// Cette fonction crée un client
export function createOutlineClient(apiKey?: string): AxiosInstance {
  // ...
}
```

---

## Debugging

### Logs

```typescript
// Dans les outils
console.error('Error message:', error.message);
// Utilise stderr (spec MCP)

// Dans dxt.ts
import logger from './utils/logger.js';
logger.info('Server started');
logger.error('Error:', error);
```

### Inspector MCP

```bash
npm run dev
# Ouvre http://localhost:5173
```

**Fonctionnalités** :
- Liste des outils disponibles
- Test des outils avec paramètres
- Visualisation des requêtes/réponses
- Logs en temps réel

### Debugging TypeScript

**VSCode launch.json** :

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug HTTP Server",
      "runtimeArgs": ["-r", "ts-node/register"],
      "args": ["${workspaceFolder}/src/index.ts"],
      "env": {
        "OUTLINE_API_KEY": "ol_api_xxxxxx"
      },
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug STDIO Server",
      "runtimeArgs": ["-r", "ts-node/register"],
      "args": ["${workspaceFolder}/src/stdio.ts"],
      "env": {
        "OUTLINE_API_KEY": "ol_api_xxxxxx"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

**Usage** :
1. Ajouter des breakpoints dans le code
2. F5 pour lancer le debug
3. Inspecter les variables, call stack, etc.

---

## Tests

### Tests manuels

```bash
# Lancer le serveur
npm run dev

# Dans un autre terminal, tester avec curl
curl -X POST http://localhost:6060/mcp \
  -H "Content-Type: application/json" \
  -H "x-outline-api-key: $OUTLINE_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "list_collections",
      "arguments": {}
    },
    "id": 1
  }'
```

### Tests automatisés

⚠️ **À clarifier** : Le projet ne semble pas avoir de tests automatisés actuellement.

**Recommandations pour ajouter des tests** :

```bash
# Installer un framework de test
npm install --save-dev vitest @types/node

# Créer un répertoire de tests
mkdir -p tests/tools
```

**Exemple de test** (`tests/tools/listCollections.test.ts`) :

```typescript
import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';

vi.mock('../src/outline/outlineClient.js', () => ({
  getOutlineClient: () => ({
    post: vi.fn().mockResolvedValue({
      data: {
        data: [
          { id: 'col-1', name: 'Collection 1' },
          { id: 'col-2', name: 'Collection 2' }
        ]
      }
    })
  })
}));

describe('list_collections', () => {
  it('should return collections', async () => {
    // Import after mocking
    const { default: toolRegistry } = await import('../src/utils/toolRegistry.js');
    await import('../src/tools/listCollections.js');

    const tool = toolRegistry.get('list_collections');
    const result = await tool.callback({});

    expect(result.content).toHaveLength(1);
    expect(result.content[0].text).toContain('Collection 1');
  });
});
```

---

## Contribution

### Commits (Conventional Commits)

**Format** :
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types** :
- `feat`: Nouvelle fonctionnalité (minor version)
- `fix`: Correction de bug (patch version)
- `docs`: Documentation uniquement
- `style`: Formatage, point-virgule manquant, etc.
- `refactor`: Refactoring sans changement de comportement
- `perf`: Amélioration de performance
- `test`: Ajout ou correction de tests
- `build`: Changements du système de build
- `ci`: Changements de la CI
- `chore`: Tâches diverses

**Exemples** :

```bash
# Nouvelle fonctionnalité
git commit -m "feat(tools): add support for document templates"

# Correction de bug
git commit -m "fix(auth): handle expired API tokens properly"

# Breaking change
git commit -m "feat(api): change authentication method

BREAKING CHANGE: API key format has changed. Users must re-authenticate."

# Plusieurs scopes
git commit -m "feat(tools,api): add batch operations for documents"
```

**Scopes recommandés** :
- `tools`: Outils MCP
- `api`: Client API Outline
- `auth`: Authentification
- `transport`: Couche transport (HTTP, STDIO)
- `dxt`: Extension DXT
- `build`: Build et packaging
- `ci`: CI/CD
- `docs`: Documentation

---

### Pull Requests

**Checklist** :
- [ ] Code formaté (`npm run format`)
- [ ] Build réussi (`npm run build`)
- [ ] Tests manuels effectués
- [ ] Documentation mise à jour si nécessaire
- [ ] Commits suivent Conventional Commits
- [ ] PR title suit le format : `feat(scope): description`

**Template de PR** :

```markdown
## Description
Brève description des changements.

## Motivation
Pourquoi ces changements sont nécessaires ?

## Changements
- Changement 1
- Changement 2

## Test plan
Comment tester ces changements :
1. Étape 1
2. Étape 2

## Screenshots (si applicable)

## Breaking changes
Y a-t-il des breaking changes ? Lesquels ?
```

---

## Ressources de développement

### Documentation MCP

- **Spec MCP** : https://modelcontextprotocol.io/
- **SDK TypeScript** : https://github.com/anthropics/model-context-protocol

### Documentation Outline

- **API Outline** : https://www.getoutline.com/developers
- **Postman Collection** : https://www.postman.com/outlinewiki

### Outils recommandés

- **VSCode** : Éditeur recommandé avec extensions TypeScript
- **Postman** : Tester l'API Outline
- **Inspector MCP** : Tester les outils MCP (inclus avec `npm run dev`)
- **GitHub CLI** : `gh` pour gérer les PRs depuis la ligne de commande

---

## Prochaines étapes

Consultez les documents suivants pour approfondir :
- [09-tests.md](./09-tests.md) : Tests et qualité
- [10-maintenance.md](./10-maintenance.md) : Maintenance et évolution
- [03-outils.md](./03-outils.md) : Documentation des outils existants
