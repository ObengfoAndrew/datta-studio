// Empty module to replace Node.js-only modules in client bundles
// This replaces protobufjs/ext/descriptor which requires Node.js-only files
// It also replaces @grpc/proto-loader which is Node.js-only

// Export an object that mimics what protobufjs expects
const emptyDescriptor = {
  lookup: function(path) { 
    return null; 
  },
  nested: {},
  values: {},
  types: {},
  add: function() { return this; },
  remove: function() { return this; },
};

// For protobufjs compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = emptyDescriptor;
}

// For ES modules
if (typeof exports !== 'undefined') {
  exports.default = emptyDescriptor;
  exports.descriptor = emptyDescriptor;
}

