import { Product, XKeys } from '@xkeys-lib/core'
import { PRODUCTS } from '@xkeys-lib/core'
import * as HID from 'node-hid'
import { NodeHIDDevice } from './node-hid-wrapper'

import { isHID_Device } from './lib'

import { HID_Device } from './api'

/**
 * Sets up a connection to a HID device (the X-keys panel)
 *
 * If called without arguments, it will select any connected X-keys panel.
 */
export function setupXkeysPanel(): Promise<XKeys>
export function setupXkeysPanel(HIDDevice: HID.Device): Promise<XKeys>
export function setupXkeysPanel(HIDAsync: HID.HIDAsync): Promise<XKeys>
export function setupXkeysPanel(devicePath: string): Promise<XKeys>
export async function setupXkeysPanel(
	devicePathOrHIDDevice?: HID.Device | HID.HID | HID.HIDAsync | string
): Promise<XKeys> {
	let devicePath: string
	let device: HID.HIDAsync | undefined
	let deviceInfo:
		| {
				product: string | undefined
				productId: number
				interface: number
		  }
		| undefined

	try {
		if (!devicePathOrHIDDevice) {
			// Device not provided, will then select any connected device:
			const connectedXkeys = listAllConnectedPanels()
			if (!connectedXkeys.length) {
				throw new Error('Could not find any connected X-keys panels.')
			}
			// Just select the first one:
			devicePath = connectedXkeys[0].path
			device = await HID.HIDAsync.open(devicePath)

			deviceInfo = {
				product: connectedXkeys[0].product,
				productId: connectedXkeys[0].productId,
				interface: connectedXkeys[0].interface,
			}
		} else if (isHID_Device(devicePathOrHIDDevice)) {
			// is HID.Device

			if (!devicePathOrHIDDevice.path) throw new Error('HID.Device path not set!')

			devicePath = devicePathOrHIDDevice.path
			device = await HID.HIDAsync.open(devicePath)

			deviceInfo = {
				product: devicePathOrHIDDevice.product,
				productId: devicePathOrHIDDevice.productId,
				interface: devicePathOrHIDDevice.interface,
			}
		} else if (typeof devicePathOrHIDDevice === 'string') {
			// is string (path)

			devicePath = devicePathOrHIDDevice
			device = await HID.HIDAsync.open(devicePath)
			// deviceInfo is set later
		} else if (devicePathOrHIDDevice instanceof HID.HID) {
			// Can't use this, since devicePath is missing
			throw new Error(
				'HID.HID not supported as argument to setupXkeysPanel, use HID.devices() to find the device and provide that instead.'
			)
		} else if (devicePathOrHIDDevice instanceof HID.HIDAsync) {
			// @ts-expect-error getDeviceInfo missing in typings
			const dInfo = await devicePathOrHIDDevice.getDeviceInfo()

			if (!dInfo.path)
				throw new Error(
					// Can't use this, we need a path to the device
					'HID.HIDAsync device did not provide a path, so its not supported as argument to setupXkeysPanel, use HID.devicesAsync() to find the device and provide that instead.'
				)

			devicePath = dInfo.path
			device = devicePathOrHIDDevice

			deviceInfo = {
				product: dInfo.product,
				productId: dInfo.productId,
				interface: dInfo.interface,
			}
		} else {
			throw new Error('setupXkeysPanel: invalid arguments')
		}

		if (!deviceInfo) {
			// @ts-expect-error getDeviceInfo missing in typings
			const nodeHidInfo: HID.Device = await device.getDeviceInfo()
			// Look through HID.devices(), because HID.Device contains the productId
			deviceInfo = {
				product: nodeHidInfo.product,
				productId: nodeHidInfo.productId,
				interface: nodeHidInfo.interface,
			}
		}

		if (!device) throw new Error('Error setting up X-keys: device not found')
		if (!devicePath) throw new Error('Error setting up X-keys: devicePath not found')
		if (!deviceInfo) throw new Error('Error setting up X-keys: deviceInfo not found')

		const deviceWrap = new NodeHIDDevice(device)

		const xkeys = new XKeys(deviceWrap, deviceInfo, devicePath)

		// Wait for the device to initialize:
		await xkeys.init()

		return xkeys
	} catch (e) {
		if (device) await device.close().catch(() => null) // Suppress error

		throw e
	}
}
/** Returns a list of all connected X-keys-HID-devices */
export function listAllConnectedPanels(): HID_Device[] {
	const connectedXkeys = HID.devices().filter((device) => {
		// Filter to only return the supported devices:

		if (device.vendorId !== XKeys.vendorId) return false
		if (!device.path) return false

		let found = false
		for (const product of Object.values<Product>(PRODUCTS)) {
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
