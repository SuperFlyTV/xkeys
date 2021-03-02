const { XKeys } = require('xkeys')


const HID = require('node-hid')


const devices = HID.devices()
const connectedXKeys = devices.filter(device => {
	return (device.vendorId === XKeys.vendorId && device.interface === 0) // Make sure that the interface-property is set to 0 
    })

if (connectedXKeys.length) {
	var myXkeysPanel = new XKeys(connectedXKeys[1].path)
} else {
	console.log("Could not find any connected X-keys panels.")
}


//console.log('Connected to: ' + connectedXKeys[1].product +' PID: '+ connectedXKeys[1].productId )//product here is the hardware name, not always the best name to use
// Connect to an x-keys panel:
//var myXkeysPanel = new XKeys()

myXkeysPanel.generateData()  // this will force a data report to check UID and other states if needed. 

// Listen to for unitID:
myXkeysPanel.on('unitID', ( UID, PID, productName) => {
	console.log('Connected to X-keys: Name: '+ productName+' PID: '+PID+' UID: '+UID)  // reports the Unit ID UID

})

// Listen to pressed keys:
myXkeysPanel.on('down', (keyIndex,   UID, PID, productName) => {
	console.log('Key pressed: ' + keyIndex +' UID: '+UID+' PID: '+PID+' Name: '+ productName)  // report the key index and the Unit ID UID

	// Light up a button when pressed:
	myXkeysPanel.setBacklight(keyIndex, true)
})
// Listen to released keys:
myXkeysPanel.on('up', (keyIndex,  UID, PID, productName) => {
	console.log('Key released: ' + keyIndex+ ' UID: ' + UID+' PID: '+PID+' Name: '+ productName)

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
	console.log('Joystick has changed: X= ' + position.x +' Y= ' + position.y +' Z= ' + position.z) // {x, y, z}
})
// Listen to t-bar changes:
myXkeysPanel.on('tbar', (position) => {
    console.log('T-bar position has changed: ' + position )
})
