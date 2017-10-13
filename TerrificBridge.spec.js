import React, { Component } from "react";
import { configure, shallow, mount } from "enzyme";
import Adapter from 'enzyme-adapter-react-16';
import sinon from "sinon";

// polyfills
import "core-js/es6/map";
import "core-js/es6/set";

// Frontend testing dependencies
import $ from "jquery";
import T from "terrific";

// enzyme config -> http://airbnb.io/enzyme/docs/installation/react-16.html
configure({ adapter: new Adapter() });

// Fake globals
window.T = T;
window.$ = $;

// Testing instances
import App from "./spec/react/App";

import TerrificBridge, {
    TerrificBridge as TerrificBridgeBlueprint,
    TerrificBridgeGlobalAppId,
    getGlobalApp as getGlobalTerrificApp
} from "./";

window.console.log = () => {};

describe("TerrificBridge", () => {
    describe("instanciation", () => {
        it.skip("should throw an error if terrific is not available inside the window", () => {});
        it("should be a singleton and not a class", () => {
            expect(TerrificBridge).toBeTruthy();
            expect(() => {
                new TerrificBridge();
            }).toThrow();
        });
    });

    describe("configuration", () => {
        it("should be possible to disable debug mode manually", () => {
            TerrificBridge.configure({ debug: false });
            expect(TerrificBridge.config.debug).toEqual(false);
        });
        it("should be possible to re-enable debug mode via configure", () => {
            TerrificBridge.configure({ debug: true });
            expect(TerrificBridge.config.debug).toEqual(true);
        });
    });

    describe("terrific", () => {
        it.skip("should get the global terrific framework instance", () => {
            TerrificBridge.configure({ debug: true });
            TerrificBridge.load();
            expect(TerrificBridge.terrific).toBeTruthy();
        });
    });

    it("should unregister unregistered terrific component", () => {
        TerrificBridge.reset();
        TerrificBridge.configure({ debug: true });

        const uiStopStub = sinon.spy();

        T.Module.CanRegister = T.createModule({
            start(resolve) {
                resolve();
            },
            stop() {
                uiStopStub();
                this._events.disconnect();
            }
        });

        class CanRegister extends Component {
            componentWillUnmount() {
                TerrificBridge.unregisterComponent(this);
            }

            render() {
                return <div id="component" data-t-name="CanRegister" />;
            }
        }

        const tree = mount(<CanRegister />);
        TerrificBridge.load();
        tree.unmount();

        expect(uiStopStub.callCount).toEqual(0);
    });

    describe("components", () => {
        describe("registration", () => {
            it("should mount components successfully", () => {
                TerrificBridge.reset();

                const didMountStub = sinon.spy();

                class CanRegister extends Component {
                    componentDidMount() {
                        didMountStub();
                    }

                    render() {
                        return <div data-t-name="CanRegister" />;
                    }
                }

                const mountApplication = () => {
                    return mount(
                        <App>
                            <CanRegister />
                        </App>
                    );
                };

                expect(mountApplication).not.toThrow();
                expect(didMountStub.called).toEqual(true);
            });
            it("should not register terrific components with invalid root nodes", () => {
                TerrificBridge.reset();
                TerrificBridge.configure({ debug: true });

                let registeredFeuComponent = void 0;

                T.Module.CanRegister = T.createModule({
                    start(resolve) {
                        resolve();
                    },
                    stop() {
                        this._events.disconnect();
                    }
                });

                class CanRegister extends Component {
                    componentDidMount() {
                        registeredFeuComponent = TerrificBridge.registerComponent();
                    }

                    render() {
                        return <div id="component" data-t-name="CanRegister" />;
                    }
                }

                const mountApplication = () => {
                    return mount(
                        <App>
                            <CanRegister />
                        </App>
                    );
                };

                expect(mountApplication).not.toThrow();

                const tree = mountApplication();
                const mountedComponenet = tree.find("#component");

                expect(mountedComponenet).toHaveLength(1);
                expect(registeredFeuComponent).toBeFalsy();
            });
            it("should register terrific components successfully", () => {
                TerrificBridge.reset();
                TerrificBridge.configure({ debug: true });

                let registeredFeuComponent = void 0;

                T.Module.CanRegister = T.createModule({
                    start(resolve) {
                        resolve();
                    },
                    stop() {
                        this._events.disconnect();
                    }
                });

                class CanRegister extends Component {
                    componentDidMount() {
                        registeredFeuComponent = TerrificBridge.registerComponent(this);
                    }

                    render() {
                        return <div id="component" data-t-name="CanRegister" />;
                    }
                }

                const mountApplication = () => {
                    return mount(
                        <App>
                            <CanRegister />
                        </App>
                    );
                };

                expect(mountApplication).not.toThrow();

                const tree = mountApplication();
                const mountedComponenet = tree.find("#component");

                expect(mountedComponenet).toHaveLength(1);
                expect(registeredFeuComponent._ctx).toBeTruthy();
                expect(registeredFeuComponent._sandbox).toBeTruthy();
                expect(registeredFeuComponent.actions).toBeTruthy();
                expect(registeredFeuComponent.send).toBeTruthy();
            });
            it("should not unregister terrific components with invalid root nodes", () => {
                TerrificBridge.reset();
                TerrificBridge.configure({ debug: true });

                let unregisteredFeuComponent = void 0;

                T.Module.CanRegister = T.createModule({
                    start(resolve) {
                        resolve();
                    },
                    stop() {
                        this._events.disconnect();
                    }
                });

                class CanRegister extends Component {
                    componentDidMount() {
                        TerrificBridge.registerComponent();
                    }

                    componentWillUnmount() {
                        unregisteredFeuComponent = TerrificBridge.unregisterComponent();
                    }

                    render() {
                        return <div id="component" data-t-name="CanRegister" />;
                    }
                }

                const mountApplication = () => {
                    return mount(
                        <App>
                            <CanRegister />
                        </App>
                    );
                };

                expect(mountApplication).not.toThrow();

                const tree = mountApplication();
                const mountedComponenet = tree.find("#component");

                expect(mountedComponenet).toHaveLength(1);
                expect(unregisteredFeuComponent).toBeFalsy();
            });
            it("should unregister terrific components successfully", () => {
                TerrificBridge.reset();
                TerrificBridge.configure({ debug: true });

                const uiStopStub = sinon.spy();

                T.Module.CanRegister = T.createModule({
                    start(resolve) {
                        resolve();
                    },
                    stop() {
                        uiStopStub();
                        this._events.disconnect();
                    }
                });

                class CanRegister extends Component {
                    componentDidMount() {
                        TerrificBridge.registerComponent(this);
                    }

                    componentWillUnmount() {
                        TerrificBridge.unregisterComponent(this);
                    }

                    render() {
                        return <div id="component" data-t-name="CanRegister" />;
                    }
                }

                const tree = mount(<CanRegister />);
                TerrificBridge.load();
                tree.unmount();

                expect(uiStopStub.callCount).toEqual(1);
            });

            it.skip("should log unregistration errors from terrific components", () => {
                TerrificBridge.reset();
                TerrificBridge.configure({ debug: true });

                T.Module.CanRegister = T.createModule({
                    start(resolve) {
                        resolve();
                    },
                    stop() {
                        throw new Error("Stop");
                        this._events.disconnect();
                    }
                });

                class CanRegister extends Component {
                    componentDidMount() {
                        TerrificBridge.registerComponent(this);
                    }

                    componentWillUnmount() {
                        TerrificBridge.unregisterComponent(this);
                    }

                    render() {
                        return <div id="component" data-t-name="CanRegister" />;
                    }
                }

                const tree = mount(<CanRegister />);
                TerrificBridge.load();
                const shouldUnmount = () => tree.unmount();

                expect(shouldUnmount).toThrow("Stop");
            });
        });

        describe("get", () => {
            it("should return undefined if it tries to get a component by invalid id", () => {
                TerrificBridge.reset();
                TerrificBridge.configure({ debug: true });

                const invalidModule = TerrificBridge.getComponentById();
                expect(invalidModule).toBeFalsy();
            });
            it("should return the terrific component if a valid ID was passed", () => {
                TerrificBridge.reset();
                TerrificBridge.configure({ debug: true });

                T.Module.CanRegister = T.createModule({
                    start(resolve) {
                        resolve();
                    }
                });

                class CanRegister extends Component {
                    componentDidMount() {
                        TerrificBridge.registerComponent(this);
                    }

                    render() {
                        return (
                            <div id="component" data-t-name="CanRegister">
                                <button className="bound-click">Click me</button>
                            </div>
                        );
                    }
                }

                const tree = mount(
                    <App>
                        <CanRegister />
                    </App>
                );

                expect(TerrificBridge.getComponentById(1)).toBeTruthy();
            });
        });

        describe("communication", () => {
            it("should provide bidirectional communication for react & terrific", () => {
                TerrificBridge.reset();
                TerrificBridge.configure({ debug: true });

                const reactConnectionHandler = sinon.spy();
                const terrificConnectionHandler = sinon.spy();

                T.Module.CanRegister = T.createModule({
                    actions: {
                        terrificConnectionHandler
                    },
                    start(resolve) {
                        this.send("reactConnectionHandler", 10);
                        resolve();
                    }
                });

                class CanRegister extends Component {
                    componentDidMount() {
                        TerrificBridge.registerComponent(this, {
                            reactConnectionHandler
                        });

                        TerrificBridge.action(this, "terrificConnectionHandler");
                    }

                    render() {
                        return (
                            <div id="component" data-t-name="CanRegister">
                                <button className="bound-click">Click me</button>
                            </div>
                        );
                    }
                }

                const mountApplication = () => {
                    return mount(
                        <App>
                            <CanRegister />
                        </App>
                    );
                };

                expect(mountApplication).not.toThrow();

                const tree = mountApplication();
                const mountedComponenet = tree.find("#component");
                const mountedButtonTrigger = tree.find(".bound-click");

                expect(mountedComponenet).toHaveLength(1);
                expect(mountedButtonTrigger).toHaveLength(1);

                mountedButtonTrigger.simulate("click");

                expect(reactConnectionHandler.callCount).toEqual(2);
                expect(terrificConnectionHandler.callCount).toEqual(1);
            });
            it("should throw errors on bidirectional communication issues", () => {
                TerrificBridge.reset();
                TerrificBridge.configure({ debug: true });

                T.Module.CanRegister = T.createModule({
                    actions: {
                        shouldThrowError: () => {
                            throw new Error("Some exception");
                        }
                    },
                    start(resolve) {
                        resolve();
                    }
                });

                class CanRegister extends Component {
                    componentDidMount() {
                        TerrificBridge.registerComponent(this);
                    }

                    remoteTriggerError() {
                        TerrificBridge.action(this, "shouldThrowError");
                    }

                    render() {
                        return <div id="component" data-t-name="CanRegister" />;
                    }
                }

                const mountApplication = () => {
                    return mount(
                        <App>
                            <CanRegister />
                        </App>
                    );
                };

                expect(mountApplication).not.toThrow();
                const tree = mountApplication();
                const singleComponent = mount(<CanRegister />);
                const triggerInnerSendMethod = () => singleComponent.instance().remoteTriggerError();
                expect(triggerInnerSendMethod).toThrow("Some exception");
            });
        });
    });
});

describe("TerrificBridgeGlobalAppId", () => {
    it("should be a defined string variable", () => {
        TerrificBridge.reset();
        TerrificBridge.load({ debug: true });
        expect(TerrificBridgeGlobalAppId).toBeTruthy();
        expect(TerrificBridgeGlobalAppId.length).toBeGreaterThan(0);
    });
    it("should access the app if bridge was loaded before", () => {
        TerrificBridge.reset();
        TerrificBridge.load({ debug: true });
        expect(window[TerrificBridgeGlobalAppId]).toBeTruthy();
        TerrificBridge.reset();
    });
});

describe("getGlobalApp", () => {
    it("should return undefined if debug mode is disabled", () => {
        TerrificBridge.configure({ debug: false });
        expect(getGlobalTerrificApp()).toEqual(void 0);
    });
    it("should return the application if debug mode is enabled", () => {
        TerrificBridge.configure({ debug: true });
        TerrificBridge.load();
        expect(getGlobalTerrificApp()).toBeTruthy();
        TerrificBridge.reset();
    });
});
