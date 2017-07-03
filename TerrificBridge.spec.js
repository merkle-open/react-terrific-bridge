import React, { Component } from "react";
import { shallow, mount } from "enzyme";
import sinon from "sinon";

import App from "./spec/react/App";

import T from "terrific";
import TerrificBridge, {
    TerrificBridge as TerrificBridgeBlueprint,
    TerrificBridgeGlobalAppId,
    getGlobalApp as getGlobalTerrificApp
} from "./";

window.console.log = () => {};

describe("TerrificBridge", () => {
    describe("instanciation", () => {
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
            it("should register terrific components successfully", () => {
                TerrificBridge.reset();
                TerrificBridge.configure({ debug: true });

                const uiStartStub = sinon.spy();

                T.Module.CanRegister = T.createModule({
                    start(resolve) {
                        uiStartStub();
                        resolve();
                    },
                    stop() {
                        this._events.disconnect();
                    }
                });

                class CanRegister extends Component {
                    componentDidMount() {
                        TerrificBridge.registerComponent(this);
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
                expect(uiStartStub.called).toEqual(true);
            });
            it.skip("should provide bidirectional communication for react & terrific", () => {});
        });

        describe("unregistration", () => {});
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
