'use strict'

const path = require('path')
const fs = require('fs-promise')
const exec = require('child_process').exec

/**
 * Return true if the passed entry is a screenshot
 * @param  {timelineEntry}  entry
 * @return {Boolean}
 */
function isScreenshotEntry (entry) {
  return entry.name === 'Screenshot'
}

/**
 * Add a padding in front of a number
 * @param  {Number} number  to convert
 * @param  {Number} length  expected string length
 * @return {String}
 */
function padLeft (number, length) {
  let ret = number + ''
  while (ret.length < length) {
    ret = '0' + ret
  }
  return ret
}

/**
 * Get the start and end time stamps of the timeline
 * @param  {timelineEntry[]} timeline
 * @return {Object}                       containing the start and end timestamp
 */
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
 * @param  {timelineEntry} entry
 * @param  {String} filePath
 * @return {Promise}              resolving the file image path
 */
function saveSreenshotEntry (entry, filePath) {
  const fileContent = entry.args.snapshot
  return fs.outputFile(filePath, fileContent, 'base64')
}

/**
 * Convert and save an array of screenshots to a gif
 * @param  {String} folderPath
 * @param  {String} gifPath
 * @param  {Object} opts
 * @return {Promise}            resolve with the path of the created gif
 */
function convertFolderToGif (folderPath, gifPath, opts) {
  const convertArgs = [
    folderPath + '/*.png',
    `-set delay 1x${opts.fps}`,
    '-loop 0',
    gifPath
  ].join(' ')

  return new Promise(function (resolve, reject) {
    exec('convert ' + convertArgs, function (err) {
      if (err) {
        return reject(err)
      }
      resolve(gifPath)
    })
  })
}

/**
 * Get a list of entries at the right fps
 * @param  {timelineEntry[]} entries
 * @param  {Object} timeBoundaries    object containing the start and end timestamps
 * @param  {Object} opts
 * @return {timelineEntry[]}          updated entry list
 */
function adjustScreenshotsEntries (entries, timeBoundaries, opts) {
  const accumulator = []
  const tsStep = 1 / opts.fps * Math.pow(10, 6)

  let tsRunner = timeBoundaries.start
  let entryPointer = 0

  while (tsRunner <= timeBoundaries.end) {
    while (entryPointer < entries.length - 1 &&
          tsRunner >= entries[entryPointer].ts) {
      entryPointer++
    }

    accumulator.push(entries[entryPointer])
    tsRunner += tsStep
  }

  return accumulator
}

/**
 * Save images from a timeline in a folder
 * @param  {timelineEntry[]} entries  timeline to convert
 * @param  {Object} opts              export options
 * @return {Promise}                  resolved with the folder path
 */
function toImages (entries, opts) {
  opts = Object.assign({
    output: './screenshots',
    fps: 10
  }, opts)

  const screenshotsEntries = entries.filter(isScreenshotEntry)
  const timeBoundaries = getTimeBoundaries(entries)
  const adjustedSreenshotEntries = adjustScreenshotsEntries(screenshotsEntries, timeBoundaries, opts)

  const saveAll = adjustedSreenshotEntries.map(function (entry, index) {
    const fileName = `screenshot-${padLeft(index, 4)}.png`
    const filePath = path.resolve(opts.output, fileName)
    return saveSreenshotEntry(entry, filePath)
  })

  return Promise.all(saveAll)
}

/**
 * Convert timeline to a gif
 * @param  {timelineEntry[]} entries  timeline to convert
 * @param  {Object} opts              export options
 * @return {Promise}                  resolved with the gif path
 */
function toGif (entries, opts) {
  opts = Object.assign({
    output: 'timeline.gif',
    tmp: '/tmp/screenshots',
    fps: 10
  }, opts)

  const toImagesOpts = {
    fps: opts.fps,
    output: opts.tmp
  }

  return fs.emptyDir(opts.tmp)
    .then(() => toImages(entries, toImagesOpts))
    .then(() => convertFolderToGif(opts.tmp, opts.output, opts))
}

module.exports = {
  toImages,
  toGif
}
