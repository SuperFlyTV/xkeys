const { XKeysWatcher } = require('xkeys')

/*
	This example connects to any conncted x-keys panels and logs
	whenever a button is pressed or analog thing is moved
*/

// Set up the watcher for xkeys:
const watcher = new XKeysWatcher({
	// automaticUnitIdMode: false
	// usePolling: false
	// pollingInterval= 1000
})

watcher.on('error', (e) => {
	console.log('Error in XKeysWatcher', e)
})
watcher.on('connected', (xkeysPanel) => {
	console.log(`X-keys panel of type ${xkeysPanel.info.name} connected`)

	xkeysPanel.on('disconnected', () => {
		console.log(`X-keys panel of type ${xkeysPanel.info.name} was disconnected`)
		// Clean up stuff
		xkeysPanel.removeAllListeners()
	})
	xkeysPanel.on('error', (...errs) => {
		console.log('X-keys error:', ...errs)
	})

	// Listen to pressed buttons:
	xkeysPanel.on('down', (keyIndex, metadata) => {
		console.log('Button pressed ', keyIndex, metadata)

		// Light up a button when pressed:
		xkeysPanel.setBacklight(keyIndex, 'red')
	})
	// Listen to released buttons:
	xkeysPanel.on('up', (keyIndex, metadata) => {
		console.log('Button released', keyIndex, metadata)

		// Turn off button light when released:
		xkeysPanel.setBacklight(keyIndex, false)
	})

	// Listen to jog wheel changes:
	xkeysPanel.on('jog', (index, deltaPos, metadata) => {
		console.log(`Jog ${index} position has changed`, deltaPos, metadata)
	})
	// Listen to shuttle changes:
	xkeysPanel.on('shuttle', (index, shuttlePos, metadata) => {
		console.log(`Shuttle ${index} position has changed`, shuttlePos, metadata)
	})
	// Listen to joystick changes:

	xkeysPanel.on('joystick', (index, position, metadata) => {
		console.log(`Joystick ${index} position has changed`, position, metadata) // {x, y, z}
	})
	// Listen to t-bar changes:
	xkeysPanel.on('tbar', (index, position, metadata) => {
		console.log(`T-bar ${index} position has changed`, position, metadata)
	})
})

// To stop watching, call
// watcher.stop().catch(console.error)
