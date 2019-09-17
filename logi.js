const HID = require("node-hid");

const devices = HID.devices();



const connectedLogis = devices.filter(device => {
	
	// Ensures device with usage 1 is selected (other usage "id's" do not seem to work)
	return (
		device.vendorId === 1133 && // Logitech
		device.productId === 50496 &&
		// device.interface !== 0 &&
		// device.interface !== 1 &&
		// device.usage === 6
		1
	)
});
console.log(connectedLogis)

connectedLogis.forEach((device) => {
	// console.log('------------------------')
	// console.log('------------------------')
	// console.log('------------------------')
	console.log('------------------------')
	// console.log('device', device)


	try {

		let d = new HID.HID(device.path)
	
		
	
		d.on("data", data => {
			console.log('data', data)
		})
		d.on("error", error => {
			console.log('error', error)
		})
	} catch(e) {
		console.log('------------------------')
		console.log('device', device)
		console.log(e)
	}
})
