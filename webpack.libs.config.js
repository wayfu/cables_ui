import path, { dirname } from "path";

import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";
import { fileURLToPath } from "url";

export default (isLiveBuild, buildInfo, minify = false) =>
{
    let __dirname = dirname(fileURLToPath(import.meta.url));
    return {
        "mode": isLiveBuild ? "production" : "development",
        "entry": [
            path.join(__dirname, "libs", "ui", "index.js"),
        ],
        "devtool": minify ? "source-map" : false,
        "output": {
            "path": path.join(__dirname, "dist", "js"),
            "filename": "libs.ui.js",
        },
        "optimization": {
            "minimizer": [new TerserPlugin({ "extractComments": false, "terserOptions": { "output": { "comments": false } } })],
            "minimize": minify,
            "usedExports": true
        },
        "externals": ["CABLES"],
        "resolve": {
            "extensions": [".js"],
            "alias": {
                "handlebars": "handlebars/dist/handlebars.min.js"
            }
        },
        "module": {
            "rules": [
                { "sideEffects": false },
                {
                    "test": /\.frag/,
                    "use": "raw-loader",
                },
                {
                    "test": /\.vert/,
                    "use": "raw-loader",
                },
                {
                    "test": /\.txt/,
                    "use": "raw-loader",
                }
            ]
        },
        "plugins": [
            new webpack.DefinePlugin({
                "window.BUILD_INFO": JSON.stringify(buildInfo)
            })
        ]
    };
};