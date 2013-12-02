var socket = io.connect('/');
socket.once('reload', function () {
    console.log('reloading...');
    setTimeout(function () {
        location.reload();
    }, 100);
});

function date (d) {
    return d && d.getFullYear ? d : d && new Date(d);
}

socket.once('data', function (data) {
    // console.log(data);
    var events = [];
    _.each(data, function (text, name) {
        var currDate;
        _.each(text.split('\n'), function (line) {
            line = line.replace(/^\s+|\s+$/g, '');
            if (!line) {
                currDate = null;
            } else if (!currDate) {
                currDate = date(line);
            } else {
                events.push({
                    id: events.length,
                    date: currDate,
                    desc: line
                });
            }
        });
    });
    T('events', events);
});

(function () {
    function update () {
        T('screen', {
            width: $(window).width(),
            height: $(window).height()
        });
    }
    $(window).bind('resize', update);
    function timer () {
        update();
        setTimeout(timer, 1000);
    }
    timer();
}());

tbone.createView('timeline', function () {
    T('screen.width');
    var self = this;
    var width = self.$el.width();
    var x = d3.time.scale()
        .domain([date('1982'), date('2014')])
        .range([0, width]);
    var events = _.map(T('events') || [], function (o) { return _.clone(o); });
    var allEvents = d3.select(this.el)
        .selectAll('event')
        .data(events, function (d) {
            return d.id;
        });
    var newEvents = allEvents.enter().append('event');
    newEvents
        .text(function (d) { return d.desc; })
        .style('left', function (d) {
            d.width = $(this).outerWidth();
            d.left = Math.round(x(d.date) - 0.5 * d.width);
            return d.left + 'px';
        });
    var blocks = [];
    allEvents
        .style('top', function (d) {
            var left = d.left;
            var right = d.right = d.left + d.width;
            var height = d.height = $(this).outerHeight();
            var attemptTops = [0];
            var occupiedRanges = _.reduce(blocks, function (memo, block) {
                if ((block.left <= right && block.left >= left) ||
                    (block.right <= right && block.right >= left) ||
                    (block.left <= left && block.right >= right)) {
                    memo.push(block);
                    attemptTops.push(block.bottom + 1);
                }
                return memo;
            }, []);
            attemptTops.sort();
            var top = d.top = _.find(attemptTops, function (topTry) {
                var bottomTry = topTry + height;
                return _.all(occupiedRanges, function (block) {
                    return !((block.top <= bottomTry && block.top >= topTry) ||
                             (block.bottom <= bottomTry && block.bottom >= topTry) ||
                             (block.top <= topTry && block.bottom >= bottomTry));
                });
            });
            d.bottom = d.top + d.height;
            blocks.push(d);
            return top + 'px';
        });
});

tbone.render($('[tbone]'));
