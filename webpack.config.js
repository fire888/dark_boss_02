const exec = require('child_process').execSync
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')
const DeadCodePlugin = require('webpack-deadcode-plugin')

const hashCommit = exec('git log -1 --pretty=format:%h').toString().trim()
const currentBranch = exec('git rev-parse --abbrev-ref HEAD').toString().trim()

module.exports = (env, { mode }) => {
    return {
        devServer: {
            headers: {
                'Cross-Origin-Opener-Policy': 'same-origin',
                'Cross-Origin-Embedder-Policy': 'require-corp',
            },
        },
        entry: './src/index.ts',
        // mode: 'development',
        devtool: mode === 'development' ? 'source-map' : false,
        resolve: {
            plugins: [
                new TsconfigPathsPlugin({
                    extensions: ['.js', '.jsx', '.ts', '.tsx'],
                }),
            ],
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        output: {
            filename: "./res/" + hashCommit + "_index.js",
            path: path.resolve(__dirname, 'dist'),
            assetModuleFilename: './res/assets/'+ hashCommit + '_[name][ext]',
            clean: true,
        },
        plugins: [
            new DeadCodePlugin({
                exclude: ['**/node_modules/**'],
                exportJSON: './analysis',
            }),
            new ESLintPlugin({}),
            new HtmlWebpackPlugin({
                template: './templates/index.html'
            }),
            new MiniCssExtractPlugin({
                filename: './res/'+ hashCommit + '_main.css',
            }),
            new webpack.DefinePlugin({
                __HASH_COMMIT__: JSON.stringify(hashCommit),
                __GIT_CURRENT_BRANCH__: JSON.stringify('' + currentBranch),
            }),
            new webpack.ProvidePlugin({
                // 'cannon': 'cannon',
                // 'babylonjs-loaders': 'babylonjs-loaders',
            }),
            // new CopyPlugin({
            //     patterns: [
            //         // {from: './templates/start-img.webp', to: 'start-img.webp'},
            //     ],
            // }),
        ],
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/i,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader,
                            options: {
                                publicPath: '../',
                            },
                        },
                        'css-loader',
                    ],
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif|webp|env|bin|glb|gltf|ogg|mp3|wav|avi|mp4|ktx2|json)$/i,
                    type: 'asset/resource',
                },
            ],
        },
    }
}
