export const VENDOR_ID = 1523

export interface ProductBase {
	identifier: string
	productId: number[]
	columns: number
	rows: number
	hasPS: boolean
	bankSize: number

	hasJoystick?: boolean

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
	XK24: {
		identifier: 'XK-24',
		productId: [1029,1028,1027,1249],
		columns: 	4,
		rows: 		6,
		hasPS: 		true,
		banks: 		2,
		bankSize: 	32
	},
	XK4: {	// This has not been tested
		identifier: 'XK-4',
		productId: [1127,1128,1129,1253, 1049],
		columns: 	4,
		rows: 		1,
		hasPS: 		false, // unknown
		banks: 		1, // only has blue light
		bankSize: 	32 // unknown
	},
	XK8: {	// This has not been tested
		identifier: 'XK-8',
		productId: [1130,1131,1132,1252],
		columns: 	8,
		rows: 		1,
		hasPS: 		false, // unknown
		banks: 		1, // only has blue light
		bankSize: 	32 // unknown
	},
	XK12JOG: {	// This has not been tested
		identifier: 'XK-12 Jog',
		productId: [1062,1064],
		columns: 	4,
		rows: 		3,
		hasPS: 		true,
		hasJog: 	true,
		jogByte: 	8,
		hasShuttle: true,
		shuttleByte: 9,
		banks: 		2,
		bankSize: 	32
	},
	XK12JOYSTICK: {	// This has not been tested
		identifier: 'XK-12 Joystick',
		productId: [1065,1067],
		columns: 	4,
		rows: 		3,
		hasPS: 		true,
		hasJoystick: true,
		banks: 		2,
		bankSize: 	32
	},
	XK16: {	// This has not been tested
		identifier: 'XK-16',
		productId: [1269,1270,1050,1051,1251],
		columns: 	4,
		rows: 		4, // not really rows, but the data comes like that (it is physically one row)
		hasPS: 		false, // unknown
		banks: 		1, // only has blue light
		bankSize: 	32 // unknown
	},
	XR32: {	// This has not been tested
		identifier: 'XR-32',
		productId: [1279,1280,1281,1282],
		columns: 	16,
		rows: 		2,
		hasPS: 		false, // unknown
		bankSize: 	128
	},
	XK60: {	// This has not been tested
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
		productId: [1237,1238,1089,1090,1091,1250],
		columns: 	10,
		rows: 		8,
		hasPS: 		true,
		banks: 		2,
		bankSize: 	80
	},
	XKE124TBAR: {
		identifier: 'XKE-124 T-bar',
		productId: [1275,1276,1277,1278],
		columns:	16,
		rows:		8,
		hasPS:		false,
		hasTbar:	true,
		tbarByte:	30,
		tbarByteRaw: 31,
		banks:		2,
		bankSize:	128,
		disableKeys: [108,109,110,111]
	},
	XKE128: {	// This has not been tested
		identifier: 'XKE-128',
		productId: [1227,1228,1229,1230],
		columns: 	16,
		rows: 		8,
		hasPS: 		false, // unknown
		banks: 		2,
		bankSize: 	128
	},
	XK68JOGSHUTTLE: {	// This has not been tested
		identifier: 'XK-68 Jog-Shuttle',
		productId: [1114, 1116],
		columns: 	10,
		rows: 		8,
		hasPS: 		true,
		hasJog: 	true,
		jogByte: 	18,
		hasShuttle: true,
		shuttleByte: 19,
		banks: 		2,
		bankSize: 	80,
		disableKeys: [29,30,31, 37,38,39, 45,46,47, 53,54,55]
	}
}
