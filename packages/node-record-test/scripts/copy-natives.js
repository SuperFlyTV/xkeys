const find = require('find');
const os = require('os')
const path = require('path')
const fs = require('fs-extra')

const arch = os.arch()
const platform = os.platform()
const prebuildType = process.argv[2] || `${platform}-${arch}`

// function isFileForPlatform(filename) {
//     if (filename.indexOf(path.join('prebuilds', prebuildType)) !== -1) {
//         return true
//     } else {
//         return false
//     }
// }

const sourceDirName = path.join(__dirname, '../../../')
// const targetDirName = path.join(__dirname, '../')

console.log('Copy-Natives --------------')
console.log('Looking for modules in', sourceDirName, 'for', prebuildType)
// console.log('to copy into ', targetDirName)

const modulesToCopy = new Map()
find.file(/\.node$/, path.join(sourceDirName, 'node_modules'), (files) => {
    files.forEach(fullPath => {
        console.log(fullPath)
        if (fullPath.indexOf(sourceDirName) === 0) {
            console.log('a')
            const file = fullPath.substr(sourceDirName.length)

            const moduleName = file.match(/node_modules[\/\\]([^\\\/]+)/)
            if (moduleName) {
                modulesToCopy.set(moduleName[1], true)
            }
        }
    })

    modulesToCopy.forEach((_, moduleName) => {
        console.log('copying', moduleName)

        fs.copySync(path.join(sourceDirName, 'node_modules', moduleName) , path.join('deploy/node_modules/', moduleName ))
    })
})
