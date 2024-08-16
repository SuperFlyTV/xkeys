/**
 * This class is used to register listener for connect and disconnect events for HID devices.
 * It allows for a few clever tricks, such as
 * * listenForDisconnectOnce() listens for a disconnect event for a specific device, and then removes the listener.
 * * handles a special case where the 'connect' event isn't fired when adding permissions for a HID device.
 */
export class GlobalConnectListener {
	private static anyConnectListeners = new Set<() => void>()
	private static anyDisconnectListeners = new Set<() => void>()
	private static disconnectListenersOnce = new Map<HIDDevice, () => void>()

	private static isSetup = false

	/** Add listener for any connect event */
	static listenForAnyConnect(callback: () => void): { stop: () => void } {
		this.setup()
		this.anyConnectListeners.add(callback)
		return {
			stop: () => this.anyConnectListeners.delete(callback),
		}
	}
	/** Add listener for any disconnect event */
	static listenForAnyDisconnect(callback: () => void): { stop: () => void } {
		this.setup()
		this.anyDisconnectListeners.add(callback)
		return {
			stop: () => this.anyDisconnectListeners.delete(callback),
		}
	}

	/** Add listener for disconnect event, for a HIDDevice. The callback will be fired once. */
	static listenForDisconnectOnce(device: HIDDevice, callback: () => void): void {
		this.setup()
		this.disconnectListenersOnce.set(device, callback)
	}

	static notifyConnectedDevice(): void {
		this.handleConnect()
	}

	private static setup() {
		if (this.isSetup) return
		navigator.hid.addEventListener('disconnect', this.handleDisconnect)
		navigator.hid.addEventListener('connect', this.handleConnect)
		this.isSetup = true
	}
	private static handleDisconnect = (ev: HIDConnectionEvent) => {
		this.anyDisconnectListeners.forEach((callback) => callback())

		this.disconnectListenersOnce.forEach((callback, device) => {
			if (device === ev.device) {
				callback()
				// Also remove the listener:
				this.disconnectListenersOnce.delete(device)
			}
		})

		this.maybeTeardown()
	}
	private static handleConnect = () => {
		this.anyConnectListeners.forEach((callback) => callback())
	}
	private static maybeTeardown() {
		if (
			this.disconnectListenersOnce.size === 0 &&
			this.anyDisconnectListeners.size === 0 &&
			this.anyConnectListeners.size === 0
		) {
			// If there are no listeners, we can teardown the global listener:
			this.teardown()
		}
	}
	private static teardown() {
		navigator.hid.removeEventListener('disconnect', this.handleDisconnect)
		navigator.hid.removeEventListener('connect', this.handleConnect)
		this.disconnectListenersOnce.clear()
		this.isSetup = false
	}
}
