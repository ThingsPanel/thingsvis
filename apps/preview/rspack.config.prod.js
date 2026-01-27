const path = require('path');
const { defineConfig } = require('@rspack/cli');
const { ModuleFederationPlugin } = require('@module-federation/rspack');

module.exports = defineConfig({
    mode: 'production',
    experiments: {
        css: true
    },
    entry: {
        main: './src/main.tsx'
    },
    target: ['web', 'es2020'],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[contenthash:8].js',
        chunkFilename: '[name].[contenthash:8].js',
        uniqueName: 'thingsvis_preview',
        publicPath: '/',
        clean: true
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
            '@thingsvis/kernel': path.resolve(__dirname, '../../packages/thingsvis-kernel/src'),
            '@thingsvis/ui': path.resolve(__dirname, '../../packages/thingsvis-ui/src'),
            '@thingsvis/schema': path.resolve(__dirname, '../../packages/thingsvis-schema/src'),
            '@thingsvis/utils': path.resolve(__dirname, '../../packages/thingsvis-utils/src')
        }
    },
    optimization: {
        minimize: true,
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    priority: 10,
                    reuseExistingChunk: true
                },
                thingsvis: {
                    test: /[\\/]packages[\\/]thingsvis-/,
                    name: 'thingsvis',
                    priority: 20,
                    reuseExistingChunk: true
                }
            }
        },
        runtimeChunk: 'single'
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true
                        }
                    }
                ]
            },
            {
                test: /\.css$/,
                type: 'css/auto'
            }
        ]
    },
    builtins: {
        html: [
            {
                template: './index.html',
                filename: 'index.html',
                minify: true
            }
        ]
    },
    plugins: [
        // Module Federation for remote plugin loading
        new ModuleFederationPlugin({
            name: 'thingsvis_preview_host',
            filename: 'remoteEntry.js',
            exposes: {},
            shared: {
                react: { singleton: true, eager: true, requiredVersion: false },
                'react-dom': { singleton: true, eager: true, requiredVersion: false },
                'leafer-ui': { singleton: true, eager: true, requiredVersion: false },
                '@thingsvis/schema': { singleton: true, eager: true, requiredVersion: false },
                '@thingsvis/kernel': { singleton: true, eager: true, requiredVersion: false },
                '@thingsvis/ui': { singleton: true, eager: true, requiredVersion: false },
                '@thingsvis/utils': { singleton: true, eager: true, requiredVersion: false }
            }
        })
    ],
    performance: {
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
        hints: 'warning'
    }
});
