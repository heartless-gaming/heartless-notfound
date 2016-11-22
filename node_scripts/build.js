'use strict'

const Promise = require('bluebird')
const chalk = require('chalk')
const dateFormat = require('dateformat')
const rmrf = require('rmfr')
const compressor = require('node-minify')
const imagemin = require('imagemin')
const imageminJpegtran = require('imagemin-jpegtran')
const imageminOptipng = require('imagemin-optipng')
const imageminSvgo = require('imagemin-svgo')

// http://bluebirdjs.com/docs/api/promisification.html
let fs = Promise.promisifyAll(require('fs'))
let ncp = Promise.promisifyAll(require('ncp'))

// File & folder path used by this program
let appFolder = 'app/'
let buildFolderName = 'dist'
let buildFolderNameCss = 'css'
let buildFolderNameJs = 'js'
let buildFolderNameImg = 'img'
let fontFolderName = 'font'
let cssFileName = 'style.css'
let jsFileName = 'script.js'
let extraFilesToCopy = [
  'contact.php',
  'about.html'
]
let extraFolderToCopy = [
  'inc',
  'template-parts'
]

/*
 * You should not have to edit stuff beyond this warning
 */

// console.log for 1337 h4X0r
let log = console.log.bind(console)

let catchError = function (err) { console.error(err) }

// Greeting Message
log(chalk.red('  #####   '))
log(chalk.red(' #######  '))
log(chalk.red('#  ###  # ') + chalk.grey(' The mighty Skull is building your project.'))
log(chalk.red('#   #   # '))
log(chalk.red('######### ') + chalk.grey(' Please wait while I get your stuff ready for production.'))
log(chalk.red(' ### ###  '))
log(chalk.red('  #####   '))
log(chalk.red('  # # #   ') + chalk.grey(' Play more, care less, be an heartless'))

let cleanDistFolder = function () {
  return rmrf(buildFolderName)
    .then(function (res) {
      log(chalk.green('[' + dateFormat(new Date(), 'HH:MM:ss') + '] ') + 'Old build folder cleaned')
    })
    .catch(catchError)
}

// Promise Version of :
// https://stackoverflow.com/questions/11293857/fastest-way-to-copy-file-in-node-js
let copyFile = function (source, target) {
  return new Promise(function (resolve, reject) {
    let readStream = fs.createReadStream(source)
    let writeStream = fs.createWriteStream(target)

    readStream
      .on('error', function (err) {
        reject(err)
      })

    writeStream
      .on('error', function (err) {
        reject(err)
      })
      .on('close', function (ex) {
        resolve()
      })

    return readStream.pipe(writeStream)
  })
}

let copyFolder = function (folderName) {
  return ncp.ncpAsync(appFolder + folderName, buildFolderName + '/' + folderName)
    .then(function () {
      log(chalk.green('[' + dateFormat(new Date(), 'HH:MM:ss') + '] ') + folderName + ' folder copied')
    })
    .catch(console.err)
}

let compressCss = function () {
  return new Promise(function (resolve, reject) {
    return new compressor.minify({
      type: 'clean-css',
      fileIn: appFolder + buildFolderNameCss + '/' + cssFileName,
      fileOut: buildFolderName + '/' + buildFolderNameCss + '/' + cssFileName,
      callback: function (err, min) {
        if (err) {
          reject(err)
        } else {
          resolve(min)
        }
      }
    })
  })
}

let compressJs = function () {
  return new Promise(function (resolve, reject) {
    return new compressor.minify({
      type: 'uglifyjs',
      fileIn: appFolder + buildFolderNameJs + '/' + jsFileName,
      fileOut: buildFolderName + '/' + buildFolderNameJs + '/' + jsFileName,
      callback: function (err, min) {
        if (err) {
          reject(err)
        } else {
          resolve(min)
        }
      }
    })
  })
}

// TODO delete that stuff
let minifyCss = function () {
  return compressCss()
    .then(function (res) {
      log(chalk.green('[' + dateFormat(new Date(), 'HH:MM:ss') + '] ') + 'CSS Minified')
    })
    .catch(console.err)
}

// TODO delete that stuff
let minifyJs = function () {
  return compressJs()
    .then(function (res) {
      log(chalk.green('[' + dateFormat(new Date(), 'HH:MM:ss') + '] ') + 'JS Minified')
    })
    .catch(console.err)
}

let imgmin = function () {
  return new Promise(function (resolve, reject) {
    return imagemin([appFolder + 'img/*.{gif,jpg,png,svg}'], buildFolderName + '/' + buildFolderNameImg, {
      plugins: [
        imageminJpegtran({progressive: true}),
        imageminOptipng(),
        imageminSvgo()
        // imageminWebp({quality: 50})
      ]
    }).then(files => {
      log(chalk.green('[' + dateFormat(new Date(), 'HH:MM:ss') + '] ') + 'Images optimized')
      resolve()
    }).catch(err => {
      reject(err)
    })
  })
}

let copyFont = function () {
  return ncp.ncpAsync(appFolder + fontFolderName, buildFolderName + '/' + fontFolderName)
    .then(function () {
      log(chalk.green('[' + dateFormat(new Date(), 'HH:MM:ss') + '] ') + 'Font folder copied')
    })
    .catch(console.err)
}

let copyHtml = function () {
  return copyFile(appFolder + 'index.html', buildFolderName + '/index.html')
    .then(function (res) {
      log(chalk.green('[' + dateFormat(new Date(), 'HH:MM:ss') + '] ') + 'index.html copied')
    })
    .catch(console.err)
}

let copyExtraFolder = function () {
  return Promise.all(extraFolderToCopy.map(function (folder) {
    return copyFolder(folder)
  }))
}

let copyExtraFile = function () {
  return Promise.all(extraFilesToCopy.map(function (file) {
    return copyFile(appFolder + file, buildFolderName + '/' + file)
  }))
}

cleanDistFolder()
  .then(minifyCss)
  .then(minifyJs)
  .then(imgmin)
  .then(copyHtml)
  .then(copyFont)
  .then(copyExtraFolder)
  .then(copyExtraFile)
  .catch(catchError)
