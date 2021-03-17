import * as HID from 'node-hid'

/*
 * This file contains public type interfaces.
 * If changing these, consider whether it might be a breaking change.
 */

export type ButtonStates = Map<number, boolean>

export interface AnalogStates {
	/** -127 to 127 */
	jog: number[]
	/** -127 to 127 */
	shuttle: number[]

	joystick: JoystickValue[]
	/** 0 to 255 */
	tbar: number[]

	// todo: Implement these:
	// slider?: number[] // x with feedback
	// trackball?: {x: number, y: number}[]
	// trackpad?: {x: number, y: number, z: number}[] // z: proximity/force
}
export interface JoystickValue {
	/** -127 to 127 */
	x: number
	/** -127 to 127 */
	y: number
	/** Joystick Z (twist of joystick) is a continuous value that rolls over to 0 after 255 */
	z: number
}
export type Color = { r: number; g: number; b: number }

export interface EventMetadata {
	/**
	 * Timestamp of the event. Measured in milliseconds from when the device was last powered on.
	 * The timestamp can be used as a more trustworthy source of time than the computer clock, as it's not affected by delays in the USB data handling.
	 */
	timestamp: number
}
export interface ButtonEventMetadata extends EventMetadata {
	/** Row of the button location*/
	row: number
	/** Column of the button location */
	col: number
}
export interface XKeysEvents {
	// Note: This interface defines strong typings for any events that are emitted by the XKeys class.

	down: (btnIndex: number, metadata: ButtonEventMetadata) => void
	up: (btnIndex: number, metadata: ButtonEventMetadata) => void

	jog: (index: number, newValue: number, eventMetadata: EventMetadata) => void
	shuttle: (index: number, newValue: number, eventMetadata: EventMetadata) => void
	joystick: (index: number, newValue: { x: number; y: number; z: number }, eventMetadata: EventMetadata) => void
	tbar: (index: number, newValue: number, eventMetadata: EventMetadata) => void

	disconnected: () => void
	error: (err: any) => void
}
export interface XKeysInfo {
	/** Name of the device */
	name: string

	/** Product id of the HID device */
	productId: number
	/** Interface number of the HID device */
	interface: number

	/** Unit id ("UID") of the device, is used to uniquely identify a certain panel, or panel type.
	 * From factory it's set to 0, but it can be changed using xkeys.setUnitId()
	 */
	unitId: number
	/** firmware version of the device	 */
	firmwareVersion: number

	/** The number of physical columns */
	colCount: number
	/** The number of physical rows */
	rowCount: number
	/**
	 * Physical layout of the product. To be used to draw a visual representation of the X-keys
	 */
	layout: {
		/** Name of the region */
		name: string
		/** Index of the region */
		index: number
		/** First row of the region (1-indexed) */
		startRow: number
		/** First column of the region (1-indexed) */
		startCol: number
		/** Last row of the region (1-indexed) */
		endRow: number
		/** Last column of the region (1-indexed) */
		endCol: number
	}[]

	/** If the product has the Program Switch button, this is a special switch not in the normal switch matrix. If exsists, only one per X-keys. */
	hasPS: boolean

	/** The number of joysticks available on the device */
	hasJoystick: number
	/** The number of jog wheels available on the device */
	hasJog: number
	/** The number of shuttles available on the device */
	hasShuttle: number
	/** The number of T-bars available on the device */
	hasTbar: number
	/** If the device has an LCD display */
	hasLCD: boolean
	/** If the device has GPIO support */
	hasGPIO: boolean
	/** If the device has serial-data support  */
	hasSerialData: boolean
	/** If the device has DMX support */
	hasDMX: boolean
}

/** HID.Device but with .path guaranteed */
export type HID_Device = HID.Device & { path: string }
