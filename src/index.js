'use strict'

const path = require('path')
const fs = require('fs-promise')
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

function getTimeBoundaries (timeline) {
  const devToolTimestamps = timeline
    .filter(entry => entry.cat === 'devtools.timeline')
    .map(entry => entry.ts)
    .sort()

  return {
    start: devToolTimestamps[0],
    end: devToolTimestamps[devToolTimestamps.length - 1]
  }
}

/**
 * Saves a screenshot entry on the disk
 * @param  {Object} entry
 * @param  {String} filePath
 * @return {Promise} resolving the file image path
 */
function saveSreenshotEntry (entry, filePath) {
  const fileContent = entry.args.snapshot
  return fs.outputFile(filePath, fileContent, 'base64')
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

module.exports = function (entries) {
  if (!entries) {
    throw new Error('You must specify the entry')
  } else if (!Array.isArray(entries)) {
    throw new Error('It doesn\'t seams that the entries params is an array')
  }

  const screenshotsEntries = entries.filter(isScreenshotEntry)
  const timeBoundaries = getTimeBoundaries(entries)

  function adjustScreenshotsEntries (opts) {
    const accumulator = []
    const tsStep = 1 / opts.fps * Math.pow(10, 6)
    let tsRunner = timeBoundaries.start
    let entryPointer = 0

    while (tsRunner <= timeBoundaries.end) {
      while (entryPointer < screenshotsEntries.length - 1 &&
            tsRunner >= screenshotsEntries[entryPointer].ts) {
        entryPointer++
      }

      accumulator.push(screenshotsEntries[entryPointer])
      tsRunner += tsStep
    }

    return accumulator
  }

  return {
    /**
     * Save all the timeline screenshots in a folder
     * @param  {Object} opts
     * @return {String[]} the list of image names
     */
    toImages: function (opts) {
      opts = Object.assign({}, opts, {
        folderPath: './screenshots',
        fps: 10
      })

      const adjustedSreenshotEntries = adjustScreenshotsEntries(opts)

      const saveAll = adjustedSreenshotEntries.map(function (entry, index) {
        const fileName = `screenshot-${utils.padLeft(index, 4)}.png`
        const filePath = path.resolve(opts.folderPath, fileName)
        return saveSreenshotEntry(entry, filePath)
      })

      return Promise.all(saveAll)
    },

    toGif: function (opts) {
      opts = Object.assign({}, opts, {
        filePath: 'timeline.gif',
        fps: 10
      })

      const mergeImages = function () {
        return new Promise(function (resolve, reject) {
          gm('screenshots/*.png')
            .delay(1 / opts.fps * 100)
            .loop(1)
            .write(opts.filePath, function (err) {
              if (err) {
                return reject(err)
              }
              resolve()
            })
        })
      }

      return this.toImages(opts)
        .then(mergeImages)
    }
  }
}
