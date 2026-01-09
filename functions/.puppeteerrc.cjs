const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Store the browser inside the local .cache folder for the function to access
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};