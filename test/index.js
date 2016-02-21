'use strict'

const tap = require('tap')
const timelineScreenshot = require('../src')
const exampleTimeline = require('./example.json')

tap.test('factory', t => {
  t.test('it throw an exception if entries not specified', t => {
    t.throw(() => timelineScreenshot())
    t.end()
  })

  t.test('it throw an exception if entries not specified', t => {
    t.throw(() => timelineScreenshot('I gonna blow-up'))
    t.end()
  })

  t.test('it accepts a well formatted timeline', t => {
    timelineScreenshot(exampleTimeline)
    t.end()
  })

  t.end()
})
