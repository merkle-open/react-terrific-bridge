import ReactDOM from "react-dom";

/**
 * Singleton container
 * @type {TerrificBridge|null}
 */
let TerrificBridgeInstance = null;

/**
 * Safe version to use NODE_ENV variable
 * @type {string}
 */
const NODE_ENV = process.env.NODE_ENV || "";

/**
 * The global id for the terrific bridge instance
 * @readonly
 * @type {string}
 */
export const TerrificBridgeGlobalAppId = "reactTerrificBridgeApp";

/**
 * Get the global react terrific bridge instance
 * @return {TerrificBridge|void}
 */
export const getGlobalApp = () => {
    return window[TerrificBridgeGlobalAppId];
};

// Simple non-operative method
const noop = () => {};

/**
 * Get a proxy console instance
 * @param {boolean} [false] debug 
 */
const getProxyConsole = (debug = false) => ({
    log: debug ? noop : global.console.log.bind(global) || noop,
    group: debug ? noop : global.console.groupCollapsed.bind(global) || noop,
    groupEnd: debug ? noop : global.console.groupEnd.bind(global) || noop
});

/**
 * Terrific application handler for React
 * @uses Terrific
 * @class TerrificBridge
 * @author Jan Biasi <biasijan@gmail.com>
 * @type {TerrificBridge}
 */
export class TerrificBridge {
    _queue = {};
    _config = {};
    _app = void 0;
    _processed = false;
    _t = void 0;
    _proxyConsole = getProxyConsole();

    /**
     * Instanciates the Bridge
     * @param  {boolean} [debug=false]      Set debug mode
     * @return {TerrificBridge}
     */
    constructor(debug = false) {
        if (!TerrificBridgeInstance) {
            TerrificBridgeInstance = this;
        }

        this._t = window.T;
        this._config.debug = debug ? true : false;
        this._queue = {
            update: [],
            register: [],
            unregister: []
        };

        if (this._config.debug) {
            this._proxyConsole = getProxyConsole(true);
        }

        return TerrificBridgeInstance;
    }

    get logger() {
        return this._proxyConsole;
    }

    /**
     * Get the application instance
     * @return {Object}
     */
    get app() {
        return this._app;
    }

    /**
     * Get the configuration factory
     * @return {Object}
     */
    get config() {
        return this._config;
    }

    /**
     * Get the Terrific framework ref
     * @return {Object}
     */
    get terrific() {
        return this._t || window.T || void 0;
    }

    /**
     * Configure the TerrificBridge
     * @param  {Object} [config={}]     Configuration factory
     */
    configure(config = {}) {
        const self = this;

        for (let key in config) {
            if (config.hasOwnProperty(key)) {
                self._config[key] = config[key];

                if (key === "debug" && config[key]) {
                    window[TerrificBridgeGlobalAppId] = self.app;
                }
            }
        }
    }

    /**
     * Load all components in e.g. App.start with an optional config
     * @param  {Object} [config]        Optional configuration
     */
    load(config = {}) {
        if (!window.T || !window.T.Application) {
            throw new Error(
                `Terrific is not available in your environement, make sure ` +
                    `that the terrific.js is loaded before your React Application.`
            );
        }

        this.configure(config);
        this._app = new window.T.Application();

        try {
            this._queue.register.forEach(fn => fn());
            this._queue.unregister.forEach(fn => fn());
        } catch (e) {
            throw new Error(`Bootstrapping terrific application failed: ${e.message || e || "Unknown Error"}`);
        }

        this._processed = true;

        if (this._config.debug) {
            window[TerrificBridgeGlobalAppId] = this._app;
        }
    }

    /**
     * Resets the current state of the Terrific Bridge,
     * flush all register hooks and data.
     */
    reset() {
        this._config = {};
        this._debug = false;
        this._app = void 0;
        this._processed = false;
        this._queue = {
            update: [],
            register: [],
            unregister: []
        };

        window[TerrificBridgeGlobalAppId] = void 0;
    }

    /**
     * Get a component by its ID
     * @param  {number} id          The components ID
     * @return {Object|void}
     */
    getComponentById(id) {
        if (isNaN(id)) {
            return void 0;
        }

        try {
            return this._app.getModuleById(id);
        } catch (err) {
            return void 0;
        }
    }

    /**
     * Register a Component by its React Class
     * @param  {Component<*,*,*>} component     React component class
     * @param  {Object} [factory]               Action fn factory for bidirectional communication
     * @return {Object|void}
     */
    registerComponent(component, compositeFactory = {}) {
        const bridge = this;

        const register = () => {
            const node = ReactDOM.findDOMNode(component);

            if (!node) {
                // No valid node was found or React component
                // was not rendered before.
                return void 0;
            }

            const name = node.getAttribute("data-t-name");
            const decoratorAnnotation = node.getAttribute("data-t-decorator");
            const decorator = typeof decoratorAnnotation === "string" ? [decoratorAnnotation] : void 0;

            if (node.getAttribute("data-t-id")) {
                return void 0;
            }

            this.logger.group(`Register ${name}`);
            const tModule = this._app.registerModule(node, name, decorator);
            this.logger.log("Registering Module %s%s on node", name, decorator ? `#${decorator[0]}` : "", node);

            if (tModule) {
                tModule._bridge = bridge;
                tModule.actions = tModule.actions || {};

                /**
                 * Enable bidirectional communication
                 * @param {string} selector
                 * @param {Array<any>} {args=[]}
                 * @return {void}
                 */
                tModule.send = (selector, args = []) => {
                    const fn = compositeFactory[selector];
                    this.logger.log("React is receiving action '%s' from terrific", selector);

                    if (typeof fn === "function") {
                        try {
                            fn.apply(bridge, [...args]);
                            this.logger.log("Successfully registered component");
                        } catch (err) {
                            throw new Error(`TerrificBridge failed receiving action ${selector}: ${err.message}`);
                        }
                    }
                };

                this._app.start([tModule]);
            }

            this.logger.groupEnd(`Register ${name}`);
            return tModule;
        };

        return this._app ? register() : this._queue.register.push(register);
    }

    /**
     * Unregister a component by its React Class
     * @param  {Component} component            React Component class
     * @return {boolean}
     */
    unregisterComponent(component) {
        const bridge = this;

        const unregister = () => {
            const node = ReactDOM.findDOMNode(component);

            if (!node) {
                return void 0;
            }

            const id = node.getAttribute("data-t-id");
            const name = node.getAttribute("data-t-name");

            if (!id || id === null) {
                return void 0;
            }

            const tModule = this._app.getModuleById(id);
            this.logger.group(`Unregister ${name}#${id}`);
            this.logger.log("Unregistering terrific component #%s", id);

            try {
                tModule.stop.apply(tModule);
                tModule.send = () => {};

                this._app.unregisterModules([id]);
                node.removeAttribute("data-t-id");
                this.logger.log("Succesfully unregistered component #%s", id);

                return true;
            } catch (err) {
                throw new Error(`Unregistering component #${id} failed: ${err.message}`);
            }
        };

        return this._app ? unregister() : this._queue.unregister.push(unregister);
    }

    /**
     * Execute a remote action inside the terrific tModule instance
     * @param  {Component} component                React Component class
     * @param  {string} action                      Action to emit on target terrific tModule
     * @param  {*} args                             Arguments to send
     * @return {boolean|void}                       State
     */
    action(component, action, ...args) {
        const bridge = this;

        const update = () => {
            const node = ReactDOM.findDOMNode(component);
            const name = node.getAttribute("data-t-name");
            const id = parseInt(node.getAttribute("data-t-id"), 10);
            let updateSucceeded = false;

            action = action.replace(/\./g, "-");
            action = action.replace(/\//g, "-");

            if (action.indexOf("-") > -1) {
                action = action.replace(/-([a-z])/g, g => g[1].toUpperCase());
            }

            if (node && name && id > 0) {
                this.logger.group(`Send action ${action} to ${name}`);
                const tModule = this._app.getModuleById(id);
                this.logger.log(`Send action ${action} to component ${name}#${id}`);

                if (tModule && tModule.actions) {
                    if (typeof tModule.actions[action] === "function") {
                        tModule.actions[action].apply(tModule, [...args, component]);
                        updateSucceeded = true;
                    }
                }
            } else {
                this.logger.log(`Cannot send action to invalid component, Name or ID missing`);
            }

            if (!updateSucceeded) {
                this.logger.log(
                    `Action was not triggered successfully, maybe the action was not registered on <T>${name}`
                );
            }

            this.logger.groupEnd(`Send action ${action} to ${name}`);
            return updateSucceeded;
        };

        return this._app ? update() : this._queue.update.push(update);
    }
}

/**
 * The TerrificBridgeInstance is a singleton and
 * will be instanciated here.
 */
TerrificBridgeInstance = new TerrificBridge(!(NODE_ENV === "production"));

/**
 * Export the singleton as default tModule
 * @type {TerrificBridge}
 */
export default TerrificBridgeInstance;
