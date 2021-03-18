import * as HID from 'node-hid'
import { EventEmitter } from 'events'
import { PRODUCTS, Product, XKEYS_VENDOR_ID, BackLightType } from './products'
import {
	AnalogStates,
	ButtonStates,
	Color,
	EventMetadata,
	HID_Device,
	ButtonEventMetadata,
	XKeysEvents,
	XKeysInfo,
} from './api'
import { isHID_Device, isHID_HID, literal } from './lib'

export declare interface XKeys {
	on<U extends keyof XKeysEvents>(event: U, listener: XKeysEvents[U]): this
	emit<U extends keyof XKeysEvents>(event: U, ...args: Parameters<XKeysEvents[U]>): boolean
}

export class XKeys extends EventEmitter {
	private product: Product

	/** All button states */
	private _buttonStates: ButtonStates = new Map()
	/** Analogue states, such as jog-wheels, shuttle etc */
	private _analogStates: AnalogStates = {
		jog: [],
		joystick: [],
		shuttle: [],
		tbar: [],
	}

	private receivedVersionResolve?: () => void
	private receivedGenerateDataResolve?: () => void

	private _initialized = false
	private _hidDevice: { productId: number; interface: number }
	private _unidId = 0 // is set after init()
	private _firmwareVersion = 0 // is set after init()
	private _disconnected = false

	/** Sets up a connection to a HID device (the X-keys panel) */
	static setupXkeysPanel(): Promise<XKeys>
	static setupXkeysPanel(HIDDevice: HID.Device): Promise<XKeys>
	static setupXkeysPanel(HIDDevice: HID.HID): Promise<XKeys>
	static setupXkeysPanel(devicePath: string): Promise<XKeys>
	static async setupXkeysPanel(devicePathOrHIDDevice?: HID.Device | HID.HID | string): Promise<XKeys> {
		let devicePath: string
		let device: HID.HID
		let deviceInfo:
			| {
					product: string | undefined
					productId: number
					interface: number
			  }
			| undefined

		// let hidDevices: HID.Device[] | undefined // set later

		if (!devicePathOrHIDDevice) {
			// Device not provided, will then select any connected device:
			const connectedXkeys = XKeys.listAllConnectedPanels()
			if (!connectedXkeys.length) {
				throw new Error('Could not find any connected X-keys panels.')
			}
			// Just select the first one:
			devicePath = connectedXkeys[0].path
			device = new HID.HID(devicePath)

			deviceInfo = {
				product: connectedXkeys[0].product,
				productId: connectedXkeys[0].productId,
				interface: connectedXkeys[0].interface,
			}
		} else if (isHID_Device(devicePathOrHIDDevice)) {
			// is HID.Device

			if (!devicePathOrHIDDevice.path) throw new Error('HID.Device path not set!')

			devicePath = devicePathOrHIDDevice.path
			device = new HID.HID(devicePath)

			deviceInfo = {
				product: devicePathOrHIDDevice.product,
				productId: devicePathOrHIDDevice.productId,
				interface: devicePathOrHIDDevice.interface,
			}
		} else if (isHID_HID(devicePathOrHIDDevice)) {
			// is HID.HID

			device = devicePathOrHIDDevice
			devicePath = devicePathOrHIDDevice.devicePath
			// deviceInfo is set later
		} else if (typeof devicePathOrHIDDevice === 'string') {
			// is string (path)

			devicePath = devicePathOrHIDDevice
			device = new HID.HID(devicePath)
			// deviceInfo is set later
		} else {
			throw new Error('setupXkeysPanel: invalid arguments')
		}

		if (!deviceInfo) {
			// Look through HID.devices(), bevause HID.Device contains the productId
			for (const hidDevice of HID.devices()) {
				if (hidDevice.path === devicePath) {
					deviceInfo = {
						product: hidDevice.product,
						productId: hidDevice.productId,
						interface: hidDevice.interface,
					}
					break
				}
			}
		}

		if (!device) throw new Error('Error setting up X-keys: device not found')
		if (!devicePath) throw new Error('Error setting up X-keys: devicePath not found')
		if (!deviceInfo) throw new Error('Error setting up X-keys: deviceInfo not found')

		const xkeys = new XKeys(devicePath, device, deviceInfo)

		// Wait for the device to initialize:
		await xkeys.init()

		return xkeys
	}
	/** Returns a list of all connected X-keys-HID-devices */
	static listAllConnectedPanels(): HID_Device[] {
		const connectedXkeys = HID.devices().filter((device) => {
			// Filter to only return the supported devices:

			if (device.vendorId !== XKeys.vendorId) return false
			if (!device.path) return false

			let found = false
			for (const product of Object.values(PRODUCTS)) {
				for (const hidDevice of product.hidDevices) {
					if (hidDevice[0] === device.productId && hidDevice[1] === device.interface) {
						found = true
						break
					}
				}
				if (found) break
			}
			return found
		})
		return connectedXkeys as HID_Device[]
	}

	/** Vendor id for the X-keys panels */
	static get vendorId(): number {
		return XKEYS_VENDOR_ID
	}

	constructor(
		public readonly devicePath: string,
		private device: HID.HID,
		deviceInfo: {
			product: string | undefined
			productId: number
			interface: number
		}
	) {
		super()

		this._hidDevice = {
			productId: deviceInfo.productId,
			interface: deviceInfo.interface,
		}

		let found = false
		for (const product of Object.values(PRODUCTS)) {
			for (const hidDevice of product.hidDevices) {
				if (hidDevice[0] === this._hidDevice.productId && hidDevice[1] === this._hidDevice.interface) {
					found = true
					this.product = product
					break
				}
			}
			if (found) break
		}
		if (!this.product) {
			throw new Error(
				`Unknown/Unsupported X-keys: "${deviceInfo.product}" (productId: "${deviceInfo.productId}").\nPlease report this as an issue on our github page!`
			)
		}

		this.device.on('data', (data: Buffer) => {
			if (data.readUInt8(1) === 214) {
				// this is a special report that does not correlate to the regular data report, it is created by sending getVersion()

				const firmVersion = data.readUInt8(10)
				// const dUID = data.readUInt8(0) // the unit ID is the first byte, index 0, used to tell between 2 identical X-keys, UID is set by user
				// const dPID = data.readUInt16LE(11) // PID is also in this report as a double check.

				this._firmwareVersion = firmVersion // Firmware version

				this.receivedVersionResolve?.()

				return // quit here because this data would be interperted as button data and give bad results.
			}
			if (data.readUInt8(1) > 3) return // Protect against all special data reports now and into the future.

			const buttonStates: ButtonStates = new Map()
			const analogStates: AnalogStates = {
				jog: [],
				joystick: [],
				shuttle: [],
				tbar: [],
			}

			// UID, unit id, is used to uniquely identify a certain panel, from factory it's set to 0, it can be set by a user with this.setUID()
			const UID = data.readUInt8(0) // the unit ID is the first byte, index 0, used to tell between 2 identical X-keys, UID is set by user
			// const PID = deviceInfo.productId // from USB hardware ID

			let timestamp = 0
			if (this.product.timestamp !== undefined) {
				timestamp = data.readUInt32BE(this.product.timestamp) // Time stamp is 4 bytes, use UInt32BE
			}

			const dd = data.readUInt8(1)
			// The genData bit is set when the message is a reply to the Generate Data message
			const genData = dd & (1 << 1) ? true : false
			if (genData) {
				// Note, the generateData is used to get the full state
				// this.emit('unitID', UID, PID, productName)

				this._unidId = UID

				this.receivedGenerateDataResolve?.()
			}

			// Note: first button data (bByte) is on byte index 2

			for (let x = 0; x < this.product.bBytes; x++) {
				for (let y = 0; y < this.product.bBits; y++) {
					const index = x * this.product.bBits + y + 1 // add 1 so PS is at index 0, more accurately displays the total button number, but confuses the index for other use, such as LED addressing.

					const d = data.readUInt8(2 + x)

					const bit = d & (1 << y) ? true : false

					buttonStates.set(index, bit)
				}
			}
			if (this.product.hasPS) {
				// program switch/button is on byte index 1 , bit 1
				const d = data.readUInt8(1)
				const bit = d & (1 << 0) ? true : false // get first bit only
				buttonStates.set(0, bit) // always btnIndex of PS to 0
			}
			this.product.hasJog?.forEach((jog, index) => {
				const d = data[jog.jogByte] // Jog
				analogStates.jog[index] = d < 128 ? d : d - 256
			})
			this.product.hasShuttle?.forEach((shuttle, index) => {
				const d = data[shuttle.shuttleByte] // Shuttle
				analogStates.shuttle[index] = d < 128 ? d : d - 256
			})
			this.product.hasJoystick?.forEach((joystick, index) => {
				const x = data.readUInt8(joystick.joyXbyte) // Joystick X
				const y = data.readUInt8(joystick.joyYbyte) // Joystick Y
				const z = data.readUInt8(joystick.joyZbyte) // Joystick Z (twist of joystick)

				analogStates.joystick[index] = {
					x: x < 128 ? x : x - 256, // -127 to 127
					y: y < 128 ? -y : -(y - 256), // -127 to 127
					z: z, // joystick z is a continuous value that rolls over to 0 after 255
				}
			})
			this.product.hasTbar?.forEach((tBar, index) => {
				const d = data.readUInt8(tBar.tbarByte) // T-bar (calibrated)
				analogStates.tbar[index] = d
			})

			// Disabled/nonexisting buttons: important as some "buttons" in the jog & shuttle devices are used for shuttle events in hardware.
			if (this.product.disableButtons) {
				this.product.disableButtons.forEach((btnIndex) => {
					buttonStates.set(btnIndex, false)
				})
			}

			// Compare with previous button states:
			buttonStates.forEach((buttonState: boolean, index: number) => {
				if ((this._buttonStates.get(index) || false) !== buttonStates.get(index)) {
					const btnLocation = this._findBtnLocation(index)

					const metadata: ButtonEventMetadata = {
						row: btnLocation.row,
						col: btnLocation.col,
						timestamp: timestamp,
					}
					if (buttonState) {
						// Button is pressed
						this.emit('down', index, metadata)
					} else {
						this.emit('up', index, metadata)
					}
				}
			})
			const eventMetadata: EventMetadata = {
				timestamp: timestamp,
			}

			// Compare with previous analogue states:
			this._analogStates.jog.forEach((newValue, index) => {
				const oldValue = this._analogStates.jog[index]
				if (newValue !== oldValue) this.emit('jog', index, newValue, eventMetadata)
			})
			this._analogStates.shuttle.forEach((newValue, index) => {
				const oldValue = this._analogStates.shuttle[index]
				if (newValue !== oldValue) this.emit('shuttle', index, newValue, eventMetadata)
			})
			this._analogStates.joystick.forEach((newValue, index) => {
				const oldValue = this._analogStates.joystick[index]
				if (!oldValue || newValue.x !== oldValue.x || newValue.y !== oldValue.y || newValue.z !== oldValue.z)
					this.emit('joystick', index, newValue, eventMetadata)
			})
			this._analogStates.tbar.forEach((newValue, index) => {
				const oldValue = this._analogStates.tbar[index]
				if (newValue !== oldValue) this.emit('tbar', index, newValue, eventMetadata)
			})

			// Store the new states:
			this._buttonStates = buttonStates
			this._analogStates = analogStates
		})

		this.device.on('error', (err) => {
			if ((err + '').match(/could not read from/)) {
				// The device has been disconnected
				this.handleDeviceDisconnected()
			} else {
				this.emit('error', err)
			}
		})
	}

	/** Initialize the device. This ensures that the essential information from the device about its state has been received. */
	async init(): Promise<void> {
		const pReceivedVersion = new Promise<void>((resolve) => {
			this.receivedVersionResolve = resolve
		})
		const pReceivedGenerateData = new Promise<void>((resolve) => {
			this.receivedGenerateDataResolve = resolve
		})

		this._getVersion()
		this._generateData()

		await pReceivedVersion
		await pReceivedGenerateData

		this._initialized = true
	}
	/** Closes the device. Subsequent commands will raise errors. */
	close(): void {
		this.handleDeviceDisconnected()
	}

	/** Firmware version of the device */
	public get firmwareVersion(): number {
		return this._firmwareVersion
	}
	/** Unit id ("UID") of the device, is used to uniquely identify a certain panel, or panel type.
	 * From factory it's set to 0, but it can be changed using this.setUnitId()
	 */
	public get unitId(): number {
		return this._unidId
	}
	/** Various information about the device and its capabilities */
	public get info(): XKeysInfo {
		this.ensureInitialized()
		return literal<XKeysInfo>({
			name: this.product.name,

			productId: this._hidDevice.productId,
			interface: this._hidDevice.interface,

			unitId: this.unitId,
			firmwareVersion: this._firmwareVersion, // added this imporant to defend against older firmware bugs

			colCount: this.product.colCount,
			rowCount: this.product.rowCount,
			layout:
				this.product.layouts?.map((region) => {
					return literal<XKeysInfo['layout'][0]>({
						name: region[0],
						index: region[1],
						startRow: region[2],
						startCol: region[3],
						endRow: region[4],
						endCol: region[5],
					})
				}) || [],

			hasPS: this.product.hasPS,
			hasJoystick: this.product.hasJoystick?.length || 0,
			hasJog: this.product.hasJog?.length || 0,
			hasShuttle: this.product.hasShuttle?.length || 0,
			hasTbar: this.product.hasTbar?.length || 0,
			hasLCD: this.product.hasLCD || false,
			hasGPIO: this.product.hasGPIO || false,
			hasSerialData: this.product.hasSerialData || false,
			hasDMX: this.product.hasDMX || false,
		})
	}

	/**
	 * Returns an object with current Button states
	 */
	getButtons(): ButtonStates {
		return Object.assign({}, this._buttonStates) // Return copy
	}

	/**
	 * Sets the indicator-LED on the device, usually a red and green LED at the top of many X-keys
	 * @param ledIndex the LED to set (1 = green, 2 = red)
	 * @param on boolean: on or off
	 * @param flashing boolean: flashing or not (if on)
	 * @returns undefined
	 */
	setIndicatorLED(ledIndex: number, on: boolean, flashing?: boolean): void {
		this.ensureInitialized()
		//force to 6 or 7
		if (ledIndex === 1) ledIndex = 6
		else if (ledIndex === 2) ledIndex = 7

		this._write([0, 179, ledIndex, on ? (flashing ? 2 : 1) : 0])
	}
	/**
	 * Sets the backlight of a button
	 * @param btnIndex The button of which to set the backlight color
	 * @param color r,g,b or string (RGB, RRGGBB, #RRGGBB)
	 * @param flashing boolean: flashing or not (if on)
	 * @returns undefined
	 */
	setBacklight(
		btnIndex: number,
		/** RGB, RRGGBB, #RRGGBB */
		color: Color | string | boolean | null,
		flashing?: boolean
	): void {
		this.ensureInitialized()
		if (btnIndex === 0) return // PS-button has no backlight

		this._verifyButtonIndex(btnIndex)
		color = this._interpretColor(color, this.product.backLightType)

		const location = this._findBtnLocation(btnIndex)

		if (this.product.backLightType === BackLightType.REMAP_24) {
			const ledIndex = (location.col - 1) * 8 + location.row - 1
			// backlight LED type 5 is the RGB 24 buttons
			this._write([0, 181, ledIndex, color.g, color.r, color.b, flashing ? 1 : 0]) // Byte order is actually G,R,B,F)
			return
		}

		if (this.product.backLightType === BackLightType.STICK_BUTTONS) {
			// The stick buttons, that requires special mapping.

			let ledIndex = location.col - 1 // 0 based linear numbering sort of...
			if (ledIndex > 11) ledIndex = ledIndex + 4
			else if (ledIndex > 5) ledIndex = ledIndex + 2

			const on: boolean = color.r > 0 || color.g > 0 || color.b > 0
			this._write([0, 181, ledIndex, on ? (flashing ? 2 : 1) : 0, 1])
		} else if (this.product.backLightType === BackLightType.LINEAR) {
			// The 40 buttons, that requires special mapping.

			const ledIndex = btnIndex - 1 // 0 based linear numbering sort of...

			const on: boolean = color.r > 0 || color.g > 0 || color.b > 0

			this._write([0, 181, ledIndex, on ? (flashing ? 2 : 1) : 0, 1])
		} else if (this.product.backLightType === BackLightType.LEGACY) {
			const ledIndexBlue = (location.col - 1) * 8 + location.row - 1
			const ledIndexRed = ledIndexBlue + (this.product.backLight2offset || 0)

			// Blue LED:
			this._write([0, 181, ledIndexBlue, color.b > 0 ? (flashing ? 2 : 1) : 0, 1])

			// Red LED:
			this._write([0, 181, ledIndexRed, color.r > 0 || color.g > 0 ? (flashing ? 2 : 1) : 0, 1])
		} else if (this.product.backLightType === BackLightType.NONE) {
			// No backlight, do nothing
		}
	}
	/**
	 * Sets the backlight of all buttons
	 * @param color r,g,b or string (RGB, RRGGBB, #RRGGBB)
	 */
	setAllBacklights(color: Color | string | boolean | null): void {
		this.ensureInitialized()
		color = this._interpretColor(color, this.product.backLightType)

		if (this.product.backLightType === BackLightType.REMAP_24) {
			// backlight LED type 5 is the RGB 24 buttons

			this._write([0, 182, color.g, color.r, color.b]) // Byte order is actually G,R,B
		} else {
			// Blue LEDs:
			this._write([0, 182, 0, color.b])
			// Red LEDs:
			this._write([0, 182, 1, color.r || color.g])
		}
	}
	/**
	 * On first call: Turn all backlights off
	 * On second call: Return all backlights to their previous states
	 */
	toggleAllBacklights(): void {
		this.ensureInitialized()
		this._write([0, 184])
	}
	/**
	 * Sets the backlightintensity of the device
	 * @param intensity 0-255
	 */
	setBacklightIntensity(blueIntensity: number, redIntensity?: number): void {
		this.ensureInitialized()
		if (redIntensity === undefined) redIntensity = blueIntensity

		blueIntensity = Math.max(Math.min(blueIntensity, 255), 0)
		redIntensity = Math.max(Math.min(redIntensity, 255), 0)

		if (this.product.backLightType === 2) {
			this._write([0, 187, blueIntensity, redIntensity])
		} else {
			this._write([0, 187, blueIntensity])
		}
	}
	/**
	 * Save the current backlights. This will restore the backlights after a power cycle.
	 * Note: EEPROM command, don't call this function too often, or you'll kill the EEPROM!
	 * (An EEPROM only support a few thousands of write operations.)
	 */
	saveBackLights(): void {
		this.ensureInitialized()
		this._write([0, 199])
	}
	/**
	 * Sets the flash frequency of LEDs for the entire X-keys. Flashing will always be synchronized
	 * @param frequency 1-255, where 1 is fastest and 255 is the slowest. 255 is approximately 4 seconds between flashes.
	 * @returns undefined
	 */
	setFrequency(frequency: number): void {
		this.ensureInitialized()
		if (!(frequency >= 1 && frequency <= 255)) {
			throw new Error(`Invalid frequency: ${frequency}`)
		}

		this._write([0, 180, frequency])
	}
	/**
	 * Sets the UID (unit Id) value in the X-keys hardware
	 * Note: EEPROM command, don't call this function too often, or you'll kill the EEPROM!
	 * (An EEPROM only support a few thousands of write operations.)
	 * @param unitId Unit id ("UID"). Allowed values: 0-255. 0 is factory default
	 * @returns undefined
	 */
	setUnitId(unitId: number): void {
		this.ensureInitialized()
		if (!(unitId >= 0 && unitId <= 255)) {
			throw new Error(`Invalid UID: ${unitId} (needs to be between 0 - 255)`)
		}

		this._write([0, 189, unitId])
		this._unidId = unitId
	}

	/**
	 * Sets the 2x16 LCD display
	 * @param line  1 for top line, 2 for bottom line.
	 * @param displayChar // string to display, empty string to clear
	 * @param backlight  0 for off, 1 for on.
	 * @returns undefined
	 */
	writeLcdDisplay(line: number, displayChar: string, backlight: boolean): void {
		this.ensureInitialized()
		if (!this.product.hasLCD) return // only used for LCD display devices.
		const byteVals = [0, 206, 0, 1, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32] // load the array with 206 op code and spaces

		// change line number to 0 or 1 and set line # byte
		if (line < 2) line = 0
		if (line > 1) line = 1
		byteVals[2] = line
		// change backlight to 0 or 1 and set backlight byte
		let liteByte
		if (backlight) {
			liteByte = 1
		} else {
			liteByte = 0
		}
		byteVals[3] = liteByte // set the LCD backlight on or off.
		// loop throught the string and load array with acsii byte values
		let i
		for (i = 0; i < displayChar.length; i++) {
			byteVals[i + 4] = displayChar.charCodeAt(i)
			if (i > 15) break // quit at 16 chars
		}

		this._write(byteVals)
	}

	/** Called when it has been detected that the device has been disconnected */
	public handleDeviceDisconnected(): void {
		if (!this._disconnected) {
			this._disconnected = true
			this.device.close()
			this.emit('disconnected')
		}
	}
	/**
	 * Writes a Buffer to the X-keys device
	 *
	 * @param buffer The buffer written to the device
	 * @returns undefined
	 */
	private _write(message: HIDMessage): void {
		if (this._disconnected) throw new Error('X-keys panel has been disconnected')
		message = this._padMessage(message)

		const intArray: number[] = []
		for (const index in message) {
			const value = message[index]
			intArray[index] = typeof value === 'string' ? parseInt(value, 10) : value
		}
		try {
			this.device.write(intArray)
		} catch (e) {
			this.emit('error', e)
		}
	}
	private _padMessage(message: HIDMessage): HIDMessage {
		const messageLength = 36
		while (message.length < messageLength) {
			message.push(0)
		}
		return message
	}

	private _verifyButtonIndex(btnIndex: number): void {
		if (!(btnIndex >= 0 && btnIndex < 8 * this.product.bBytes + 1)) {
			throw new Error(`Invalid btnIndex: ${btnIndex}`)
		}
	}
	private _findBtnLocation(btnIndex: number): { row: number; col: number } {
		let location: { row: number; col: number } = { row: 0, col: 0 }
		// derive the Row and Column from the button index for many products
		if (btnIndex !== 0) {
			// program switch is always on index 0 and always R:0, C:0 unless remapped by btnLocaion array
			location.row = btnIndex - this.product.bBits * (Math.ceil(btnIndex / this.product.bBits) - 1)
			location.col = Math.ceil(btnIndex / this.product.bBits)
		}
		// if the product has a btnLocaion array, then look up the Row and Column
		if (this.product.btnLocation !== undefined) {
			location = {
				row: this.product.btnLocation[btnIndex][0],
				col: this.product.btnLocation[btnIndex][1],
			}
		}
		return location
	}
	/**
	 * Generate data: forces the unit to send a data report with current states. Important to get the Unit ID.
	 * @param none
	 * @returns undefined //an input report will be generated by the X-keys with bit 2 of PS set. This is useful in determining the initial state of the device before any data has changed.
	 */
	private _generateData(): void {
		this._write([0, 177])
	}
	/**
	 * Gets the frimware version and UID : forces the unit to send a special data report with firmware version and Unit ID.
	 * @param none
	 * @returns undefined //an input report will be generated by the X-keys with byte 2 set to 214. This has the firmware version and UID.
	 */
	private _getVersion(): void {
		this._write([0, 214])
	}
	/** Makes best effort to interpret a color */
	private _interpretColor(color: Color | string | boolean | null, _backLightType: BackLightType): Color {
		if (typeof color === 'boolean' || color === null) {
			// todo: Should we use _backLightType in some way to determine different default colors?
			if (color) return { r: 0, g: 0, b: 255 }
			else return { r: 0, g: 0, b: 0 }
		} else if (typeof color === 'string') {
			// Handle a few "worded" colors:
			if (color === 'red') color = 'ff0000'
			else if (color === 'blue') color = '0000ff'
			else if (color === 'purple') color = 'ff00ff'
			else if (color === 'redblue') color = 'ff00ff'
			else if (color === 'green') color = '00ff00'
			else if (color === 'black') color = '000000'
			else if (color === 'white') color = 'ffffff'
			else if (color === 'on') color = 'ffffff'
			else if (color === 'off') color = '000000'

			let m
			if ((m = color.match(/([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/))) {
				// 'RRGGBB'
				return {
					r: parseInt(m[1], 16),
					g: parseInt(m[2], 16),
					b: parseInt(m[3], 16),
				}
			} else if ((m = color.match(/([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})/))) {
				// 'RGB'
				return {
					r: parseInt(m[1] + m[1], 16),
					g: parseInt(m[2] + m[2], 16),
					b: parseInt(m[3] + m[3], 16),
				}
			} else {
				// Fallback:
				this.emit('error', new Error(`Unable to interpret color "${color}"`))
				return {
					r: 127,
					g: 127,
					b: 127,
				}
			}
		} else {
			return color
		}
	}
	/** Check that the .init() function has run, throw otherwise */
	private ensureInitialized() {
		if (!this._initialized) throw new Error('XKeys.init() must be run first!')
	}
}
type HIDMessage = (string | number)[]
