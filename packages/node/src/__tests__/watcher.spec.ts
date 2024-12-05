import * as HID from 'node-hid'
import * as HIDMock from '../__mocks__/node-hid'
import { NodeHIDDevice, XKeys, XKeysWatcher } from '..'
import { handleXkeysMessages } from './lib'

describe('XKeysWatcher', () => {
	test('Detect device (w polling)', async () => {
		const POLL_INTERVAL = 10
		NodeHIDDevice.CLOSE_WAIT_TIME = 0 // We can override this to speed up the unit tests

		HIDMock.setMockWriteHandler(handleXkeysMessages)

		const onError = jest.fn((e) => {
			console.log('Error in XKeysWatcher', e)
		})
		const onConnected = jest.fn((xkeys: XKeys) => {
			xkeys.on('disconnected', () => {
				onDisconnected()
				xkeys.removeAllListeners()
			})
		})
		const onDisconnected = jest.fn(() => {})

		const watcher = new XKeysWatcher({
			usePolling: true,
			pollingInterval: POLL_INTERVAL,
		})
		watcher.on('error', onError)
		watcher.on('connected', onConnected)

		try {
			await sleep(POLL_INTERVAL * 2)
			expect(onConnected).toHaveBeenCalledTimes(0)

			// Add a device:
			{
				const hidDevice = {
					vendorId: XKeys.vendorId,
					productId: 1029,
					interface: 0,
					path: 'abc123',
					product: 'XK-24 MOCK',
				} as HID.Device

				HIDMock.mockSetDevices([hidDevice])

				// Listen for the 'connected' event:
				await sleep(POLL_INTERVAL)
				expect(onConnected).toHaveBeenCalledTimes(1)
			}

			// Remove the device:
			{
				HIDMock.mockSetDevices([])

				await sleepTicks(POLL_INTERVAL)
				expect(onDisconnected).toHaveBeenCalledTimes(1)
			}
		} catch (e) {
			throw e
		} finally {
			// Cleanup:
			await watcher.stop()
		}
		// Ensure the event handlers haven't been called again:
		await sleep(POLL_INTERVAL)
		expect(onDisconnected).toHaveBeenCalledTimes(1)
		expect(onConnected).toHaveBeenCalledTimes(1)

		expect(onError).toHaveBeenCalledTimes(0)
	})
})
/** Like sleep() but 1ms at a time, allows for the event loop to run promises, etc.. */
async function sleepTicks(ms: number) {
	for (let i = 0; i < ms; i++) {
		await sleep(1)
	}
}

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
