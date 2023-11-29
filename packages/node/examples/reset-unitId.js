const { XKeysWatcher } = require('xkeys')

/*
	This example looks up all connected X-keys panels
	and resets the unitId of them
*/

const watcher = new XKeysWatcher()
watcher.on('error', (e) => {
	console.log('Error in XKeysWatcher', e)
})

watcher.on('connected', (xkeysPanel) => {
	console.log(
		`Connected to "${xkeysPanel.info.name}", it has productId=${xkeysPanel.info.productId}, unitId=${xkeysPanel.info.unitId}`
	)

	if (xkeysPanel.info.unitId !== 0) {
		console.log('Resetting unitId...')
		xkeysPanel.setUnitId(0)
		console.log('Resetting unitId done')
	} else {
		console.log('unitId is already 0')
	}
})
