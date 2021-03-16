import { literal } from './lib'

/*
 * This file contains information about the various X-keys panels
 */

export const XKEYS_VENDOR_ID = 1523

export interface Product {
	/** Name / Identifier of the product */
	name: string
	/** Product ids of the product  */
	productId: number[]
	/** Number of button data bytes, starting at index 2 */
	bBytes: number
	/** Number of bits in bByte used for buttons */
	bBits: number
	/** The number of physical columns, sort of */
	colCount: number
	/** The number of physical rows */
	rowCount: number
	/** If the product has the Program Switch button, this is a special switch not in the normal switch matrix. If exsists, only one per X-keys. */
	hasPS: boolean
	/** Byte offset for legacy backLight, bank 2 */
	backLight2offset: number

	/**
	 * Physical layout of the product. To be used to draw a visual representation of the X-keys,
	 * [Region type name, index, startRow, startCol, endRow, endCol]
	 */
	layout?: [string, number, number, number, number, number][]

	/** Maps the (internal) keyIndex to a [Row, Column] */
	btnLocation?: [number, number][]

	timestamp?: number // the index of the start to the 4 byte time stamp

	hasJoystick?: {
		joyXbyte: number
		joyYbyte: number
		joyZbyte: number
	}[]

	/** used to determine what keyIndex to back light mapping should be used. */
	backLightType: BackLightType
	/** blocks certain keyIndex from calling key events. */
	disableKeys?: number[]

	hasJog?: { jogByte: number }[]
	hasShuttle?: { shuttleByte: number }[]
	hasTbar?: {
		tbarByte: number
		tbarByteRaw: number
	}[]
	hasLCD?: boolean
	hasGPIO?: boolean
	hasSerialData?: boolean
	hasDMX?: boolean
}
export enum BackLightType {
	/** No back lights */
	NONE = 0,
	/** Legacy LED:s, blue and red backlights */
	LEGACY = 2,
	/** Only blue light. Is the stick keys, that requires special mapping. */
	STICK_KEYS = 3,
	/** Backlight LED type 4, is the 40 keys, map keyIndex-1 to ledIndex */
	LINEAR = 4,
	/** Backlight LED type 5 is the RGB 24 keys */
	REMAP_24 = 5,
}

export const PRODUCTS: { [name: string]: Product } = {
	// Note: The byte numbers are byte index (starts with 0) and will be offset from PIE SDK documentation by -2
	// the byte index is used to access the exact byte in the data report.

	XK24: literal<Product>({
		name: 'XK-24',
		productId: [1029, 1027],
		bBytes: 4, // number of button bytes
		bBits: 6, // number button bits per byte
		layout: [['Keys', 0, 1, 1, 6, 4]], // reigon type name, index, startRow, startCol, endRow, endCol
		colCount: 4, // number of physical columns
		rowCount: 6, // number of physical rows
		hasPS: true,
		backLightType: BackLightType.LEGACY,
		backLight2offset: 32,
		timestamp: 6, // index of first of 4 bytes, ms time since device boot, 4 byte BE
	}),
	XK24RGB: literal<Product>({
		name: 'XK-24M-RGB', // prototype XK24 with RGB backLight LEDs and mechanical
		productId: [1404],
		bBytes: 4, // number of button bytes
		bBits: 6, // number button bits per byte
		colCount: 4, // number of physical columns
		rowCount: 6, // number of physical rows
		hasPS: true,
		backLightType: BackLightType.REMAP_24, //RGB Standard Index
		backLight2offset: 0, // RGBs have no offset.
		timestamp: 6, // index of first of 4 bytes, ms time since device boot, 4 byte BE
	}),
	XK4: literal<Product>({
		name: 'XK-4 Stick',
		productId: [1127, 1129],
		bBytes: 4,
		bBits: 1,
		colCount: 4, // number of physical columns
		rowCount: 1, // number of physical rows
		hasPS: true, // slide switch on end
		backLightType: BackLightType.STICK_KEYS, // only has blue light
		backLight2offset: 0, //
		timestamp: 6, // ms time since device boot 4 byte BE
	}),
	XK8: literal<Product>({
		name: 'XK-8 Stick',
		productId: [1130, 1132],
		bBytes: 4,
		bBits: 2, // row1	= 0,1,2,3	row2=4,5,6,7
		colCount: 8, // number of physical columns
		rowCount: 1, // number of physical rows
		hasPS: true, // slide switch on end
		backLightType: BackLightType.STICK_KEYS, // only has blue light
		backLight2offset: 0, //
		timestamp: 6, // ms time since device boot 4 byte BE
		btnLocation: [
			[0, 0],
			[1, 1],
			[1, 5],
			[1, 2],
			[1, 6],
			[1, 3],
			[1, 7],
			[1, 4],
			[1, 8],
		], // map key index to [Row,Column] 0,0 is program switch
	}),
	XK16: literal<Product>({
		name: 'XK-16 Stick',
		productId: [1049, 1051, 1213, 1216],
		bBytes: 4, // 4	buttton data bytes
		bBits: 4, // not really rows, but the data comes like that (it is physically one row) row1= 0,1,2,3	row2=4,5,6,7 row3= 8,9,10,11 row4=12,13,14,15
		colCount: 16, // number of physical columns
		rowCount: 1, // number of physical rows
		hasPS: true, // slide switch on end
		backLightType: BackLightType.STICK_KEYS, // only has blue backlight
		backLight2offset: 0, // only one set of LEDs under keys
		timestamp: 6, // ms time since device boot 4 byte BE
		btnLocation: [
			[0, 0],
			[1, 1],
			[1, 5],
			[1, 9],
			[1, 13],
			[1, 2],
			[1, 6],
			[1, 10],
			[1, 14],
			[1, 3],
			[1, 7],
			[1, 11],
			[1, 15],
			[1, 4],
			[1, 8],
			[1, 12],
			[1, 16],
		],
	}),
	XK12JOG: literal<Product>({
		name: 'XK-12 Jog-Shuttle',
		productId: [1062, 1064],
		bBytes: 4,
		bBits: 3,
		colCount: 4, // number of physical columns
		rowCount: 3, // number of physical rows
		hasPS: true,
		hasJog: [{ jogByte: 6 }],
		hasShuttle: [{ shuttleByte: 7 }],
		backLightType: BackLightType.LEGACY,
		backLight2offset: 32,
		timestamp: 8, // ms time since device boot 4 byte BE
	}),
	XK12JOYSTICK: literal<Product>({
		name: 'XK-12 Joystick',
		productId: [1065, 1067],
		bBytes: 4,
		bBits: 3,
		colCount: 4, // number of physical columns
		rowCount: 3, // number of physical rows
		hasPS: true,
		hasJoystick: [
			{
				joyXbyte: 6, //Joystick X motion, 0 to 127 from center to full right, 255 to 129 from center to full left, 0 at center.
				joyYbyte: 7, //Joystick Y motion, 0 to 127 from center to full down, 255 to 129 from center to full up, 0 at center.
				joyZbyte: 8, //Joystick Z motion, twist of stick, absolute 0 to 255, rolls over,
			},
		],

		backLightType: BackLightType.LEGACY,
		backLight2offset: 32, // offset used to access second bank of LEDs, usually the red is on bank 2
		timestamp: 12,
	}),
	XK68JOYSTICK: literal<Product>({
		name: 'XK-68 Joystick',
		productId: [1117, 1119],
		bBytes: 10,
		bBits: 8,
		layout: [
			['Keys', 0, 1, 1, 8, 10],
			['Joystick', 0, 4, 4, 6, 7],
		], // reigon type name, index, startRow, startCol, endRow, endCol
		colCount: 10, // number of physical columns,
		rowCount: 8, //  number of physical rows
		hasPS: true,
		hasJoystick: [
			{
				joyXbyte: 14, //Joystick X motion, 0 to 127 from center to full right, 255 to 129 from center to full left, 0 at center.
				joyYbyte: 15, //Joystick Y motion, 0 to 127 from center to full down, 255 to 129 from center to full up, 0 at center.
				joyZbyte: 16, //Joystick Z motion, twist of stick, absolute 0 to 255, rolls over
			},
		],

		backLightType: BackLightType.LEGACY,
		backLight2offset: 80, // offset used to access second bank of LEDs, usually the red is on bank 2
		timestamp: 18, // ms time since device boot 4 byte BE
		disableKeys: [28, 29, 30, 36, 37, 38, 44, 45, 46, 52, 53, 54], // these are the index of the "hole" created by the joystick in the center, they will always be 0
	}),
	XKR32: literal<Product>({
		// discontinued product, XKE 40 is viable replacement
		name: 'XKR-32',
		productId: [1279, 1282],
		bBytes: 4, // 4	buttton data bytes
		bBits: 8,
		colCount: 16, // number of physical columns,
		rowCount: 2, //  number of physical rows
		hasPS: false, // unknown
		backLightType: BackLightType.LEGACY,
		backLight2offset: 32,
		timestamp: 31, // ms time since device boot 4 byte BE
	}),
	XKE40: literal<Product>({
		name: 'XKE-40',
		productId: [1355, 1356, 1357, 1358, 1359, 1360, 1361],
		bBytes: 5, // 5	buttton data bytes
		bBits: 8, // row1=0,8,16,24,32 row2=1,9,17,25,33 row3=2,10,18,26,34 row4=3,11,19,27,35 row5=4,12,20,28,36 row6=5,13,21,29,37 row7=6,14,22,30,38 row8=7,15,23,31,39
		colCount: 20, // number of physical columns,
		rowCount: 2, //  number of physical rows
		hasPS: true, // behind small hole on right side.
		backLightType: BackLightType.LINEAR, // map keyIndex-1  to ledIndex
		backLight2offset: 40, // off set to control second led bank.
		timestamp: 31, // ms time since device boot 4 byte BE
		btnLocation: [
			[0, 0],
			[1, 1],
			[1, 2],
			[1, 3],
			[1, 4],
			[1, 5],
			[1, 6],
			[1, 7],
			[1, 8],
			[1, 9],
			[1, 10],
			[1, 11],
			[1, 12],
			[1, 13],
			[1, 14],
			[1, 15],
			[1, 16],
			[1, 17],
			[1, 18],
			[1, 19],
			[1, 20],
			[2, 1],
			[2, 2],
			[2, 3],
			[2, 4],
			[2, 5],
			[2, 6],
			[2, 7],
			[2, 8],
			[2, 9],
			[2, 10],
			[2, 11],
			[2, 12],
			[2, 13],
			[2, 14],
			[2, 15],
			[2, 16],
			[2, 17],
			[2, 18],
			[2, 19],
			[2, 20],
		],
	}),
	XK60: literal<Product>({
		name: 'XK-60', // the USB hardwware string will report "xkeys 80 HID" because it uses the same firmware as 80, the PID tells the difference
		productId: [1121, 1123, 1231, 1234],
		bBytes: 10,
		bBits: 8,
		layout: [
			['Keys', 0, 1, 1, 2, 10],
			['Keys', 1, 4, 1, 8, 20],
			['Keys', 2, 4, 4, 8, 7],
			['Keys', 3, 4, 9, 8, 10],
		], // control name, control index, startRow, startCol, endRow, endCol
		colCount: 10, // number of physical columns,
		rowCount: 8, //  number of physical rows
		hasPS: true,
		backLightType: BackLightType.LEGACY,
		backLight2offset: 80,
		timestamp: 12, // ms time since device boot 4 byte BE
		//disableKeys: 	[2,10,18,26,34,42,50,58,66,74,19,20,21,22,23,59,60,61,] // these keys are not installed on the 60 key unit, these bytes will always be 0.
	}),
	XK80: literal<Product>({
		name: 'XK-80',
		productId: [1089, 1091, 1217, 1220],
		bBytes: 10,
		bBits: 8,
		colCount: 10, // number of physical columns
		rowCount: 8, //  number of physical rows
		hasPS: true,
		backLightType: BackLightType.LEGACY,
		backLight2offset: 80,
		timestamp: 12, // ms time since device boot 4 byte BE
	}),
	XKE124TBAR: literal<Product>({
		name: 'XKE-124 T-bar',
		productId: [1275, 1278],
		bBytes: 16,
		bBits: 8,
		layout: [
			['Keys', 0, 1, 1, 8, 16],
			['Tbar', 0, 5, 14, 8, 14],
		], // control name, control index, startRow, startCol, endRow, endCol
		colCount: 16, //number of physical columns
		rowCount: 8, // number of physical rows
		hasPS: false,
		hasTbar: [
			{
				tbarByte: 28, //this gives a clean 0-255 value
				tbarByteRaw: 29, // should only use cal t-bar on byte index 28
			},
		],

		backLightType: BackLightType.LEGACY,
		backLight2offset: 128,
		//timeStamp:	31, // the XKE-124 T-bar has no time stamp for technical reasons
		disableKeys: [109, 110, 111, 112],
	}),
	XKE128: literal<Product>({
		name: 'XKE-128',
		productId: [1227, 1230],
		bBytes: 16,
		bBits: 8,
		colCount: 16, // number of physical columns
		rowCount: 8, //  number of physical rows
		hasPS: false,
		backLightType: BackLightType.LEGACY,
		backLight2offset: 128,
		timestamp: 31, // ms time since device boot 4 byte BE
	}),
	XKMatrix: literal<Product>({
		name: 'XK-128 Matrix', // this is a bare encoder board that can encode a 8x16 switch matrix
		productId: [1030, 1032],
		bBytes: 16,
		bBits: 8,
		colCount: 16, //  number of virtual columns
		rowCount: 8, //   number of virtual rows
		hasPS: true, // slide switch on board
		backLightType: BackLightType.NONE, // no back light, only the 2 standard indicator LEDs, also availe on header, see documentation
		backLight2offset: 0,
		timestamp: 18, // ms time since device boot 4 byte BE
		// many keys may be disabled or not as the custom wiring determines this.
		// to prevent phantom keys, external diodes may be required, if diodes not used the board may be set by write command 215, see documentation
	}),
	XK68JOGSHUTTLE: literal<Product>({
		name: 'XK-68 Jog-Shuttle',
		productId: [1114, 1116],
		bBytes: 10,
		bBits: 8,
		layout: [
			['Keys', 0, 1, 1, 8, 10],
			['Jog-Shuttle', 0, 6, 4, 8, 7],
		], // control name, control index, startRow, startCol, endRow, endCol
		colCount: 10, //  number of physical columns
		rowCount: 8, //   number of physical rows
		hasPS: true,
		hasJog: [{ jogByte: 16 }],

		hasShuttle: [{ shuttleByte: 17 }],

		backLightType: BackLightType.LEGACY,
		backLight2offset: 80,
		timestamp: 18, // ms time since device boot 4 byte BE
		disableKeys: [30, 31, 32, 38, 39, 40, 46, 47, 48, 54, 55, 56],
	}),
	XK3FOOT: literal<Product>({
		name: 'XK-3 Foot Pedal',
		productId: [1080, 1082],
		bBytes: 1,
		bBits: 4, // Bit 1=0, bit 2=left pedal, bit 3=middle pedal, bit 4= right pedal, bits 5-8=0.
		colCount: 3, //  3 pedals in a row
		rowCount: 1, //  number of physical rows, note the first bit is not used here
		hasPS: true, // inside unit and not very accessible
		backLightType: BackLightType.NONE, // no back light LEDs
		backLight2offset: 0,
		timestamp: 18, // ms time since device boot 4 byte BE
		btnLocation: [
			[0, 0],
			[0, 0], // the keyIndex of 1 on this product does not exsit
			[1, 1],
			[1, 2],
			[1, 3],

		],
		disableKeys: [1],
	}),
	XK3SI: literal<Product>({
		name: 'XK-3 Switch Interface', // one 3.5 mm port, contacts for a TRRS Plug
		productId: [1221, 1224],
		bBytes: 1,
		bBits: 5, // Bit 1=SW2, bit 2= SW1, bits 3 is unset if nothing is plugged in and set if anything is plugged in, bit 4=undefined, bit 5=SW3  bits 6,7,8=0.
		colCount: 3, //  3 Switches possible, the best UI is probably 3 boxes side by side
		rowCount: 1, //
		hasPS: false, // none
		backLightType: BackLightType.NONE, // no back light LEDs
		backLight2offset: 0,
		timestamp: 31, // ms time since device boot 4 byte BE
		btnLocation: [
			[0, 0],
			[1, 1],
			[1, 2],
			[1, 0],
			[2, 0],
			[1, 3],
		], // bit 3 has been mapped to R1,C0 this is the bit that is set if any plug is in the 3.5 mm socket. Helps tell between no switch attached or just no switches pressed.
		disableKeys: [4], // Exclude index 4, redundent on index 3, note some or all of the keys may be triggered when plugging switch into 3.5 mm socket
	}),
	XK12SI: literal<Product>({
		name: 'XK-12 Switch Interface', // six 3.5 mm ports, contacts for a stereo Plug
		productId: [1192, 1195],
		bBytes: 2,
		bBits: 8, // see documentation
		layout: [
			['SwitchPorts', 0, 1, 1, 2, 3],
			['SwitchPorts', 1, 1, 4, 2, 6],
		], // control name, control index, startRow, startCol, endRow, endCol
		colCount: 6, //  3 ports per side of unit , numbered 1-3 and 4-6
		rowCount: 2, // each port has 2 switches
		hasPS: false, // none
		backLightType: BackLightType.NONE, // no back light LEDs
		backLight2offset: 0,
		timestamp: 31, // ms time since device boot 4 byte BE
		btnLocation: [
			[0, 0],
			[2, 1],
			[1, 1],
			[2, 2],
			[1, 2],
			[2, 3],
			[1, 3],
			[2, 4],
			[1, 4],
			[2, 5],
			[1, 5],
			[2, 6],
			[1, 6],
		], // column indicates port #, mono plugs map to row 1, stereo plugs to row 1 and 2
		// due to the stereo jack some keys may always be down when a single pole (mono) plug is plugged in.
	}),
	XKHD15WI: literal<Product>({
		name: 'XK-HD15 Wire Interface', // HD15 connector for 10 inputs and two 3.5 mm ports, contacts for a stereo Plug
		productId: [1244, 1247],
		bBytes: 2,
		bBits: 8, // see documentation
		colCount: 1, //  difficult to describe with Rows and Columns, so just a list may be the bests
		rowCount: 14, // 14 inputs
		hasPS: false, // none
		backLightType: BackLightType.NONE, // no back light LEDs but has 2 digital outputs on the HD 15 wire. See documentation
		backLight2offset: 0,
		timestamp: 31, // ms time since device boot 4 byte BE
	}),
	XKHD15GPIO: literal<Product>({
		name: 'XK-HD15 GPIO', // HD15 connector for 10 digital outputs or can be configured to inputs, and two 3.5 mm ports, contacts for a stereo Plug
		productId: [1351, 1354],
		bBytes: 2,
		bBits: 8, // see documentation
		colCount: 1, //  difficult to describe with Rows and Columns, so just a list may be the bests
		rowCount: 14, // 14 inputs possible, check config
		hasPS: false, // none
		backLightType: BackLightType.NONE, // no back light LEDs but has 2 or more digital outputs on the HD 15 wire. See documentation
		backLight2offset: 0,
		hasGPIO: true,
		timestamp: 31, // ms time since device boot 4 byte BE
		//The input data will always be in the 2 data bytes described, but this device may be configured in several ways
		// it is best to Qwery the device and get its current setup data, using GetIoConfiguration function
	}),
	XCRS232: literal<Product>({
		name: 'XC-RS232-DB9', // DB9 connector for RS232 and six 3.5 mm ports, contacts for a stereo Plug
		productId: [1257, 1260],
		bBytes: 2,
		bBits: 8, // see documentation
		layout: [
			['SwitchPorts', 0, 1, 1, 2, 3],
			['SwitchPorts', 1, 1, 4, 2, 6],
		], // control name, control index, startRow, startCol, endRow, endCol
		colCount: 3, //  3 ports per side of unit , the best UI is probably 3 boxes side by side then 4 rows
		rowCount: 4, // each port has 2 switches
		hasPS: false, // none
		backLightType: BackLightType.NONE, // no back light LEDs but has 2 or more digital outputs on the HD 15 wire. See documentation
		backLight2offset: 0,
		hasSerialData: true,
		btnLocation: [
			[0, 0],
			[2, 1],
			[1, 1],
			[2, 2],
			[1, 2],
			[2, 3],
			[1, 3],
			[2, 4],
			[1, 4],
			[2, 5],
			[1, 5],
			[2, 6],
			[1, 6],
		], // column indicates port #, mono plugs map to row 1, stereo plugs to row 1 and 2

		//The Serial data will come on a special message with byte 1 id of 216, see documentation
	}),
	XCDMX512TST: literal<Product>({
		name: 'XC-DMX512-T ST', // Screw Terminal connector for DMX512 and six 3.5 mm ports, contacts for a stereo Plug
		productId: [1324],
		bBytes: 2,
		bBits: 8, // see documentation
		colCount: 6, //  3 ports per side of unit ,
		rowCount: 2, // each port has 2 switches
		hasPS: false, // none
		backLightType: BackLightType.NONE, // no back light LEDs
		backLight2offset: 0,
		hasDMX: true,

		//Sends DMX512 Data, see documentation
	}),
	XCDMX512TRJ45: literal<Product>({
		name: 'XC-DMX512-T RJ45', // RJ45 connector for DMX512 and four 3.5 mm ports, contacts for a stereo Plug
		productId: [1225],
		bBytes: 1,
		bBits: 8, // see documentation
		colCount: 4, //  2 ports per side of unit ,
		rowCount: 2, // each port has 2 switches
		hasPS: false, // none
		backLightType: BackLightType.NONE, // no back light LEDs
		backLight2offset: 0,
		hasDMX: true,
		btnLocation: [ // columns are port number and row 1 is the first switch on the port and 2 is second
			[0, 0],
			[2, 1],
			[1, 1],
			[2, 2],
			[1, 2],
			[2, 3],
			[1, 3],
			[2, 4],
			[1, 4],
		],
		//Sends DMX512 Data to DMX512 devivces on the , see documentation
	}),

	XK16LCD: literal<Product>({
		name: 'XK-16 LCD', // Has a 16x2 Alpha Numeric back lit LCD Display
		productId: [1316, 1317, 1318, 1319, 1320, 1321, 1322],
		bBytes: 4,
		bBits: 4, //
		colCount: 4, // physical columns
		rowCount: 4, // physical rows
		hasPS: true, // at top
		hasLCD: true,
		backLightType: BackLightType.LEGACY, // back light LEDs
		backLight2offset: 32,
		timestamp: 31, // ms time since device boot 4 byte BE
	}),
	XKE180BROAD: literal<Product>({
		name: 'XKE-180 Broadcast Keyboard', //
		productId: [1443],
		bBytes: 31,
		bBits: 7, //
		layout: [
			['Keys', 0, 1, 1, 2, 24],
			['Keys', 1, 3, 1, 8, 2],
			['QWERTY-77', 0, 3, 3, 8, 17],
			['Keys', 2, 3, 18, 8, 20],
			['NumPad-24', 0, 3, 21, 8, 24],
		], // control name, control index, startRow, startCol, endRow, endCol
		colCount: 24, // physical columns
		rowCount: 8, // physical rows
		hasPS: true, // at top right behind hole in end
		backLightType: BackLightType.NONE, // back light LEDs
		backLight2offset: 0,
		timestamp: 36, // ms time since device boot 4 byte BE
	}),

	XK64JOGTBAR: literal<Product>({
		name: 'XKE-64 Jog T-bar',
		productId: [1325, 1326, 1327, 1328, 1329, 1330, 1331],
		bBytes: 10,
		bBits: 8,
		layout: [
			['Keys', 0, 1, 1, 8, 10],
			['Jog-Shuttle', 0, 6, 1, 8, 4],
			['Tbar', 0, 1, 10, 4, 10],
		], // control name, control index, startRow, startCol, endRow, endCol
		colCount: 10, // physical columns
		rowCount: 8, // physical rows
		hasPS: false,
		hasJog: [{ jogByte: 18 }],

		hasShuttle: [{ shuttleByte: 19 }],

		hasTbar: [
			{
				tbarByte: 17,
				tbarByteRaw: 15, // should only use cal t-bar on byte index 17
			},
		],
		backLightType: BackLightType.LEGACY,
		backLight2offset: 80,
		timestamp: 31, // ms time since device boot 4 byte BE
		disableKeys: [6, 7, 8, 14, 15, 16, 22, 23, 24, 30, 31, 32, 73, 74, 75, 73], // These bits are messy, better to ignore them
	}),
}
