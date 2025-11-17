# Déploiement

Ce document détaille toutes les méthodes d'installation, de build et de déploiement du serveur Outline MCP.

---

## Prérequis

### Système

- **Node.js** : Version 20 ou supérieure
- **NPM** : Version 9+ (inclus avec Node.js)
- **Système d'exploitation** : Linux, macOS, Windows

### Compte Outline

- Compte Outline (cloud ou auto-hébergé)
- API key avec permissions appropriées
- (Optionnel) Fonctionnalité "AI Answers" activée pour `ask_documents`

---

## Installation

### 1. Installation NPM (recommandé)

#### Utilisation ponctuelle (npx)

**Mode HTTP/SSE** :
```bash
npx -y outline-mcp-server@latest
# Serveur démarre sur http://127.0.0.1:6060
```

**Mode STDIO** :
```bash
OUTLINE_API_KEY=ol_api_xxxxxx npx -y --package=outline-mcp-server@latest -c outline-mcp-server-stdio
```

#### Installation globale

```bash
npm install -g outline-mcp-server@latest

# Puis exécuter
outline-mcp-server          # Mode HTTP
outline-mcp-server-stdio    # Mode STDIO
```

#### Installation locale (projet)

```bash
npm install outline-mcp-server

# Puis exécuter
npx outline-mcp-server
```

---

### 2. Installation depuis les sources

#### Cloner le dépôt

```bash
git clone https://github.com/mmmeff/outline-mcp-server.git
cd outline-mcp-server
```

#### Installer les dépendances

```bash
npm install
```

#### Configurer l'environnement

```bash
cp .env.example .env
nano .env
# Éditer OUTLINE_API_KEY
```

#### Build

```bash
npm run build
# Génère le répertoire /build/
```

#### Exécuter

```bash
# Mode HTTP
npm start

# Mode STDIO
OUTLINE_API_KEY=ol_api_xxxxxx node build/stdio.js

# Mode développement (watch + inspector)
npm run dev
```

---

### 3. Installation via Docker

#### Méthode 1 : Docker Compose (recommandé)

```bash
# Cloner le dépôt
git clone https://github.com/mmmeff/outline-mcp-server.git
cd outline-mcp-server

# Configurer .env
cp .env.example .env
nano .env  # Ajouter OUTLINE_API_KEY

# Build et démarrage
docker-compose up --build

# En arrière-plan
docker-compose up -d
```

**docker-compose.yml** :
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
    restart: unless-stopped
```

#### Méthode 2 : Docker manuel

```bash
# Build de l'image
docker build -t outline-mcp-server .

# Exécution
docker run --env-file .env -p 6060:6060 outline-mcp-server

# Ou avec variables en ligne
docker run \
  -e OUTLINE_API_KEY=ol_api_xxxxxx \
  -e OUTLINE_MCP_PORT=6060 \
  -p 6060:6060 \
  outline-mcp-server
```

#### Dockerfile

**Fichier** : `/Dockerfile`

```dockerfile
# Multi-stage build pour optimiser la taille
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/package*.json ./
RUN npm install --omit=dev --ignore-scripts
EXPOSE 6060
CMD ["node", "build/index.js"]
```

**Avantages** :
- Image finale légère (Alpine Linux)
- Dépendances de développement exclues
- Build reproductible

---

### 4. Installation Claude Desktop (DXT)

#### Télécharger l'extension

1. Aller sur https://github.com/mmmeff/outline-mcp-server/releases
2. Télécharger `outline-mcp-extension.dxt`

#### Installer

**macOS / Windows** :
- Double-cliquer sur `outline-mcp-extension.dxt`
- Claude Desktop s'ouvre et demande la configuration
- Entrer `OUTLINE_API_KEY`
- Cliquer sur "Install"

**Emplacement** :
- macOS : `~/Library/Application Support/Claude/extensions/`
- Windows : `%APPDATA%\Claude\extensions\`

#### Build de l'extension (depuis les sources)

```bash
# Cloner le dépôt
git clone https://github.com/mmmeff/outline-mcp-server.git
cd outline-mcp-server

# Build de l'extension DXT
npm run build:dxt

# Génère outline-mcp-extension.dxt
ls -lh outline-mcp-extension.dxt
```

**Script** : `/scripts/build-dxt.sh`

---

### 5. Configuration Cursor

#### Créer/éditer le fichier de configuration

**Fichier** : `~/.cursor/mcp.json` (ou `.cursor/mcp.json` dans le projet)

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

#### Installation one-click

Cursor propose un bouton d'installation rapide :

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=outline&config=...)

#### Vérifier l'installation

1. Redémarrer Cursor
2. Ouvrir la palette de commandes
3. Taper "MCP" → Vérifier que "outline" apparaît
4. Tester avec une commande : "Liste mes documents Outline"

---

## Build

### Build standard

```bash
npm run build
```

**Étapes** :
1. Compilation TypeScript (`tsc`)
2. Génération du répertoire `/build/`
3. Attribution des permissions exécutables (`chmod +x`)

**Sortie** :
```
build/
├── index.js          # Point d'entrée HTTP/SSE
├── stdio.js          # Point d'entrée STDIO
├── dxt.js            # Point d'entrée DXT
├── outline/
│   └── outlineClient.js
├── tools/
│   ├── createDocument.js
│   ├── listDocuments.js
│   └── ... (18 outils)
└── utils/
    ├── getMcpServer.js
    ├── loadAllTools.js
    ├── logger.js
    └── toolRegistry.js
```

---

### Build DXT

```bash
npm run build:dxt
```

**Étapes** (`/scripts/build-dxt.sh`) :
1. Nettoyage (`rm -rf dist/ outline-mcp-extension.dxt`)
2. Build TypeScript (`npm run build`)
3. Génération du manifest DXT (`generate-dxt-manifest.js`)
4. Création de la structure de répertoires
5. Copie des fichiers compilés
6. Installation des dépendances de production
7. Création du fichier `.dxt` (zip)

**Sortie** :
```
outline-mcp-extension.dxt
dist/
├── dxt-server/
│   ├── index.js
│   ├── tools/
│   ├── utils/
│   └── outline/
├── assets/
├── package.json
├── node_modules/
└── manifest.json
```

**Taille typique** : ~5-10 MB

---

### Build pour production

```bash
# 1. Build TypeScript
npm run build

# 2. Optimisations (optionnelles)
# - Minification (non implémentée actuellement)
# - Tree-shaking (géré par TypeScript)
# - Bundling (non implémenté, modules séparés)

# 3. Test du build
NODE_ENV=production node build/index.js
```

**Recommandations** :
- Utiliser `NODE_ENV=production`
- Exclure les source maps (`sourceMap: false` dans tsconfig.json)
- Supprimer les devDependencies (`npm install --omit=dev`)

---

## Déploiement

### Déploiement local

#### Développement

```bash
# Watch mode + inspector MCP
npm run dev

# Accès :
# - Serveur : http://127.0.0.1:6060/mcp
# - Inspector : http://localhost:5173
```

#### Production locale

```bash
# Build
npm run build

# Configurer .env
cp .env.example .env
nano .env

# Démarrer
npm start
# Ou
node build/index.js
```

---

### Déploiement Docker

#### Docker Compose (recommandé)

**Fichier** : `docker-compose.yml`

```yaml
services:
  outline-mcp-server:
    build: .
    ports:
      - "127.0.0.1:6060:6060"  # Bind localhost uniquement
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - OUTLINE_API_KEY=${OUTLINE_API_KEY}
      - OUTLINE_API_URL=${OUTLINE_API_URL:-https://app.getoutline.com/api}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:6060/mcp"]
      interval: 30s
      timeout: 10s
      retries: 3
```

```bash
# Démarrer
docker-compose up -d

# Logs
docker-compose logs -f

# Arrêter
docker-compose down
```

---

### Déploiement sur VPS

#### Avec systemd (Linux)

**1. Créer un utilisateur dédié**

```bash
sudo useradd -r -s /bin/false outline-mcp
```

**2. Installer le serveur**

```bash
cd /opt
sudo git clone https://github.com/mmmeff/outline-mcp-server.git
cd outline-mcp-server
sudo npm install
sudo npm run build
```

**3. Configurer l'environnement**

```bash
sudo nano /opt/outline-mcp-server/.env
# Ajouter OUTLINE_API_KEY=...
```

**4. Créer un service systemd**

```bash
sudo nano /etc/systemd/system/outline-mcp.service
```

```ini
[Unit]
Description=Outline MCP Server
After=network.target

[Service]
Type=simple
User=outline-mcp
WorkingDirectory=/opt/outline-mcp-server
EnvironmentFile=/opt/outline-mcp-server/.env
ExecStart=/usr/bin/node build/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**5. Démarrer le service**

```bash
sudo systemctl daemon-reload
sudo systemctl enable outline-mcp
sudo systemctl start outline-mcp

# Vérifier
sudo systemctl status outline-mcp
sudo journalctl -u outline-mcp -f
```

---

### Déploiement derrière un reverse proxy

#### Nginx

```nginx
server {
    listen 80;
    server_name outline-mcp.mondomaine.com;

    location /mcp {
        proxy_pass http://127.0.0.1:6060/mcp;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Avec HTTPS (recommandé)** :

```bash
# Installer certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir un certificat
sudo certbot --nginx -d outline-mcp.mondomaine.com
```

---

### Déploiement cloud

#### Heroku

**1. Créer un Procfile**

```
web: node build/index.js
```

**2. Déployer**

```bash
heroku create outline-mcp-server
heroku config:set OUTLINE_API_KEY=ol_api_xxxxxx
git push heroku master
```

#### Railway

**1. Créer un fichier `railway.toml`**

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "node build/index.js"
healthcheckPath = "/mcp"
healthcheckTimeout = 100
```

**2. Déployer via dashboard ou CLI**

```bash
railway login
railway init
railway up
```

#### Render

**1. Créer un fichier `render.yaml`**

```yaml
services:
  - type: web
    name: outline-mcp-server
    env: node
    buildCommand: npm install && npm run build
    startCommand: node build/index.js
    envVars:
      - key: OUTLINE_API_KEY
        sync: false
      - key: OUTLINE_MCP_PORT
        value: 6060
```

**2. Connecter le dépôt GitHub**

---

## CI/CD

### GitHub Actions

#### Workflow de release automatique

**Fichier** : `/.github/workflows/npm-publish-and-release.yml`

```yaml
name: Semantic Release

on:
  push:
    branches:
      - master

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        with:
          fetch-depth: 0
          persist-credentials: false

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Semantic Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

**Étapes** :
1. Clone du dépôt
2. Installation des dépendances
3. Build TypeScript
4. Semantic Release :
   - Analyse des commits (Conventional Commits)
   - Détermination de la version
   - Build de l'extension DXT
   - Publication NPM
   - Création de la release GitHub
   - Mise à jour du CHANGELOG.md

**Déclenchement** : Automatique à chaque push sur `master`

---

#### Workflow de publication Docker

**Fichier** : `/.github/workflows/publish-to-ghcr.yml`

```yaml
name: Publish Docker image to GHCR

on:
  release:
    types: [published]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Log in to GHCR
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:latest
            ghcr.io/${{ github.repository }}:${{ github.event.release.tag_name }}
```

**Déclenchement** : Automatique lors de la création d'une release GitHub

---

## Vérification du déploiement

### Test du serveur HTTP

```bash
# Vérifier que le serveur répond
curl -X POST http://localhost:6060/mcp \
  -H "Content-Type: application/json" \
  -H "x-outline-api-key: ol_api_xxxxxx" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

**Réponse attendue** :
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      { "name": "create_document", "description": "..." },
      ...
    ]
  },
  "id": 1
}
```

---

### Test du serveur STDIO

```bash
# Lancer en mode STDIO
OUTLINE_API_KEY=ol_api_xxxxxx node build/stdio.js

# Envoyer une requête via stdin
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | OUTLINE_API_KEY=ol_api_xxxxxx node build/stdio.js
```

---

### Healthcheck

**HTTP** :
```bash
curl http://localhost:6060/mcp
# Attendu : Erreur 405 (méthode GET non autorisée)
# Signifie que le serveur répond
```

**Docker healthcheck** :
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:6060/mcp"]
  interval: 30s
  timeout: 10s
  retries: 3
```

---

## Mise à jour

### Mise à jour NPM

```bash
# Installation globale
npm update -g outline-mcp-server

# Installation locale
npm update outline-mcp-server

# Vérifier la version
outline-mcp-server --version
```

### Mise à jour depuis les sources

```bash
cd outline-mcp-server
git pull origin master
npm install
npm run build
sudo systemctl restart outline-mcp  # Si systemd
```

### Mise à jour Docker

```bash
# Reconstruire l'image
docker-compose build --no-cache

# Redémarrer
docker-compose up -d
```

---

## Dépannage

### Problèmes fréquents

#### 1. API key invalide

**Symptôme** :
```
Error: OUTLINE_API_KEY environment variable is required for stdio mode
```

**Solution** :
```bash
# Vérifier la variable
echo $OUTLINE_API_KEY

# La définir
export OUTLINE_API_KEY=ol_api_xxxxxx
```

#### 2. Port déjà utilisé

**Symptôme** :
```
Error: listen EADDRINUSE: address already in use :::6060
```

**Solution** :
```bash
# Trouver le processus
lsof -i :6060

# Tuer le processus
kill -9 <PID>

# Ou changer le port
export OUTLINE_MCP_PORT=9001
```

#### 3. Permissions Docker

**Symptôme** :
```
permission denied while trying to connect to the Docker daemon socket
```

**Solution** :
```bash
# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER
newgrp docker
```

---

## Prochaines étapes

Consultez les documents suivants pour approfondir :
- [08-developpement.md](./08-developpement.md) : Guide de développement
- [06-configuration.md](./06-configuration.md) : Configuration détaillée
- [09-tests.md](./09-tests.md) : Tests et qualité
