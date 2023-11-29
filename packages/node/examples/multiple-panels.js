const { XKeysWatcher } = require('xkeys')

/*
	This example shows how multiple devices should be handled, using automaticUnitIdMode.

	The main reason to use automaticUnitIdMode is that it enables us to track re-connections of the same device,
	vs a new device being connected to the system.

	The best way to test how it works is to have 2 panels of the same type.	Connect one, then disconnect it and
	notice the difference between reconnecting the same one vs a new one.

	To reset the unitId of the panels, run the reset-unitId.js example.
*/

/** A persistent memory to store data for connected panels */
const memory = {}

// Set up the watcher for xkeys:
const watcher = new XKeysWatcher({
	automaticUnitIdMode: true,

	// If running on a system (such as some linux flavors) where the 'usb' library doesn't work, enable usePolling instead:
	// usePolling: true,
	// pollingInterval: 1000,
})
watcher.on('error', (e) => {
	console.log('Error in XKeysWatcher', e)
})

watcher.on('connected', (xkeysPanel) => {
	// This callback is called when a panel is initially connected.
	// It won't be called again on reconnection (use the 'reconnected' event instead).

	console.log(`A new X-keys panel of type ${xkeysPanel.info.name} connected`)

	const newName = 'HAL ' + (Object.keys(memory).length + 1)

	// Store the name in a persistent store:
	memory[xkeysPanel.uniqueId] = {
		name: newName,
	}
	console.log(
		`I'm going to call this panel "${newName}", it has productId=${xkeysPanel.info.productId}, unitId=${xkeysPanel.info.unitId}`
	)

	xkeysPanel.on('disconnected', () => {
		console.log(`X-keys panel ${memory[xkeysPanel.uniqueId].name} was disconnected`)
	})
	xkeysPanel.on('error', (...errs) => {
		console.log('X-keys error:', ...errs)
	})

	xkeysPanel.on('reconnected', () => {
		console.log(`Hello again, ${memory[xkeysPanel.uniqueId].name}!`)
	})

	// Listen to pressed buttons:
	xkeysPanel.on('down', (keyIndex, metadata) => {
		console.log(`Button ${keyIndex} pressed`)
	})
})

// To stop watching, call
// watcher.stop().catch(console.error)
