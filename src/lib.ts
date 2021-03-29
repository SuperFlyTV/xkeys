import type * as HID from 'node-hid'
/*
 * This file contains internal convenience functions
 */

/** Convenience function to force the input to be of a certain type. */
export function literal<T>(o: T): T {
	return o
}

export function isHID_Device(device: HID.Device | HID.HID | string): device is HID.Device {
	return (
		typeof device === 'object' &&
		(device as HID.Device).vendorId !== undefined &&
		(device as HID.Device).productId !== undefined &&
		(device as HID.Device).interface !== undefined
	)
}
type HID_HID = HID.HID & { devicePath: string }
export function isHID_HID(device: HID.Device | HID.HID | string): device is HID_HID {
	return (
		typeof device === 'object' &&
		(device as HID_HID).write !== undefined &&
		(device as HID_HID).getFeatureReport !== undefined &&
		(device as HID_HID).devicePath !== undefined // yes, HID.HID exposes this, we're using that
	)
}

export function describeEvent(event: string, args: any[]): string {
	const metadataStr = (metadata: any) => {
		const strs: string[] = []
		Object.entries(metadata).forEach(([key, value]) => {
			strs.push(`${key}: ${value}`)
		})
		return strs.join(', ')
	}

	if (event === 'down') {
		const btnIndex = args[0]
		const metadata = args[1]
		return `Button ${btnIndex} pressed.  Metadata: ${metadataStr(metadata)}`
	} else if (event === 'up') {
		const btnIndex = args[0]
		const metadata = args[1]
		return `Button ${btnIndex} released. Metadata: ${metadataStr(metadata)}`
	} else if (event === 'jog') {
		const index = args[0]
		const value = args[1]
		const metadata = args[2]
		return `Jog ( index ${index}) value: ${value}. Metadata: ${metadataStr(metadata)}`
	} else if (event === 'shuttle') {
		const index = args[0]
		const value = args[1]
		const metadata = args[2]
		return `Shuttle ( index ${index}) value: ${value}. Metadata: ${metadataStr(metadata)}`
	} else if (event === 'joystick') {
		const index = args[0]
		const value = args[1]
		const metadata = args[2]
		return `Joystick ( index ${index}) value: ${value}. Metadata: ${metadataStr(metadata)}`
	} else if (event === 'tbar') {
		const index = args[0]
		const value = args[1]
		const metadata = args[2]
		return `T-bar ( index ${index}) value: ${value}. Metadata: ${metadataStr(metadata)}`
	} else if (event === 'disconnected') {
		return `Panel disconnected!`
	}

	throw new Error('Unhnandled event!')
}
