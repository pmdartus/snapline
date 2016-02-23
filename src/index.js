'use strict'

const fs = require('fs')
const path = require('path')
const utils = require('./utils')
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

module.exports = function (entries) {
  if (!entries) {
    throw new Error('You must specify the entry')
  } else if (!Array.isArray(entries)) {
    throw new Error('It doesn\'t seams that the entries params is an array')
  }

  const timeline = entries

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

      const screenshotsEntries = generateMissingEntries(this.getScreenshotEntries())

      return utils.createFolder(folderPath)
        .then(function () {
          const saveAll = screenshotsEntries
            .map((entry, index) => {
              const fileName = `${imageNamePrefix}${utils.padLeft(index, 4)}.png`
              const filePath = path.resolve(folderPath, fileName)
              return saveSreenshotEntry(entry, filePath)
            })
          return Promise.all(saveAll)
        })
    },

    saveGif: function (opts) {
      const screenshotOpts = Object.assign({
        folder: '_tmp',
        filePath: 'timeline.gif'
      }, opts)

      return this.saveScreenshots(screenshotOpts)
        .then(function () {
          return new Promise(function (resolve, reject) {
            gm('_tmp/*.png')
              .delay(100)
              .loop(1)
              .write(screenshotOpts.filePath, function (err) {
                if (err) {
                  return reject(err)
                }
                resolve()
              })
          })
        })
    }
  }
}
