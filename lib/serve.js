#!/usr/bin/env node

process.title = 'timeline_serve';

var express = require('express');
var socket = require('socket.io');

var app = express();
app.configure(function () {
    app.use(express.static(__dirname + '/../public'));
    app.use('/data', express.static(__dirname + '/../data'));
});
var server = app.listen(8888);

var io = socket.listen(server);
io.configure(function () {
    io.set("log level", 1);
});
io.sockets.on('connection', function (socket) {
    socket.on('getPaths', function () {
        socket.emit('paths', []);
    });
});

var watch = require('node-watch');
watch('../', function () {
    io.sockets.emit('reload');
});
