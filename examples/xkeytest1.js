const { XKeysWatcher } = require('../dist')

// Set up the watcher for xkeys
const watcher = new XKeysWatcher()

watcher.on('connected', (xkeysPanel) => {
	// show useful info about the panel
	console.log(`X-keys panel type: ${xkeysPanel.info.name} connected`)
	console.log(`Panel has UID:  ${xkeysPanel.info.unitId} PID: ${xkeysPanel.info.productId}  Firmware Version: ${xkeysPanel.info.firmwareVersion}`)
	console.log(`This panel has:  ${xkeysPanel.info.rowCount} Rows and  ${xkeysPanel.info.colCount} Columns`)
	//xkeysPanel.info.layout[0].name
	xkeysPanel.on('disconnected', () => {
		console.log(`X-keys panel type: ${xkeysPanel.info.name} was disconnected`)
		// Clean up stuff
		xkeysPanel.removeAllListeners()
	})
	xkeysPanel.on('error', (...errs) => {
		console.log('X-keys error:', ...errs)
	})

	// Listen to pressed keys:
	xkeysPanel.on('down', (keyIndex, metadata) => {
		console.log('Key pressed ', keyIndex, metadata)

		// Light up a button when pressed:
		xkeysPanel.setBacklight(keyIndex, 'red')
		xkeysPanel.setIndicatorLED(2, true, true) // test of setting LEDs at the top, 1 is green 2 is red
		// Show the key on the LCD if it has one. 
		xkeysPanel.writeLcdDisplay(1, 'Last Key Down ' + keyIndex, true) // test of setting lcd line 1, (line #, text, backlight)
		xkeysPanel.writeLcdDisplay(2, 'Row= ' + metadata.row + ' Col= ' + metadata.col, true) // test of setting lcd line 2
	})
	// Listen to released keys:
	xkeysPanel.on('up', (keyIndex, metadata) => {
		console.log('Key released', keyIndex, metadata)

		// Turn off button light when released:
		xkeysPanel.setBacklight(keyIndex, false)
		xkeysPanel.setIndicatorLED(2, false, false)
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
