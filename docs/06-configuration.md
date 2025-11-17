# Configuration

Ce document détaille toutes les variables d'environnement, fichiers de configuration et options disponibles pour le serveur Outline MCP.

---

## Variables d'environnement

### Vue d'ensemble

| Variable | Obligatoire | Défaut | Description |
|----------|-------------|--------|-------------|
| `OUTLINE_API_KEY` | ✅ STDIO<br/>❌ HTTP | - | Clé API Outline pour l'authentification |
| `OUTLINE_API_URL` | ❌ | `https://app.getoutline.com/api` | URL de base de l'API Outline |
| `OUTLINE_MCP_PORT` | ❌ | `6060` | Port du serveur HTTP |
| `OUTLINE_MCP_HOST` | ❌ | `127.0.0.1` | Adresse IP d'écoute du serveur |

---

### `OUTLINE_API_KEY`

**Type** : `string`
**Format** : Token commençant par `ol_api_`
**Exemple** : `ol_api_xxxxxxxxxxxxxxxxxxxxxxxxxx`

#### Description

Clé d'authentification pour accéder à l'API Outline. Cette clé détermine les permissions du serveur MCP.

#### Obtenir une clé

1. Se connecter à votre workspace Outline
2. Aller dans **Settings → API Tokens**
3. Cliquer sur **Create a token**
4. Copier le token généré

#### Utilisation par mode

**Mode STDIO/DXT** :
```bash
# Obligatoire, validation au démarrage
export OUTLINE_API_KEY="ol_api_xxxxxx"
outline-mcp-server-stdio
```

**Mode HTTP/SSE** :
```bash
# Optionnel, fallback si pas de header
export OUTLINE_API_KEY="ol_api_xxxxxx"
outline-mcp-server
```

Ou via header de requête (recommandé) :
```http
POST /mcp HTTP/1.1
x-outline-api-key: ol_api_xxxxxx
```

#### Sécurité

⚠️ **Ne jamais** :
- Committer `.env` dans Git
- Logger la clé API complète
- Partager la clé publiquement

✅ **Toujours** :
- Utiliser des variables d'environnement
- Rotation régulière des clés
- Limiter les permissions au minimum nécessaire

---

### `OUTLINE_API_URL`

**Type** : `string` (URL)
**Défaut** : `https://app.getoutline.com/api`
**Exemple** : `https://outline.monentreprise.com/api`

#### Description

URL de base de l'API Outline. Utilisé pour les instances auto-hébergées.

#### Utilisation

**Instance cloud Outline** :
```bash
# Pas besoin de définir, utilise le défaut
```

**Instance auto-hébergée** :
```bash
export OUTLINE_API_URL="https://docs.monentreprise.com/api"
```

#### Fichier source

`/src/outline/outlineClient.ts:10`
```typescript
const API_URL = process.env.OUTLINE_API_URL || 'https://app.getoutline.com/api';
```

⚠️ **Important** : L'URL doit se terminer par `/api` sans slash final.

---

### `OUTLINE_MCP_PORT`

**Type** : `number`
**Défaut** : `6060`
**Plage** : `1024-65535` (ports non privilégiés)
**Exemple** : `9001`

#### Description

Port d'écoute du serveur HTTP/SSE.

⚠️ **Note** : Cette variable n'a aucun effet en mode STDIO/DXT.

#### Utilisation

```bash
export OUTLINE_MCP_PORT=9001
outline-mcp-server
# Serveur accessible sur http://127.0.0.1:9001/mcp
```

#### Fichier source

`/src/index.ts:152`
```typescript
const PORT = process.env.OUTLINE_MCP_PORT ? parseInt(process.env.OUTLINE_MCP_PORT, 10) : 6060;
```

---

### `OUTLINE_MCP_HOST`

**Type** : `string` (IP ou hostname)
**Défaut** : `127.0.0.1`
**Exemples** :
- `127.0.0.1` : Localhost uniquement
- `0.0.0.0` : Toutes les interfaces (accès réseau)
- `192.168.1.100` : Interface spécifique

#### Description

Adresse IP sur laquelle le serveur HTTP/SSE écoute les connexions.

⚠️ **Note** : Cette variable n'a aucun effet en mode STDIO/DXT.

#### Utilisation

**Localhost uniquement (défaut)** :
```bash
# Accès uniquement depuis la machine locale
export OUTLINE_MCP_HOST=127.0.0.1
```

**Accès réseau** :
```bash
# Accès depuis n'importe quelle interface réseau
export OUTLINE_MCP_HOST=0.0.0.0
```

#### Sécurité

⚠️ **Attention** : Utiliser `0.0.0.0` expose le serveur sur le réseau.

**Recommandations** :
- En développement local : `127.0.0.1`
- En production derrière un reverse proxy : `127.0.0.1`
- En production directement exposé : Utiliser un firewall et HTTPS

#### Fichier source

`/src/index.ts:153`
```typescript
const HOST = process.env.OUTLINE_MCP_HOST || '127.0.0.1';
```

---

## Fichiers de configuration

### `.env` (développement local)

**Fichier** : `/.env`
**Format** : Clé-valeur, une par ligne

#### Exemple

```bash
# Required: Your Outline API Key
OUTLINE_API_KEY=ol_api_xxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Outline API base URL (defaults to https://app.getoutline.com/api)
OUTLINE_API_URL=https://app.getoutline.com/api

# Optional: Host/IP to bind the server to (defaults to 127.0.0.1)
# Use 0.0.0.0 to bind to all network interfaces for multi-client access
OUTLINE_MCP_HOST=127.0.0.1

# Optional: Port for HTTP/SSE server
OUTLINE_MCP_PORT=6060
```

#### Utilisation

Le fichier `.env` est chargé automatiquement par dotenv :

```typescript
// /src/outline/outlineClient.ts:7-8
import { config } from 'dotenv';
config({ path: join(__dirname, '..', '.env') });
```

#### Création

```bash
# Copier l'exemple
cp .env.example .env

# Éditer avec votre API key
nano .env
```

⚠️ **Important** : `.env` est dans `.gitignore` et ne doit jamais être commité.

---

### `.env.example`

**Fichier** : `/.env.example`
**Rôle** : Template pour créer `.env`

#### Contenu

```bash
# Required: Your Outline API Key
OUTLINE_API_KEY=your_outline_api_key_here

# Optional: Outline API base URL (defaults to https://app.getoutline.com/api)
# OUTLINE_API_URL=https://app.getoutline.com/api

# Optional: Host/IP to bind the server to (defaults to 127.0.0.1)
# Use 0.0.0.0 to bind to all network interfaces for multi-client access
# OUTLINE_MCP_HOST=127.0.0.1

# To get your Outline API key:
# 1. Log in to your Outline account
# 2. Go to Settings > API Tokens
# 3. Create a new token and copy it
# 4. Create a .env file and paste your key here
```

---

### Configuration Docker

#### `docker-compose.yml`

**Fichier** : `/docker-compose.yml`

```yaml
services:
  outline-mcp-server:
    build: .
    ports:
      - "${OUTLINE_MCP_PORT:-6060}:6060"
    env_file:
      - .env
    environment:
      - OUTLINE_API_KEY=${OUTLINE_API_KEY}
      - OUTLINE_API_URL=${OUTLINE_API_URL:-https://app.getoutline.com/api}
      - OUTLINE_MCP_PORT=${OUTLINE_MCP_PORT:-6060}
      - OUTLINE_MCP_HOST=${OUTLINE_MCP_HOST:-127.0.0.1}
```

#### Utilisation

```bash
# Créer .env avec OUTLINE_API_KEY
cp .env.example .env
nano .env

# Démarrer avec docker-compose
docker-compose up
```

#### Variables dans docker-compose

- `${OUTLINE_API_KEY}` : Lecture depuis .env
- `${OUTLINE_API_URL:-default}` : Lecture depuis .env avec valeur par défaut
- `${OUTLINE_MCP_PORT:-6060}:6060` : Mapping de port configurable

---

### Configuration Cursor

#### `mcp.json`

**Fichier** : `~/.cursor/mcp.json` ou `.cursor/mcp.json` (projet)

```json
{
  "outline": {
    "command": "npx",
    "args": ["-y", "--package=outline-mcp-server@latest", "-c", "outline-mcp-server-stdio"],
    "env": {
      "OUTLINE_API_KEY": "ol_api_xxxxxx",
      "OUTLINE_API_URL": "https://app.getoutline.com/api"
    }
  }
}
```

#### Champs

| Champ | Description |
|-------|-------------|
| `command` | Commande à exécuter (`npx` pour installer/exécuter) |
| `args` | Arguments de la commande |
| `env` | Variables d'environnement pour le processus |

---

### Configuration Claude Desktop

#### Extension DXT

**Installation** :
1. Télécharger `outline-mcp-extension.dxt` depuis les releases
2. Double-cliquer sur le fichier
3. Claude Desktop demande la configuration

**Configuration demandée** :
- `OUTLINE_API_KEY` : Clé API Outline
- `OUTLINE_API_URL` : URL de l'API (optionnel)

**Stockage** :
- macOS : `~/Library/Application Support/Claude/extensions/`
- Windows : `%APPDATA%\Claude\extensions\`

---

## Configuration par mode de transport

### Mode STDIO

**Variables requises** :
- ✅ `OUTLINE_API_KEY` (obligatoire)

**Variables optionnelles** :
- ❌ `OUTLINE_API_URL`

**Variables ignorées** :
- ❌ `OUTLINE_MCP_PORT`
- ❌ `OUTLINE_MCP_HOST`

**Exemple** :
```bash
export OUTLINE_API_KEY="ol_api_xxxxxx"
npx -y --package=outline-mcp-server@latest -c outline-mcp-server-stdio
```

---

### Mode HTTP/SSE

**Variables requises** :
- ❌ `OUTLINE_API_KEY` (optionnel, peut être fourni par header)

**Variables optionnelles** :
- ❌ `OUTLINE_API_URL`
- ❌ `OUTLINE_MCP_PORT`
- ❌ `OUTLINE_MCP_HOST`

**Exemple** :
```bash
export OUTLINE_API_KEY="ol_api_xxxxxx"  # Fallback
export OUTLINE_MCP_PORT=9001
export OUTLINE_MCP_HOST=0.0.0.0
npx -y outline-mcp-server@latest
```

**Avec headers** :
```bash
# Aucune variable requise
npx -y outline-mcp-server@latest
```

```http
POST /mcp HTTP/1.1
Host: localhost:6060
x-outline-api-key: ol_api_xxxxxx
Content-Type: application/json
```

---

### Mode DXT

**Variables requises** :
- ✅ `OUTLINE_API_KEY` (configuré via l'interface d'installation)

**Variables optionnelles** :
- ❌ `OUTLINE_API_URL` (configuré via l'interface)

**Variables ignorées** :
- ❌ `OUTLINE_MCP_PORT`
- ❌ `OUTLINE_MCP_HOST`

---

## Configuration TypeScript

### `tsconfig.json`

**Fichier** : `/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "build",
    "sourceMap": false,
    "declaration": false,
    "declarationMap": false,
    "removeComments": false,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "lib": ["ES2020"],
    "typeRoots": ["./node_modules/@types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build"]
}
```

#### Options importantes

| Option | Valeur | Raison |
|--------|--------|--------|
| `target` | `ES2020` | Support Node.js 20+ |
| `module` | `ESNext` | ESM (import/export) |
| `strict` | `true` | Typage strict |
| `outDir` | `build` | Sortie de compilation |
| `sourceMap` | `false` | Pas de source maps en prod |

---

## Configuration NPM

### `package.json`

**Fichier** : `/package.json`

#### Champs importants

```json
{
  "name": "outline-mcp-server",
  "version": "5.6.0",
  "type": "module",
  "bin": {
    "outline-mcp-server": "./build/index.js",
    "outline-mcp-server-stdio": "./build/stdio.js"
  },
  "files": [
    "build"
  ],
  "engines": {
    "node": ">=20"
  }
}
```

#### `bin` - Exécutables

Définit les commandes disponibles après installation NPM :
- `outline-mcp-server` → `/build/index.js` (HTTP/SSE)
- `outline-mcp-server-stdio` → `/build/stdio.js` (STDIO)

#### `files` - Package NPM

Seul le répertoire `build/` est inclus dans le package NPM.

#### `engines` - Version Node.js

Requiert Node.js 20 ou supérieur.

---

## Scripts NPM

### Scripts de développement

| Script | Commande | Description |
|--------|----------|-------------|
| `dev` | `concurrently -n 'build,inspector' ...` | Lance le serveur + inspector MCP |
| `watch` | `bun --watch src/index.ts` | Watch mode HTTP avec Bun |
| `watch:stdio` | `bun --watch src/stdio.ts` | Watch mode STDIO avec Bun |

### Scripts de build

| Script | Commande | Description |
|--------|----------|-------------|
| `build` | `tsc && chmod +x ...` | Compile TypeScript + permissions exécutables |
| `build:dxt` | `./scripts/build-dxt.sh` | Build de l'extension DXT |
| `prepare` | `npm run build` | Hook NPM (avant install) |

### Scripts de production

| Script | Commande | Description |
|--------|----------|-------------|
| `start` | `bun build/index.js` | Démarre le serveur HTTP compilé |
| `format` | `prettier --write ...` | Formate le code |
| `semantic-release` | `semantic-release` | Publication automatique |

---

## Configuration Prettier

### `.prettierrc`

**Fichier** : `/.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid"
}
```

### `.prettierignore`

**Fichier** : `/.prettierignore`

```
build/
node_modules/
dist/
*.md
```

---

## Configuration Semantic Release

### `.releaserc.json`

**Fichier** : `/.releaserc.json`

```json
{
  "branches": ["master"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "./scripts/build-all-assets.js",
    [
      "@semantic-release/github",
      {
        "assets": [
          {
            "path": "outline-mcp-extension.dxt",
            "label": "Claude Desktop Extension (DXT)"
          }
        ]
      }
    ],
    [
      "@semantic-release/git",
      {
        "assets": ["package.json", "CHANGELOG.md"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ]
  ]
}
```

#### Plugins

1. **commit-analyzer** : Analyse les commits pour déterminer la version
2. **release-notes-generator** : Génère les notes de release
3. **changelog** : Met à jour CHANGELOG.md
4. **npm** : Publie sur NPM
5. **build-all-assets** : Build de l'extension DXT
6. **github** : Crée une release GitHub avec assets
7. **git** : Commit les changements (package.json, CHANGELOG.md)

---

## Bonnes pratiques de configuration

### 1. Environnements multiples

```bash
# .env.development
OUTLINE_API_KEY=ol_api_dev_xxxxxx
OUTLINE_API_URL=https://dev.outline.com/api
OUTLINE_MCP_PORT=6060

# .env.production
OUTLINE_API_KEY=ol_api_prod_xxxxxx
OUTLINE_API_URL=https://app.getoutline.com/api
OUTLINE_MCP_PORT=6060
OUTLINE_MCP_HOST=127.0.0.1
```

### 2. Sécurité des secrets

```bash
# Utiliser un gestionnaire de secrets
export OUTLINE_API_KEY=$(vault kv get -field=api_key secret/outline)

# Ou variables d'environnement du système
# Jamais de .env en production
```

### 3. Configuration Docker

```yaml
# docker-compose.prod.yml
services:
  outline-mcp-server:
    environment:
      - OUTLINE_API_KEY=${OUTLINE_API_KEY}  # Depuis l'env du host
    ports:
      - "127.0.0.1:6060:6060"  # Bind localhost uniquement
    restart: unless-stopped
```

---

## Prochaines étapes

Consultez les documents suivants pour approfondir :
- [07-deploiement.md](./07-deploiement.md) : Déploiement et installation
- [08-developpement.md](./08-developpement.md) : Guide de développement
- [04-api-outline.md](./04-api-outline.md) : Détails de l'API Outline
