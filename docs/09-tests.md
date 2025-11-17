# Tests et qualité

Ce document décrit l'organisation des tests, les outils utilisés et les bonnes pratiques pour assurer la qualité du code.

---

## État actuel des tests

⚠️ **À clarifier** : Le projet ne semble pas avoir de suite de tests automatisés actuellement.

**Fichiers analysés** :
- Pas de répertoire `/tests/` ou `/spec/`
- Pas de configuration Jest, Vitest ou Mocha
- Pas de fichiers `*.test.ts` ou `*.spec.ts`
- Script `scripts/test.sh` présent mais contenu inconnu

**Conséquences** :
- Tests manuels requis pour valider les changements
- Risque de régressions lors des modifications
- Pas de coverage automatique

---

## Tests manuels

### 1. Test avec l'inspector MCP

**Lancement** :
```bash
npm run dev
# Ouvre http://localhost:5173
```

**Fonctionnalités** :
- Liste tous les outils disponibles (18 attendus)
- Test de chaque outil avec paramètres personnalisés
- Visualisation des requêtes/réponses JSON
- Logs en temps réel

**Exemple de test** :
1. Sélectionner l'outil `list_collections`
2. Cliquer sur "Call Tool"
3. Vérifier la réponse :
   ```json
   {
     "content": [{
       "type": "text",
       "text": "[{\"id\":\"col-1\",\"name\":\"Ma collection\"}, ...]"
     }]
   }
   ```

---

### 2. Test avec curl

**Liste des outils** :
```bash
curl -X POST http://localhost:6060/mcp \
  -H "Content-Type: application/json" \
  -H "x-outline-api-key: $OUTLINE_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

**Appel d'un outil** :
```bash
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

**Test de validation Zod** :
```bash
# Paramètre manquant (doit échouer)
curl -X POST http://localhost:6060/mcp \
  -H "Content-Type: application/json" \
  -H "x-outline-api-key: $OUTLINE_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "create_document",
      "arguments": {}
    },
    "id": 1
  }'
# Attendu : Erreur de validation (title, text, collectionId requis)
```

---

### 3. Test STDIO

**Lancement** :
```bash
OUTLINE_API_KEY=ol_api_xxxxxx node build/stdio.js
```

**Test** :
```bash
# Envoyer une requête JSON via stdin
echo '{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}' | OUTLINE_API_KEY=ol_api_xxxxxx node build/stdio.js
```

**Validation** :
- Vérifier que la réponse est sur stdout
- Vérifier que les logs sont sur stderr
- Vérifier que le serveur refuse de démarrer si `OUTLINE_API_KEY` est absente

---

### 4. Test DXT

**Build** :
```bash
npm run build:dxt
```

**Installation** :
1. Double-cliquer sur `outline-mcp-extension.dxt`
2. Configurer l'API key dans Claude Desktop
3. Redémarrer Claude Desktop

**Test** :
1. Ouvrir Claude Desktop
2. Poser une question : "Liste mes collections Outline"
3. Vérifier que Claude appelle le serveur MCP et retourne les collections

---

## Scénarios de test recommandés

### Tests fonctionnels par outil

#### 1. Documents

| Outil | Scénario | Résultat attendu |
|-------|----------|------------------|
| `create_document` | Créer un document avec titre + texte + collectionId | Document créé avec ID retourné |
| `get_document` | Récupérer un document existant par ID | Document complet retourné |
| `update_document` | Modifier le titre d'un document | Document mis à jour |
| `delete_document` | Supprimer un document | Confirmation de suppression |
| `list_documents` | Lister tous les documents (limit=10) | 10 documents maximum + pagination |
| `search_documents` | Rechercher "test" | Documents contenant "test" |
| `move_document` | Déplacer un document vers une autre collection | Document avec nouveau collectionId |
| `archive_document` | Archiver un document | Document archivé (archivedAt présent) |
| `ask_documents` | Poser une question "Qu'est-ce que..." | Réponse générée par IA |

#### 2. Collections

| Outil | Scénario | Résultat attendu |
|-------|----------|------------------|
| `get_collection` | Récupérer une collection par ID | Collection complète |
| `list_collections` | Lister toutes les collections | Liste de collections |
| `create_collection` | Créer une collection "Test" | Collection créée avec ID |
| `update_collection` | Renommer une collection | Collection mise à jour |

#### 3. Commentaires

| Outil | Scénario | Résultat attendu |
|-------|----------|------------------|
| `create_comment` | Créer un commentaire sur un document | Commentaire créé |
| `update_comment` | Modifier un commentaire | Commentaire mis à jour |
| `delete_comment` | Supprimer un commentaire | Confirmation de suppression |

#### 4. Utilisateurs

| Outil | Scénario | Résultat attendu |
|-------|----------|------------------|
| `list_users` | Lister tous les utilisateurs | Liste d'utilisateurs + pagination |
| `list_users` (filter=active) | Filtrer par utilisateurs actifs | Uniquement les actifs |

---

### Tests d'erreur

| Scénario | Résultat attendu |
|----------|------------------|
| API key invalide | Erreur 401 Unauthorized |
| API key absente (STDIO) | Serveur refuse de démarrer |
| Paramètre requis manquant | Erreur de validation Zod |
| Document ID inexistant | Erreur 404 Not Found |
| Permissions insuffisantes | Erreur 403 Forbidden |
| Rate limiting dépassé | Erreur 429 Too Many Requests |

---

### Tests de performance

| Scénario | Métrique cible |
|----------|----------------|
| Temps de démarrage (HTTP) | < 1s |
| Temps de démarrage (STDIO) | < 500ms |
| Temps de réponse `list_collections` | < 500ms |
| Temps de réponse `create_document` | < 1s |
| Temps de réponse `search_documents` | < 2s |

---

## Recommandations pour ajouter des tests automatisés

### Framework de test : Vitest

**Installation** :
```bash
npm install --save-dev vitest @vitest/ui @types/node
```

**Configuration** (`vitest.config.ts`) :
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'build/',
        'dist/',
        '**/*.config.ts'
      ]
    }
  }
});
```

**Scripts package.json** :
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

### Structure de tests proposée

```
tests/
├── unit/                    # Tests unitaires
│   ├── outline/
│   │   └── outlineClient.test.ts
│   ├── utils/
│   │   ├── toolRegistry.test.ts
│   │   └── loadAllTools.test.ts
│   └── tools/
│       ├── createDocument.test.ts
│       ├── listDocuments.test.ts
│       └── ...
├── integration/             # Tests d'intégration
│   ├── http-server.test.ts
│   ├── stdio-server.test.ts
│   └── api-calls.test.ts
├── e2e/                     # Tests end-to-end
│   └── full-workflow.test.ts
└── fixtures/                # Données de test
    ├── mock-responses.json
    └── test-data.json
```

---

### Exemple de test unitaire

**Fichier** : `tests/unit/outline/outlineClient.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createOutlineClient } from '../../../src/outline/outlineClient.js';

describe('createOutlineClient', () => {
  it('should create axios instance with API key', () => {
    const client = createOutlineClient('ol_api_test');

    expect(client.defaults.baseURL).toBe('https://app.getoutline.com/api');
    expect(client.defaults.headers['Authorization']).toBe('Bearer ol_api_test');
    expect(client.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('should throw error if no API key provided', () => {
    expect(() => createOutlineClient()).toThrow('OUTLINE_API_KEY must be provided');
  });

  it('should use custom API URL from env', () => {
    process.env.OUTLINE_API_URL = 'https://custom.com/api';
    const client = createOutlineClient('ol_api_test');

    expect(client.defaults.baseURL).toBe('https://custom.com/api');

    delete process.env.OUTLINE_API_URL;
  });
});
```

---

### Exemple de test d'outil avec mock

**Fichier** : `tests/unit/tools/listCollections.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock du client Outline
const mockPost = vi.fn();
vi.mock('../../../src/outline/outlineClient.js', () => ({
  getOutlineClient: () => ({
    post: mockPost
  })
}));

describe('list_collections tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return collections from API', async () => {
    // Setup mock response
    mockPost.mockResolvedValue({
      data: {
        data: [
          { id: 'col-1', name: 'Collection 1' },
          { id: 'col-2', name: 'Collection 2' }
        ]
      }
    });

    // Import tool after mocking
    const { default: toolRegistry } = await import('../../../src/utils/toolRegistry.js');
    await import('../../../src/tools/listCollections.js');

    // Get tool and execute
    const tool = toolRegistry.get('list_collections');
    const result = await tool.callback({});

    // Assertions
    expect(mockPost).toHaveBeenCalledWith('/collections.list', {});
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Collection 1');
  });

  it('should throw McpError on API failure', async () => {
    // Setup mock error
    mockPost.mockRejectedValue(new Error('API Error'));

    const { default: toolRegistry } = await import('../../../src/utils/toolRegistry.js');
    await import('../../../src/tools/listCollections.js');

    const tool = toolRegistry.get('list_collections');

    // Expect error
    await expect(tool.callback({})).rejects.toThrow('API Error');
  });
});
```

---

### Exemple de test d'intégration

**Fichier** : `tests/integration/http-server.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';
import { spawn, ChildProcess } from 'child_process';

describe('HTTP Server Integration', () => {
  let serverProcess: ChildProcess;

  beforeAll(async () => {
    // Démarrer le serveur
    serverProcess = spawn('node', ['build/index.js'], {
      env: {
        ...process.env,
        OUTLINE_API_KEY: 'test_key',
        OUTLINE_MCP_PORT: '6061'
      }
    });

    // Attendre que le serveur démarre
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(() => {
    // Arrêter le serveur
    serverProcess.kill();
  });

  it('should respond to tools/list request', async () => {
    const response = await axios.post('http://localhost:6061/mcp', {
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status).toBe(200);
    expect(response.data.result.tools).toBeDefined();
    expect(response.data.result.tools.length).toBe(18);
  });

  it('should return 405 for GET requests', async () => {
    try {
      await axios.get('http://localhost:6061/mcp');
    } catch (error: any) {
      expect(error.response.status).toBe(405);
    }
  });
});
```

---

## Coverage cible

### Objectifs de couverture

| Catégorie | Cible | Priorité |
|-----------|-------|----------|
| **Outils MCP** | 80% | Haute |
| **Client API** | 90% | Haute |
| **Utilitaires** | 95% | Haute |
| **Transports** | 70% | Moyenne |
| **Scripts** | 50% | Basse |

### Zones critiques à tester

1. **Validation Zod** : Tous les schémas d'entrée
2. **Gestion d'erreurs** : Tous les catch blocks
3. **Authentification** : Tous les chemins d'auth (env, headers)
4. **RequestContext** : Isolation entre requêtes
5. **Chargement d'outils** : loadAllTools et auto-registration

---

## CI/CD et qualité

### GitHub Actions (à ajouter)

**Fichier** : `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [master, develop]
  pull_request:
    branches: [master, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run format -- --check

      - name: Build
        run: npm run build

      - name: Run tests
        run: npm test

      - name: Coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

### Pre-commit hooks (à ajouter)

**Installation** :
```bash
npm install --save-dev husky lint-staged
npx husky install
```

**Configuration** (`.husky/pre-commit`) :
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

**lint-staged** (`package.json`) :
```json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

---

## Bonnes pratiques de test

### 1. Tests isolés

✅ **Bon** :
```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

❌ **Mauvais** : Réutiliser les mocks entre tests.

### 2. Tests déterministes

✅ **Bon** :
```typescript
const fixedDate = new Date('2025-01-15T10:00:00Z');
vi.setSystemTime(fixedDate);
```

❌ **Mauvais** : `expect(doc.createdAt).toBe(new Date())` (non déterministe).

### 3. Mocks explicites

✅ **Bon** :
```typescript
mockPost.mockResolvedValueOnce({
  data: { data: { id: 'doc-1', title: 'Test' } }
});
```

❌ **Mauvais** : Mocker toute l'API Outline sans granularité.

### 4. Messages d'erreur clairs

✅ **Bon** :
```typescript
expect(result.content[0].text).toContain('Collection 1');
```

❌ **Mauvais** :
```typescript
expect(result).toBeTruthy();
```

---

## Outils de qualité

### ESLint (à ajouter)

```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

**Configuration** (`.eslintrc.json`) :
```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "off",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### TypeScript strict mode

Déjà activé dans `tsconfig.json` :
```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

---

## Prochaines étapes

Consultez les documents suivants pour approfondir :
- [10-maintenance.md](./10-maintenance.md) : Maintenance et évolution
- [08-developpement.md](./08-developpement.md) : Guide de développement
- [CONTRIBUTING.md](../CONTRIBUTING.md) : Guide de contribution
