"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TerrificBridge = exports.getGlobalApp = exports.TerrificBridgeGlobalAppId = undefined;

var _toConsumableArray2 = require("babel-runtime/helpers/toConsumableArray");

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _reactDom = require("react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Singleton container
 * @type {TerrificBridge|null}
 */
var TerrificBridgeInstance = null;

/**
 * Safe version to use NODE_ENV variable
 * @type {string}
 */
var NODE_ENV = process.env.NODE_ENV || "";

/**
 * The global id for the terrific bridge instance
 * @readonly
 * @type {string}
 */
var TerrificBridgeGlobalAppId = exports.TerrificBridgeGlobalAppId = "reactTerrificBridgeApp";

/**
 * Get the global react terrific bridge instance
 * @return {TerrificBridge|void}
 */
var getGlobalApp = exports.getGlobalApp = function getGlobalApp() {
    return window[TerrificBridgeGlobalAppId];
};

/**
 * Terrific application handler for React
 * @uses Terrific
 * @class TerrificBridge
 * @author Jan Biasi <biasijan@gmail.com>
 * @type {TerrificBridge}
 */

var TerrificBridge = function () {

    /**
     * Instanciates the Bridge
     * @param  {boolean} [debug=false]      Set debug mode
     * @return {TerrificBridge}
     */
    function TerrificBridge() {
        var debug = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
        (0, _classCallCheck3.default)(this, TerrificBridge);
        this._queue = {};
        this._config = {};
        this._app = void 0;
        this._processed = false;
        this._t = void 0;

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

        return TerrificBridgeInstance;
    }

    /**
     * Get the application instance
     * @return {Object}
     */


    (0, _createClass3.default)(TerrificBridge, [{
        key: "configure",


        /**
         * Configure the TerrificBridge
         * @param  {Object} [config={}]     Configuration factory
         */
        value: function configure() {
            var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            var self = this;

            for (var key in config) {
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

    }, {
        key: "load",
        value: function load() {
            var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            if (!window.T || !window.T.Application) {
                throw new Error("Terrific is not available in your environement, make sure " + "that the terrific.js is loaded before your React Application.");
            }

            this.configure(config);
            this._app = new window.T.Application();

            try {
                this._queue.register.forEach(function (fn) {
                    return fn();
                });
                this._queue.unregister.forEach(function (fn) {
                    return fn();
                });
            } catch (e) {
                throw new Error("Bootstrapping terrific application failed: " + (e.message || e || "Unknown Error"));
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

    }, {
        key: "reset",
        value: function reset() {
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

    }, {
        key: "getComponentById",
        value: function getComponentById(id) {
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

    }, {
        key: "registerComponent",
        value: function registerComponent(component) {
            var _this = this;

            var compositeFactory = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            var bridge = this;

            var register = function register() {
                var node = _reactDom2.default.findDOMNode(component);

                if (!node) {
                    // No valid node was found or React component
                    // was not rendered before.
                    return void 0;
                }

                var name = node.getAttribute("data-t-name");
                var decoratorAnnotation = node.getAttribute("data-t-decorator");
                var decorator = typeof decoratorAnnotation === "string" ? [decoratorAnnotation] : void 0;

                if (node.getAttribute("data-t-id")) {
                    return void 0;
                }

                var tModule = _this._app.registerModule(node, name, decorator);

                if (bridge._config.debug) {
                    console.log("Registering tModule %s%s on node", name, decorator ? "#" + decorator[0] : "", node);
                }

                if (tModule) {
                    tModule._bridge = bridge;
                    tModule.actions = tModule.actions || {};

                    /**
                     * Enable bidirectional communication
                     * @param {string} selector
                     * @param {Array<any>} {args=[]}
                     * @return {void}
                     */
                    tModule.send = function (selector) {
                        var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

                        var fn = compositeFactory[selector];
                        if (bridge._config.debug) {
                            console.log("React is receiving action '%s' from terrific", selector);
                        }

                        if (typeof fn === "function") {
                            try {
                                fn.apply(bridge, [].concat((0, _toConsumableArray3.default)(args)));
                            } catch (err) {
                                throw new Error("TerrificBridge failed receiving action " + selector + ": " + err.message);
                            }
                        }
                    };

                    _this._app.start([tModule]);
                }

                return tModule;
            };

            return this._app ? register() : this._queue.register.push(register);
        }

        /**
         * Unregister a component by its React Class
         * @param  {Component} component            React Component class
         * @return {boolean}
         */

    }, {
        key: "unregisterComponent",
        value: function unregisterComponent(component) {
            var _this2 = this;

            var bridge = this;

            var unregister = function unregister() {
                var node = _reactDom2.default.findDOMNode(component);

                if (!node) {
                    return void 0;
                }

                var id = node.getAttribute("data-t-id");
                var tModule = _this2._app.getModuleById(id);

                if (bridge._config.debug) {
                    console.log("Unregistering terrific component #%s", id);
                }

                try {
                    tModule.stop.apply(tModule);
                    tModule.send = function () {};

                    _this2._app.unregisterModules([id]);
                    node.removeAttribute("data-t-id");

                    if (bridge._config.debug) {
                        console.log("Succesfully unregistered component #%s", id);
                    }

                    return true;
                } catch (err) {
                    throw new Error("Unregistering component #" + id + " failed: " + err.message);
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

    }, {
        key: "action",
        value: function action(component, _action) {
            for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
                args[_key - 2] = arguments[_key];
            }

            var _this3 = this;

            var bridge = this;

            var update = function update() {
                var node = _reactDom2.default.findDOMNode(component);
                var name = node.getAttribute("data-t-name");
                var id = parseInt(node.getAttribute("data-t-id"), 10);

                _action = _action.replace(/\./g, "-");
                _action = _action.replace(/\//g, "-");

                if (_action.indexOf("-") > -1) {
                    _action = _action.replace(/-([a-z])/g, function (g) {
                        return g[1].toUpperCase();
                    });
                }

                if (node && name && id > 0) {
                    var tModule = _this3._app.getModuleById(id);

                    if (bridge._config.debug) {
                        console.log("Send action %s to component %s#%d", _action, name, id);
                    }

                    if (tModule && tModule.actions) {
                        if (typeof tModule.actions[_action] === "function") {
                            tModule.actions[_action].apply(tModule, [].concat(args, [component]));
                            return true;
                        }
                    }
                }

                return false;
            };

            return this._app ? update() : this._queue.update.push(update);
        }
    }, {
        key: "app",
        get: function get() {
            return this._app;
        }

        /**
         * Get the configuration factory
         * @return {Object}
         */

    }, {
        key: "config",
        get: function get() {
            return this._config;
        }

        /**
         * Get the Terrific framework ref
         * @return {Object}
         */

    }, {
        key: "terrific",
        get: function get() {
            return this._t;
        }
    }]);
    return TerrificBridge;
}();

/**
 * The TerrificBridgeInstance is a singleton and 
 * will be instanciated here.
 */


exports.TerrificBridge = TerrificBridge;
TerrificBridgeInstance = new TerrificBridge(!(NODE_ENV === "production"));

/**
 * Export the singleton as default tModule
 * @type {TerrificBridge}
 */
exports.default = TerrificBridgeInstance;
