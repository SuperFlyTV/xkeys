import { XKeys, XKEYS_VENDOR_ID } from '@xkeys-lib/core'
import { WebHIDDevice } from './web-hid-wrapper'

/** Prompts the user for which X-keys panel to select */
export async function requestXkeysPanels(): Promise<HIDDevice[]> {
	const allDevices = await navigator.hid.requestDevice({
		filters: [
			{
				vendorId: XKEYS_VENDOR_ID,
			},
		],
	})
	return allDevices.filter(isValidXkeysUsage)
}
/**
 * Reopen previously selected devices.
 * The browser remembers what the user previously allowed your site to access, and this will open those without the request dialog
 */
export async function getOpenedXKeysPanels(): Promise<HIDDevice[]> {
	const allDevices = await navigator.hid.getDevices()
	return allDevices.filter(isValidXkeysUsage)
}

function isValidXkeysUsage(device: HIDDevice): boolean {
	if (device.vendorId !== XKEYS_VENDOR_ID) return false

	return !!device.collections.find((collection) => {
		if (collection.usagePage !== 12) return false

		// Check the write-length of the device is > 20
		return !!collection.outputReports?.find((report) => !!report.items?.find((item) => item.reportCount ?? 0 > 20))
	})
}

/** Sets up a connection to a HID device (the X-keys panel) */
export async function setupXkeysPanel(browserDevice: HIDDevice): Promise<XKeys> {
	if (!browserDevice?.collections?.length) throw Error(`device collections is empty`)
	if (!isValidXkeysUsage(browserDevice)) throw new Error(`Device has incorrect usage/interface`)
	if (!browserDevice.productId) throw Error(`Device has no productId!`)

	const productId = browserDevice.productId

	if (!browserDevice.opened) {
		await browserDevice.open()
	}

	const deviceWrap = new WebHIDDevice(browserDevice)

	const xkeys = new XKeys(
		deviceWrap,
		{
			product: browserDevice.productName,
			productId: productId,
			interface: null, // todo: Check what to use here (collection.usage?)
		},
		undefined
	)

	// Wait for the device to initialize:
	try {
		await xkeys.init()

		return xkeys
	} catch (e) {
		await deviceWrap.close()
		throw e
	}
}
