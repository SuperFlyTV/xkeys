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

	throw `XKeysWatcher requires the dependency "usb-detection" to be installed, It might have been skipped due to your platform being unsupported (this is an issue with "usb-detection", not the X-keys library).

You can try to install the depencency manually, by running "npm install usb-detection".

If you're unable to install the "usb-detection" library, you can still connect to X-keys panels manually by using XKeys.setupXkeysPanel() instead.
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
	private shouldFindChangedReTries = 0

	public debug = false
	/** A list of the devices we've called setupXkeysPanels for */
	private setupXkeysPanels: XKeys[] = []

	constructor() {
		super()

		watcherCount++
		if (watcherCount === 1) {
			// We've just started watching
			USBDetect().startMonitoring()
		}

		// Watch for added devices:
		USBDetect().on(`add:${XKEYS_VENDOR_ID}`, this.onAddedUSBDevice)
		USBDetect().on(`remove:${XKEYS_VENDOR_ID}`, this.onRemovedUSBDevice)

		// Also do a sweep for all currently connected X-keys panels:
		this.updateConnectedDevices()
	}
	/**
	 * Stop the watcher
	 * @param closeAllDevices Set to false in order to NOT close all devices. Use this if you only want to stop the watching. Defaults to true
	 */
	public async stop(closeAllDevices = true): Promise<void> {
		this.isMonitoring = false

		// Remove the listeners:
		// @ts-expect-error usb-detection exposes wrong types:
		USBDetect().removeListener(`add:${XKEYS_VENDOR_ID}`, this.onAddedUSBDevice)
		// @ts-expect-error usb-detection exposes wrong types:
		USBDetect().removeListener(`remove:${XKEYS_VENDOR_ID}`, this.onRemovedUSBDevice)

		watcherCount--
		if (watcherCount === 0) {
			USBDetect().stopMonitoring()
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
			this.triggerUpdateConnectedDevices()
		}
	}
	private onRemovedUSBDevice = (_device: USBDetectNS.Device) => {
		// Called whenever a new USB device is removed
		this.debugLog('onRemovedUSBDevice')
		if (this.isMonitoring) {
			this.shouldFindChangedReTries++
			this.triggerUpdateConnectedDevices()
		}
	}
	private triggerUpdateConnectedDevices(timeout = 100): void {
		if (!this.updateConnectedDevicesTimeout) {
			this.updateConnectedDevicesTimeout = setTimeout(() => {
				this.updateConnectedDevicesTimeout = null

				this.updateConnectedDevices()
			}, timeout)
		}
	}
	private updateConnectedDevices(): void {
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
				if (o.xkeys) this.handleRemovedDevice(o.xkeys)

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
			this.triggerUpdateConnectedDevices(1000)
		} else {
			this.shouldFindChangedReTries = 0
		}
	}
	private handleNewDevice(devicePath: string): void {
		this.debugLog('handleNewDevice', devicePath)

		setupXkeysPanel(devicePath)
			.then((xkeysPanel) => {
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

					// Emit to the consumer:
					this.emit('connected', xkeysPanel)
				} else {
					this.handleRemovedDevice(xkeysPanel)
				}
			})
			.catch((err) => {
				this.emit('error', err)
			})
	}
	private handleRemovedDevice(xkeysPanel: XKeys) {
		xkeysPanel.handleDeviceDisconnected()
	}
	private debugLog(...args: any[]) {
		if (this.debug) console.log(...args)
	}
}
