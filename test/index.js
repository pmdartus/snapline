'use strict'

const tap = require('tap')
const snapline = require('../src')
const exampleTimeline = require('./example.json')

tap.test('factory', t => {
  t.test('it throw an exception if entries not specified', t => {
    t.throw(() => snapline())
    t.end()
  })

  t.test('it throw an exception if entries not specified', t => {
    t.throw(() => snapline('I gonna blow-up'))
    t.end()
  })

  t.test('it accepts a well formatted timeline', t => {
    snapline(exampleTimeline)
    t.end()
  })

  t.end()
})
