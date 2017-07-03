import React, { Component } from "react";
import TerrificBridge from "../../";

export default class ReactTestApp extends Component {
    componentDidMount() {
        TerrificBridge.load();
    }

    render() {
        return (
            <div className="react-test-app">
                {this.props.children}
            </div>
        );
    }
}
