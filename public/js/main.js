var socket = io.connect('/');
socket.once('reload', function () {
    console.log('reloading...');
    setTimeout(function () {
        location.reload();
    }, 100);
});

function date (d) {
    if (d && d.getFullYear) {
        return d;
    } else if (d && d.match(/^\s*now/)) {
        return new Date();
    } else {
        return d && new Date(d);
    }
}

socket.once('data', function (data) {
    // console.log(data);
    var events = [];
    _.each(data, function (text, name) {
        var currDate;
        var currEndDate;
        _.each(text.split('\n'), function (line) {
            line = line.replace(/^\s+|\s+$/g, '');
            if (!line) {
                currDate = null;
                currEndDate = null;
            } else if (!currDate) {
                currDate = date(line.split('-')[0]);
                currEndDate = date(line.split('-')[1]);
            } else {
                events.push(_.extend({
                    id: events.length,
                    desc: line
                }, currEndDate ? {
                    startDate: currDate,
                    endDate: currEndDate
                } : {
                    date: currDate
                }));
            }
        });
    });
    events = _.sortBy(events, function (event) {
        return event.date ? '2' : '1';
    });
    // events.sort(function () { return Math.random() > 0.5; })
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

T('minDate', date('2000'));
T('maxDate', date('now'));

function getScale (view) {
    T('screen.width');
    var width = view.$el.width();
    return d3.time.scale()
        .domain([T('minDate'), T('maxDate')])
        .range([0, width]);
}

tbone.createView('axis', function () {
    var self = this;
    var x = getScale(this);
    var ticks = d3.select(this.el).selectAll('tick').data(x.ticks());
    var newTicks = ticks.enter().append('tick');
    var formatFn = x.tickFormat();
    newTicks
        .text(function (d) { return formatFn(d); })
        .style('left', function (d) { return x(d) + 'px'; });

});

var VERT_PADDING = 2;
tbone.createView('timeline', function () {
    var self = this;
    var x = getScale(self);
    var events = _.map(T('events') || [], function (o) { return _.clone(o); });
    var allEvents = d3.select(this.el)
        .selectAll('event')
        .data(events, function (d) {
            return d.id;
        });
    var newEvents = allEvents.enter().append('event');
    newEvents
        .classed('moment', function (d) { return !!d.date; })
        .each(function (d) {
            d.left = Math.round(x(d.date || d.startDate));
            d.right = Math.round(x(d.date || d.endDate));
            d.width = d.right - d.left + 1;
        })
        .style('width', function (d) {
            return d.width + 'px';
        })
        .style('left', function (d) {
            // d.width = $(this).outerWidth();
            return d.left + 'px';
        })
        .append('div')
        .append('span')
        .text(function (d) { return d.desc; });
    var blocks = [];
    allEvents
        .style('top', function (d) {
            var left, right, height;
            if (d.date) {
                left = d.left - 6;
                right = d.right + 6;
                height = 150;
            } else {
                left = d.left;
                right = d.right = d.left + d.width;
                height = d.height = $(this).outerHeight();
            }
            var attemptTops = [0];
            var occupiedRanges = _.reduce(blocks, function (memo, block) {
                if ((block.left <= right && block.left >= left) ||
                    (block.right <= right && block.right >= left) ||
                    (block.left <= left && block.right >= right)) {
                    memo.push(block);
                    attemptTops.push(block.bottom + VERT_PADDING);
                }
                return memo;
            }, []);
            attemptTops = _.sortBy(attemptTops, function (a) { return a; })
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
