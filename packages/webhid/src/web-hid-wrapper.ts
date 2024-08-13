/* eslint-disable @typescript-eslint/unbound-method */
import { HIDDevice as CoreHIDDevice } from '@xkeys-lib/core'
import { EventEmitter } from 'events'
import Queue from 'p-queue'
import { Buffer as WebBuffer } from 'buffer'

/**
 * The wrapped browser HIDDevice.
 * This translates it into the common format (@see CoreHIDDevice) defined by @xkeys-lib/core
 */
export class WebHIDDevice extends EventEmitter implements CoreHIDDevice {
	private readonly device: HIDDevice

	private readonly reportQueue = new Queue({ concurrency: 1 })

	constructor(device: HIDDevice) {
		super()

		this.device = device

		this.device.addEventListener('inputreport', this._handleInputreport)
		this.device.addEventListener('error', this._handleError)
	}
	public write(data: number[]): void {
		this.reportQueue
			.add(async () => {
				await this.device.sendReport(data[0], new Uint8Array(data.slice(1)))
			})
			.catch((err) => {
				this.emit('error', err)
			})
	}

	public async close(): Promise<void> {
		await this.device.close()
		this.device.removeEventListener('inputreport', this._handleInputreport)
		this.device.removeEventListener('error', this._handleError)
	}
	private _handleInputreport = (event: HIDInputReportEvent) => {
		const buf = WebBuffer.from(event.data.buffer)
		this.emit('data', buf)
	}
	private _handleError = (error: any) => {
		this.emit('error', error)
	}
}
