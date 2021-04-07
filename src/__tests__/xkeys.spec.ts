import * as fs from 'fs'
import * as HID from 'node-hid'
import * as HIDMock from '../__mocks__/node-hid'
import { describeEvent } from '../lib'
import { XKeys, XKeysEvents } from '../'
import { Product, PRODUCTS } from '../products'

expect.extend({
	toBeObject(received) {
		return {
			message: () => `expected ${received} to be an object`,
			pass: typeof received == 'object',
		}
	},
	toBeWithinRange(received, floor, ceiling) {
		if (typeof received !== 'number') {
			return {
				message: () => `expected ${received} to be a number`,
				pass: false,
			}
		}
		const pass = received >= floor && received <= ceiling
		if (pass) {
			return {
				message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
				pass: true,
			}
		} else {
			return {
				message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
				pass: false,
			}
		}
	},
})
declare global {
	namespace jest {
		interface Matchers<R> {
			toBeObject(): R
			toBeWithinRange(a: number, b: number): R
		}
	}
}

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

	const recordings: { filePath: string; recording: any }[] = []
	fs.readdirSync(dirPath).forEach((file) => {
		if (!file.match(/json$/)) return // only use json files
		const recording: any = JSON.parse(fs.readFileSync(dirPath + file, 'utf-8'))
		recordings.push({
			filePath: file,
			recording: recording,
		})
	})

	recordings.forEach(({ filePath, recording }) => {
		test(`Recording "${filePath}"`, async () => {
			const xkeysDevice = await setupTestPanel({
				productId: recording.device.productId,
			})
			let lastDescription: string[] = []
			let lastData: { event: string; args: any[] }[] = []

			const handleEvent = (event: keyof XKeysEvents) => {
				xkeysDevice.on(event, (...args: any[]) => {
					lastDescription.push(describeEvent(event, args))
					lastData.push({ event, args })
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
				try {
					expect(event.data).toHaveLength(1)

					for (const data of event.data) {
						// Mock the device sending data:
						// @ts-expect-error hack
						xkeysDevice.device.emit('data', Buffer.from(data, 'hex'))
					}
					if (event.description) {
						expect(lastDescription).toEqual([event.description])
						expect(lastData).toHaveLength(1)
						const eventType = lastData[0].event
						if (['down', 'up'].includes(eventType)) {
							const index = lastData[0].args[0]
							expect(index).toBeWithinRange(0, 999)

							const metadata = lastData[0].args[1]
							expect(metadata).toBeObject()
							expect(metadata.row).toBeWithinRange(0, 99)
							expect(metadata.col).toBeWithinRange(0, 99)
							if (xkeysDevice.info.emitsTimestamp) {
								expect(metadata.timestamp).toBeWithinRange(1, Number.POSITIVE_INFINITY)
							} else {
								expect(metadata.timestamp).toBe(undefined)
							}
						} else if (['jog', 'shuttle', 'joystick', 'tbar'].includes(eventType)) {
							const index = lastData[0].args[0]
							expect(index).toBeWithinRange(0, 999)

							// const value = lastData[0].args[1]

							const metadata = lastData[0].args[2]
							expect(metadata).toBeObject()

							if (xkeysDevice.info.emitsTimestamp) {
								expect(metadata.timestamp).toBeWithinRange(1, Number.POSITIVE_INFINITY)
							} else {
								expect(metadata.timestamp).toBe(undefined)
							}
						} else {
							throw new Error(`Unsupported event: "${eventType}" (update tests)`)
						}
					} else {
						expect(lastDescription).toEqual([])
						expect(lastData).toHaveLength(0)
					}

					lastDescription = []
					lastData = []
				} catch (err) {
					console.log(event.description)
					throw err
				}
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

	test('Product coverage', () => {
		const products: { [name: string]: Product } = {}
		for (const [key, product] of Object.entries(PRODUCTS)) {
			products[key] = product
		}

		recordings.forEach(({ recording }) => {
			// Find and remove matched product:
			for (const [key, product] of Object.entries(products)) {
				let found = false
				for (const hidDevice of product.hidDevices) {
					if (hidDevice[0] === recording.info.productId && hidDevice[1] === recording.info.interface) {
						found = true
					}
				}
				if (found) {
					delete products[key]
					break
				}
			}
		})

		console.log(
			`Note: Products not yet covered by tests: \n${Object.values(products)
				.map((p) => `* ${p.name}`)
				.join('\n')}`
		)

		// This number should be decreased as more recordings are added
		expect(Object.values(products).length).toBeLessThanOrEqual(8)
	})
})
describe('Unit tests', () => {
	test('calculateDelta', () => {
		expect(XKeys.calculateDelta(100, 100)).toBe(0)
		expect(XKeys.calculateDelta(110, 100)).toBe(10)
		expect(XKeys.calculateDelta(90, 100)).toBe(-10)
		expect(XKeys.calculateDelta(0, 255)).toBe(1)
		expect(XKeys.calculateDelta(5, 250)).toBe(11)
		expect(XKeys.calculateDelta(255, 0)).toBe(-1)
		expect(XKeys.calculateDelta(250, 5)).toBe(-11)
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
