'use strict'

const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')

/**
 * Add a padding in front of a number
 * @param  {Number} number to convert
 * @param  {Number} length expected string length
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
 * Create a folder if not aldready existing else it empty the folder
 * @param  {String} folderPath
 * @return {Promise} resolving the first created directory
 */
function createFolder (folderPath) {
  const folderExists = function () {
    return new Promise(function (resolve) {
      fs.access(folderPath, fs.F_OK, function (err) {
        if (err) {
          return resolve(false)
        }

        resolve(true)
      })
    })
  }

  const emptyFolder = function () {
    return new Promise(function (resolve, reject) {
      fs.readdir(folderPath, function (err, files) {
        if (err) {
          return reject(err)
        }

        const deleteFiles = files
          .map(fileName => path.resolve(folderPath, fileName))
          .map(function (absFilePath) {
            return new Promise(function (resolve, reject) {
              fs.unlink(absFilePath, function (err) {
                if (err) {
                  return reject(err)
                }

                resolve()
              })
            })
          })

        return Promise.all(deleteFiles)
      })
    })
  }

  const createFolder = function () {
    return new Promise(function (resolve, reject) {
      mkdirp(folderPath, {}, function (err, res) {
        if (err) {
          return reject(err)
        }

        resolve(res)
      })
    })
  }

  return folderExists()
    .then(function (isExistingFolder) {
      if (isExistingFolder) {
        return emptyFolder()
      } else {
        return createFolder()
      }
    })
}

module.exports = {
  createFolder,
  padLeft
}
