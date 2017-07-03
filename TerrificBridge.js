import ReactDOM from "react-dom";

let TerrificBridgeInstance = null;

/**
 * The global id for the terrific bridge instance
 * @readonly
 * @type {string}
 */
export const TerrificBridgeGlobalAppId = "reactTerrificBridgeApp";

/**
 * Debugging messages
 * @type {Object}
 */
const messages = {
    init: "Initialized new TerrificBridge instance",
    tryRegister: "Registering module %s%s on node",
    tryUnregister: "Unregistering terrific component #%s",
    unregisterSuccess: "Succesfully unregistered component #%s",
    unregisterFailed: "Unregistering component #%s failed: %s",
    sendAction: "Send action %s to component %s#%d",
    receiveActionFailed: "TerrificBridge failed receiving action %s: %s",
    getComponentFailed: "No Component found with id #%d"
};

/**
 * Get the global react terrific bridge instance
 * @return {TerrificBridge|void}
 */
export const getGlobalApp = () => {
    return window[TerrificBridgeGlobalAppId];
};

/**
 * Terrific application handler for React
 * @uses Terrific
 * @class TerrificBridge
 * @author Jan Biasi <jan.biasi@namics.com>
 * @type {TerrificBridge}
 */
export class TerrificBridge {
    _queue = {};
    _config = {};
    _debug = false;
    _app = void 0;
    _processed = false;
    _t = void 0;

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
            register: [],
            unregister: []
        };

        if (this._config.debug) {
            console.log(messages.init);
        }

        return TerrificBridgeInstance;
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
        return this._t;
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
                    window[TerrificBridgeGlobalAppId] = self._app;
                }
            }
        }
    }

    /**
     * Load all components in e.g. App.start with an optional config
     * @param  {Object} [config]        Optional configuration
     */
    load(config = {}) {
        this.configure(config);
        this._app = new window.T.Application();

        this._queue.register.forEach(fn => fn());
        this._queue.unregister.forEach(fn => fn());
        this._processed = true;

        if (this._debug) {
            window[TerrificBridgeGlobalAppId] = this._app;
        }
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
            console.warn(messages.getComponentFailed, id);
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
                return {};
            }

            const name = node.getAttribute("data-t-name");
            const decoratorAnnotation = node.getAttribute("data-t-decorator");
            const decorator = typeof decoratorAnnotation === "string" ? [decoratorAnnotation] : void 0;

            if (node.getAttribute("data-t-id")) {
                return {};
            }

            const module = this._app.registerModule(node, name, decorator);

            if (bridge._config.debug) {
                console.log(messages.tryRegister, name, decorator ? `#${decorator[0]}` : "", node);
            }

            if (module) {
                module._bridge = bridge;
                module.actions = module.actions || {};

                /**
                 * Enable bidirectional communication
                 * @param {string} selector
                 * @param {Array<any>} {args=[]}
                 * @return {void}
                 */
                module.send = (selector, args = []) => {
                    const fn = compositeFactory[selector];

                    if (typeof fn === "function") {
                        try {
                            fn.apply(bridge, [...args]);
                        } catch (err) {
                            console.console.error(messages.receiveActionFailed, selector, err.message);
                        }
                    }
                };

                this._app.start([module]);
            }

            return module;
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
            const id = node.getAttribute("data-t-id");
            const module = this._app.getModuleById(id);

            if (bridge._config.debug) {
                console.log(messages.tryUnregister, id);
            }

            try {
                module.stop.apply(module);
                module.send = () => {};

                this._app.unregisterModules([id]);
                node.removeAttribute("data-t-id");
                console.log(messages.unregisterSuccess, id);

                return true;
            } catch (err) {
                if (bridge._config.debug) {
                    console.error(messages.unregisterFailed, id, err.message);
                }

                return false;
            }
        };

        return this._app ? unregister() : this._queue.unregister.push(unregister);
    }

    /**
     * Execute a remote action inside the terrific module instance
     * @param  {Component} component                React Component class
     * @param  {string} action                      Action to emit on target terrific module
     * @param  {*} args                             Arguments to send
     * @return {boolean|void}                       State
     */
    action(component, action, ...args) {
        const bridge = this;

        const update = () => {
            const node = ReactDOM.findDOMNode(component);
            const name = node.getAttribute("data-t-name");
            const id = parseInt(node.getAttribute("data-t-id"), 10);

            action = action.replace(/\./g, "-");
            action = action.replace(/\//g, "-");

            if (action.indexOf("-") > -1) {
                action = action.replace(/-([a-z])/g, g => g[1].toUpperCase());
            }

            if (node && name && id > 0) {
                const module = this._app.getModuleById(id);

                if (bridge._config.debug) {
                    console.log(messages.sendAction, action, name, id);
                }

                if (module && module.actions) {
                    if (typeof module.actions[action] === "function") {
                        module.actions[action].apply(module, [...args, component]);
                        return true;
                    }
                }
            }

            return false;
        };

        return this._app ? update() : this._queue.update.push(update);
    }
}

/**
 * The TerrificBridgeInstance is a singleton and 
 * will be instanciated here.
 */
TerrificBridgeInstance = new TerrificBridge(!!debuggingEnabled);

/**
 * Export the singleton as default module
 * @type {TerrificBridge}
 */
export default TerrificBridgeInstance;
