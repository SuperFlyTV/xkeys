import { XKeys, XKEYS_VENDOR_ID } from '@xkeys-lib/core'
import { WebHIDDevice } from './web-hid-wrapper'

/** Prompts the user for which X-keys panel to select */
export async function requestXkeysPanels(): Promise<HIDDevice[]> {
	const browserDevices = await navigator.hid.requestDevice({
		filters: [
			{
				vendorId: XKEYS_VENDOR_ID,
			},
		],
	})
	// if (!browserDevices.length) throw new Error('No device was selected by user')

	return browserDevices
}
/**
 * Reopen previously selected devices.
 * The browser remembers what the user previously allowed your site to access, and this will open those without the request dialog
 */
export async function getOpenedXKeysPanels(): Promise<HIDDevice[]> {
	return await navigator.hid.getDevices()
}

/** Sets up a connection to a HID device (the X-keys panel) */
export async function setupXkeysPanel(browserDevice: HIDDevice): Promise<XKeys> {
	// const browserDevices = await navigator.hid.requestDevice({
	// 	filters: [
	// 		{
	// 			vendorId: XKEYS_VENDOR_ID,
	// 		},
	// 	],
	// })

	// if (!browserDevices.length) throw new Error('No device was selected by user')

	// const browserDevice = browserDevices[0]
	if (!browserDevice?.collections?.length) throw Error(`device collections is empty`)
	if (!browserDevice.productId) throw Error(`Device has no productId!`)

	const productId = browserDevice.productId
	// const collection = browserDevice.collections[0]

	if (!browserDevice.opened) {
		await browserDevice.open()
	}

	const deviceWrap = new WebHIDDevice(browserDevice)

	const xkeys = new XKeys(deviceWrap, {
		product: browserDevice.productName,
		productId: productId,
		interface: null, // todo: Check what to use here (collection.usage?)
	})

	// Wait for the device to initialize:
	await xkeys.init()

	return xkeys
}
