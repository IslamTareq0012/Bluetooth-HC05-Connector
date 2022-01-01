const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);


const hostname = '127.0.0.1';
const port = 3000;
app.use(express.static('public'))


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/connect', function (req, res) {
    res.render('connect');

    const bluetooth = require('node-bluetooth');
    const device = new bluetooth.DeviceINQ();

    // Find devices
    device
        .on('finished', console.log.bind(console, 'finished'))
        .on('found', function found(address, name) {
            console.log('Found: ' + address + ' with name ' + name);

            // We know our Arduino bluetooth module is called 'HC-05', so we only want to connect to that.
            if (name === 'HC-05') {

                // find serial port channel
                device.findSerialPortChannel(address, function (channel) {
                    console.log('Found channel for serial port on %s: ', name, channel);

                    // make bluetooth connect to remote device
                    bluetooth.connect(address, channel, function (err, connection) {
                        if (err) return console.error(err);

                        // This is some example code from the library for writing, customize as you wish.
                        connection.delimiter = Buffer.from('/n', 'utf-8');
                        connection.on('data', (buffer) => {
                            io.on('connection', (socket) => {
                                socket.broadcast.emit('received message: ', buffer.toString());
                            });
                        });
                    });
                });
            }
        });
    device.scan();
});


setInterval(() => {

    var frequncy = Math.random();
    var RL = 100;
    var Rs = 17;
    var Rt = 6.8;
    var Ct = 0.01;
    var voltage = frequncy*(RL/Rs)*(Rt*Ct);
    io.emit("frequency-in",{
        ferquency : Math.round((frequncy + Number.EPSILON) * 100) / 100,
        volt: Math.round((voltage + Number.EPSILON) * 100) / 100
    })

}, 5000);


io.on('connection', (socket) => {
    console.log('a user connected');
});
server.listen(port);