import { XKeys, XKeysWatcher } from '../'

// Set up the watcher for xkeys
const watcher = new XKeysWatcher()

watcher.on('connected', (xkeysPanel: XKeys) => {
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
	xkeysPanel.on('down', (btnIndex, metadata) => {
		console.log('Button pressed ', btnIndex, metadata)

		// Light up a button when pressed:
		xkeysPanel.setBacklight(btnIndex, 'red')
	})
	// Listen to released buttons:
	xkeysPanel.on('up', (btnIndex, metadata) => {
		console.log('Button released', btnIndex, metadata)

		// Turn off button light when released:
		xkeysPanel.setBacklight(btnIndex, false)
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
// watcher.stop()
