import { EventEmitter } from 'events'
import type { Device } from 'node-hid'
import { XKEYS_VENDOR_ID } from '..'

let mockWriteHandler: undefined | ((hid: HIDAsync, message: number[]) => void) = undefined
export function setMockWriteHandler(handler: (hid: HIDAsync, message: number[]) => void) {
	mockWriteHandler = handler
}
export function resetMockWriteHandler() {
	mockWriteHandler = undefined
}
let mockDevices: Device[] = []
export function mockSetDevices(devices: Device[]) {
	mockDevices = devices
}

// export class HID extends EventEmitter {
export class HIDAsync extends EventEmitter {
	private mockWriteHandler

	static async open(path: string): Promise<HIDAsync> {
		return new HIDAsync(path)
	}

	private _deviceInfo: Device = {
		vendorId: XKEYS_VENDOR_ID,
		productId: 0,
		release: 0,
		interface: 0,
		product: 'N/A Mock',
	}

	constructor(path: string) {
		super()
		this.mockWriteHandler = mockWriteHandler

		const existingDevice = mockDevices.find((d) => d.path === path)
		if (existingDevice) {
			this._deviceInfo = existingDevice
		}
	}
	// constructor(vid: number, pid: number);
	async close(): Promise<void> {
		// void
	}
	async pause(): Promise<void> {
		// void
		throw new Error('Mock not implemented.')
	}
	async read(_timeOut?: number): Promise<Buffer | undefined> {
		return undefined
	}
	async sendFeatureReport(_data: number[]): Promise<number> {
		return 0
	}
	async getFeatureReport(_reportIdd: number, _reportLength: number): Promise<Buffer> {
		return Buffer.alloc(0)
	}
	async resume(): Promise<void> {
		// void
		throw new Error('Mock not implemented.')
	}
	async write(message: number[]): Promise<number> {
		await this.mockWriteHandler?.(this, message)
		return 0
	}
	async setNonBlocking(_noBlock: boolean): Promise<void> {
		// void
		throw new Error('Mock not implemented.')
	}

	async generateDeviceInfo(): Promise<Device> {
		// HACK: For typings
		return this.getDeviceInfo()
	}

	async getDeviceInfo(): Promise<Device> {
		return this._deviceInfo
	}
}
export function devices(): Device[] {
	return mockDevices
}
export function setDriverType(_type: 'hidraw' | 'libusb'): void {
	throw new Error('Mock not implemented.')
	// void
}
