var socket = io.connect('/');
socket.once('reload', function () {
    console.log('reloading...');
    setTimeout(function () {
        location.reload();
    }, 100);
});
