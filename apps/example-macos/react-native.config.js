const path = require('path');
const pkg = require('../../package.json');

module.exports = {
  dependencies: {
    [pkg.name]: {
      root: path.join(__dirname, '../..'),
      platforms: {
        // Codegen script incorrectly fails without this
        // So we explicitly specify the platforms with empty object
        macos: {},
        ios: {},
        android: {},
      },
    },
  },
};
