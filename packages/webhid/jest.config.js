// eslint-disable-next-line node/no-unpublished-require
const base = require('../../jest.config.base')
const packageJson = require('./package')

module.exports = {
	...base,
	name: packageJson.name,
	displayName: packageJson.name,
}
