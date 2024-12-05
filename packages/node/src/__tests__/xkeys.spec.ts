import * as HID from 'node-hid'
import * as HIDMock from '../__mocks__/node-hid'
import { setupXkeysPanel, XKeys } from '../'
import { getSentData, handleXkeysMessages, resetSentData, sleep } from './lib'

describe('Unit tests', () => {
	afterEach(() => {
		HIDMock.resetMockWriteHandler()
	})
	test('calculateDelta', () => {
		expect(XKeys.calculateDelta(100, 100)).toBe(0)
		expect(XKeys.calculateDelta(110, 100)).toBe(10)
		expect(XKeys.calculateDelta(90, 100)).toBe(-10)
		expect(XKeys.calculateDelta(0, 255)).toBe(1)
		expect(XKeys.calculateDelta(5, 250)).toBe(11)
		expect(XKeys.calculateDelta(255, 0)).toBe(-1)
		expect(XKeys.calculateDelta(250, 5)).toBe(-11)
	})
	test('XKeys methods', async () => {
		// const panel = new XKeys()

		const hidDevice = {
			vendorId: XKeys.vendorId,
			productId: 1029,
			interface: 0,
			path: 'mockPath',
		} as HID.Device

		HIDMock.setMockWriteHandler(handleXkeysMessages)

		const myXkeysPanel = await setupXkeysPanel(hidDevice)

		const onError = jest.fn(console.log)

		myXkeysPanel.on('error', onError)

		resetSentData()

		expect(myXkeysPanel.firmwareVersion).toBe(1)
		resetSentData()
		expect(myXkeysPanel.unitId).toBe(0)
		resetSentData()
		expect(myXkeysPanel.info).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.getButtons()
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setIndicatorLED(5, true)
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setIndicatorLED(5, false)
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()

		myXkeysPanel.setIndicatorLED(5, true, true)
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()

		myXkeysPanel.setBacklight(5, '59f')
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setBacklight(5, '5599ff')
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setBacklight(5, '#5599ff')
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setBacklight(5, { r: 45, g: 210, b: 255 })
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setBacklight(5, true)
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setBacklight(5, false)
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setBacklight(5, null)
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setBacklight(5, null)
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setBacklight(5, '59f', true)
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()

		myXkeysPanel.setAllBacklights('59f')
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setAllBacklights('5599ff')
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setAllBacklights('#5599ff')
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setAllBacklights({ r: 45, g: 210, b: 255 })
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setAllBacklights(true)
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setAllBacklights(false)
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setAllBacklights(null)
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setAllBacklights(null)
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()

		myXkeysPanel.toggleAllBacklights()
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setBacklightIntensity(100)
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setBacklightIntensity(0, 255)
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.saveBackLights()
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()

		myXkeysPanel.setFrequency(127)
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.setUnitId(42)
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		myXkeysPanel.rebootDevice()
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()
		// expect(myXkeysPanel.writeLcdDisplay(line: number, displayChar: string, backlight: boolean)
		await myXkeysPanel.flush()
		// expect(getSentData()).toMatchSnapshot()
		// resetSentData()

		myXkeysPanel.writeData([0, 1, 2, 3, 4])
		await myXkeysPanel.flush()
		expect(getSentData()).toMatchSnapshot()
		resetSentData()

		expect(onError).toHaveBeenCalledTimes(0)
	})
	test('flush()', async () => {
		const hidDevice = {
			vendorId: XKeys.vendorId,
			productId: 1029,
			interface: 0,
			path: 'mockPath',
		} as HID.Device

		const mockWriteStart = jest.fn()
		const mockWriteEnd = jest.fn()
		HIDMock.setMockWriteHandler(async (hid, message) => {
			mockWriteStart()
			await sleep(10)
			mockWriteEnd()
			handleXkeysMessages(hid, message)
		})

		const myXkeysPanel = await setupXkeysPanel(hidDevice)

		const errorListener = jest.fn(console.error)
		myXkeysPanel.on('error', errorListener)

		mockWriteStart.mockClear()
		mockWriteEnd.mockClear()

		myXkeysPanel.toggleAllBacklights()

		expect(mockWriteStart).toBeCalledTimes(1)
		expect(mockWriteEnd).toBeCalledTimes(0) // Should not have been called yet

		// cleanup:
		await myXkeysPanel.flush() // waits for all writes to finish

		expect(mockWriteEnd).toBeCalledTimes(1)

		await myXkeysPanel.close() // close the device.
		myXkeysPanel.off('error', errorListener)

		expect(errorListener).toHaveBeenCalledTimes(0)
	})
	test('flush() with error', async () => {
		const hidDevice = {
			vendorId: XKeys.vendorId,
			productId: 1029,
			interface: 0,
			path: 'mockPath',
		} as HID.Device

		const mockWriteStart = jest.fn()
		const mockWriteEnd = jest.fn()
		HIDMock.setMockWriteHandler(async (hid, message) => {
			mockWriteStart()
			await sleep(10)
			mockWriteEnd()
			// console.log('message', message)

			if (message[0] === 0 && message[1] === 184) {
				// toggleAllBacklights
				throw new Error('Mock error')
			}

			handleXkeysMessages(hid, message)
		})

		const myXkeysPanel = await setupXkeysPanel(hidDevice)

		const errorListener = jest.fn((e) => {
			if (`${e}`.includes('Mock error')) return // ignore
			console.error(e)
		})
		myXkeysPanel.on('error', errorListener)

		mockWriteStart.mockClear()
		mockWriteEnd.mockClear()

		myXkeysPanel.toggleAllBacklights()

		expect(mockWriteStart).toBeCalledTimes(1)
		expect(errorListener).toBeCalledTimes(0) // Should not have been called yet

		// cleanup:
		await myXkeysPanel.flush() // waits for all writes to finish

		expect(errorListener).toBeCalledTimes(1)
		errorListener.mockClear()

		await myXkeysPanel.close() // close the device.
		myXkeysPanel.off('error', errorListener)

		expect(errorListener).toHaveBeenCalledTimes(0)
	})
})
