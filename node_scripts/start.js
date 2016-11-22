'use strict'

let Promise = require('bluebird')
let fs = Promise.promisifyAll(require('fs'))
let chalk = require('chalk')
let dateFormat = require('dateformat')
let sass = require('node-sass')
let bs = require('browser-sync').create()

// console.log for 1337 h4X0r
let log = console.log.bind(console)

// add a '/' at the end
let appPath = {
  appFolderPath: 'app/',
  cssFolderName: 'css/',
  sassFolderName: 'scss/',
  jsFolderName: 'js/',
  imgFolderName: 'css/'
}

// Set to true for serving php for exemple
let isProxy = false

// If isProxy is enable specify the path URL where the project files are
let proxyURL = 'http://localhost/~user/wordpress-site/'

/*
 * You should not have to edit stuff beyond this warning
 */

// Greeting Message
let greetingMessage = function () {
  log(chalk.red('  #####   '))
  log(chalk.red(' #######  '))
  log(chalk.red('#  ###  # ') + chalk.grey(' The mighty Skull is starting your project.'))
  log(chalk.red('#   #   # '))
  log(chalk.red('######### ') + chalk.grey(' Happy coding !'))
  log(chalk.red(' ### ###  '))
  log(chalk.red('  #####   '))
  log(chalk.red('  # # #   ') + chalk.grey(' Play more, care less, be an heartless'))
}

greetingMessage()

// Reload all browser on HTML change
bs.watch(appPath.appFolderPath + '*.html').on('change', function () {
  bs.reload()
})

// Reload all browser on JS change
bs.watch(appPath.appFolderPath + appPath.jsFolderName + '**.js').on('change', function () {
  bs.reload()
})

// Specific compilation for SASS file
bs.watch(appPath.appFolderPath + appPath.sassFolderName + '**/*.scss', function (event, file) {
  if (event === 'change') {
    sass.render({
      file: appPath.appFolderPath + appPath.sassFolderName + 'style.scss',
      outputStyle: 'expanded',
      outFile: appPath.appFolderPath + appPath.cssFolderName + 'style.css',
      sourceMap: appPath.appFolderPath + appPath.cssFolderName + 'style.map.css'
    }, function (error, result) {
      if (error) {
        // Pretty Debug Message on sass error

        let nowFormat = dateFormat(new Date(), 'HH:MM:ss')

        log(chalk.red('[SASS ERROR ' + nowFormat + '] ') + error.file)
        log(chalk.red('[SASS ERROR ' + nowFormat + '] ') + 'On line ' + chalk.red(error.line) + ' at column ' + chalk.red(error.column))
        log(chalk.red('[SASS ERROR ' + nowFormat + '] ') + error.message)
      } else {
        // Creating css style files
        fs.writeFile(appPath.appFolderPath + appPath.cssFolderName + 'style.css', result.css, function (err) {
          if (!err) {
            // Creating css map file
            fs.writeFile(appPath.appFolderPath + appPath.cssFolderName + 'style.map.css', result.map, function (err) {
              if (!err) {
                let nowFormat = dateFormat(new Date(), '[HH:MM:ss]')
                log(nowFormat + chalk.green(' CSS Reloaded'))
              } else {
                log(err)
              }
            })
          } else {
            log(err)
          }
        })
        // Injecting the CSS change in BrowserSync
        bs.reload(appPath.appFolderPath + 'css/style.css')
      }
    })
  }
})

let startBrowserSync = function () {
  if (isProxy) {
    return bs.init({
      proxy: proxyURL
    })
  } else {
    return bs.init({
      server: './' + appPath.appFolderPath
      // proxy: 'http://hl3.hope/~skullmasher/my-project/app'
    })
  }
}

// Now init the Browsersync server
startBrowserSync()
