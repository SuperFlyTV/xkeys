import { XKeys } from '@xkeys-lib/core'
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
				vendorId: number
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
				vendorId: connectedXkeys[0].vendorId,
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
				vendorId: devicePathOrHIDDevice.vendorId,
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
				vendorId: dInfo.vendorId,
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
				vendorId: nodeHidInfo.vendorId,
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

		let alreadyRejected = false
		await new Promise<void>((resolve, reject) => {
			const markRejected = (e: unknown) => {
				reject(e)
				alreadyRejected = true
			}
			const xkeysStopgapErrorHandler = (e: unknown) => {
				if (alreadyRejected) {
					console.error(`Xkeys: Error emitted after setup already rejected:`, e)
					return
				}

				markRejected(e)
			}

			// Handle all error events until the instance is returned
			xkeys.on('error', xkeysStopgapErrorHandler)

			// Wait for the device to initialize:
			xkeys
				.init()
				.then(() => {
					resolve()
					xkeys.removeListener('error', xkeysStopgapErrorHandler)
				})
				.catch(markRejected)
		})

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

		if (!device.path) return false

		const found = XKeys.filterDevice({
			product: device.product,
			interface: device.interface,
			vendorId: device.vendorId,
			productId: device.productId,
		})
		if (!found) return false
		return true
	})
	return connectedXkeys as HID_Device[]
}
