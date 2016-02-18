'use strict';

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const gm = require('gm').subClass({imageMagick: true});

/**
 * Return true if the passed entry is a screenshot
 * @param  {Object}  entry
 * @return {Boolean}
 */
function isScreenshotEntry(entry) {
  return entry.name === 'Screenshot';
}

/**
 * Saves a screenshot entry on the disk
 * @param  {Object} entry
 * @param  {String} filePath
 * @return {Promise} resolving the file image path
 */
function saveSreenshotEntry(entry, filePath) {
  const fileContent = entry.args.snapshot;

  return new Promise(function (resolve, reject) {
    fs.writeFile(filePath, fileContent, 'base64', function(err) {
      if (err) {
        return reject(err);
      }

      resolve(filePath);
    });
  });
}

/**
 * Add timestamp over a screenshot entry
 * @param  {Object} entry
 * @param  {String} filePath
 * @return {Promise}
 */
function drawTimestamp(entry, filePath) {
  gm(filePath).size(function(err, value) {
    const h = value.height;
    const w = value.width;

    gm(filePath)
      .fill('black')
      .drawRectangle(w - 300, h - 100, w, h)
      .fill('white')
      .drawText(w - 290, h -10, entry.ts)
      .write(filePath, function (err) {
        if (!err) console.log('done');
      });
  });
}

/**
 * Create a folder if not aldready existing
 * @param  {String} folderPath
 * @return {Promise} resolving the first created directory
 */
function createFolder(folderPath) {
  return new Promise(function (resolve, reject) {
    mkdirp(folderPath, {}, function(err, res) {
      if (err) {
        return reject(err);
      }

      resolve(res);
    });
  });
}

module.exports = function(params) {
  if (!params || !params.entries) {
    throw new Error('entries parameter should be present');
  } else if (!Array.isArray(params.entries)) {
    throw new Error('It doesn\'t seams that the entries params is an array');
  }

  const timeline = params.entries;

  return {
    /**
     * Return a list of filtered screenshot entries
     * @return {Object[]}
     */
    getScreenshotEntries: function () {
      return timeline.filter(isScreenshotEntry);
    },

    /**
     * Save all the timeline screenshots in a folder
     * @param  {Object} opts
     * @return {String[]} the list of image names
     */
    saveScreenshots: function(opts) {
      opts = opts || {};
      const imageNamePrefix = opts.prefix ? opts.prefix  + '-' : '';

      let folderPath = opts.folder || './screenshots';
      if (!path.isAbsolute(folderPath)) {
        folderPath = path.resolve(process.cwd(), folderPath);
      }

      const saveScreenshots = this.getScreenshotEntries()
        .sort((a, b) => a.ts < b.ts)
        .map((entry, index) => {
          const fileName = `${imageNamePrefix}${index}.png`;
          const filePath = path.resolve(folderPath, fileName);
          return saveSreenshotEntry(entry, filePath);
        });

      return createFolder(folderPath)
        .then(() => Promise.all(saveScreenshots));
    }
  };
}
