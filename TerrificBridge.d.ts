declare module "react-terrific-bridge" {
    class Component {
        props: any;
        state: any;
        context: any;
        static name: string;
        constructor(props?, context?);
        setState(partial: any, callback?: any): void;
        forceUpdate(callback?: any): void;
    }

    export interface TerrificApp {
        _config: Object;
        _ctx: Object;
        _id: number;
        _modules: Object;
        _sandbox: Object;
        start: Function;
        getModuleById: Function;
        registerModule: Function;
        unregisterModules: Function;
    }

    export interface TerrificSandbox {
        _application: TerrificApp;
        _eventEmitters: Array<Object>;
    }

    export var TerrificBridgeGlobalAppId: string;

    export interface TerrificBridgeFnFactory {
        [action: string]: Function;
    }

    export function getGlobalApp(): TerrificBridge | void;

    export class TerrificBridge {
        app: TerrificApp;
        config: Object;
        terrific: Object;

        constructor(debug: Boolean);

        configure(config?: Object): void;
        load(config?: Object): void;
        getComponentById(componentId: number): Object | null;
        registerComponent(
            component: Component<any, any, any>,
            compositeFactory?: TerrificBridgeFnFactory
        ): Object | void;
        unregisterComponent(component: Component<any, any, any>): boolean;
        action(component: Component<any, any, any>, action: string, ...args: any): boolean | void;
    }

    export default TerrificBridge;
}
