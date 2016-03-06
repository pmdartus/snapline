'use strict'

const snapline = require('..')
const timeline = require('./loading.json')

snapline.toGif(timeline, { output: 'test.gif', fps: 10 })
  .then(gifPath => console.log(`The gif(t) is ready: ${gifPath}!`))
  .catch(console.error)
