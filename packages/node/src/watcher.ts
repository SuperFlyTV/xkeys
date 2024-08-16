import type { usb } from 'usb'
import { XKeys, XKEYS_VENDOR_ID, GenericXKeysWatcher, XKeysWatcherOptions } from '@xkeys-lib/core'
import { listAllConnectedPanels, setupXkeysPanel } from '.'

/**
 * Set up a watcher for newly connected X-keys panels.
 * Note: It is highly recommended to set up a listener for the disconnected event on the X-keys panel, to clean up after a disconnected device.
 */
export class XKeysWatcher extends GenericXKeysWatcher<string> {
	private pollingInterval: NodeJS.Timeout | undefined = undefined

	constructor(options?: XKeysWatcherOptions) {
		super(options)

		if (!this.options.usePolling) {
			// Watch for added devices:
			USBImport.USBDetect().on('attach', this.onAddedUSBDevice)
			USBImport.USBDetect().on('detach', this.onRemovedUSBDevice)
		} else {
			this.pollingInterval = setInterval(() => {
				this.triggerUpdateConnectedDevices(false)
			}, this.options.pollingInterval)
		}
	}
	/**
	 * Stop the watcher
	 * @param closeAllDevices Set to false in order to NOT close all devices. Use this if you only want to stop the watching. Defaults to true
	 */
	public async stop(closeAllDevices = true): Promise<void> {
		if (!this.options.usePolling) {
			// Remove the listeners:
			USBImport.USBDetect().off('attach', this.onAddedUSBDevice)
			USBImport.USBDetect().off('detach', this.onRemovedUSBDevice)
		}

		if (this.pollingInterval) {
			clearInterval(this.pollingInterval)
			this.pollingInterval = undefined
		}

		await super.stop(closeAllDevices)
	}

	protected async getConnectedDevices(): Promise<Set<string>> {
		// Returns a Set of devicePaths of the connected devices
		const connectedDevices = new Set<string>()

		for (const xkeysDevice of listAllConnectedPanels()) {
			if (xkeysDevice.path) {
				connectedDevices.add(xkeysDevice.path)
			} else {
				this.emit('error', `XKeysWatcher: Device missing path.`)
			}
		}
		return connectedDevices
	}
	protected async setupXkeysPanel(devicePath: string): Promise<XKeys> {
		return setupXkeysPanel(devicePath)
	}
	private onAddedUSBDevice = (device: usb.Device) => {
		// Called whenever a new USB device is added
		// Note:
		// There isn't a good way to relate the output from usb to node-hid devices
		// So we're just using the events to trigger a re-check for new devices and cache the seen devices
		if (!this.isActive) return
		if (device.deviceDescriptor.idVendor !== XKEYS_VENDOR_ID) return

		this.debugLog('onAddedUSBDevice')
		this.triggerUpdateConnectedDevices(true)
	}
	private onRemovedUSBDevice = (device: usb.Device) => {
		// Called whenever a new USB device is removed

		if (!this.isActive) return
		if (device.deviceDescriptor.idVendor !== XKEYS_VENDOR_ID) return
		this.debugLog('onRemovedUSBDevice')

		this.triggerUpdateConnectedDevices(true)
	}
}

class USBImport {
	private static USBImport: typeof usb | undefined
	private static hasTriedImport = false
	// Because usb is an optional dependency, we have to use in a somewhat messy way:
	static USBDetect(): typeof usb {
		if (this.USBImport) return this.USBImport

		if (!this.hasTriedImport) {
			this.hasTriedImport = true
			try {
				// eslint-disable-next-line @typescript-eslint/no-var-requires
				const usb: typeof import('usb') = require('usb')
				this.USBImport = usb.usb
				return this.USBImport
			} catch (err) {
				// It's not installed
			}
		}
		// else emit error:
		throw `XKeysWatcher requires the dependency "usb" to be installed, it might have been skipped due to your platform being unsupported (this is an issue with "usb", not the X-keys library).
	Possible solutions are:
	* You can try to install the dependency manually, by running "npm install usb".
	* Use the fallback "usePolling" functionality instead: new XKeysWatcher({ usePolling: true})
	* Otherwise you can still connect to X-keys panels manually by using XKeys.setupXkeysPanel().
	`
	}
}
