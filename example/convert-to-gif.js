'use strict'

const fs = require('fs')
const JSONStream = require('JSONStream')
const _ = require('highland')
const spawn = require('child_process').spawn

// const convert = spawn('convert', ['gif:-', '-'])

const readLoading = fs.createReadStream('./example/loading.json')
const isScreenshotEntry = data => data.name === 'Screenshot'

_(readLoading).through(JSONStream.parse('*'))
  .filter(isScreenshotEntry)
  .each(data => console.log(data.name))
  // .pipe(es.mapSync(data => new Buffer(data.args.snapshot, 'base64')))
  // .pipe()

// let i = 0
// s.on('end', () => console.log('end'))
// s.on('data', data => console.log(i++))
// s.on('error', err => console.log(err))
