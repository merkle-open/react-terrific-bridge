const path = require("path");
const pkg = require("./package.json");

module.exports = {
    entry: path.resolve(pkg.main),
    output: {
        path: __dirname + "/dist",
        publicPath: "/dist/",
        filename: pkg.name + ".js"
    },
    module: {
        rules: [
            {
                test: /\TerrificBridge.js$/,
                exclude: /node_modules/,
                use: "babel-loader"
            }
        ]
    },
    resolve: {
        modules: [path.resolve("./src"), "node_modules"]
    }
};
