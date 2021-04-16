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

let dirName = path.join(__dirname, '../')

console.log('Running in', dirName, 'for', prebuildType)

const modulesToCopy = new Map()
find.file(/\.node$/, path.join(dirName, 'node_modules'), (files) => {
    files.forEach(fullPath => {
        console.log(fullPath)
        if (fullPath.indexOf(dirName) === 0) {
            const file = fullPath.substr(dirName.length)
            // if (isFileForPlatform(file)) {
            if (true) {
                const moduleName = file.match(/node_modules[\/\\]([^\\\/]+)/)
                if (moduleName) {
                    modulesToCopy.set(moduleName[1], true)
                }
            }
        }
    })

    modulesToCopy.forEach((_, moduleName) => {
        console.log('copying', moduleName)

        fs.copySync(path.join(dirName, 'node_modules', moduleName) , path.join('deploy/node_modules/', moduleName ))
    })
})
