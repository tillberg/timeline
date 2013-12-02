#!/usr/bin/env node

process.title = 'timeline_serve';

var _ = require('underscore')._;
var express = require('express');
var socket = require('socket.io');
var fs = require('fs');

var app = express();
app.configure(function () {
    app.use(express.static(__dirname + '/../public'));
});
var server = app.listen(8888);

var io = socket.listen(server);
io.configure(function () {
    io.set("log level", 1);
});
io.sockets.on('connection', function (socket) {
    var fileNames = fs.readdirSync(__dirname + '/../data');
    socket.emit('data', _.reduce(fileNames, function (memo, filename) {
        memo[filename] = fs.readFileSync(__dirname + '/../data/' + filename, 'utf8');
        return memo;
    }, {}));
});

var watch = require('node-watch');
watch('../', function () {
    io.sockets.emit('reload');
});
