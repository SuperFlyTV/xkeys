const { promisify } = require('util')
const fs = require('fs')
const { exec } = require('child_process')

const fsReadFile = promisify(fs.readFile)
const fsWriteFile = promisify(fs.writeFile)

// This function installs all dependencies except node-hid
// It is used during CI/tests, where the binaries aren't used anyway

function run(command) {
	return new Promise((resolve, reject) => {
		console.log(command)
		exec(command, (err, stdout, stderr) => {
			if (stdout) console.log(stdout)
			if (stderr) console.log(stderr)
			if (err) reject(err)
			else {
				resolve()
			}
		})
	})
}

;(async () => {
	const path = './package.json'
	const orgStr = await fsReadFile(path)
	try {
		const packageJson = JSON.parse(orgStr)

		if (!packageJson.optionalDependencies) packageJson.optionalDependencies = {}
		packageJson.optionalDependencies['node-hid'] = packageJson.dependencies['node-hid']
		delete packageJson.dependencies['node-hid']
		await fsWriteFile(path, JSON.stringify(packageJson, null, 2))

		await run('yarn install --ignore-optional')

		// Restore:
		await fsWriteFile(path, orgStr)

		await run('yarn install --ignore-scripts')
	} catch (e) {
		// Restore:
		await fsWriteFile(path, orgStr)
		throw e
	}
})().then(
	() => {
		// eslint-disable-next-line no-process-exit
		process.exit(0)
	},
	(err) => {
		console.error(err)
		// eslint-disable-next-line no-process-exit
		process.exit(1)
	}
)
