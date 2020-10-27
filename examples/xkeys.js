const { XKeys } = require('../dist/index')

// Connect to an x-keys panel:
var myXkeysPanel = new XKeys()

// Listen to pressed keys:
myXkeysPanel.on('down', keyIndex => {
	console.log('Key pressed: ' + keyIndex)

	// Light up a button when pressed:
	myXkeysPanel.setBacklight(keyIndex, true)
})
// Listen to released keys:
myXkeysPanel.on('up', keyIndex => {
	console.log('Key released: ' + keyIndex)

	// Turn off button light when released:
	myXkeysPanel.setBacklight(keyIndex, false)
})

// Listen to jog wheel changes:
myXkeysPanel.on('jog', deltaPos => {
	console.log('Jog position has changed: ' + deltaPos)
})
// Listen to shuttle changes:
myXkeysPanel.on('shuttle', shuttlePos => {
	console.log('Shuttle position has changed: ' + shuttlePos)
})
// Listen to joystick changes:
myXkeysPanel.on('joystick', position => {
	console.log('Joystick has changed:' + position) // {x, y, z}
})
