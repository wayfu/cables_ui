import path, { dirname } from "path";

import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";
import { fileURLToPath } from "url";

export default (isLiveBuild, buildInfo, minify = false) =>
{
    minify = false;
    let __dirname = dirname(fileURLToPath(import.meta.url));
    return {
        "mode": isLiveBuild ? "production" : "development",
        "entry": [
            path.join(__dirname, "src", "ui", "index.js"),
        ],
        "devtool": minify ? "source-map" : false,
        "output": {
            "path": path.join(__dirname, "dist", "js"),
            "filename": "cablesui.js",
        },
        "optimization": {
            "minimize": true,
            "minimizer": [
                new TerserPlugin({
                    "terserOptions": {
                        "keep_classnames": true,
                        "keep_fnames": true
                    }
                })
            ]
        },
        "externals": ["CABLES"],
        "resolve": {
            "extensions": [".json", ".js"],
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
