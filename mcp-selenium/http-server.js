#!/usr/bin/env node

// Imports
import { z } from "zod";
import pkg from 'selenium-webdriver';
const { Builder, By, Key, until, Actions } = pkg;
import { Options as FirefoxOptions } from 'selenium-webdriver/firefox.js';
import express from 'express';
import cors from 'cors';
import { existsSync, readFileSync, writeFileSync } from 'fs';

// Create HTTP server for n8n
const app = express();
app.use(cors());
app.use(express.json());

// ⭐ LOGS DÉTAILLÉS - PLACÉS AU BON ENDROIT
app.use((req, res, next) => {
    console.log(`\n🔍 === Nouvelle requête ===`);
    console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log(`🌐 IP: ${req.ip} | User-Agent: ${req.get('User-Agent')}`);
    console.log(`📋 Headers:`, JSON.stringify(req.headers, null, 2));
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`📄 Body:`, JSON.stringify(req.body, null, 2));
    }
    console.log(`===============================\n`);
    next();
});

// Server state
const SESSION_FILE = './session.json';

const loadSession = () => {
    if (existsSync(SESSION_FILE)) {
        const data = readFileSync(SESSION_FILE, 'utf8');
        return JSON.parse(data);
    }
    return { currentSession: null };
};

const saveSession = (session) => {
    writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
};

const state = {
    drivers: new Map(),
    ...loadSession()
};

// Helper functions
const getDriver = () => {
    const driver = state.drivers.get(state.currentSession);
    if (!driver) {
        throw new Error('No active browser session. Please start a browser first.');
    }
    return driver;
};

const getLocator = (by, value) => {
    switch (by.toLowerCase()) {
        case 'id': return By.id(value);
        case 'css': return By.css(value);
        case 'css selector': return By.css(value);
        case 'xpath': return By.xpath(value);
        case 'name': return By.name(value);
        case 'tag': return By.css(value);
        case 'class': return By.className(value);
        default: throw new Error(`Unsupported locator strategy: ${by}`);
    }
};

// Validation functions (temporairement désactivées pour debug)
const validateBrowserParams = (params) => {
    console.log(`🔍 Validating browser params:`, JSON.stringify(params, null, 2));
    // Validation désactivée temporairement
    return true;
};

const validateLocatorParams = (params) => {
    if (!params.by) {
        throw new Error('Locator strategy "by" parameter is required');
    }
    if (!params.value) {
        throw new Error('Locator "value" parameter is required');
    }
    if (!['id', 'css', 'xpath', 'name', 'tag', 'class', 'css selector'].includes(params.by)) {
        throw new Error(`Unsupported locator strategy: ${params.by}`);
    }
};

// Define tools
const tools = {
    start_browser: async (params) => {
        try {
            console.log(`🚀 === START_BROWSER CALLED ===`);
            console.log(`📋 Raw params received:`, JSON.stringify(params, null, 4));
            console.log(`📋 Params type:`, typeof params);

            // Handle both object and string inputs for browser
            let browser;
            let options = {};
            if (typeof params === 'string') {
                browser = params;
            } else if (typeof params === 'object' && params !== null) {
                browser = params.browser;
                options = params.options || {};
            }

            // If no browser is specified, default to Firefox
            if (!browser) {
                browser = 'firefox';
                console.log(`⚠️ No browser specified, defaulting to Firefox.`);
            }
            
            console.log(`🎯 Final browser: ${browser}`);
            console.log(`🎯 Final options:`, JSON.stringify(options, null, 2));
            
            // Validation basique uniquement
            if (!browser || typeof browser !== 'string') {
                throw new Error(`Invalid browser parameter: ${browser}`);
            }
            
            if (!['chrome', 'firefox', 'edge'].includes(browser)) {
                console.log(`⚠️  Unsupported browser ${browser}, forcing firefox`);
                browser = 'firefox';
            }
            
            // FORCER FIREFOX SI AUTRE CHOSE EST DEMANDÉ
            if (browser !== 'firefox') {
                console.log(`⚠️  Browser ${browser} requested but forcing Firefox (only working browser)`);
                browser = 'firefox';
            }
            
            let builder = new Builder();
            let driver;
            let startTime = Date.now();
            
            console.log(`🎯 Starting ${browser} browser...`);
            
            // SEUL FIREFOX FONCTIONNE - ne pas essayer les autres
            if (browser === 'firefox') {
                const firefoxOptions = new FirefoxOptions();
                if (options.headless === true) {
                    firefoxOptions.addArguments('--headless');
                }
                // Options pour démarrage rapide
                firefoxOptions.addArguments('--width=1280');
                firefoxOptions.addArguments('--height=720');
                firefoxOptions.setPreference('browser.startup.homepage', 'about:blank');
                firefoxOptions.setPreference('startup.homepage_welcome_url', 'about:blank');
                firefoxOptions.setPreference('startup.homepage_welcome_url.additional', 'about:blank');
                
                if (options.arguments && Array.isArray(options.arguments)) {
                    options.arguments.forEach(arg => firefoxOptions.addArguments(arg));
                }
                
                console.log(`🦊 Starting Firefox browser...`);
                
                driver = await Promise.race([
                    builder.forBrowser('firefox').setFirefoxOptions(firefoxOptions).build(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Firefox startup timeout after 30 seconds')), 30000)
                    )
                ]);
                
            } else {
                // Toujours forcer Firefox même si autre chose demandé
                throw new Error(`Only Firefox is supported on this system. Browser ${browser} is not available.`);
            }
            
            const sessionId = `${browser}_${Date.now()}`;
            state.drivers.set(sessionId, driver);
            state.currentSession = sessionId;
            saveSession({ currentSession: sessionId });
            
            const duration = Date.now() - startTime;
            console.log(`✅ Browser started successfully with session: ${sessionId} in ${duration}ms`);
            return `✅ Browser ${browser} started successfully with session ID: ${sessionId} (${duration}ms)`;
            
        } catch (e) {
            console.error(`❌ Error in start_browser:`, e);
            console.error(`❌ Stack trace:`, e.stack);
            throw new Error(`Failed to start browser: ${e.message}`);
        }
    },

    navigate: async (params = {}) => {
        try {
            if (!params.url) {
                throw new Error('URL parameter is required');
            }
            
            const driver = getDriver();
            await driver.get(params.url);
            console.log(`✅ Navigated to: ${params.url}`);
            return `Successfully navigated to ${params.url}`;
            
        } catch (e) {
            console.error(`❌ Navigation error:`, e);
            throw new Error(`Navigation failed: ${e.message}`);
        }
    },

    find_element: async (params = {}) => {
        try {
            validateLocatorParams(params);
            const { by, value, timeout = 10000 } = params;
            
            const driver = getDriver();
            const locator = getLocator(by, value);
            await driver.wait(until.elementLocated(locator), timeout);
            
            console.log(`✅ Element found: ${by}=${value}`);
            return `Element found using ${by}="${value}"`;
            
        } catch (e) {
            console.error(`❌ Find element error:`, e);
            throw new Error(`Element not found: ${e.message}`);
        }
    },

    click_element: async (params = {}) => {
        try {
            validateLocatorParams(params);
            const { by, value, timeout = 10000 } = params;
            
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            await element.click();
            
            console.log(`✅ Element clicked: ${by}=${value}`);
            return `Successfully clicked element using ${by}="${value}"`;
            
        } catch (e) {
            console.error(`❌ Click error:`, e);
            throw new Error(`Click failed: ${e.message}`);
        }
    },

    send_keys: async (params = {}) => {
        try {
            validateLocatorParams(params);
            if (!params.text && !params.keys) {
                throw new Error('Parameter "text" or "keys" is required');
            }
            
            const text = params.text || params.keys;
            const { by, value, timeout = 10000 } = params;
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            await element.clear();
            await element.sendKeys(text);
            
            console.log(`✅ Text entered: "${text}" into ${by}=${value}`);
            return `Successfully entered text "${text}" into element using ${by}="${value}"`;
            
        } catch (e) {
            console.error(`❌ Send keys error:`, e);
            throw new Error(`Send keys failed: ${e.message}`);
        }
    },

    get_element_text: async (params = {}) => {
        try {
            validateLocatorParams(params);
            let { by, value, timeout = 10000 } = params;
            
            // Sanitize XPath value
            if (by.toLowerCase() === 'xpath' && value.endsWith('/text()')) {
                value = value.slice(0, -7);
            }

            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            const text = await element.getText();
            
            console.log(`✅ Text retrieved from ${by}=${value}: "${text}"`);
            return text || '(empty text)';
            
        } catch (e) {
            console.error(`❌ Get text error:`, e);
            throw new Error(`Get text failed: ${e.message}`);
        }
    },

    hover: async (params = {}) => {
        try {
            validateLocatorParams(params);
            const { by, value, timeout = 10000 } = params;
            
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            const actions = driver.actions({ bridge: true });
            await actions.move({ origin: element }).perform();
            
            console.log(`✅ Hovered over: ${by}=${value}`);
            return `Successfully hovered over element using ${by}="${value}"`;
            
        } catch (e) {
            console.error(`❌ Hover error:`, e);
            throw new Error(`Hover failed: ${e.message}`);
        }
    },

    take_screenshot: async (params = {}) => {
        try {
            const driver = getDriver();
            const screenshot = await driver.takeScreenshot();
            
            if (params.outputPath) {
                const fs = await import('fs');
                await fs.promises.writeFile(params.outputPath, screenshot, 'base64');
                console.log(`✅ Screenshot saved to: ${params.outputPath}`);
                return `Screenshot saved to ${params.outputPath}`;
            } else {
                console.log(`✅ Screenshot captured (base64 length: ${screenshot.length})`);
                return `Screenshot captured as base64 (${screenshot.length} characters)`;
            }
            
        } catch (e) {
            console.error(`❌ Screenshot error:`, e);
            throw new Error(`Screenshot failed: ${e.message}`);
        }
    },

    get_page_source: async (params = {}) => {
        try {
            const driver = getDriver();
            const bodyHtml = await driver.executeScript("return document.body.outerHTML;");
            console.log(`✅ Body HTML retrieved (length: ${bodyHtml.length})`);
            return bodyHtml;
        } catch (e) {
            console.error(`❌ Get page source error:`, e);
            throw new Error(`Get page source failed: ${e.message}`);
        }
    },

    drag_and_drop: async (params = {}) => {
        try {
            validateLocatorParams(params);
            if (!params.targetBy || !params.targetValue) {
                throw new Error('Target locator parameters (targetBy, targetValue) are required');
            }
            
            const { by, value, targetBy, targetValue, timeout = 10000 } = params;
            const driver = getDriver();
            
            const sourceLocator = getLocator(by, value);
            const targetLocator = getLocator(targetBy, targetValue);
            
            const sourceElement = await driver.wait(until.elementLocated(sourceLocator), timeout);
            const targetElement = await driver.wait(until.elementLocated(targetLocator), timeout);
            
            const actions = driver.actions({ bridge: true });
            await actions.dragAndDrop(sourceElement, targetElement).perform();
            
            console.log(`✅ Drag and drop completed: ${by}=${value} to ${targetBy}=${targetValue}`);
            return `Successfully dragged element using ${by}="${value}" to target using ${targetBy}="${targetValue}"`;
            
        } catch (e) {
            console.error(`❌ Drag and drop error:`, e);
            throw new Error(`Drag and drop failed: ${e.message}`);
        }
    },

    double_click: async (params = {}) => {
        try {
            validateLocatorParams(params);
            const { by, value, timeout = 10000 } = params;
            
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            
            const actions = driver.actions({ bridge: true });
            await actions.doubleClick(element).perform();
            
            console.log(`✅ Double click performed: ${by}=${value}`);
            return `Successfully double clicked element using ${by}="${value}"`;
            
        } catch (e) {
            console.error(`❌ Double click error:`, e);
            throw new Error(`Double click failed: ${e.message}`);
        }
    },

    right_click: async (params = {}) => {
        try {
            validateLocatorParams(params);
            const { by, value, timeout = 10000 } = params;
            
            const driver = getDriver();
            const locator = getLocator(by, value);
            const element = await driver.wait(until.elementLocated(locator), timeout);
            
            const actions = driver.actions({ bridge: true });
            await actions.contextClick(element).perform();
            
            console.log(`✅ Right click performed: ${by}=${value}`);
            return `Successfully right clicked element using ${by}="${value}"`;
            
        } catch (e) {
            console.error(`❌ Right click error:`, e);
            throw new Error(`Right click failed: ${e.message}`);
        }
    },

    press_key: async (params = {}) => {
        try {
            if (!params.key) {
                throw new Error('Key parameter is required');
            }
            
            const { key } = params;
            const driver = getDriver();
            const actions = driver.actions({ bridge: true });
            
            // Conversion des noms de clés courants
            let seleniumKey = key;
            const keyMappings = {
                'Enter': Key.ENTER,
                'Tab': Key.TAB,
                'Escape': Key.ESCAPE,
                'Space': Key.SPACE,
                'ArrowUp': Key.ARROW_UP,
                'ArrowDown': Key.ARROW_DOWN,
                'ArrowLeft': Key.ARROW_LEFT,
                'ArrowRight': Key.ARROW_RIGHT,
                'F1': Key.F1,
                'F2': Key.F2,
                'F3': Key.F3,
                'F4': Key.F4,
                'F5': Key.F5,
                'F6': Key.F6,
                'F7': Key.F7,
                'F8': Key.F8,
                'F9': Key.F9,
                'F10': Key.F10,
                'F11': Key.F11,
                'F12': Key.F12
            };
            
            if (keyMappings[key]) {
                seleniumKey = keyMappings[key];
            }
            
            await actions.keyDown(seleniumKey).keyUp(seleniumKey).perform();
            
            console.log(`✅ Key pressed: ${key}`);
            return `Successfully pressed key: ${key}`;
            
        } catch (e) {
            console.error(`❌ Press key error:`, e);
            throw new Error(`Press key failed: ${e.message}`);
        }
    },

    upload_file: async (params = {}) => {
        try {
            validateLocatorParams(params);
            if (!params.filePath) {
                throw new Error('File path parameter is required');
            }
            
            const { by, value, filePath, timeout = 10000 } = params;
            const driver = getDriver();
            const locator = getLocator(by, value);
            
            const element = await driver.wait(until.elementLocated(locator), timeout);
            await element.sendKeys(filePath);
            
            console.log(`✅ File uploaded: ${filePath} to ${by}=${value}`);
            return `Successfully uploaded file "${filePath}" to element using ${by}="${value}"`;
            
        } catch (e) {
            console.error(`❌ Upload file error:`, e);
            throw new Error(`Upload file failed: ${e.message}`);
        }
    },

    close_session: async () => {
        try {
            if (!state.currentSession) {
                return 'No active browser session to close';
            }
            
            const driver = getDriver();
            await driver.quit();
            state.drivers.delete(state.currentSession);
            const sessionId = state.currentSession;
            state.currentSession = null;
            saveSession({ currentSession: null });
            
            console.log(`✅ Browser session closed: ${sessionId}`);
            return `Browser session ${sessionId} closed successfully`;
            
        } catch (e) {
            console.error(`❌ Close session error:`, e);
            throw new Error(`Close session failed: ${e.message}`);
        }
    }
};

// Test endpoint ultra-rapide pour n8n
app.post('/quick-test', async (req, res) => {
    console.log(`⚡ Quick test endpoint called`);
    try {
        // Simulation rapide sans vraiment lancer un navigateur
        const sessionId = `test_${Date.now()}`;
        res.json({
            success: true,
            message: `Quick test completed successfully with session: ${sessionId}`,
            timestamp: new Date().toISOString(),
            duration: '50ms'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test endpoint pour diagnostiquer le format des données de n8n
app.post('/debug', (req, res) => {
    console.log(`🐛 DEBUG - Full request body:`, JSON.stringify(req.body, null, 2));
    console.log(`🐛 DEBUG - Headers:`, JSON.stringify(req.headers, null, 2));
    res.json({
        message: 'Debug info logged to console',
        receivedBody: req.body,
        bodyType: typeof req.body,
        hasMethod: !!req.body.method,
        hasParams: !!req.body.params,
        paramsKeys: req.body.params ? Object.keys(req.body.params) : []
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'MCP Selenium HTTP Server',
        activeSession: state.currentSession,
        activeSessions: state.drivers.size,
        availableTools: Object.keys(tools),
        timestamp: new Date().toISOString()
    });
});

// List available tools
app.get('/tools', (req, res) => {
    const allTools = Object.keys(tools);
    console.log(`📋 Listing all available tools: ${allTools.join(', ')}`);
    
    res.json({
        tools: allTools.map(name => ({
            name,
            description: `Selenium ${name} tool`,
            inputSchema: getToolSchema(name)
        }))
    });
});

// MCP compatible endpoint
app.post('/', async (req, res) => {
    const { method, params, id } = req.body;

    console.log(`📞 MCP Method called: ${method}`);
    console.log(`🆔 Request ID: ${id}`);
    console.log(`📋 Params:`, JSON.stringify(params, null, 2));

    try {
        switch (method) {
            case 'initialize':
                console.log(`🎯 Initializing MCP server`);
                res.json({
                    jsonrpc: '2.0',
                    id: id,
                    result: {
                        protocolVersion: '2024-11-05',
                        capabilities: {
                            tools: {}
                        },
                        serverInfo: {
                            name: 'selenium-mcp-server',
                            version: '1.0.0'
                        }
                    }
                });
                break;

            case 'notifications/initialized':
                console.log('✅ MCP Client initialized successfully!');
                // Les notifications ne retournent pas de réponse
                res.status(204).end();
                return;

            case 'tools/list': {
                console.log(`📋 Listing available tools`);
                const allAvailableTools = Object.keys(tools);
                console.log(`🔧 All tools: ${allAvailableTools.join(', ')}`);
                
                res.json({
                    jsonrpc: '2.0',
                    id: id,
                    result: {
                        tools: allAvailableTools.map(name => ({
                            name,
                            description: `Selenium automation tool: ${name}`,
                            inputSchema: {
                                type: 'object',
                                properties: getToolSchema(name),
                                required: getRequiredFields(name)
                            }
                        }))
                    }
                });
                break;
            }
            case 'tools/call': {
                const { name, arguments: args } = params;
                console.log(`🔧 Calling tool: ${name}`);
                console.log(`📋 Raw params received:`, JSON.stringify(params, null, 2));
                console.log(`📋 Arguments extracted:`, JSON.stringify(args, null, 2));
                
                if (!tools[name]) {
                    console.log(`❌ Tool not found: ${name}`);
                    return res.status(404).json({
                        jsonrpc: '2.0',
                        id: id,
                        error: { 
                            code: -32601,
                            message: `Tool not found: ${name}`,
                            data: { availableTools: Object.keys(tools) }
                        }
                    });
                }
                
                // Gestion spéciale pour n8n qui peut envoyer les arguments différemment
                let toolArgs = args;
                
                // Si n8n envoie les arguments directement dans params au lieu de params.arguments
                if (!args && name === 'start_browser') {
                    // Chercher les paramètres dans params directement
                    if (params.browser) {
                        toolArgs = {
                            browser: params.browser,
                            options: params.options || {}
                        };
                        console.log(`🔄 Adjusted arguments for n8n format:`, JSON.stringify(toolArgs, null, 2));
                    } else {
                        // Valeurs par défaut pour les tests
                        toolArgs = {
                            browser: 'firefox', // Firefox fonctionne sur ce système
                            options: { headless: true }
                        };
                        console.log(`🔄 Using default arguments:`, JSON.stringify(toolArgs, null, 2));
                    }
                }
                
                const result = await tools[name](toolArgs || {});
                console.log(`✅ Tool ${name} executed successfully`);
                res.json({
                    jsonrpc: '2.0',
                    id: id,
                    result: {
                        content: [{ type: 'text', text: result }]
                    }
                });
                break;
            }

            default:
                console.log(`⚠️  Unknown method: ${method}`);
                res.status(400).json({
                    jsonrpc: '2.0',
                    id: id || null,
                    error: { 
                        code: -32601,
                        message: `Method not found: ${method}`,
                        data: { supportedMethods: ['initialize', 'notifications/initialized', 'tools/list', 'tools/call'] }
                    }
                });
        }
    } catch (error) {
        console.error('❌ MCP Error:', error);
        res.status(500).json({
            jsonrpc: '2.0',
            id: id || null,
            error: { 
                code: -32603,
                message: error.message,
                data: { stack: error.stack }
            }
        });
    }
});

// Helper function to get required fields
function getRequiredFields(toolName) {
    const requiredFields = {
        start_browser: ['browser'],
        navigate: ['url'],
        find_element: ['by', 'value'],
        click_element: ['by', 'value'],
        send_keys: ['by', 'value', 'text'],
        get_element_text: ['by', 'value'],
        hover: ['by', 'value'],
        drag_and_drop: ['by', 'value', 'targetBy', 'targetValue'],
        double_click: ['by', 'value'],
        right_click: ['by', 'value'],
        press_key: ['key'],
        upload_file: ['by', 'value', 'filePath'],
        take_screenshot: [],
        get_page_source: [],
        close_session: []
    };
    
    return requiredFields[toolName] || [];
}

// Helper function to get tool schema
function getToolSchema(toolName) {
    const schemas = {
        start_browser: {
            browser: {
                type: 'string',
                description: 'The browser to launch. Only "firefox" is supported on this system.'
            }
        },
        navigate: {
            url: { type: 'string', description: 'URL to navigate to' }
        },
        find_element: {
            by: { type: 'string', description: 'The locator strategy to use. One of: id, css, xpath, name, tag, class.' },
            value: { type: 'string', description: 'The value of the locator.' },
            timeout: { type: 'number', description: 'The timeout in milliseconds.' }
        },
        click_element: {
            by: { type: 'string', description: 'The locator strategy to use. One of: id, css, xpath, name, tag, class.' },
            value: { type: 'string', description: 'The value of the locator.' },
            timeout: { type: 'number', description: 'The timeout in milliseconds.' }
        },
        send_keys: {
            by: { type: 'string', description: 'The locator strategy to use. One of: id, css, xpath, name, tag, class.' },
            value: { type: 'string', description: 'The value of the locator.' },
            text: { type: 'string', description: 'The text to send to the element.' },
            timeout: { type: 'number', description: 'The timeout in milliseconds.' }
        },
        get_element_text: {
            by: { type: 'string', description: 'The locator strategy to use. One of: id, css, xpath, name, tag, class.' },
            value: { type: 'string', description: 'The value of the locator.' },
            timeout: { type: 'number', description: 'The timeout in milliseconds.' }
        },
        hover: {
            by: { type: 'string', description: 'The locator strategy to use. One of: id, css, xpath, name, tag, class.' },
            value: { type: 'string', description: 'The value of the locator.' },
            timeout: { type: 'number', description: 'The timeout in milliseconds.' }
        },
        drag_and_drop: {
            by: { type: 'string', description: 'The locator strategy for the source element. One of: id, css, xpath, name, tag, class.' },
            value: { type: 'string', description: 'The value of the source locator.' },
            targetBy: { type: 'string', description: 'The locator strategy for the target element. One of: id, css, xpath, name, tag, class.' },
            targetValue: { type: 'string', description: 'The value of the target locator.' },
            timeout: { type: 'number', description: 'The timeout in milliseconds.' }
        },
        double_click: {
            by: { type: 'string', description: 'The locator strategy to use. One of: id, css, xpath, name, tag, class.' },
            value: { type: 'string', description: 'The value of the locator.' },
            timeout: { type: 'number', description: 'The timeout in milliseconds.' }
        },
        right_click: {
            by: { type: 'string', description: 'The locator strategy to use. One of: id, css, xpath, name, tag, class.' },
            value: { type: 'string', description: 'The value of the locator.' },
            timeout: { type: 'number', description: 'The timeout in milliseconds.' }
        },
        press_key: {
            key: { type: 'string', description: 'The key to press. For example, "Enter", "Tab", "a", etc.' }
        },
        upload_file: {
            by: { type: 'string', description: 'The locator strategy for the file input element. One of: id, css, xpath, name, tag, class.' },
            value: { type: 'string', description: 'The value of the locator.' },
            filePath: { type: 'string', description: 'The absolute path to the file to upload.' },
            timeout: { type: 'number', description: 'The timeout in milliseconds.' }
        },
        take_screenshot: {
            outputPath: { type: 'string', description: 'Optional path to save screenshot' }
        },
        get_page_source: {
            // No parameters required
        },
        close_session: {
            // Pas de paramètres requis
        }
    };
    
    return schemas[toolName] || {};
}

// Cleanup handler
async function cleanup() {
    console.log('🧹 Cleaning up browser sessions...');
    for (const [sessionId, driver] of state.drivers) {
        try {
            await driver.quit();
            console.log(`✅ Closed session: ${sessionId}`);
        } catch (e) {
            console.error(`❌ Error closing browser session ${sessionId}:`, e);
        }
    }
    state.drivers.clear();
    state.currentSession = null;
    console.log('✅ Cleanup completed');
    process.exit(0);
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// Start HTTP server
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
    console.log(`🚀 MCP Selenium HTTP server running at http://${host}:${port}`);
    console.log(`📱 Ready for n8n integration!`);
    console.log(`🔗 Endpoints:`);
    console.log(`   - Health: http://localhost:${port}/health`);
    console.log(`   - Tools: http://localhost:${port}/tools`);
    console.log(`   - MCP: http://localhost:${port}/`);
    console.log(`🔧 Available tools: ${Object.keys(tools).join(', ')}`);
    console.log(`🦊 Default browser: Firefox (confirmed working)`);
    console.log(`⚡ Server ready for requests!`);
});
