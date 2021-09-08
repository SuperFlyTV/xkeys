const { XKeysWatcher } = require('../dist')

/*
	This example shows how multiple devices should be handled, using automaticUnitIdMode.
*/

const memory = {}


// Set up the watcher for xkeys:
const watcher = new XKeysWatcher({
	automaticUnitIdMode: true
})

watcher.on('connected', (xkeysPanel) => {
	console.log(`A new X-keys panel of type ${xkeysPanel.info.name} connected`)

	const newName = 'HAL ' + (Object.keys(memory).length + 1)

	// Store the name in a persistent store:
	memory[xkeysPanel.uniqueId] = {
		name: newName
	}
	console.log(`I'm going to call this panel "${newName}", it has productId=${xkeysPanel.info.productId}, unitId=${xkeysPanel.info.unitId}`)


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
	// Listen to released buttons:
	// xkeysPanel.on('up', (keyIndex, metadata) => {
	// 	console.log('Button released', keyIndex, metadata)
	// })

	// // Listen to jog wheel changes:
	// xkeysPanel.on('jog', (index, deltaPos, metadata) => {
	// 	console.log(`Jog ${index} position has changed`, deltaPos, metadata)
	// })
	// // Listen to shuttle changes:
	// xkeysPanel.on('shuttle', (index, shuttlePos, metadata) => {
	// 	console.log(`Shuttle ${index} position has changed`, shuttlePos, metadata)
	// })
	// // Listen to joystick changes:

	// xkeysPanel.on('joystick', (index, position, metadata) => {
	// 	console.log(`Joystick ${index} position has changed`, position, metadata) // {x, y, z}
	// })
	// // Listen to t-bar changes:
	// xkeysPanel.on('tbar', (index, position, metadata) => {
	// 	console.log(`T-bar ${index} position has changed`, position, metadata)
	// })
})

// To stop watching, call
// watcher.stop().catch(console.error)
