import { GenericXKeysWatcher, XKeys, XKeysWatcherOptions } from '@xkeys-lib/core'
import { getOpenedXKeysPanels, setupXkeysPanel } from './methods'
import { GlobalConnectListener } from './globalConnectListener'
/**
 * Set up a watcher for newly connected X-keys panels.
 * Note: It is highly recommended to set up a listener for the disconnected event on the X-keys panel, to clean up after a disconnected device.
 */
export class XKeysWatcher extends GenericXKeysWatcher<HIDDevice> {
	private eventListeners: { stop: () => void }[] = []
	private pollingInterval: NodeJS.Timeout | undefined = undefined

	constructor(options?: XKeysWatcherOptions) {
		super(options)

		if (!this.options.usePolling) {
			this.eventListeners.push(GlobalConnectListener.listenForAnyDisconnect(this.handleConnectEvent))
			this.eventListeners.push(GlobalConnectListener.listenForAnyConnect(this.handleConnectEvent))
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
		this.eventListeners.forEach((listener) => listener.stop())

		if (this.pollingInterval) {
			clearInterval(this.pollingInterval)
			this.pollingInterval = undefined
		}

		await super.stop(closeAllDevices)
	}

	protected async getConnectedDevices(): Promise<Set<HIDDevice>> {
		// Returns a Set of devicePaths of the connected devices
		return new Set<HIDDevice>(await getOpenedXKeysPanels())
	}
	protected async setupXkeysPanel(device: HIDDevice): Promise<XKeys> {
		return setupXkeysPanel(device)
	}
	private handleConnectEvent = () => {
		// Called whenever a device is connected or disconnected

		if (!this.isActive) return

		this.triggerUpdateConnectedDevices(true)
	}
}
