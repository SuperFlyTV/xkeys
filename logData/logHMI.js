const HID = require('node-hid');
const fs = require('fs');
const EventEmitter = require('events');


/* ****************************************************** 
*
* This script logs all activity from HID-devices
* 
* The output is used to create tests
* 
* ****************************************************** */

const logFileName = 'log.txt';


console.log('Logging to '+logFileName);

var logStream = fs.createWriteStream(logFileName, {flags:'a'});

const devices = HID.devices();

if (devices.length) {

	var filteredDevices = devices.filter((device) => {


		return (device.vendorId === 1523 && device.usage === 1); // xkeys
	});

	var deviceNo = 0;
	filteredDevices.forEach((device) => {

		deviceNo++;

		var myDeviceNo = deviceNo;
			
		log('Listening to device ('+deviceNo+'):');

		log('manufacturer  ',device.manufacturer);
		log('product       ',device.product);
		log('vendorId      ',device.vendorId);
		log('productId     ',device.productId);
		log('interface     ',device.interface);
		//log(device);


		var myDevice = new HID.HID(device.path);

		myDevice.on('data', data => {


			log(myDeviceNo, 'data', data);

			
		});

	});

	
} else {
	log('No HID devices found!');
}



function log() {

	console.log.apply(this, arguments);


	var strs = [];
	for (var i = 0; i < arguments.length ; i++) {
		var a = arguments[i];

		

		if (a.constructor && a.constructor.isBuffer) { // is Buffer?

			strs.push(a.toString('hex'));
		} else {

			strs.push(a.toString ? a.toString() : a+'' );
		}

		
	}
	

	var d = new Date();

	var h = d.getHours()+'';
	if (h.length < 2) h = '0'+h;
	var m = d.getMinutes()+'';
	if (m.length < 2) m = '0'+m;
	var s = d.getSeconds()+'';
	if (s.length < 2) s = '0'+s;
	var ms = d.getMilliseconds()+'';
	if (ms.length < 3) ms = '0'+ms;
	if (ms.length < 3) ms = '0'+ms;

	logStream.write(
		d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+' '+
		h+':'+m+':'+s+'.'+ms+' '+

		strs.join(' ')+
		'\r\n'

	);


}