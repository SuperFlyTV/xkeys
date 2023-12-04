import type * as HID from 'node-hid'
/*
 * This file contains internal convenience functions
 */

export function isHID_Device(device: HID.Device | HID.HID | HID.HIDAsync | string): device is HID.Device {
	return (
		typeof device === 'object' &&
		(device as HID.Device).vendorId !== undefined &&
		(device as HID.Device).productId !== undefined &&
		(device as HID.Device).interface !== undefined
	)
}
