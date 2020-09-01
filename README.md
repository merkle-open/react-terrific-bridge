[![Build Status](https://travis-ci.org/namics/react-terrific-bridge.svg?branch=master)](https://travis-ci.org/namics/react-terrific-bridge) [![Coverage Status](https://coveralls.io/repos/github/namics/react-terrific-bridge/badge.svg?branch=master)](https://coveralls.io/github/namics/react-terrific-bridge?branch=master)

# TerrificBridge

The Terrific Bridge is used to manage Frontend UI components inside React. It can be used to register components, send and receive actions (bidirectional) and handle application starts & stops. Remember that the TerrificBridge is a singleton and can be instanciated once per Application.

## TOC

*   [Package information](#package)
    *   [Dependencies]()
    *   [Contents of react-terrific-bridge](#contents)
*   [Installation guide](#installation)
*   [How to use](#registering-component)
    *   [Loading the TerrificBridge](#loading-the-terrificbridge)
    *   [Registering Component](#registering-component)
    *   [Registering Component with UI bindngs](#registering-component-with-receive-actions)
    *   [Send actions to the UI Component](#send-actions-to-the-ui-component)
    *   [Unregistering Component](#unregister-component)
*   [API Documentation](#react-api)
    *   [React](#react-api)
    *   [Terrific](#terrific-api)

## Package

```js
import TerrificBridgeInstance, { TerrificBridge, TerrificBridgeGlobalAppId, getGlobalApp } from 'react-terrific-bridge';
```

### Dependencies

*   [react@~16.3.0](https://www.npmjs.com/package/react)
*   [react-dom@~16.3.0](https://www.npmjs.com/package/react-dom)

###### Peer Dependencies

*   [react@>=16.3.0](https://www.npmjs.com/package/react)
*   [react-dom@>=16.3.0](https://www.npmjs.com/package/react-dom)
*   [terrific@~3.0.0](https://www.npmjs.com/package/terrific)

### Contents

#### TerrificBridgeInstance (default)

Singleton instance which should be used to register any components inside the page.

#### TerrificBridge

The named export TerrificBridge is the class blueprint of the singleton. You can use it if you need multiple Terrific Applications.

#### TerrificBridgeGlobalAppId

Will be used to make the application available inside the window object if the debug mode is enabled. You can receive the application via te `getGlobalApp()` method.

#### getGlobalApp

Will return the global application instance if the debug mode was enabled before, otherwise it will return `undefined`;

## Installation

It is recommended to use **yarn** as package manager and to install `react-terrific-bridge` via yarn, allthough it would work with NPM.

```bash
yarn add react-terrific-bridge
npm install --save react-terrific-bridge
```

## Loading the TerrificBridge

The most important thing in the bridge is the `load()` method, which will bootstrap the Terrific application on the react side.
You must call this method at the root entry of your react app to make it possible to register all components. All components which
are registered before the load function was called will be automatically initialized during the `load()` call.

```js
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import TerrificBridge from 'react-terrific-bridge';

class App extends Component {
    componentDidMount() {
        // bootstrap terrific application ...
        TerrificBridge.load();
    }

    render() {
        return <h1>Hello there!</h1>;
    }
}

ReactDOM.render(<App />, document.getElementById('root'));
```

## Registering Component

Just register a Terrific Component and start it inside the `componentDidMount` hook.

```js
import React, { Component } from 'react';
import TerrificBridge from 'helper/terrific';

export default class Slider extends Component {

     constructor(props) {
        super(props);
        this.componentRef = React.createRef();
    }

    componentDidMount() {
        TerrificBridge.registerComponent(this.componentRef.current);
    }

    componentWillUnmount() {
        TerrificBridge.unregisterComponent(this.componentRef.current);
    }

    render() {
        const { modifier, slides } = this.props;

        return (
            <ul  ref={this.componentRef} className={'m-slider' + (modifier ? 'm-slider--' + modifier : '')} data-t-name="Slider">
                {slides &&
                    slides.map((slide, index) => {
                        return (
                            <li key={index}>
                                <img src={slide.image} alt={slide.alt} />
                                <h5>{slide.caption}</h5>
                                {slide.text && <p>{slide.text}</p>}
                            </li>
                        );
                    })}
            </ul>
        );
    }
}
```

## Registering Component with receive actions

If you register a Component with a Functin factory as second parameter, you can specify receive actions which the
Terrific component can execute in the React App. Each Frontend Component has a method called `send` which is capable to
transport N arguments.

```js
import React, { Component } from 'react';
import TerrificBridge from 'helper/terrific';

export default class Slider extends Component {

    constructor(props) {
        super(props);
        this.componentRef = React.createRef();
    }

    componentDidMount() {
        // Trigger via T.Module.Slider.send("shouldUpdate");
        TerrificBridge.registerComponent(this.componentRef.current, {
            shouldUpdate: this.forceUpdate,
        });
    }

    componentWillUnmount() {
        TerrificBridge.unregisterComponent(this.componentRef.current);
    }

    render() {
        const { modifier, slides } = this.props;

        return (
            <ul ref={this.componentRef} className={'m-slider' + (modifier ? 'm-slider--' + modifier : '')} data-t-name="Slider">
                {slides &&
                    slides.map((slide, index) => {
                        return (
                            <li key={index}>
                                <img src={slide.image} alt={slide.alt} />
                                <h5>{slide.caption}</h5>
                                {slide.text && <p>{slide.text}</p>}
                            </li>
                        );
                    })}
            </ul>
        );
    }
}
```

## Send actions to the UI Component

In this part you'll see how to send actions from React to the Frontend UI component. To send actions to the UI component, the
Terrific Component needs to provide an object in its root called `actions`. You can call any action defined in this Object.

```js
import React, { Component } from 'react';
import TerrificBridge from 'helper/terrific';

export default class Slider extends Component {

    constructor(props) {
        super(props);
        this.componentRef = React.createRef();
    }

    componentDidMount() {
        TerrificBridge.registerComponent(this.componentRef.current, {
            update: this.forceUpdate,
        });
    }

    componentWillUnmount() {
        TerrificBridge.unregisterComponent(this.componentRef.current);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.forceUpdate && nextProps.forceUpdateId) {
            // T.Module.Slider.actions.update(nextProps.forceUpdateId);
            TerrificBridge.action(this.componentRef.current, 'update', nextProps.forceUpdateId);
        }
    }

    render() {
        const { modifier, slides } = this.props;

        return (
            <ul ref={this.componentRef} className={'m-slider' + (modifier ? 'm-slider--' + modifier : '')} data-t-name="Slider">
                {slides &&
                    slides.map((slide, index) => {
                        return (
                            <li key={index}>
                                <img src={slide.image} alt={slide.alt} />
                                <h5>{slide.caption}</h5>
                                {slide.text && <p>{slide.text}</p>}
                            </li>
                        );
                    })}
            </ul>
        );
    }
}
```

## Unregister Component

Just register a Terrific Component and start it inside the `componentDidMount` hook.

```js
import React, { Component } from 'react';
import TerrificBridge from 'helper/terrific';

export default class Slider extends Component {

    constructor(props) {
        super(props);
        this.componentRef = React.createRef();
    }
    componentDidMount() {
        TerrificBridge.registerComponent(this.componentRef.current);
    }

    componentWillUnmount() {
        TerrificBridge.unregisterComponent(this.componentRef.current);
    }

    render() {
        const { modifier, slides } = this.props;

        return (
            <ul ref={this.componentRef} className={'m-slider' + (modifier ? 'm-slider--' + modifier : '')} data-t-name="Slider">
                {slides &&
                    slides.map((slide, index) => {
                        return (
                            <li key={index}>
                                <img src={slide.image} alt={slide.alt} />
                                <h5>{slide.caption}</h5>
                                {slide.text && <p>{slide.text}</p>}
                            </li>
                        );
                    })}
            </ul>
        );
    }
}
```

## Using the bridge without the `window` object

The terrific bridge can be used with a custom terrific module, per default it will look for the `window.T` object in your browser.
There are two methods which you can use to override the module:

1.  Override the singleton with a new configuration

```js
import TerrificBridge, { TerrificBridge as TerrificBridgeBlueprint } from '@namics/react-terrific-bridge';
import customTerrificModule from 'terrific';

new TerrificBridgeBlueprint({
    overrideSingletonInstance: true,
    terrific: customTerrificModule,
});

// ...

TerrificBridge.registerComponent(/* ... */);
```

2.  Override the internal terrific space

```js
import TerrificBridge from '@namics/react-terrific-bridge';
import customTerrificModule from 'terrific';

TerrificBridge.useCustomTerrific(customTerrificModule);
```

## React API

### load

Starts the Terrific Application with a configurable set of options.

| #   | Argument Type    | Required |
| --- | ---------------- | -------- |
| 1   | Settings: Object | false    |

```js
TerrificBridge.load(settings: Object): void
```

##### 01 Settings

A configuration set for the Bridge Singleton.

### reset

Resets the TerrificBridge state (queue, components, amm.) and must be re-loaded afterwards.

```js
TerrificBridge.reset(): void
```

### registerComponent

| #   | Argument Type            | Required |
| --- | ------------------------ | -------- |
| 1   | DOM Node | true     |
| 2   | BindingFactory {}        | false    |

```js
TerrificBridge.registerComponent(node, factory: BindingFactory): void
```

##### 1 DOM Node

Reference a DOM Node

##### 2 BindingFactory

Can be used for setting actions which the Terrific component can execute.

```js
type BindingFactory = {
    [name: string]: Function,
};
```

##### getComponentById

Will return a Terrific Component instance.

```js
TerrificBridge.getComponentById(id: number): Object | void
```

| #   | Argument Type      | Required |
| --- | ------------------ | -------- |
| 1   | TerrificId: number | true     |

##### 01 Terrific ID

The ID of a component (e.g. 198).

### unregisterComponent

| #   | Argument Type            | Required |
| --- | ------------------------ | -------- |
| 1   | DOM Node | true     |

```js
TerrificBridge.unregisterComponent(node): void
```

##### 01 DOM Node

Reference for the React Component DOM Node

### action

| #   | Argument Type            | Required |
| --- | ------------------------ | -------- |
| 1   | DOM Node | true     |
| 2   | Action: string           | true     |
| N   | Arguments: ...any        | false    |

```js
TerrificBridge.action(node, action: string, ...args: any): void
```

##### 1 DOM Node

Reference for the React Component DOM Node

##### 2 Action

The action to trigger in the FE UI component under `actions`.

##### N Arguments

Pass N arguments after the React Component and the Action to the FE UI.

## Terrific API

### Actions

Actions which can be triggered by a react component must be stored directly inside the module under the variable `actions`, otherwise React won't be able to trigger any action on the UI side.

```js
actions = { [actionName]: () => {} }: Object
```

#### Example

```js
($ => {
    'use strict';

    T.Module.Slider = T.createModule({
        actions: {},
        start(resolve) {
            this._setActions();
            resolve();
        },
        stop() {
            this._events.off().disconnect();
        },
        _setActions() {
            this.actions = {
                update() {
                    // Place some logic here
                },
            };
        },
        /* ... more methods */
    });
})(jQuery);
```

### Send

```js
send(actionName: string [, ...args]): void
```

The send method will be created by the react side of the application. This method allows the UI to trigger custom functions inside a react component e.g. a actionCreator, class methods or something similar.

#### Example

```js
($ => {
    'use strict';

    T.Module.Calculator = T.createModule({
        start(resolve) {
            $(this._ctx)
                .find('js-a-button--submit')
                .on('click', ev => {
                    this.onSubmit.call();
                });

            resolve();
        },
        onSubmit() {
            this.send('submit', this.someValueHere, ['more ...']);
        },
        /* ... more methods */
    });
})(jQuery);
```
