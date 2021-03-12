import { EventEmitter } from 'events'

export interface Device {
	vendorId: number
	productId: number
	path?: string
	serialNumber?: string
	manufacturer?: string
	product?: string
	release: number
	interface: number
	usagePage?: number
	usage?: number
}

// export class HID extends EventEmitter {
export class HID extends EventEmitter {
	constructor (_path: string) {
		super()
	}
	// constructor(vid: number, pid: number);
	close(): void {
		// void
	}
	pause(): void {
		// void
	}
	read(_callback: (err: any, data: number[]) => void): void {
		// void
	}
	readSync(): number[] {
		return []
	}
	readTimeout(_timeOut: number): number[] {
		return []
	}
	sendFeatureReport(_data: number[]): number {
		return 0
	}
	getFeatureReport(_reportIdd: number, _reportLength: number): number[] {
		return []
	}
	resume(): void {
		// void
	}
	write(message: number[]): number {
		this.mockWriteHandler?.(this, message)
		return 0
	}
	setNonBlocking(_noBlock: boolean): void {
		// void
	}
}
export function devices(): Device[] {
	return []
}
export function setDriverType(_type: 'hidraw' | 'libusb'): void {
	// void
}
