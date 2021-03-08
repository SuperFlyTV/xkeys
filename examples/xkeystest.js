


const { XKeys } = require('../') // the '../' here is so we can run in the VS Code Terminal 

const HID = require('node-hid')
const devices = HID.devices()

// I would like to be able to search the products.ts data 
// How do we connect to 2 or more devices?
//Can we connect, call genData, check the UID and then disiconnect?
// sould be able to list which PIDs (more than one) we would like to connect to


var badPID = 1443 // hard coded PID to exclude for tests

const connectedXKeys = devices.filter(device => {
	return (device.vendorId === XKeys.vendorId && device.usagePage === 12 && device.usage === 1 && (device.interface===0 ||device.interface===-1 )&& device.productId!==badPID) // Make sure that it is consumer page and the interface-property is set to 0 or -1
    })

if (connectedXKeys.length) {
	for (i = 0; i < connectedXKeys.length; i++) {
		console.log("HID Hardware string: "+ connectedXKeys[i].product);
		console.log("HID Product ID: "+connectedXKeys[i].productId);
		//if (connectedXKeys[i].productId===badPID)
		//var myXkeysPanel = new XKeys(connectedXKeys[i].path)
	  } 

	var myXkeysPanel = new XKeys(connectedXKeys[0].path) // connecting to the first one in the array is cheating but after the filter above it sort of works. 
	
	console.log("Interface= "+connectedXKeys[0].interface+ " UsagePage= " +connectedXKeys[0].usagePage + " usage= " +connectedXKeys[0].usage)
} else {
	
	console.log("Could not find any connected X-keys panels.")
	process.exit() // no need to go on
	
}



myXkeysPanel.getVersion()// this will force a data report to get version and  UID  and PID

// Listen for firmware version to be returned from X-keys 
myXkeysPanel.on('firmVersion', ( firmVersion, UID, PID) => {
	console.log(`Connected to X-keys: Firmware Version: ${firmVersion} PID: ${PID} UID: ${UID}`)  // reports the Unit ID UID when sent by a generateData call. 

})

myXkeysPanel.generateData()  // this will force a data report to check UID and other states if needed. 

// Listen for unitID to be returned from X-keys 
myXkeysPanel.on('unitID', ( UID, PID, productName) => {
	console.log('Connected to X-keys: Name: '+ productName+' PID: '+PID+' UID: '+UID)  // reports the Unit ID UID when sent by a generateData call. 

})

// Listen to pressed keys:
myXkeysPanel.on('down', (keyIndex, keyLocation,  UID, PID, productName, timeStamp) => {
	console.log('Key pressed:  Index: ' + keyIndex + ' Row: '+ keyLocation[0] +' Col: '+ keyLocation[1]+' UID: ' + UID+' PID: '+PID+' Name: '+ productName+ ' Time Stamp: '+ timeStamp)  // report the key index and the Unit ID UID

	// Light up a button when pressed:
	myXkeysPanel.setBacklight(keyIndex, true,true)
	
	//if(UID!==5) myXkeysPanel.setUID(5)  // test of setting UID Caution: this is an EEPROM command, do not set it often 


	myXkeysPanel.setIndicatorLED(2,true,true)  // test of setting LEDs at the top, 1 is green 2 is red
	//myXkeysPanel.writeLcdDisplay(1,'Moose + Rat',true)  // test of setting lcd line 1, (line #, text, backlight)
	//myXkeysPanel.writeLcdDisplay(2,'Wombat & Cow',true)  // test of setting lcd line 2

})
// Listen to released keys:
myXkeysPanel.on('up', (keyIndex, keyLocation,  UID, PID, productName,timeStamp) => {
	console.log('Key released: Index: ' + keyIndex + ' Row: '+ keyLocation[0] +' Col: '+ keyLocation[1]+' UID: ' + UID+' PID: '+PID+' Name: '+ productName+ ' Time Stamp: '+ timeStamp)

	// Turn off button light when released:
	myXkeysPanel.setBacklight(keyIndex, false,true)
	myXkeysPanel.setIndicatorLED(2,false,false) 
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
