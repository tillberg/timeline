var socket = io.connect('/');
socket.once('reload', function () {
    console.log('reloading...');
    setTimeout(function () {
        location.reload();
    }, 100);
});

window.date = function(v) {
    if (v && !v.getTime) {
        var number;
        if (typeof v === 'string') {
            // Attempt to parse v as a number
            number = parseFloat(v);
            // If we get a number longer than 4 digits, interpret
            // that as seconds/milliseconds/microseconds
            if (number && number > 9999) {
                v = number;
            } else if (v.match(/\bnow\b/)) {
                return new Date();
            }
        }
        if (typeof v === 'number') {
            return new Date(v);
        } else if (typeof v === 'string') {
            // Pass non-number strings on to the Date constructor
            return new Date(v);
        } else {
            return null;
        }
    } else if (arguments.length === 0) {
        return new Date();
    } else {
        return v || null;
    }
};

window.ms = function (d) {
    var _date = arguments.length ? date(d) : date();
    return _date ? _date.getTime() : _date;
};

var nextId = 1;
socket.on('data', function (data) {
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
                    id: nextId,
                    desc: line
                }, currEndDate ? {
                    startDate: currDate,
                    endDate: currEndDate
                } : {
                    date: currDate
                }));
                nextId++;
            }
        });
    });
    events = _.sortBy(events, function (event) {
        return event.date ? '2' : '1';
    });
    // events.sort(function () { return Math.random() > 0.5; })
    T('events', events);
});

T('earliestDate', function () {
    return _.reduce(T('events') || [], function (memo, event) {
        var start = ms(event.startDate || event.date);
        return memo ? Math.min(memo, start) : start;
    }, null);
});

T('latestDate', function () {
    return _.reduce(T('events') || [], function (memo, event) {
        var end = ms(event.endDate || event.date);
        return memo ? Math.max(memo, end) : end;
    }, null);
});

T('zoomDomain', function () {
    var earliest = ms(T('earliestDate'));
    var latest = ms(T('latestDate'));
    var zoomLeft = T('zoomLeft');
    var zoomRight = T('zoomRight');
    if (earliest && latest) {
        var dateWidth = latest - earliest;
        return [
            date(earliest + dateWidth * zoomLeft),
            date(earliest + dateWidth * zoomRight)
        ];
    } else {
        return null;
    }
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

function getScale (view) {
    T('screen.width');
    var width = view.$el.width();
    return d3.time.scale()
        .domain(T('zoomDomain') || [0, 1])
        .range([0, width]);
}

tbone.createView('axis', function () {
    var self = this;
    var x = getScale(this);
    var ticks = d3.select(this.el).selectAll('tick').data(x.ticks(), function (d) { return d; });
    var newTicks = ticks.enter().append('tick');
    ticks.exit().remove();
    var formatFn = x.tickFormat();
    newTicks
        .text(function (d) { return formatFn(d); });
    ticks
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
        .append('div')
        .append('span')
        .text(function (d) { return d.desc; });
    allEvents.exit().remove();
    var blocks = [];
    allEvents
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
        .style('top', function (d) {
            var left, right, height;
            if (d.date) {
                left = d.left - 4;
                right = d.right + 4;
                height = 200;
            } else {
                left = d.left;
                right = d.right = d.left + d.width;
                height = d.height = $(this).outerHeight();
                d.left += 2;
                d.right -= 2;
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

function updateZoom () {
    var x = zoom.x();
    var min = Math.max(0, x.domain()[0]);
    var max = Math.min(1, x.domain()[1]);
    x.domain([min, max]);
    zoom.x(x);
    T('zoomLeft', min);
    T('zoomRight', max);
}

var WIDTH = $('body').width();
var zoom = d3.behavior.zoom()
    .on("zoom", updateZoom)
    .x(d3.scale.linear()
        .domain([0, 1])
        .range([0, WIDTH]));
d3.select('body').call(zoom);
updateZoom();

tbone.render($('[tbone]'));
