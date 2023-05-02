import type * as HID from 'node-hid'
/*
 * This file contains internal convenience functions
 */

export function isHID_Device(device: HID.Device | HID.HIDAsync | string): device is HID.Device {
	return (
		typeof device === 'object' &&
		(device as HID.Device).vendorId !== undefined &&
		(device as HID.Device).productId !== undefined &&
		(device as HID.Device).interface !== undefined
	)
}
type HID_HID = HID.HIDAsync & { devicePath: string }
export function isHID_HID(device: HID.Device | HID.HIDAsync | string): device is HID_HID {
	return (
		typeof device === 'object' &&
		(device as HID_HID).write !== undefined &&
		(device as HID_HID).getFeatureReport !== undefined &&
		(device as HID_HID).devicePath !== undefined // yes, HID.HID exposes this, we're using that
	)
}
