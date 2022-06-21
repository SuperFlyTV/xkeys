import type * as USBDetectNS from 'usb-detection'
import { EventEmitter } from 'events'
import { XKeys, XKEYS_VENDOR_ID } from '@xkeys-lib/core'
import { listAllConnectedPanels, setupXkeysPanel } from '.'

interface USBDetectType {
	startMonitoring: typeof USBDetectNS.startMonitoring
	stopMonitoring: typeof USBDetectNS.stopMonitoring
	on: typeof USBDetectNS.on
}

let USBDetectImport: USBDetectType | undefined
let hasTriedImport = false

// Because usb-detection is an optional dependency, we have to use in a somewhat messy way:
function USBDetect(): USBDetectType {
	if (USBDetectImport) return USBDetectImport

	if (!hasTriedImport) {
		hasTriedImport = true
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const usbDetection = require('usb-detection')
			USBDetectImport = usbDetection
			return usbDetection
		} catch (err) {
			// It's not installed
		}
	}
	// else emit error:
	throw `XKeysWatcher requires the dependency "usb-detection" to be installed, it might have been skipped due to your platform being unsupported (this is an issue with "usb-detection", not the X-keys library).
Possible solutions are:
* You can try to install the depencency manually, by running "npm install usb-detection".
* Use the fallback "usePolling" functionality instead: new XKeysWatcher({ usePolling: true})
* Otherwise you can still connect to X-keys panels manually by using XKeys.setupXkeysPanel().
`
}

export interface XKeysWatcherEvents {
	// Note: This interface defines strong typings for any events that are emitted by the XKeysWatcher class.

	connected: (xkeysPanel: XKeys) => void
	error: (err: any) => void
}

export declare interface XKeysWatcher {
	on<U extends keyof XKeysWatcherEvents>(event: U, listener: XKeysWatcherEvents[U]): this
	emit<U extends keyof XKeysWatcherEvents>(event: U, ...args: Parameters<XKeysWatcherEvents[U]>): boolean
}
let watcherCount = 0
/**
 * Set up a watcher for newly connected X-keys panels.
 * Note: It is highly recommended to set up a listener for the disconnected event on the X-keys panel, to clean up after a disconnected device.
 */
export class XKeysWatcher extends EventEmitter {
	private seenDevicePaths: {
		[devicePath: string]: {
			xkeys?: XKeys
		}
	} = {}
	private isMonitoring = true
	private updateConnectedDevicesTimeout: NodeJS.Timeout | null = null
	private updateConnectedDevicesIsRunning = false
	private updateConnectedDevicesRunAgain = false
	private shouldFindChangedReTries = 0

	public debug = false
	/** A list of the devices we've called setupXkeysPanels for */
	private setupXkeysPanels: XKeys[] = []
	private prevConnectedIdentifiers: { [key: string]: XKeys } = {}
	/** Unique unitIds grouped into productId groups. */
	private uniqueIds = new Map<number, number>()
	private pollingInterval: NodeJS.Timeout | undefined = undefined

	constructor(private options?: XKeysWatcherOptions) {
		super()

		if (!this.options?.usePolling) {
			watcherCount++
			if (watcherCount === 1) {
				// We've just started watching
				USBDetect().startMonitoring()
			}

			// Watch for added devices:
			USBDetect().on(`add:${XKEYS_VENDOR_ID}`, this.onAddedUSBDevice)
			USBDetect().on(`remove:${XKEYS_VENDOR_ID}`, this.onRemovedUSBDevice)
		} else {
			this.pollingInterval = setInterval(() => {
				this.triggerUpdateConnectedDevices(true)
			}, this.options?.pollingInterval ?? 1000)
		}

		// Also do a sweep for all currently connected X-keys panels:
		this.triggerUpdateConnectedDevices(true)
	}
	/**
	 * Stop the watcher
	 * @param closeAllDevices Set to false in order to NOT close all devices. Use this if you only want to stop the watching. Defaults to true
	 */
	public async stop(closeAllDevices = true): Promise<void> {
		this.isMonitoring = false

		if (!this.options?.usePolling) {
			// Remove the listeners:
			// @ts-expect-error usb-detection exposes wrong types:
			USBDetect().removeListener(`add:${XKEYS_VENDOR_ID}`, this.onAddedUSBDevice)
			// @ts-expect-error usb-detection exposes wrong types:
			USBDetect().removeListener(`remove:${XKEYS_VENDOR_ID}`, this.onRemovedUSBDevice)

			watcherCount--
			if (watcherCount === 0) {
				USBDetect().stopMonitoring()
			}
		}

		if (this.pollingInterval) {
			clearInterval(this.pollingInterval)
			this.pollingInterval = undefined
		}

		if (closeAllDevices) {
			// In order for an application to close gracefully,
			// we need to close all devices that we've called setupXkeysPanel() on:
			const ps: Promise<void>[] = []
			for (const xKeysPanel of this.setupXkeysPanels) {
				ps.push(xKeysPanel.close())
			}
			await Promise.all(ps)
		}
	}
	private onAddedUSBDevice = (_device: USBDetectNS.Device) => {
		// Called whenever a new USB device is added
		this.debugLog('onAddedUSBDevice')
		if (this.isMonitoring) {
			this.shouldFindChangedReTries++
			this.triggerUpdateConnectedDevices(true)
		}
	}
	private onRemovedUSBDevice = (_device: USBDetectNS.Device) => {
		// Called whenever a new USB device is removed
		this.debugLog('onRemovedUSBDevice')
		if (this.isMonitoring) {
			this.shouldFindChangedReTries++
			this.triggerUpdateConnectedDevices(true)
		}
	}
	private triggerUpdateConnectedDevices(asap: boolean): void {
		if (this.updateConnectedDevicesIsRunning) {
			// It is already running, so we'll run it again later, when it's done:
			this.updateConnectedDevicesRunAgain = true
			return
		} else if (this.updateConnectedDevicesTimeout) {
			// It is already scheduled to run.

			if (asap) {
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
							if (this.updateConnectedDevicesRunAgain) this.triggerUpdateConnectedDevices(true)
						})
				},
				asap ? 10 : 1000
			)
		}
	}
	private async updateConnectedDevices(): Promise<void> {
		const pathMap: { [devicePath: string]: true } = {}

		this.debugLog('updateConnectedDevices')
		// Note:
		// This implementation is a bit awkward,
		// the reason for that is that I couldn't find a good way to relate the output from usb-detection to node-hid devices
		// So we're just using the usb-detection to trigger a re-check for new devices and cache the seen devices

		listAllConnectedPanels().forEach((xkeysDevice) => {
			if (xkeysDevice.path) {
				pathMap[xkeysDevice.path] = true
			} else {
				this.emit('error', `XKeysWatcher: Device missing path.`)
			}
		})

		let removed = 0
		let added = 0
		// Removed devices:
		for (const [devicePath, o] of Object.entries(this.seenDevicePaths)) {
			if (!pathMap[devicePath]) {
				// A device has been removed
				this.debugLog('removed')
				removed++
				if (o.xkeys) await this.handleRemovedDevice(o.xkeys)

				delete this.seenDevicePaths[devicePath]
			}
		}
		// Added devices:
		for (const devicePath of Object.keys(pathMap)) {
			if (!this.seenDevicePaths[devicePath]) {
				// A device has been added
				this.debugLog('added')
				added++
				this.seenDevicePaths[devicePath] = {}
				this.handleNewDevice(devicePath)
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
	private handleNewDevice(devicePath: string): void {
		this.debugLog('handleNewDevice', devicePath)

		setupXkeysPanel(devicePath)
			.then(async (xkeysPanel: XKeys) => {
				this.setupXkeysPanels.push(xkeysPanel)
				// Since this is async, check if the panel is still connected
				if (this.seenDevicePaths[devicePath]) {
					// yes, it is still connected

					// Listen to the disconnected event, because often if comes faster from the X-keys than from this watcher.
					const onDisconnected = () => {
						delete this.seenDevicePaths[devicePath]
						xkeysPanel.removeListener('disconnected', onDisconnected)
					}
					xkeysPanel.on('disconnected', onDisconnected)

					// Store for future reference:
					this.seenDevicePaths[devicePath].xkeys = xkeysPanel

					if (this.options?.automaticUnitIdMode) {
						if (xkeysPanel.unitId === 0) {
							// if it is 0, we assume that it's new from the factory and can be safely changed
							xkeysPanel.setUnitId(this._getNextUniqueId(xkeysPanel)) // the lookup-cache is stored either in memory, or preferrably on disk
						}
						// the PID+UID pair is enough to uniquely identify a panel.
						const uniqueIdentifier: string = xkeysPanel.uniqueId
						const previousXKeysPanel = this.prevConnectedIdentifiers[uniqueIdentifier]
						if (previousXKeysPanel) {
							// This panel has been connected before.

							// We want the XKeys-instance to emit a 'reconnected' event.
							// This means that we kill off the newly created xkeysPanel, and

							await previousXKeysPanel._handleDeviceReconnected(
								xkeysPanel._getHIDDevice(),
								xkeysPanel._getDeviceInfo()
							)
						} else {
							// It seems that this panel hasn't been connected before
							this.emit('connected', xkeysPanel)
							this.prevConnectedIdentifiers[uniqueIdentifier] = xkeysPanel
						}
					} else {
						// Default behaviour:
						this.emit('connected', xkeysPanel)
					}
				} else {
					await this.handleRemovedDevice(xkeysPanel)
				}
			})
			.catch((err) => {
				this.emit('error', err)
			})
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
	private async handleRemovedDevice(xkeysPanel: XKeys) {
		await xkeysPanel._handleDeviceDisconnected()
	}
	private debugLog(...args: any[]) {
		if (this.debug) console.log(...args)
	}
}
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
