import { EventEmitter } from 'events'
import { XKeys } from './xkeys'

export interface XKeysWatcherOptions {
	/**
	 * This activates the "Automatic UnitId mode", which enables several features:
	 * First, any x-keys panel with unitId===0 will be issued a (pseudo unique) unitId upon connection, in order for it to be uniquely identified.
	 * This allows for the connection-events to work a bit differently, mainly enabling the "reconnected"-event for when a panel has been disconnected, then reconnected again.
	 */
	automaticUnitIdMode?: boolean

	/** If set, will use polling for devices instead of watching for them directly. Might be a bit slower, but is more compatible. */
	usePolling?: boolean
	/** If usePolling is set, the interval to use for checking for new devices. */
	pollingInterval?: number
}

export interface XKeysWatcherEvents {
	// Note: This interface defines strong typings for any events that are emitted by the XKeysWatcher class.

	connected: (xkeysPanel: XKeys) => void
	error: (err: any) => void
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export declare interface GenericXKeysWatcher<HID_Identifier> {
	on<U extends keyof XKeysWatcherEvents>(event: U, listener: XKeysWatcherEvents[U]): this
	emit<U extends keyof XKeysWatcherEvents>(event: U, ...args: Parameters<XKeysWatcherEvents[U]>): boolean
}
/**
 * Set up a watcher for newly connected X-keys panels.
 * Note: It is highly recommended to set up a listener for the disconnected event on the X-keys panel, to clean up after a disconnected device.
 */
export abstract class GenericXKeysWatcher<HID_Identifier> extends EventEmitter {
	private updateConnectedDevicesTimeout: NodeJS.Timeout | null = null
	private updateConnectedDevicesIsRunning = false
	private updateConnectedDevicesRunAgain = false

	private seenDevices = new Set<HID_Identifier>()
	private setupXkeys = new Map<HID_Identifier, XKeys>()

	/** A value that is incremented whenever we expect to find a new or removed device in updateConnectedDevices(). */
	private shouldFindChangedReTries = 0

	protected isActive = true

	public debug = false
	/** A list of the devices we've called setupNewDevice() for */
	// private setupXkeysPanels: XKeys[] = []
	private prevConnectedIdentifiers: { [key: string]: XKeys } = {}
	/** Unique unitIds grouped into productId groups. */
	private uniqueIds = new Map<number, number>()

	constructor(private _options?: XKeysWatcherOptions) {
		super()

		// Do a sweep for all currently connected X-keys panels:
		this.triggerUpdateConnectedDevices(false)
	}
	protected get options(): Required<XKeysWatcherOptions> {
		return {
			automaticUnitIdMode: this._options?.automaticUnitIdMode ?? false,
			usePolling: this._options?.usePolling ?? false,
			pollingInterval: this._options?.pollingInterval ?? 1000,
		}
	}
	/**
	 * Stop the watcher
	 * @param closeAllDevices Set to false in order to NOT close all devices. Use this if you only want to stop the watching. Defaults to true
	 */
	public async stop(closeAllDevices = true): Promise<void> {
		// To be implemented by the subclass and call super.stop() at the end

		this.isActive = false

		if (closeAllDevices) {
			// In order for an application to close gracefully,
			// we need to close all devices that we've called setupXkeysPanel() on:

			await Promise.all(
				Array.from(this.seenDevices.keys()).map(async (device) => this.handleRemovedDevice(device))
			)
		}
	}

	protected triggerUpdateConnectedDevices(somethingWasAddedOrRemoved: boolean): void {
		if (somethingWasAddedOrRemoved) {
			this.shouldFindChangedReTries++
		}

		if (this.updateConnectedDevicesIsRunning) {
			// It is already running, so we'll run it again later, when it's done:
			this.updateConnectedDevicesRunAgain = true
			return
		} else if (this.updateConnectedDevicesTimeout) {
			// It is already scheduled to run.

			if (somethingWasAddedOrRemoved) {
				// Set it to run now:
				clearTimeout(this.updateConnectedDevicesTimeout)
				this.updateConnectedDevicesTimeout = null
			} else {
				return
			}
		}

		if (!this.updateConnectedDevicesTimeout) {
			this.updateConnectedDevicesRunAgain = false
			this.updateConnectedDevicesTimeout = setTimeout(
				() => {
					this.updateConnectedDevicesTimeout = null
					this.updateConnectedDevicesIsRunning = true

					this.updateConnectedDevices()
						.catch(console.error)
						.finally(() => {
							this.updateConnectedDevicesIsRunning = false
							if (this.updateConnectedDevicesRunAgain) this.triggerUpdateConnectedDevices(false)
						})
				},
				somethingWasAddedOrRemoved ? 10 : Math.min(this.options.pollingInterval * 0.5, 300)
			)
		}
	}
	protected abstract getConnectedDevices(): Promise<Set<HID_Identifier>>
	protected abstract setupXkeysPanel(device: HID_Identifier): Promise<XKeys>

	private async updateConnectedDevices(): Promise<void> {
		this.debugLog('updateConnectedDevices')

		const connectedDevices = await this.getConnectedDevices()

		let removed = 0
		let added = 0
		// Removed devices:
		for (const device of this.seenDevices.keys()) {
			if (!connectedDevices.has(device)) {
				// A device has been removed
				this.debugLog('removed')
				removed++

				await this.handleRemovedDevice(device)
			}
		}
		// Added devices:
		for (const connectedDevice of connectedDevices.keys()) {
			if (!this.seenDevices.has(connectedDevice)) {
				// A device has been added
				this.debugLog('added')
				added++
				this.seenDevices.add(connectedDevice)
				this.handleNewDevice(connectedDevice)
			}
		}
		if (this.shouldFindChangedReTries > 0 && (added === 0 || removed === 0)) {
			// We expected to find something changed, but didn't.
			// Try again later:
			this.shouldFindChangedReTries--
			this.triggerUpdateConnectedDevices(false)
		} else {
			this.shouldFindChangedReTries = 0
		}
	}

	private handleNewDevice(device: HID_Identifier): void {
		// This is called when a new device has been added / connected

		this.setupXkeysPanel(device)
			.then(async (xKeysPanel: XKeys) => {
				// Since this is async, check if the panel is still connected:
				if (this.seenDevices.has(device)) {
					await this.setupNewDevice(device, xKeysPanel)
				} else {
					await this.handleRemovedDevice(device)
				}
			})
			.catch((err) => {
				this.emit('error', err)
			})
	}
	private async handleRemovedDevice(device: HID_Identifier) {
		// This is called when a device has been removed / disconnected
		this.seenDevices.delete(device)

		const xkeys = this.setupXkeys.get(device)
		this.debugLog('aa')
		if (xkeys) {
			this.debugLog('bb')
			await xkeys._handleDeviceDisconnected()
			this.setupXkeys.delete(device)
		}
	}

	private async setupNewDevice(device: HID_Identifier, xKeysPanel: XKeys): Promise<void> {
		// Store for future reference:
		this.setupXkeys.set(device, xKeysPanel)

		xKeysPanel.once('disconnected', () => {
			this.handleRemovedDevice(device).catch((e) => this.emit('error', e))
		})

		// this.setupXkeysPanels.push(xkeysPanel)

		if (this.options.automaticUnitIdMode) {
			if (xKeysPanel.unitId === 0) {
				// if it is 0, we assume that it's new from the factory and can be safely changed
				xKeysPanel.setUnitId(this._getNextUniqueId(xKeysPanel)) // the lookup-cache is stored either in memory, or preferably on disk
			}
			// the PID+UID pair is enough to uniquely identify a panel.
			const uniqueIdentifier: string = xKeysPanel.uniqueId
			const previousXKeysPanel = this.prevConnectedIdentifiers[uniqueIdentifier]
			if (previousXKeysPanel) {
				// This panel has been connected before.

				// We want the XKeys-instance to emit a 'reconnected' event.
				// This means that we kill off the newly created xkeysPanel, and

				await previousXKeysPanel._handleDeviceReconnected(
					xKeysPanel._getHIDDevice(),
					xKeysPanel._getDeviceInfo()
				)
			} else {
				// It seems that this panel hasn't been connected before
				this.emit('connected', xKeysPanel)
				this.prevConnectedIdentifiers[uniqueIdentifier] = xKeysPanel
			}
		} else {
			// Default behavior:
			this.emit('connected', xKeysPanel)
		}
	}
	private _getNextUniqueId(xkeysPanel: XKeys): number {
		let nextId = this.uniqueIds.get(xkeysPanel.info.productId)
		if (!nextId) {
			nextId = 32 // Starting at 32
		} else {
			nextId++
		}
		if (nextId > 255) throw new Error('No more unique ids available!')

		this.uniqueIds.set(xkeysPanel.info.productId, nextId)

		return nextId
	}

	protected debugLog(...args: any[]): void {
		if (this.debug) console.log(...args)
	}
}
