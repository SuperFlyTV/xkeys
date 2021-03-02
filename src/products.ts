export const VENDOR_ID = 1523

export interface ProductBase {
	identifier: string
	productId: number[]
	columns: number
	rows: number
	hasPS: boolean
	bankSize: number

	hasJoystick?: boolean
	joyXbyte?: number
	joyYbyte?: number
	joyZbyte?: number

	banks?: number
	disableKeys?: number[]

	hasJog?: true
	jogByte?: number
	
	hasShuttle?: true
	shuttleByte?: number
	hasTbar?: true
	tbarByte?: number
	tbarByteRaw?: number
}
export interface ProductJog extends ProductBase {
	hasJog: true
	jogByte: number
}
export interface ProductShuttle extends ProductBase {
	hasShuttle: true
	shuttleByte: number
}
export interface ProductTbar extends ProductBase {
	hasTbar: true
	tbarByte: number
	tbarByteRaw: number
}
export type Product = ProductBase | ProductJog | ProductShuttle | ProductTbar

export const PRODUCTS: {[name: string]: Product} = {

	// Note: The byte numbers are byte index (starts with 0) and will be offset from PIE SDK documentation by -2
	// these byte index are used to access the exact byte in the data report.

	XK24: {
		identifier: 'XK-24',
		productId: [1029,1027],
		columns: 	4,
		rows: 		6,
		hasPS: 		true,
		banks: 		2,
		bankSize: 	32
	},
	XK4: {
		identifier: 'XK-4',
		productId: [1127,1129],
		columns: 	4,
		rows: 		1,
		hasPS: 		true, // slide switch on end
		banks: 		1, // only has blue light
		bankSize: 	32 // unknown
	},
	XK8: {
		identifier: 'XK-8',
		productId: [1130,1132],
		columns: 	4,
		rows: 		2, // row1	= 0,1,2,3	row2=4,5,6,7
		hasPS: 		true, // slide switch on end
		banks: 		1, // only has blue light
		bankSize: 	32 // unknown
	},
	XK12JOG: {
		identifier: 'XK-12 Jog',
		productId: [1062,1064],
		columns: 	4,
		rows: 		3,
		hasPS: 		true,
		hasJog: 	true,
		jogByte: 	6,
		hasShuttle: 	true,
		shuttleByte:	7,
		banks: 		2,
		bankSize: 	32
	},
	XK12JOYSTICK: {
		identifier: 'XK-12 Joystick',
		productId: [1065,1067],
		columns: 	4,
		rows: 		3,
		hasPS: 		true,
		hasJoystick: true,
		joyXbyte:	6,
		joyYbyte:	7,
		joyZbyte:	8, // twist of stick
		banks: 		2,
		bankSize: 	32
	},
	XK16: {
		identifier: 'XK-16',
		productId: [1049,1051,1213,1216],
		columns: 	4, // 4	buttton data bytes
		rows: 		4, // not really rows, but the data comes like that (it is physically one row) row1= 0,1,2,3	row2=4,5,6,7 row3= 8,9,10,11 row4=12,13,14,15
		hasPS: 		true, // slide switch on end
		banks: 		1, // only has blue light
		bankSize: 	0, // only one set LEDs under keys
		//btnLocation:	['r1c1','r1c5','r1c9','r1c13','r1c2','r1c6','r1c10','r1c14','r1c3','r1c7','r1c11','r1c15','r1c4','r1c8','r1c12','r1c16']
	},
	XKR32: {	// discontinued product, XKE 40 is viable replacement
		identifier: 'XR-32',
		productId: [1279,1282],
		columns: 	4, // 4	buttton data bytes
		rows: 		8,
		hasPS: 		false, // unknown
		bankSize: 	128
	},
	XKE40: {
		identifier: 'XKE-40',
		productId: [1358,1359,1360,1361],
		columns: 	5, // 5	buttton data bytes
		rows: 		8, // row1=0,8,16,24,32 row2=1,9,17,25,33 row3=2,10,18,26,34 row4=3,11,19,27,35 row5=4,12,20,28,36 row6=5,13,21,29,37 row7=6,14,22,30,38 row8=7,15,23,31,39
		hasPS: 		true, // behind small hole on left side.
		bankSize: 	40	// off set to	control second led bank.
	},

	XK60: {
		identifier: 'XK-60',
		productId: [1239,1240,1121,1122,1123,1254],
		columns: 	10,
		rows: 		8,
		hasPS: 		true,
		banks: 		2,
		bankSize: 	80
	},
	XK80: {
		identifier: 'XK-80',
		productId: 	[1237,1238,1089,1090,1091,1250],
		columns: 	10,
		rows: 		8,
		hasPS: 		true,
		banks: 		2,
		bankSize: 	80
	},
	XKE124TBAR: {
		identifier: 'XKE-124 T-bar',
		productId: 	[1275,1278],
		columns:	16,
		rows:		8,
		hasPS:		false,
		hasTbar:	true,
		tbarByte:	28,	 // should only use cal t-bar on byte index 28 n
		tbarByteRaw: 	29,
		banks:		2,
		bankSize:	128,
		disableKeys:	[108,109,110,111]
	},
	XKE128: {
		identifier: 'XKE-128',
		productId: [1227,1228,1229,1230],
		columns: 	16,
		rows: 		8,
		hasPS: 		false, // unknown
		banks: 		2,
		bankSize: 	128
	},
	XK68JOGSHUTTLE: {
		identifier: 'XK-68 Jog-Shuttle',
		productId: 	[1114, 1116],
		columns: 	10,
		rows: 		8,
		hasPS: 		true,
		hasJog: 	true,
		jogByte: 	16,
		hasShuttle: 	true,
		shuttleByte: 	17,
		banks: 		2,
		bankSize: 	80,
		disableKeys: 	[29,30,31, 37,38,39, 45,46,47, 53,54,55]

		},
	XK64JOGTBAR: {
		identifier: 'XKE-64 Jog T-bar',
		productId: 	[1325, 1326,1327,1328,1329,1330,1331],
		columns: 	10,
		rows: 		8,
		hasPS: 		true,
		hasJog: 	true,
		jogByte: 	18,
		hasShuttle: 	true,
		shuttleByte: 	19,
		hasTbar:	true,
		tbarByte:	17,	 // should only use cal t-bar on byte index 17
		tbarByteRaw: 	15,
		banks: 		2,
		bankSize: 	80,
		disableKeys: 	[5,6,7,13,14,15,21,22,23,29,30,31,72,73,74,75] // These bits are messy, better to ignore them

	}
}
