import { EventEmitter } from 'events'
import { XKeys } from '@xkeys-lib/core'
import { getOpenedXKeysPanels, setupXkeysPanel } from './methods'

export type XKeysWatcherEvents = {
	connected: (xkeysPanel: XKeys) => void
	error: (err: unknown) => void
}

export declare interface XKeysWatcher {
	// Note: This interface defines strong typings for any events that are emitted by the XKeysWatcher class.
	on<U extends keyof XKeysWatcherEvents>(event: U, listener: XKeysWatcherEvents[U]): this
	emit<U extends keyof XKeysWatcherEvents>(event: U, ...args: Parameters<XKeysWatcherEvents[U]>): boolean
}

const DEFAULT_POLLING_INTERVAL_MS = 1000

/**
 * Set up a watcher for newly connected X-keys panels.
 * Note: It is highly recommended to set up a listener for the disconnected event on the X-keys panel, to clean up after a disconnected device.
 */
export class XKeysWatcher extends EventEmitter {
	private pollingTimeout: number | undefined = undefined

	public debug = false

	private readonly seenHidDevices: Set<HIDDevice> = new Set()
	/** A list of the devices we've called setupXkeysPanels for. */
	private setupXKeysPanels: XKeys[] = []
	private readonly hidDeviceToXKeysPanel: WeakMap<HIDDevice, XKeys> = new WeakMap()
	private readonly hidDeviceToDisconnectedListener: WeakMap<HIDDevice, (...args: unknown[]) => void> = new WeakMap()

	constructor(private readonly options?: XKeysWatcherOptions) {
		super()
		this.triggerUpdateConnectedDevices(true)
		navigator.hid.addEventListener('disconnect', this.handleDisconnect)
	}

	/**
	 * Stop the watcher.
	 *
	 * @param closeAllDevices Set to false in order to NOT close all devices. Use this if you only want to stop the watching. Defaults to true.
	 */
	public async stop(closeAllDevices = true): Promise<void> {
		navigator.hid.removeEventListener('disconnect', this.handleDisconnect)

		if (this.pollingTimeout !== undefined) {
			clearTimeout(this.pollingTimeout)
			this.pollingTimeout = undefined
		}

		if (closeAllDevices) {
			// In order for an application to close gracefully,
			// we need to close all devices that we've called setupXkeysPanel() on
			await Promise.all(this.setupXKeysPanels.map((xKeys) => xKeys.close()))
		}
	}

	private triggerUpdateConnectedDevices(immediate: boolean) {
		this.pollingTimeout = (setTimeout as Window['setTimeout'])(
			async () => {
				try {
					await this.updateConnectedDevices()
				} catch (e) {
					console.error(e)
				}
				this.triggerUpdateConnectedDevices(false)
			},
			immediate ? 0 : this.options?.pollingInterval ?? DEFAULT_POLLING_INTERVAL_MS
		)
	}

	private async updateConnectedDevices() {
		const devices = await getOpenedXKeysPanels()

		// Removed devices:
		this.seenHidDevices.forEach((device) => {
			if (!devices.includes(device)) {
				this.debugLog('removed')
				this.seenHidDevices.delete(device)
			}
		})
		const unseenDevices = devices.filter((device) => !this.seenHidDevices.has(device))
		unseenDevices.forEach((device) => this.seenHidDevices.add(device))

		// Added devices:
		await Promise.all(
			unseenDevices.map((device) => {
				this.debugLog('added')
				return this.handleNewDevice(device)
			})
		)
	}

	private async handleNewDevice(device: HIDDevice) {
		this.debugLog('handleNewDevice', device.productId)

		try {
			const xKeysPanel = await setupXkeysPanel(device)
			this.hidDeviceToXKeysPanel.set(device, xKeysPanel)
			this.setupXKeysPanels.push(xKeysPanel)

			this.emit('connected', xKeysPanel)

			const handleDisconnected = () => {
				this.cleanupDevice(device)
			}
			this.hidDeviceToDisconnectedListener.set(device, handleDisconnected)
			xKeysPanel.once('disconnected', handleDisconnected)
		} catch (e) {
			this.emit('error', e)
		}
	}

	private handleDisconnect = (event: HIDConnectionEvent) => {
		this.cleanupDevice(event.device)
	}

	private cleanupDevice(device: HIDDevice) {
		const xKeys = this.hidDeviceToXKeysPanel.get(device)
		const disconnectedListener = this.hidDeviceToDisconnectedListener.get(device)
		if (xKeys && disconnectedListener) {
			xKeys.removeListener('disconnected', disconnectedListener)
		}
		this.seenHidDevices.delete(device)
		this.hidDeviceToXKeysPanel.delete(device)
		this.hidDeviceToDisconnectedListener.delete(device)
	}

	private debugLog(...args: any[]) {
		if (this.debug) console.log(...args)
	}
}

export type XKeysWatcherOptions = {
	/**
	 * The interval to use for checking for new devices (defaults to 1000) [ms].
	 * Note: This is a lower bound; the real poll rate may be slower if individual polling cycles take longer than the interval.
	 */
	pollingInterval?: number
}
