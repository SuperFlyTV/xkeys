import * as fs from 'fs'
import * as HID from 'node-hid'
import * as HIDMock from '../__mocks__/node-hid'
import { describeEvent } from './lib'
import { XKeys, XKeysEvents } from '../'

describe('Recorded tests', () => {
	async function setupTestPanel(params: { productId: number }): Promise<XKeys> {
		const hidDevice = {
			vendorId: XKeys.vendorId,
			productId: params.productId,
			interface: 0,
			path: 'mockPath',
		} as HID.Device

		HIDMock.setMockWriteHandler(handleXkeysMessages)

		const myXkeysPanel = await XKeys.setupXkeysPanel(hidDevice)

		return myXkeysPanel
	}
	beforeAll(() => {
		expect(HIDMock.setMockWriteHandler).toBeTruthy()
		// @ts-expect-error mock
		expect(HID.setMockWriteHandler).toBeTruthy()
	})
	beforeEach(() => {})

	const dirPath = './src/__tests__/recordings/'

	fs.readdirSync(dirPath).forEach((file) => {
		test(`Recording "${file}"`, async () => {
			const recording: any = JSON.parse(fs.readFileSync(dirPath + file, 'utf-8'))

			const xkeysDevice = await setupTestPanel({
				productId: recording.device.productId,
			})
			let lastDescription: string[] = []

			const handleEvent = (event: keyof XKeysEvents) => {
				xkeysDevice.on(event, (...args: any[]) => {
					lastDescription.push(describeEvent(event, args))
				})
			}
			handleEvent('down')
			handleEvent('up')
			handleEvent('jog')
			handleEvent('shuttle')
			handleEvent('joystick')
			handleEvent('tbar')
			handleEvent('disconnected')

			// Go through all recorded events:
			// (ie mock that data comes from the device, and check that the right events are emitted from the class)
			expect(recording.events.length).toBeGreaterThanOrEqual(1)
			for (const event of recording.events) {
				expect(event.data).toHaveLength(1)

				for (const data of event.data) {
					// Mock the device sending data:
					// @ts-expect-error hack
					xkeysDevice.device.emit('data', Buffer.from(data, 'hex'))
				}
				expect(lastDescription).toEqual([event.description])

				lastDescription = []
			}

			// Go through all recorded actions:
			// (ie trigger a method on the class, verify that the data sent to the device is correct)
			expect(recording.actions.length).toBeGreaterThanOrEqual(1)
			resetSentData()
			for (const action of recording.actions) {
				try {
					expect(xkeysDevice[action.method]).toBeTruthy()
					expect(action.anomaly).toBeFalsy()

					xkeysDevice[action.method](...action.arguments)

					expect(sentData).toEqual(action.sentData)
					resetSentData()
				} catch (err) {
					console.log('action', action)
					throw err
				}
			}
		})
	})
})

/** Data sent to the panel */
let sentData: string[] = []

function handleXkeysMessages(hid: HID.HID, message: number[]) {
	// Replies to a few of the messages that are sent to the XKeys

	sentData.push(Buffer.from(message).toString('hex'))

	const firmVersion: number = 0
	const unitID: number = 0

	// Special case:
	if (message[1] === 214) {
		// getVersion
		// Reply with the version
		const data = Buffer.alloc(128) // length?
		data.writeUInt8(214, 1)
		data.writeUInt8(firmVersion, 10)
		hid.emit('data', data)
		return
	}
	let reply = false

	// Reply with full state:
	const values: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // length?

	values[0] = unitID

	if (message[1] === 177) {
		// generateData
		values[1] += 2 // set the genData flag
		reply = true
	}

	if (reply) {
		const data = Buffer.alloc(128) // length?
		values.forEach((value, index) => {
			data.writeUInt8(value, index)
		})
		hid.emit('data', data)
	}
}
function resetSentData() {
	sentData = []
}
