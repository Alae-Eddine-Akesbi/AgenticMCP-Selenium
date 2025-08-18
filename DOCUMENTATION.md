# Documentation Complète du Projet d'Automatisation de Navigateur avec IA

## 1. Introduction

Ce document fournit une documentation complète et détaillée pour le projet d'automatisation de navigateur alimenté par l'IA. L'objectif de ce projet est de permettre le contrôle d'un navigateur web en utilisant des commandes en langage naturel, facilitant ainsi des tâches complexes telles que le web scraping, les tests automatisés, et d'autres interactions web.

Ce projet est spécifiquement conçu pour une intégration transparente avec **n8n**, un outil d'automatisation de workflows, ce qui permet de créer des automatisations sophistiquées avec une grande facilité.

## 2. Architecture du Projet

Le projet est construit sur une architecture modulaire composée de deux services principaux qui communiquent entre eux :

1.  **`langchain-agent`**: Une application Python construite avec LangChain et Streamlit. Ce service fournit une interface de chat conviviale où l'utilisateur peut entrer des commandes en langage naturel. L'agent utilise un modèle de langage puissant (comme Gemini de Google) pour interpréter ces commandes et orchestrer les tâches d'automatisation.

2.  **`mcp-selenium`**: Un serveur Node.js qui implémente le **Model Context Protocol (MCP)**. Ce serveur agit comme un pont entre l'agent LangChain et Selenium WebDriver. Il expose un ensemble d'outils (fonctions) que l'agent peut appeler pour contrôler un navigateur web.

### Schéma de Communication

```
+---------------------+       +------------------------+       +--------------------+
|      Utilisateur    | ----> |    langchain-agent     | ----> |    mcp-selenium    | ----> |   Navigateur Web   |
| (Interface de Chat) |       | (Interprète les cmds)  |       | (Exécute les cmds) |       | (Chrome/Firefox)   |
+---------------------+       +------------------------+       +--------------------+       +--------------------+
```

## 3. Comment ça Marche ? Le Workflow en Détail

1.  **L'Utilisateur Donne une Instruction** : L'utilisateur tape une commande dans l'interface de chat, par exemple : "Va sur Google et cherche des images de chats."

2.  **L'Agent LangChain Analyse** : L'agent reçoit la commande. Grâce au modèle de langage, il décompose la tâche en étapes réalisables :
    *   Étape 1 : Démarrer un navigateur.
    *   Étape 2 : Naviguer vers `https://www.google.com`.
    *   Étape 3 : Trouver le champ de recherche.
    *   Étape 4 : Écrire "images de chats" dans le champ.
    *   Étape 5 : Cliquer sur le bouton de recherche.

3.  **L'Agent Appelle les Outils du Serveur MCP** : Pour chaque étape, l'agent envoie une requête HTTP au serveur `mcp-selenium`, en appelant l'outil approprié. Par exemple, pour l'étape 2, il appellera l'outil `navigate` avec l'URL `https://www.google.com`.

4.  **Le Serveur MCP Exécute les Actions** : Le serveur `mcp-selenium` reçoit la requête, la traduit en une commande Selenium WebDriver, et l'exécute dans le navigateur.

5.  **Le Résultat est Renvoyé** : Le serveur renvoie le résultat de l'action à l'agent (par exemple, "Navigation réussie"). Si une erreur se produit, elle est également renvoyée.

6.  **L'Agent Informe l'Utilisateur** : Une fois toutes les étapes terminées, l'agent formule une réponse finale et l'affiche à l'utilisateur.

## 4. Installation et Lancement du Projet

Il y a deux manières de lancer le projet : **localement** (pour le développement) ou avec **Docker** (pour un déploiement facile).

### 4.1. Lancement en Local

**Prérequis :**
*   Node.js et npm
*   Python et pip
*   Une clé d'API pour un modèle de langage (ex: Google Gemini)

**Étape 1 : Configurer et Lancer le Serveur `mcp-selenium`**

Ce serveur est le moteur qui contrôle le navigateur.

```bash
# Allez dans le dossier du serveur
cd mcp-selenium

# Installez les dépendances
npm install

# Lancez le serveur
node http-server.js
```

Le serveur démarrera sur `http://localhost:3000`.

**Étape 2 : Configurer et Lancer l'`langchain-agent`**

C'est l'interface de chat et le "cerveau" du projet.

```bash
# Allez dans le dossier de l'agent
cd langchain-agent

# Installez les dépendances Python
pip install -r requirements.txt
```

**Configuration de la Clé d'API :**
Créez un fichier nommé `.env` à la racine du dossier `langchain-agent` et ajoutez votre clé d'API :

```
GEMINI_API_KEY=votre_cle_api_ici
```

**Lancement de l'Agent :**

```bash
streamlit run app.py
```

Cela ouvrira une page web avec l'interface de chat.

### 4.2. Lancement avec Docker

Docker simplifie grandement le déploiement en encapsulant tout dans un seul conteneur.

**Étape 1 : Construire l'Image Docker**

À la racine du projet, exécutez :

```bash
docker build -t mcp-selenium-agent .
```

**Étape 2 : Lancer le Conteneur Docker**

```bash
docker run -p 3000:3000 -p 8501:8501 mcp-selenium-agent
```

*   Le serveur `mcp-selenium` sera accessible sur le port `3000`.
*   L'interface de chat de l'agent sera accessible sur `http://localhost:8501`.

## 5. Intégration avec n8n

Ce projet est conçu pour s'intégrer parfaitement avec n8n.

1.  **Importez le Workflow** : Importez le fichier `selenium_workflow.json` dans votre instance n8n.
2.  **Configurez le Modèle de Chat** : Dans le nœud "Google Gemini Chat Model", ajoutez vos identifiants d'API.
3.  **Configurez le Client MCP** : Assurez-vous que le nœud "MCP Client" pointe vers l'URL de votre serveur `mcp-selenium` (par défaut, `http://127.0.0.1:3000`).
4.  **Activez le Workflow** : Vous pouvez maintenant interagir avec l'agent directement depuis l'interface de chat de n8n.

## 6. Comment Ajouter un Nouvel Outil (Tool)

Ajouter un nouvel outil est un excellent moyen d'étendre les capacités de l'agent. Voici comment faire :

**Étape 1 : Définir la Logique de l'Outil dans `http-server.js`**

Ouvrez le fichier `mcp-selenium/http-server.js`. Dans l'objet `tools`, ajoutez une nouvelle fonction asynchrone.

**Exemple : Ajout d'un outil `get_current_url`**

```javascript
// Dans l'objet 'tools'
const tools = {
    // ... autres outils
    
    get_current_url: async (params = {}) => {
        try {
            const driver = getDriver();
            const currentUrl = await driver.getCurrentUrl();
            console.log(`✅ URL actuelle récupérée: ${currentUrl}`);
            return `L'URL actuelle est : ${currentUrl}`;
        } catch (e) {
            console.error(`❌ Erreur lors de la récupération de l'URL:`, e);
            throw new Error(`Échec de la récupération de l'URL : ${e.message}`);
        }
    },

    // ... autres outils
};
```

**Étape 2 : Ajouter le Schéma de l'Outil (pour la validation)**

Pour que l'agent comprenne les paramètres de votre nouvel outil, ajoutez son schéma dans les fonctions `getRequiredFields` et `getToolSchema`.

Dans `getRequiredFields`:
```javascript
function getRequiredFields(toolName) {
    const requiredFields = {
        // ... autres outils
        get_current_url: [] // Pas de paramètres requis
    };
    return requiredFields[toolName] || [];
}
```

Dans `getToolSchema`:
```javascript
function getToolSchema(toolName) {
    const schemas = {
        // ... autres outils
        get_current_url: {
            // Pas de propriétés car pas de paramètres
        }
    };
    return schemas[toolName] || {};
}
```

**Étape 3 : Redémarrer le Serveur**

Après avoir ajouté le code, redémarrez le serveur `mcp-selenium` pour que les modifications prennent effet.

**C'est tout !** L'agent LangChain découvrira automatiquement le nouvel outil au démarrage et pourra l'utiliser. Vous pouvez maintenant demander à l'agent : "Quelle est l'URL actuelle de la page ?".

## 7. Description Détaillée des Outils Disponibles

Ce serveur expose un total de 15 outils pour une automatisation web complète. Voici la liste détaillée de chaque outil et de ses paramètres.

### Gestion du Navigateur

**`start_browser`**
Lance une nouvelle session de navigateur.
-   `browser` (requis): Le navigateur à lancer. Actuellement configuré pour forcer `firefox`.
-   `options` (optionnel): Objet pour configurer le navigateur (ex: `{ "headless": true }`).

**`navigate`**
Navigue vers une URL spécifique.
-   `url` (requis): L'URL complète de la page à visiter.

**`close_session`**
Ferme la session actuelle du navigateur et nettoie les ressources.

### Lecture de la Page

**`get_page_source`**
Récupère le code source HTML complet de la page actuelle. Idéal pour l'analyse de la structure de la page.

**`get_element_text`**
Récupère le texte visible d'un élément spécifique.
-   `by` (requis): Stratégie de localisation (`id`, `css`, `xpath`, `name`, `class`, `tag`).
-   `value` (requis): La valeur du sélecteur.
-   `timeout` (optionnel): Temps d'attente en millisecondes (défaut: 10000).

**`take_screenshot`**
Prend une capture d'écran de la page visible.
-   `outputPath` (optionnel): Chemin pour sauvegarder l'image. Si non fourni, l'image est retournée en base64.

### Interaction avec les Éléments

**`find_element`**
Vérifie l'existence d'un élément sur la page.
-   `by` (requis): Stratégie de localisation.
-   `value` (requis): Valeur du sélecteur.
-   `timeout` (optionnel): Temps d'attente.

**`click_element`**
Clique sur un élément.
-   `by` (requis): Stratégie de localisation.
-   `value` (requis): Valeur du sélecteur.
-   `timeout` (optionnel): Temps d'attente.

**`send_keys`**
Écrit du texte dans un champ de saisie.
-   `by` (requis): Stratégie de localisation.
-   `value` (requis): Valeur du sélecteur.
-   `text` (requis): Le texte à écrire.
-   `timeout` (optionnel): Temps d'attente.

**`upload_file`**
Télécharge un fichier via un champ de type `input file`.
-   `by` (requis): Stratégie de localisation.
-   `value` (requis): Valeur du sélecteur.
-   `filePath` (requis): Le chemin absolu du fichier à télécharger.
-   `timeout` (optionnel): Temps d'attente.

### Interactions Avancées (Souris et Clavier)

**`hover`**
Passe la souris sur un élément (utile pour les menus déroulants).
-   `by` (requis): Stratégie de localisation.
-   `value` (requis): Valeur du sélecteur.

**`drag_and_drop`**
Glisse un élément et le dépose sur un autre.
-   `by` (requis): Stratégie de localisation de l'élément source.
-   `value` (requis): Valeur du sélecteur source.
-   `targetBy` (requis): Stratégie de localisation de l'élément cible.
-   `targetValue` (requis): Valeur du sélecteur cible.

**`double_click`**
Effectue un double-clic sur un élément.
-   `by` (requis): Stratégie de localisation.
-   `value` (requis): Valeur du sélecteur.

**`right_click`**
Effectue un clic droit sur un élément.
-   `by` (requis): Stratégie de localisation.
-   `value` (requis): Valeur du sélecteur.

**`press_key`**
Simule l'appui sur une touche du clavier (ex: 'Enter', 'Tab').
-   `key` (requis): La touche à presser.

## 8. Explication Détaillée des Fichiers du Projet

### `langchain-agent/`
*   **`app.py`** : Le point d'entrée de l'application Streamlit. Gère l'interface de chat et les interactions avec l'utilisateur.
*   **`requirements.txt`** : Liste les dépendances Python nécessaires pour l'agent.
*   **`src/agent/executor.py`** : Le cœur de l'agent. C'est ici que le modèle de langage, les outils et la mémoire sont assemblés pour créer l'exécuteur de l'agent.
*   **`src/tools/mcp_tools.py`** : Ce script est responsable de la communication avec le serveur `mcp-selenium`. Il récupère la liste des outils disponibles et crée une classe `MCPTool` qui sait comment appeler le serveur.
*   **`src/prompts/prompt.py`** : Contient le "prompt" ou les instructions initiales données à l'agent. C'est un élément crucial qui guide le comportement de l'agent.

### `mcp-selenium/`
*   **`http-server.js`** : Le fichier principal du serveur. Il crée un serveur Express, définit tous les outils disponibles, et gère les requêtes entrantes de l'agent.
*   **`package.json`** : Définit les métadonnées du projet Node.js et liste ses dépendances, comme `express` et `selenium-webdriver`.
*   **`session.json`** : Un fichier simple pour stocker l'ID de la session de navigateur active, permettant la persistance.

### Fichiers à la Racine
*   **`Dockerfile`** : Un fichier de configuration pour construire une image Docker du projet. Il gère l'installation de Node.js, Python, Firefox, et toutes les dépendances nécessaires.
*   **`start.sh`** : Un script shell utilisé par Docker pour démarrer les deux services (`mcp-selenium` et `langchain-agent`) dans le bon ordre.
*   **`selenium_workflow.json`** : Le workflow n8n pré-construit qui peut être importé pour une intégration rapide.

## 8. Conclusion

Ce projet offre une base solide et flexible pour l'automatisation de navigateurs web via l'IA. En comprenant son architecture et en sachant comment étendre ses fonctionnalités, vous pouvez l'adapter à une multitude de cas d'utilisation.
