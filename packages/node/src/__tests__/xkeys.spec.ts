import * as HID from 'node-hid'
import * as HIDMock from '../__mocks__/node-hid'
import { setupXkeysPanel, XKeys } from '../'
import { getSentData, handleXkeysMessages, resetSentData } from './lib'

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
