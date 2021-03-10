import * as HID from 'node-hid'
import { EventEmitter } from 'events'
import { PRODUCTS, Product, VENDOR_ID } from './products'


export type ButtonStates = {[keyIndex: number]: boolean}
export interface ButtonStates2 {
	[index: string]: boolean
	PS: boolean
}

export interface AnalogStates {
	[index: string]: number | undefined
	/** -127 to 127 */
	jog?: number
	/** -127 to 127 */
	shuttle?: number
	/** -127 to 127 */
	joystick_x?: number
	/** -127 to 127 */
	joystick_y?: number
	/** 0 to 255 */
	joystick_z?: number
	/** 0 to 255 */
	tbar?: number
	/** 0 to 4096 */
	tbar_raw?: number
}
type Message = (string | number)[]

export class XKeys extends EventEmitter {

	private devicePath: string
	private device: HID.HID
	private deviceType: Product

	/** All button states */
	private _buttonStates: ButtonStates = {}
	/** Alternative buttons, such as the program switch 'PS' */
	//private _buttonStates2: ButtonStates2 = { PS: false }
	/** Analogue states, such as jog-wheels, shuttle etc */
	private _analogStates: AnalogStates = {}

	constructor (devicePath?: HID.HID | string) {
		super()
		const devices = HID.devices()

		let deviceInfo: HID.Device | HID.HID | null = null

		if (devicePath) {

			if (typeof devicePath === 'object') { // is object, this is for testing
				const obj: HID.HID = devicePath

				// @ts-ignore devicePath property
				this.devicePath = obj.devicePath
				this.device = obj

				deviceInfo = obj

			} else {
				this.devicePath = devicePath
				this.device = new HID.HID(devicePath)
			}

		} else {

			// Device not provided, will then select any connected device:
			const connectedXKeys = devices.filter(device => {

				// Ensures device with interface 0 is selected (other interface id's do not seem to work)

				// Note: device.usage has been removed in node-hid: https://github.com/SuperFlyTV/xkeys/issues/4
				// Using interface instead:
				
				return (device.vendorId === XKeys.vendorId && device.interface === 0)
			})
			if (!connectedXKeys.length) {
				throw new Error('Could not find any connected X-keys panels.')
			}
			if (!connectedXKeys[0].path) {
				throw new Error('Internal Error: path not set on xkeys device')
			}
			this.devicePath = connectedXKeys[0].path
			this.device = new HID.HID(this.devicePath)
		}

		// Which device is it?

		if (!deviceInfo) {

			for (const deviceKey in devices) {
				if (devices[deviceKey].path === this.devicePath) {
					deviceInfo = devices[deviceKey]
					break
				}
			}
		}
		if (!deviceInfo) {
			throw new Error('Device not found')
		}
		// @ts-ignore productId
		const productId = deviceInfo.productId
		if (productId) {
			for (const productKey in PRODUCTS) {
				if (
					PRODUCTS[productKey].productId &&
					PRODUCTS[productKey].productId.indexOf(productId) !== -1
				) {
					this.deviceType = PRODUCTS[productKey]
					break
				}
			}
		}

		if (!this.deviceType) {
			console.log(this.device)
			console.log(deviceInfo)

			// @ts-ignore
			const product = deviceInfo.product
			// @ts-ignore
			const productId = deviceInfo.productId

			throw new Error(
				`Unknown/Unsupported X-keys: "${product}" (id: "${productId}").\nPlease open an issue on our github page and we'll look into it!`
			)
		}

		this.device.on('data', (data: Buffer) => {

			if (!deviceInfo) return

			if (data.readUInt8(1)===214){ // this is a special report that does not correlate to the regular data report, it is ceated by sending getVersion

				var firmVersion = data.readUInt8(10)
				var dUID = data.readUInt8(0) // the unit ID is the first byte, index 0, used to tell between 2 identical X-keys, UID is set by user
				var dPID = data.readUInt16LE(11) // PID is also in this report as a double check. 
				this.emit('firmVersion',  firmVersion,dUID,dPID, )
				return // quit here because this data would be interperted as button data and give bad results. 
			}
			if( data.readUInt8(1) >3) return // Protect against all special data reports now and into the future. 
			 
			const buttonStates: ButtonStates = {}
			//const buttonStates2: ButtonStates2 = { PS: false }
			const analogStates: AnalogStates = {}

			// UID, unit id, is used to uniquely identify a certain panel, from factory it's set to 0. It can be set by a user to be able to find a reconnected panel.
			var UID = data.readUInt8(0) // the unit ID is the first byte, index 0, used to tell between 2 identical X-keys, UID is set by user
			// @ts-ignore
			var PID = deviceInfo.productId // from USB hardware ID
			var productName = this.deviceType.identifier // name from products file

			var timeStamp = 0

			if (this.deviceType.timeStamp !== undefined ) {

				timeStamp = data.readUInt32BE(this.deviceType.timeStamp) // Time stamp is 4 bytes, use UInt32BE 
			}
			// var keyCol = 1 // use a 1 based system for Rows and Columns
			// var keyRow = 1

			var dd = data.readUInt8(1)
			// The genData bit is set when the message is a reply to the Generate Data message
			var genData = dd & (1 << 1) ? true : false
			if (genData ) {
				this.emit('unitID',  UID, PID, productName)
			}


			// Note: first button data (bByte) is on byte index 2

			for (let x: number = 0; x < this.deviceType.bBytes; x++) {
				for (let y: number = 0; y < this.deviceType.bBits; y++) {

					var keyIndex = (x * this.deviceType.bBits + y)+1 // add 1 so PS is at index 0, more accurately displays the total key number, but confuses the index for other use, such as LED addressing. 
					//var keyIndex = x * 8 + y // this creates a key index based on the data bytes and skips some keys for many products. 

                    var d = data.readUInt8(2 + x)

					const bit = d & (1 << y) ? true : false

					buttonStates[keyIndex] = bit
				}
			}
			if (this.deviceType.hasPS) {
				// program switch/button is on byte index 1 , bit 1
                var d = data.readUInt8(1)
				const bit = d & (1 << 0) ? true : false  // get first bit only
				buttonStates[0]  = bit // always keyIndex of 0
			}
			if (this.deviceType.hasJog && this.deviceType.jogByte !== undefined ) {

				var d = data[(this.deviceType.jogByte ) ] // Jog
				analogStates.jog = (d < 128 ? d : d - 256)
			}
			if (this.deviceType.hasShuttle && this.deviceType.shuttleByte !== undefined) {
				var d = data[(this.deviceType.shuttleByte ) ] // Shuttle
				analogStates.shuttle = (d < 128 ? d : d - 256)
			}
			if (this.deviceType.hasJoystick && this.deviceType.joyXbyte !== undefined && this.deviceType.joyYbyte !== undefined && this.deviceType.joyZbyte !== undefined ) {
				var d = data.readUInt8(this.deviceType.joyXbyte); // Joystick X
                analogStates.joystick_x = (d < 128 ? d : d - 256);
                d = data.readUInt8(this.deviceType.joyYbyte); // Joystick Y
                analogStates.joystick_y = (d < 128 ? -d : -(d - 256));
                d = data.readUInt8(this.deviceType.joyZbyte); // Joystick Z (twist of joystick)
                analogStates.joystick_z = (d); // joystick z is a continuous value that rolls over to 0 after 255

			}
			if (this.deviceType.hasTbar && this.deviceType.tbarByte !== undefined) {
				var d = data.readUInt8(this.deviceType.tbarByte ) // T-bar (calibrated)
				analogStates.tbar = d

				
			}

			// Disabled/nonexisting keys: // important as some keys in the jog & shuttle devices are used for shuttle events in hardware.
			if (this.deviceType.disableKeys) {
				this.deviceType.disableKeys.forEach((keyIndex) => {
					buttonStates[keyIndex] = false
				})
			}

			for (const buttonStateKey in buttonStates) {
				// compare with previous button states:
				if ((this._buttonStates[buttonStateKey] || false) !== buttonStates[buttonStateKey]) {
					var btnRowCol = this.findBtnLocation(buttonStateKey)
					if (buttonStates[buttonStateKey]) { // key is pressed
						this.emit('down', buttonStateKey,btnRowCol, UID, PID, productName,timeStamp);
                       // this.emit('downKey', buttonStateKey, UID, PID, productName);
					} else {
						this.emit('up', buttonStateKey,btnRowCol,UID, PID, productName,timeStamp);
                       // this.emit('upKey', buttonStateKey, UID, PID, productName);
					}
				}
			}
			/**for (const buttonStates2Key in buttonStates2) {
				// compare with previous button states:
				if ((this._buttonStates2[buttonStates2Key] || false) !== buttonStates2[buttonStates2Key]) {
					if (buttonStates2[buttonStates2Key]) { // key is pressed
						this.emit('down', buttonStates2Key, UID, PID, productName);
                        this.emit('downAlt', buttonStates2Key, UID, PID, productName);
					} else {
						this.emit('up', buttonStates2Key, UID, PID, productName);
                        this.emit('upAlt', buttonStates2Key, UID, PID, productName);
					}
				}
			}
			*/
			for (const analogStateKey in analogStates) {
				// compare with previous states:
				if (
					(this._analogStates[analogStateKey] || 0) !== analogStates[analogStateKey]
				) {
					if (
						analogStateKey === 'jog' ||
						analogStateKey === 'shuttle'
					) {
						this.emit(analogStateKey , analogStates[analogStateKey])
					} else if (analogStateKey === 'tbar') {
						this.emit('tbar', analogStates.tbar)

					} else if (
						analogStateKey === 'joystick_x' ||
						analogStateKey === 'joystick_y' ||
						analogStateKey === 'joystick_z'
					) {
						this.emit('joystick', {
							x: analogStates.joystick_x,
							y: analogStates.joystick_y,
							z: analogStates.joystick_z
						})
					} else if (
						analogStateKey !== 'tbar' // ignore tbar updates because event is emitted on tbar_raw update
					) {
						throw new Error(`Internal error: Unknown analogStateKey: "${analogStateKey}"`)
					}

				}
			}

			this._buttonStates	= buttonStates
			//this._buttonStates2	= buttonStates2
			this._analogStates	= analogStates
		})

		this.device.on('error', err => {
			this.emit('error', err)
		})

	}

	static get vendorId () {
		return VENDOR_ID
	}

	/**
	 * Writes a Buffer to the X-keys device
	 *
	 * @param {Buffer} buffer The buffer written to the device
	 * @returns undefined
	 */
	write (anyArray: Message): void {
		const intArray: number[] = []
		for (const i in anyArray) {
			const v = anyArray[i]
			intArray[i] = (
				typeof v === 'string' ?
				parseInt(v, 10) :
				v
			)
		}
		try {
			this.device.write(intArray)
			// return this.device.write(intArray)
		} catch (e) {
			this.emit('error',e)
		}
	}

	/**
	 * Returns an object with current Key states
	 */
	getKeys () {
		return Object.assign({}, this._buttonStates) // Return copy
	}

	/**
	 * Sets the LED on the unit, usually a red and green LED at the top of many X-keys 
	 * @param {ledIndex} the LED to set (1 = green, 2 = red)
	 * @param {on} boolean: on or off
	 * @param {flashing} boolean: flashing or not (if on)
	 * @returns undefined
	 */
	setIndicatorLED (ledIndex: number, on: boolean, flashing?: boolean): void {

		//force to 6 or 7
		if (ledIndex <= 1) ledIndex = 6
		if (ledIndex >= 2) ledIndex = 7

		const message = this.padMessage([0,179,ledIndex,(on ? (flashing ? 2 : 1) : 0)])

		this.write(message)
	}
	/**
	 * Sets the backlight of a key
	 * @param {keyIndex} the key to set the color of
	 * @param {on} boolean: on or off
	 * @param {flashing} boolean: flashing or not (if on)
	 * @returns undefined
	 */
	setBacklight (keyIndex: number | string, on: boolean, redLight?: boolean, flashing?: boolean): void {
		if (keyIndex === 0) return // PS-button has no backlight

		this.verifyKeyIndex(keyIndex)
		keyIndex = (typeof keyIndex === 'string' ? parseInt(keyIndex, 10) : keyIndex)

		var location = this.findBtnLocation(keyIndex)

		

		var ledIndex = ((location[1]-1) * 8 + location[0])-1
		

		

		if (this.deviceType.backLiteType===3){ // backlight LED type 3, is the stick keys, that requires special mapping. 
			ledIndex=location[1]-1 // 0 based linear numbering sort of...
			if(ledIndex>11) ledIndex = ledIndex + 4
			else if(ledIndex>5) ledIndex = ledIndex + 2
		}
		else if (this.deviceType.backLiteType===4){ // backlight LED type 4, is the 40 keys, that requires special mapping. 
			ledIndex=keyIndex-1 // 0 based linear numbering sort of...
			
		}
		else if (this.deviceType.backLiteType===5){ // backlight LED type 5 is the RGB 24 keys
		
			var red =0
			var green =0
			var blue =127
			var flash =0

			if (flashing)flash=1

			if (redLight){
				red =128
				blue =0

			}

			if (!on){
				red=0
				green=0
				blue=0
				flash =0
			}


		const message = this.padMessage([0, 181, ledIndex, green,red,blue,flash]) // Byte order is actually G,R,B,F
		this.write(message)
		return 
		}
		if (redLight) {
			ledIndex = ledIndex + (this.deviceType.backLite2offset || 0)
		}


		const message = this.padMessage([0, 181, ledIndex, (on ? (flashing ? 2 : 1) : 0) , 1])
		this.write(message)
	}
	/**
	 * Sets the backlightintensity of the device
	 * @param {intensity} 0-255
	 */
	setBacklightIntensity (blueIntensity: number, redIntensity?: number): void {
		if (redIntensity === undefined) redIntensity = blueIntensity

		blueIntensity = Math.max(Math.min(blueIntensity, 255), 0)
		redIntensity = Math.max(Math.min(redIntensity, 255), 0)

		const message = (
			this.deviceType.backLiteType === 2 ?
			this.padMessage([0, 187, blueIntensity, redIntensity]) :
			this.padMessage([0, 187, blueIntensity])
		)
		this.write(message)
	}
	/**
	 * Sets the backlight of all keys
	 * @param {on} boolean: on or off
	 * @param {redLight} boolean: if to set the red or blue backlights
	 * @returns undefined
	 */
	setAllBacklights (on: boolean, redLight: boolean) {
		if (this.deviceType.backLiteType===5){ // backlight LED type 5 is the RGB 24 keys
		
			var red =0
			var green =0
			var blue =127
			
			if (redLight){
				red =128
				blue =0
			}

			if (!on){
				red=0
				green=0
				blue=0
			}


		const message = this.padMessage([0, 182,  green,red,blue]) // Byte order is actually G,R,B
		this.write(message)
		return 
		}
		const message = this.padMessage([0, 182, (redLight ? 1 : 0) , (on ? 255 : 0) ])
		this.write(message)
	}
	/**
     * Generate data: forces the unit to send a data report with current states. Important to get the Unit ID. 
     * @param none
     * @returns undefined //an input report will be generated by the X-keys with bit 2 of PS set. This is useful in determining the initial state of the device before any data has changed. 
     */
    generateData () {
        
        var message = this.padMessage([0, 177]);
        this.write(message);
    };
	/**
     * Gets the frimware version and UID : forces the unit to send a special data report with firmware version and Unit ID. 
     * @param none
     * @returns undefined //an input report will be generated by the X-keys with byte 2 set to 214. This has the firmware version and UID. 
     */
    getVersion() {
        
        var message = this.padMessage([0, 214]);
        this.write(message);
    };
	/**
	 * Sets the flash frequency of LEDs for the entire X-keys. Flashing will always be synchronized
	 * @param {frequency} 1-255, where 1 is fastest and 255 is the slowest. 255 is approximately 4 seconds between flashes.
	 * @returns undefined
	 */
	setFrequency (frequency: number) {
		if (!(frequency >= 1 && frequency <= 255)) {
			throw new Error(`Invalid frequency: ${frequency}`)
		}

		const message = this.padMessage([0,180,frequency])
		this.write(message)
	}
	/**
	 * Sets the UID value in the X-keys  hardware
	 * @param {UID} 0-255, 0 is factory default, writes to EEPROM do not use excessivley
	 * @returns undefined
	 */
	setUID (UID: number) {
		if (!(UID >= 0 && UID <= 255)) {
			throw new Error(`Invalid UID: ${UID}`)
		}

		const message = this.padMessage([0,189,UID])
		this.write(message)
	}

	/**
	 * Sets the 2x16 LCD display 
	 * @param {line}  1 for top line, 2 for bottom line.
	 *  @param {disChar} //string to display, empty string to clear
	 *  @param {backlight}  0 for off, 1 for on.
	 * @returns undefined
	 */
	writeLcdDisplay (line: number,displayChar: string, backlight:boolean) { 
		if (!this.deviceType.hasLCD) return // only used for LCD display devices. 
		var byteVals = [0,206,0,1,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32]  // load the array with 206 op code and spaces

		// change line number to 0 or 1 and set line # byte
		if (line<2) line=0
		if (line >1) line = 1 
		byteVals[2]=line
		// change backlight to 0 or 1 and set backlight byte 
		var liteByte
		if (backlight) {liteByte=1} else {liteByte=0}
		byteVals[3]=liteByte // set the LCD backlight on or off.
		// loop throught the string and load array with acsii byte values
		var i;
		for (i = 0; i < displayChar.length; i++) {
			byteVals[i+4]=displayChar.charCodeAt(i);
			if (i>15) break // quit at 16 chars
		  }
		
		const message = this.padMessage(byteVals)
		this.write(message)
		
	}
	
	verifyKeyIndex (keyIndex: number | string) {
		keyIndex = (typeof keyIndex === 'string' ? parseInt(keyIndex, 10) : keyIndex)

		if (!(keyIndex >= 0 && keyIndex < 8 * this.deviceType.bBytes+1)) {
			throw new Error(`Invalid keyIndex: ${keyIndex}`)
		}
	}
	padMessage (message: Message): Message {
		const messageLength = 36
		while (message.length < messageLength) {
			message.push(0)
		}
		return message
	}
	findBtnLocation (keyIndex: number | string): number[] {
		keyIndex = (typeof keyIndex === 'string' ? parseInt(keyIndex, 10) : keyIndex)
		var location = [0,0]
		// derive the Row and Column from the key index for many products
		if (keyIndex!==0) {// program switch is always on index 0 and always R:0, C:0 unless remapped by btnLocaion array
		location[0]= keyIndex-(this.deviceType.bBits*( Math.ceil(keyIndex/this.deviceType.bBits)-1))
		location[1]= Math.ceil(keyIndex/this.deviceType.bBits)
		}
		// if the product has a btnLocaion array, then look up the Row and Column
		if (this.deviceType.btnLocation !== undefined){
		 location = this.deviceType.btnLocation[keyIndex]
		}
		return location
	}
}
