/* eslint-disable @typescript-eslint/unbound-method */
import { HIDDevice } from '@xkeys-lib/core'
import { EventEmitter } from 'events'
import Queue from 'p-queue'
import * as HID from 'node-hid'

/**
 * This class wraps the node-hid.HID Device.
 * This translates it into the common format (@see HIDDevice) defined by @xkeys-lib/core
 */
export class NodeHIDDevice extends EventEmitter implements HIDDevice {
	static CLOSE_WAIT_TIME = 300

	private readonly writeQueue = new Queue({ concurrency: 1 })

	constructor(private device: HID.HIDAsync) {
		super()

		this.device.on('error', this._handleError)
		this.device.on('data', this._handleData)
	}

	public write(data: number[]): void {
		this.writeQueue
			.add(async () => {
				await this.device.write(data)
			})
			.catch((err) => {
				this.emit('error', err)
			})
	}

	public async close(): Promise<void> {
		await this.device.close()

		// For some unknown reason, we need to wait a bit before returning because it
		// appears that the HID-device isn't actually closed properly until after a short while.
		// (This issue has been observed in Electron, where a app.quit() causes the application to crash with "Exit status 3221226505".)
		await new Promise((resolve) => setTimeout(resolve, NodeHIDDevice.CLOSE_WAIT_TIME))

		this.device.removeListener('error', this._handleError)
		this.device.removeListener('data', this._handleData)
	}

	private _handleData = (data: Buffer) => {
		this.emit('data', data)
	}
	private _handleError = (error: any) => {
		this.emit('error', error)
	}
}
