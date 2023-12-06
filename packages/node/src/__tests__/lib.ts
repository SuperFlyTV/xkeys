import * as HID from 'node-hid'

/** Data sent to the panel */
let sentData: string[] = []

export function getSentData() {
	return sentData
}

export function handleXkeysMessages(hid: HID.HIDAsync, message: number[]) {
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
export function resetSentData() {
	sentData = []
}

declare global {
	namespace jest {
		interface Matchers<R> {
			toBeObject(): R
			toBeWithinRange(a: number, b: number): R
		}
	}
}
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
