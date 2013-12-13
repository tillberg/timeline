var socket = io.connect('/');
socket.once('reload', function () {
    console.log('reloading...');
    setTimeout(function () {
        location.reload();
    }, 100);
});

var nextId = 1;
socket.on('data', function (data) {
    // console.log(data);
    var events = [];
    _.each(data, function (text, name) {
        var currStartDate;
        var currEndDate;
        var currDateString;
        _.each(text.split('\n'), function (line) {
            line = line.replace(/^\s+|\s+$/g, '');
            if (line.match(/^#/)) { return; }
            if (!line) {
                currStartDate = null;
                currEndDate = null;
            } else if (!currStartDate) {
                currDateString = line;
                var parts = line.split('-');
                currStartDate = parseDate(parts[0]);
                currEndDate = parseDate(parts[1] || parts[0], true);
            } else {
                var ev = {
                    id: nextId,
                    desc: line,
                    dateStr: currDateString,
                    startDate: currStartDate,
                    endDate: currEndDate,
                    lengthMs: ms(currEndDate) - ms(currStartDate)
                };
                events.push(ev);
                nextId++;
            }
        });
    });
    events = _.sortBy(events, function (event) {
        return event.date ? '2' : '1';
    });
    events = _.sortBy(events, function (ev) { return -ev.lengthMs; })
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

var PADDING = 10;
function getScale (width) {
    return d3.time.scale()
        .domain(T('zoomDomain') || [0, 1])
        .range([PADDING, width - PADDING]);
}

tbone.createView('axis', function () {
    var self = this;
    T('screen.width');
    var width = self.$el.width();
    var x = getScale(width);
    var ticks = d3.select(this.el).selectAll('tick').data(x.ticks(), function (d) { return d; });
    var newTicks = ticks.enter().append('tick');
    ticks.exit().remove();
    var formatFn = x.tickFormat();
    newTicks
        .text(function (d) { return formatFn(d); });
    ticks
        .style('left', function (d) { return x(d) + 'px'; });

});

$.fn.tooltip.defaults = {
    animation: false,
    placement: 'bottom',
    selector: false,
    template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
    trigger: 'hover',
    title: '',
    delay: { show: 0, hide: 0 },
    html: true
};

var EVENT_HEIGHT = 23;
var VERT_PADDING = 2;
tbone.createView('timeline', function () {
    var self = this;
    T('screen.width');
    var width = self.$el.width();
    var x = getScale(width);
    var minVisible = -50;
    var maxVisible = width + 50;
    var events = _.reduce(T('events') || [], function (memo, ev) {
        var left = x(ev.startDate);
        var right = x(ev.endDate)
        if ((left > minVisible && left < maxVisible) ||
            (right > minVisible && right < maxVisible) ||
            (left <= minVisible && right >= maxVisible)) {
            var width = Math.round(right) - Math.round(left) + 1;
            memo.push(_.extend({
                left: left,
                right: right,
                width: width,
                isMoment: width < 6
            }, ev));
        }
        return memo;
    }, []);
    var allEvents = d3.select(this.el)
        .selectAll('event')
        .data(events, function (d) {
            return d.id + ' ' + d.isMoment;
        });
    allEvents.enter()
        .append('event')
        .attr('title', function (d) {
            return (d.isMoment ? '' : d.desc + ' <br> ') + d.dateStr;
        })
        .each(function (d) {
            $(this).tooltip({
                placement: d.isMoment ? 'top': 'bottom'
            });
        })
        .append('div')
        .append('span')
        .text(function (d) { return d.desc; });
    allEvents.exit()
        .each(function (d) {
            $(this).find('[data-original-title]').tooltip('destroy');
        })
        .remove();
    var blocks = [];
    allEvents
        .classed('moment', function (d) { return !!d.isMoment; })
        .style('width', function (d) {
            return d.isMoment ? null : d.width + 'px';
        })
        .style('left', function (d) {
            return Math.round(d.left) + 'px';
        })
        .style('top', function (d) {
            var left, right, height;
            if (d.isMoment) {
                left = d.left - 4;
                right = d.right + 4;
                height = 200;
            } else {
                left = d.left;
                right = d.right;
                height = d.height = EVENT_HEIGHT;
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
            if (!d.isMoment) {
                blocks.push(d);
            }
            return top + 'px';
        });
});

function updateZoom () {
    var x = zoom.x();
    var min = x.domain()[0];
    var max = x.domain()[1];
    // I don't get how to do this without messing up panning
    // if (min < 0 || max > 1) {
    //     if (min < 0) { min = 0; }
    //     if (max > 1) { max = 1; }
    //     x.domain([min, max]);
    //     zoom.x(x);
    //     zoom.translate([0, 0]);
    // }
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
