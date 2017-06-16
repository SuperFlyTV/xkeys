const HID = require('node-hid');
const EventEmitter = require('events');

// Note: This is based on info from http://xkeys.com/PISupport/DeveloperHIDDataReports.php

const VENDOR_ID = 1523;
const PRODUCTS = {
	XK24: {
		identifier: 'XK-24',
		productId: [1029,1028,1027,1249],
		columns: 	4,
		rows: 		6,
		hasPS: 		true,
		bankSize: 	32
	},
	XK4: {	// This has not been tested
		identifier: 'XK-4',
		columns: 	4,
		rows: 		1,
		hasPS: 		false, // unknown
		bankSize: 	32 // unknown
	},
	XK8: {	// This has not been tested
		identifier: 'XK-8',
		columns: 	8,
		rows: 		1,
		hasPS: 		false, // unknown
		bankSize: 	32 // unknown
	},
	XK12JOG: {	// This has not been tested
		identifier: 'XK-12 Jog',
		productId: [1062,1064],
		columns: 	4,
		rows: 		3,
		hasPS: 		true,
		hasJog: 	1,
		bankSize: 	32,
	},
	XK12JOYSTICK: {	// This has not been tested
		identifier: 'XK-12 Shuttle',
		productId: [1065,1067],
		columns: 	4,
		rows: 		3,
		hasPS: 	true,
		hasJoystick: 1,
		bankSize: 	32,
	},
	XK16: {	// This has not been tested
		identifier: 'XK-16',
		productId: [1269,1270],
		columns: 	4,
		rows: 		4, // not really rows, but the data comes like that (it is physically one row)
		hasPS: 		false, // unknown
		bankSize: 	32 // unknown
	},
	XR32: {	// This has not been tested
		identifier: 'XR-32',
		columns: 	16,
		rows: 		2,
		hasPS: 		false, // unknown
		bankSize: 	128
	},
	XK60: {	// This has not been tested
		identifier: 'XK-60',
		productId: [1239,1240],
		columns: 	10,
		rows: 		8,
		hasPS: 		true,
		banks: 		2,
		bankSize: 	80
	},
	XK80: {
		identifier: 'XK-80',
		productId: [1237,1238],
		columns: 	10,
		rows: 		8,
		hasPS: 		true,
		banks: 		2,
		bankSize: 	80
	},
	XKE128: {	// This has not been tested
		identifier: 'XKE-128',
		productId: [1227,1227,1229,1230],
		columns: 	16,
		rows: 		8,
		hasPS: 		false, // unknown
		bankSize: 	128
	}
};

class XKeys extends EventEmitter {
	constructor(devicePath) {
		super();
		const devices = HID.devices();

		if (devicePath) {
			this.devicePath = devicePath; 
			this.device = new HID.HID(devicePath);
		} else {
			// Device not provided, will then select any connected device:
			
			const connectedXKeys = devices.filter(device => {
				return device.vendorId === VENDOR_ID;
			});
			if (!connectedXKeys.length) {
				throw new Error('No X-keys are connected.');
			}
			this.devicePath = connectedXKeys[0].path;
			this.device = new HID.HID(connectedXKeys[0].path);
		}

		// Which device is it?
		this.deviceType = null;
		var deviceInfo = null;
		for (var key in devices) {
			if (devices[key].path == this.devicePath) {
				deviceInfo = devices[key];
				break;
			}
		}

		
		
		for (var key in PRODUCTS) {
			//if ( (deviceInfo.product||'').match(new RegExp('^'+PRODUCTS[key].identifier),'i')) {
			if ( 
					PRODUCTS[key].productId 
				&& 	PRODUCTS[key].productId.indexOf(deviceInfo.productId) != -1
			) {
				this.deviceType = PRODUCTS[key];
				break;
			}
		};
		
		if (! this.deviceType ) {
			console.log(this.device)
			console.log(deviceInfo)
			throw new Error(
				"Unknown/Unsupported X-keys: '"+deviceInfo.product+"' (id: "+deviceInfo.productId+").\n"+
				"Please open an issue on our github page and we'll look into it!"
			);
		}

		this._buttonStates = {};
		this._buttonStates2 = {};
		this._analogStates = {};


		this.device.on('data', data => {


			var d = data.readUInt32LE(2)

			var bit = d & (1 << 0) ? 1 : 0;
			
			// first column is on word 2

			var buttonStates = {};
			var buttonStates2 = {}; // alternative buttons, such as the program switch 'PS'
			var analogStates = {}; // Analogue states, such as jog-wheels, shuttle etc
			var d, mask, bit;
			for (var x=0; x<this.deviceType.columns; x++ ) {
				for (var y=0; y<this.deviceType.rows; y++ ) {

					var keyIndex = x*8 + y;

					d = data.readUInt32LE(2+x)

					//mask = Math.pow(2,y);

					bit = d & (1 << y) ? 1 : 0;

					buttonStates[keyIndex] = bit;
				}
			}
			if (this.deviceType.hasPS) {
				// program switch-button is on word 1
				d = data.readUInt32LE(1)
				bit = d & (1 << 0) ? 1 : 0;
				buttonStates2['PS'] = bit;
			}
			if (this.deviceType.hasJog) {
				d = data.readUInt32LE(7); // Jog
				analogStates['jog'] = (d < 128 ? d : d-256);

				d = data.readUInt32LE(8); // Shuttle
				analogStates['shuttle'] = (d < 128 ? d : d-256);
			}
			if (this.deviceType.hasJoystick) {
				d = data.readUInt32LE(7); // Joystick X
				analogStates['joystick_x'] = (d < 128 ? d : d-256);
				d = data.readUInt32LE(8); // Joystick Y
				analogStates['joystick_y'] = (d < 128 ? d : d-256);
				d = data.readUInt32LE(9); // Joystick Z (twist of joystick)
				analogStates['joystick_z'] = (d < 128 ? d : d-256);
			}

			for (var key in buttonStates) {
				// compare with previous button states:
				if ((this._buttonStates[key]||0) != buttonStates[key]) {
					if (buttonStates[key]) { // key is pressed
						this.emit('down', key);
						this.emit('downKey', key);
					} else {
						this.emit('up', key);
						this.emit('upKey', key);
					}
				}
			}
			for (var key in buttonStates2) {
				// compare with previous button states:
				if ((this._buttonStates2[key]||0) != buttonStates2[key]) {
					if (buttonStates2[key]) { // key is pressed
						this.emit('down', key);
						this.emit('downAlt', key);
					} else {
						this.emit('up', key);
						this.emit('upAlt', key);
					}
				}
			}
			for (var key in analogStates) {
				// compare with previous states:
				if (
					(this._analogStates[key]||0) != analogStates[key] 
					|| analogStates[key] != 0
				) {
					if (
							key == 'jog'
						|| 	key == 'shuttle'
					) {
						this.emit(key , analogStates[key]);
					} else if (
							key == 'joystick_x'
						|| 	key == 'joystick_y'
						|| 	key == 'joystick_z'
					) {
						this.emit('joystick', {
							x: analogStates['joystick_x'],
							y: analogStates['joystick_y'],
							z: analogStates['joystick_z'],
						});
					}
						
				}
			}

			this._buttonStates = buttonStates;
			this._buttonStates2= buttonStates2;
			this._analogStates = analogStates;
		});

		this.device.on('error', err => {
			this.emit('error', err);
		});

	}

	/**
	 * Writes a Buffer to the X-keys device
	 *
	 * @param {Buffer} buffer The buffer written to the device
	 * @returns undefined
	 */
	write(intArray) {
		for (var i in intArray) {
			intArray[i] = parseInt(intArray[i]);
		}
		try {
			return this.device.write(intArray);
		} catch (e) {
			this.emit('error',e);
		}
	}

	/**
	 * Sends a HID feature report to the X-keys device.
	 *
	 * @param {Buffer} buffer The buffer send to the device.
	 * @returns undefined
	 */
	sendFeatureReport(buffer) {
		return this.device.sendFeatureReport(StreamDeck.bufferToIntArray(buffer));
	}

	/**
	 * Returns an object with current Key states
     */
    getKeys() {
    	return Object.assign({}, this._buttonStates); // Return copy
    }

    /**
	 * Sets the LED of a key
	  * @param {keyIndex} the LED to set the color of (0 = green, 1 = red)
	  * @param {on} boolean: on or off
	  * @param {flashing} boolean: flashing or not (if on)
	  * @returns undefined
     */
    setLED(keyIndex, on, flashing) {

    	var ledIndex = 0;
    	if (keyIndex == 0) ledIndex = 6;
    	if (keyIndex == 1) ledIndex = 7;


    	var message = this.padMessage([0,179,ledIndex,(on ? (flashing ? 2 : 1) : 0)]);

    	this.write(message);
    }
    /**
	 * Sets the backlight of a key
	  * @param {keyIndex} the key to set the color of
	  * @param {on} boolean: on or off
	  * @param {flashing} boolean: flashing or not (if on)
	  * @returns undefined
     */
    setBacklight(keyIndex, on, redLight, flashing) {
    	if (keyIndex === 'PS') return; // PS-button has no backlight

    	this.verifyKeyIndex(keyIndex);
    	
    	if (redLight) {
    		keyIndex = parseInt(keyIndex) + (this.deviceType.bankSize || 0);
    	}
    	var message = this.padMessage([0, 181, keyIndex, (on ? (flashing ? 2 : 1) : 0 ) , 1]);
    	this.write(message);
    }
    /**
	 * Sets the backlightintensity of the device
	  * @param {intensity} 0-255
	  * @returns undefined
     */
    setBacklightIntensity(intensity) {
    	intensity = Math.max(Math.min(intensity,255),0);
    	var message = [];
    	if (this.deviceType.banks == 2 ) {
    		message = this.padMessage([0,187,intensity, intensity]);
    	} else {
    		message = this.padMessage([0,187,intensity]);
    	}

    	this.write(message);
    }
    /**
	 * Sets the backlight of all keys
	  * @param {on} boolean: on or off
	  * @param {redLight} boolean: if to set the red or blue backlights
	  * @returns undefined
     */
    setAllBacklights(on, redLight) {
    	var message = this.padMessage([0, 182, (redLight ? 1 : 0 ) , ( on ? 255 : 0 ) ]);
    	this.write(message);
    }
    /**
	 * Sets the flash frequency
	  * @param {frequency} 1-255, where 1 is fastest and 255 is the slowest. 255 is approximately 4 seconds between flashes.
	  * @returns undefined
     */
    setFrequency(frequency) {
    	if (!(frequency>=1 && frequency <= 255) ) {
    		throw new Error("Invalid frequency: "+keyIndex);
    	}

    	var message = this.padMessage([0,180,frequency]);

    	this.write(message);
    }
    verifyKeyIndex(keyIndex) {
    	if (!(keyIndex>=0 && keyIndex < 8 * this.deviceType.columns) ) {
    		throw new Error("Invalid keyIndex: "+keyIndex);
    	}
    }
    padMessage(message) {
    	var messageLength = 36;
    	while (message.length < messageLength) {
    		message.push(0);
    	}
    	return message;
    }
}
module.exports = XKeys;