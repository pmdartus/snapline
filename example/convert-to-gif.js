'use strict'

const snapline = require('../src')
const timeline = require('./loading.json')

snapline(timeline)
  .toGif()
  .then(gifPath => console.log(`The gif(t) is ready: ${gifPath}!`))
  .catch(console.error)
