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

function readData () {
    var fileNames = fs.readdirSync('./');
    return _.reduce(fileNames, function (memo, filename) {
        var stat = fs.statSync(filename);
        if (stat.isFile()) {
            memo[filename] = fs.readFileSync(filename, 'utf8');
        }
        return memo;
    }, {});
}

var io = socket.listen(server);
io.configure(function () {
    io.set("log level", 1);
});
io.sockets.on('connection', function (socket) {
    socket.emit('data', readData());
});

var watch = require('node-watch');
watch(__dirname + '/..', function () {
    io.sockets.emit('reload');
});
watch('./', function () {
    io.sockets.emit('data', readData());
});
