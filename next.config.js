/** @type {import('next').NextConfig} */
const webpack = require('webpack');
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  
  // Disable Google Fonts optimization to avoid timeout issues
  optimizeFonts: false,
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      const emptyModulePath = path.resolve(__dirname, 'empty-module.js');
      
      // CRITICAL: Force browser conditions for package.json exports resolution
      // This prevents Firebase from using Node.js builds
      if (!config.resolve.conditionNames) {
        config.resolve.conditionNames = [];
      }
      // Ensure 'browser' is first to prioritize browser builds
      config.resolve.conditionNames = ['browser', 'import', 'module', 'require', 'default'];
      config.resolve.mainFields = ['browser', 'module', 'main'];
      
      
      // Set fallbacks for Node.js modules - these should never be in client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        'child_process': false,
        'worker_threads': false,
        'util': false,
        'buffer': false,
        'events': false,
      };
      
      // CRITICAL: The order matters! We need to intercept at multiple levels
      
      // LEVEL 1: Replace protobufjs/ext/descriptor/index.js FIRST
      // This is the file that requires the JSON - replace it before it executes
      config.plugins.unshift(
        new webpack.NormalModuleReplacementPlugin(
          /node_modules[\/\\]protobufjs[\/\\]ext[\/\\]descriptor[\/\\]index\.js$/,
          emptyModulePath
        ),
        new webpack.NormalModuleReplacementPlugin(
          /protobufjs[\/\\]ext[\/\\]descriptor[\/\\]index$/,
          emptyModulePath
        ),
        new webpack.NormalModuleReplacementPlugin(
          /protobufjs[\/\\]ext[\/\\]descriptor$/,
          emptyModulePath
        )
      );
      
      // LEVEL 2: Replace @grpc/proto-loader which imports protobufjs/ext/descriptor
      config.plugins.unshift(
        new webpack.NormalModuleReplacementPlugin(
          /node_modules[\/\\]@grpc[\/\\]proto-loader/,
          emptyModulePath
        ),
        new webpack.NormalModuleReplacementPlugin(
          /@grpc[\/\\]proto-loader/,
          emptyModulePath
        )
      );
      
      // LEVEL 3: Block @grpc modules using IgnorePlugin as backup
      config.plugins.unshift(
        new webpack.IgnorePlugin({
          checkResource(resource, context) {
            if (!resource) return false;
            const normRes = resource.replace(/\\/g, '/');
            const normCtx = (context || '').replace(/\\/g, '/');
            
            // Block any @grpc module
            if (normRes.includes('@grpc/') || normCtx.includes('@grpc/')) {
              return true;
            }
            return false;
          },
        })
      );
      
      // STEP 4: Replace Firebase Firestore Node.js build - use try/catch for safety
      try {
        const esmPath = path.resolve(
          __dirname,
          'node_modules/@firebase/firestore/dist/index.esm.js'
        );
        config.plugins.unshift(
          new webpack.NormalModuleReplacementPlugin(
            /@firebase\/firestore\/dist\/index\.node\.(mjs|js)$/,
            esmPath
          )
        );
      } catch (e) {
        // If path resolution fails, just block it
        console.warn('Could not resolve Firebase ESM build, using alias instead');
      }
      
      // STEP 5: Multiple layers of blocking for the JSON file
      // Use both regex and checkResource to catch all variations
      config.plugins.push(
        // Catch absolute paths
        new webpack.IgnorePlugin({
          resourceRegExp: /[\/\\]google[\/\\]protobuf[\/\\]descriptor\.json$/,
        }),
        // Catch relative paths  
        new webpack.IgnorePlugin({
          resourceRegExp: /[\/\\]protobuf[\/\\]descriptor\.json$/,
        }),
        // Catch any variation
        new webpack.IgnorePlugin({
          checkResource(resource, context) {
            if (!resource) return false;
            const normRes = resource.replace(/\\/g, '/').toLowerCase();
            const normCtx = (context || '').replace(/\\/g, '/').toLowerCase();
            
            // Block any descriptor.json file
            if (normRes.includes('descriptor.json') || 
                normRes.includes('google/protobuf/descriptor')) {
              return true;
            }
            
            // Block if coming from protobufjs context
            if (normCtx.includes('protobufjs') && normRes.includes('json')) {
              return true;
            }
            
            return false;
          },
        })
      );
      
      // STEP 6: Add alias to force Firebase to use browser build
      config.resolve.alias = {
        ...config.resolve.alias,
        // Prevent Node.js build from being resolved
        '@firebase/firestore/dist/index.node.mjs': false,
        '@firebase/firestore/dist/index.node.js': false,
      };
      
    }
    
    return config;
  },
  
  // Experimental: Use SWC minification which handles modules better
  swcMinify: true,
}

module.exports = nextConfig

