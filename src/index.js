'use strict'

const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const gm = require('gm').subClass({imageMagick: true})

/**
 * Return true if the passed entry is a screenshot
 * @param  {Object}  entry
 * @return {Boolean}
 */
function isScreenshotEntry (entry) {
  return entry.name === 'Screenshot'
}

/**
 * Saves a screenshot entry on the disk
 * @param  {Object} entry
 * @param  {String} filePath
 * @return {Promise} resolving the file image path
 */
function saveSreenshotEntry (entry, filePath) {
  const fileContent = entry.args.snapshot

  return new Promise(function (resolve, reject) {
    fs.writeFile(filePath, fileContent, 'base64', function (err) {
      if (err) {
        return reject(err)
      }

      resolve(filePath)
    })
  })
}

/**
 * Add timestamp over a screenshot entry
 * @param  {Object} entry
 * @param  {String} filePath
 * @return {Promise}
 */
function drawTimestamp (entry, filePath) {
  return new Promise(function (resolve, reject) {
    gm(filePath).size(function (err, value) {
      if (err) {
        return reject(err)
      }

      const h = value.height
      const w = value.width

      gm(filePath)
        .fill('black')
        .drawRectangle(w - 300, h - 100, w, h)
        .fill('white')
        .drawText(w - 290, h - 10, entry.relTs)
        .write(filePath, function (err) {
          if (err) {
            return reject(err)
          }
          resolve()
        })
    })
  })
}

/**
 * Takes a list of screenshots and generate missing entries
 * @param  {[type]} entries [description]
 * @return {[type]}         [description]
 */
function generateMissingEntries (entries, framesPerSec) {
  const framesPerMs = (framesPerSec || 10) / 1000
  const startTime = entries[0].ts

  return entries
    .map(function (entry) {
      return Object.assign({
        relTs: (entry.ts - startTime) / 1000
      }, entry)
    })
    .reduce(function (list, entry, index, array) {
      list.push(entry)

      const diffWithNext = index < array.length - 1 ? array[index + 1].relTs - array[index].relTs : 0
      const duplateFrameNb = Math.floor(diffWithNext * framesPerMs)

      for (let i = 0; i < duplateFrameNb; i++) {
        list.push(Object.assign({
          relTs: entry.relTs + i * (1 / framesPerMs)
        }, entry))
      }

      return list
    }, [])
}

/**
 * Create a folder if not aldready existing
 * @param  {String} folderPath
 * @return {Promise} resolving the first created directory
 */
function createFolder (folderPath) {
  return new Promise(function (resolve, reject) {
    mkdirp(folderPath, {}, function (err, res) {
      if (err) {
        return reject(err)
      }

      resolve(res)
    })
  })
}

module.exports = function (params) {
  if (!params || !params.entries) {
    throw new Error('entries parameter should be present')
  } else if (!Array.isArray(params.entries)) {
    throw new Error('It doesn\'t seams that the entries params is an array')
  }

  const timeline = params.entries

  return {
    /**
     * Return a list of filtered screenshot entries
     * @return {Object[]}
     */
    getScreenshotEntries: function () {
      return timeline.filter(isScreenshotEntry)
    },

    /**
     * Save all the timeline screenshots in a folder
     * @param  {Object} opts
     * @return {String[]} the list of image names
     */
    saveScreenshots: function (opts) {
      opts = opts || {}
      const imageNamePrefix = opts.prefix ? opts.prefix + '-' : ''

      let folderPath = opts.folder || './screenshots'
      if (!path.isAbsolute(folderPath)) {
        folderPath = path.resolve(process.cwd(), folderPath)
      }

      const sreenshots = generateMissingEntries(this.getScreenshotEntries())
        .map((entry, index) => {
          const fileName = `${imageNamePrefix}${index}.png`
          const filePath = path.resolve(folderPath, fileName)
          return saveSreenshotEntry(entry, filePath)
            // .then(() => drawTimestamp(entry, filePath))
        })

      return createFolder(folderPath)
        .then(() => Promise.all(sreenshots))
    },

    saveGif: function (opts) {
      const screenshotOpts = Object.assign({
        folder: '_tmp'
      })

      return this.saveScreenshots(screenshotOpts)
        .then(res => {
          gm('_tmp/*.png')
            .delay(100)
            .loop(1)
            .write('test.gif', (err) => console.log(err))
        })
    }
  }
}
