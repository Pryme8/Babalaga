const path = require("path");
const fs = require("fs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

const appDirectory = fs.realpathSync(process.cwd());
module.exports = {
    entry: path.resolve(appDirectory, "src/app.ts"), //path to the main .ts file
    output: {
        filename: "js/index.js", //name for the js file that is created/compiled in memory
        path: path.resolve(appDirectory, "dist")
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    devServer: {
        host: "0.0.0.0",
        port: 8080, //port that we're using for local host (localhost:8080)
        hot: true,
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    stats: 'verbose',
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            cleanOnceBeforeBuildPatterns: ['./dist/*'],
            template: path.resolve(appDirectory, "public/index.html"),
        }),
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns: [
              { from: path.resolve(__dirname, 'public/assets'), to: path.resolve(__dirname, 'dist/assets') },
              { from: path.resolve(__dirname, 'public/styles'), to: path.resolve(__dirname, 'dist/styles') },
            ],
        })
    ],
    mode: "production",
    devtool: 'source-map',
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    }
};