var socket = io.connect('/');
socket.once('reload', function () {
    console.log('reloading...');
    setTimeout(function () {
        location.reload();
    }, 100);
});

var DAY_MS = 24 * 60 * 60 * 1000;

var rgxMetadata = /^(\w+)\:\s*(.*)$/
var nextId = 1;
socket.on('data', function (data) {
    // console.log(data);
    var events = [];
    _.each(data, function (text, name) {
        var currDateRange;
        var currDateString;
        var props = {};
        var lastYear;
        var descLines = [];
        function flush () {
            if (currDateRange && descLines.length) {
                var ev = _.extend({
                    id: nextId,
                    desc: descLines.join('\n'),
                    descShort: descLines[0].match(/^[^\(]*/)[0],
                    dateStr: currDateString,
                    startDate: currDateRange.start,
                    endDate: currDateRange.end,
                    lengthMs: ms(currDateRange.end) - ms(currDateRange.start)
                }, props);
                events.push(ev);
                nextId++;
            }
        }
        _.each(text.split('\n'), function (line) {
            line = line.replace(/^\s+|\s+$/g, '');
            if (line.match(/^#/)) { return; }
            if (!line) {
                flush();
                descLines = [];
                currDateRange = null;
            } else if (!currDateRange) {
                var mdMatch = line.match(rgxMetadata);
                if (mdMatch) {
                    var num = parseFloat(mdMatch[2]);
                    props[mdMatch[1]] = isNaN(num) ? mdMatch[2] : num;
                } else {
                    currDateString = line;
                    currDateRange = parseDateRange(line, { currYear: lastYear });
                    lastYear = currDateRange.end.getFullYear();
                }
            } else {
                descLines.push(line);
            }
        });
        flush();
    });
    events = _.sortBy(events, function (ev) {
        return -(ev.lengthMs * (ev.weight || 1) + 10 * (ev.weight || 1) * DAY_MS);
    })
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
    // hack the domain so that ticks don't disappear suddenly at screen edges
    var domain = x.domain();
    var domainWidth = ms(domain[1]) - ms(domain[0]);
    var domainStart = date(ms(domain[0]) - 0.1 * domainWidth);
    var domainEnd = date(ms(domain[1]) + 0.1 * domainWidth);
    var _x = d3.time.scale().domain([ domainStart, domainEnd ]);
    var _ticks = _x.ticks();
    var formatFn = x.tickFormat();

    var ticks = d3.select(this.el).selectAll('tick').data(_ticks, function (d) { return d; });
    ticks.enter().append('tick').text(function (d) { return formatFn(d); });
    ticks.exit().remove();
    ticks.style('left', function (d) { return x(d) + 'px'; });

    var marks = d3.select(this.el).selectAll('mark').data(_ticks, function (d) { return d; });
    marks.enter().append('mark');
    marks.exit().remove();
    marks.style('left', function (d) { return x(d) + 'px'; });
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
var VERT_PADDING = 6;
tbone.createView('timeline', function () {
    var self = this;
    T('screen.width');
    var width = self.$el.width();
    var $tmp = $('<ul class="axis"></ul>').appendTo('body');
    var axisHeight = $tmp.outerHeight();
    $tmp.remove();
    T(function () {
        var x = getScale(width);
        var minVisible = -50;
        var maxVisible = width + 50;
        var events = _.reduce(T('events') || [], function (memo, ev) {
            var left = x(ev.startDate);
            var right = x(ev.endDate)
            if ((left > minVisible && left < maxVisible) ||
                (right > minVisible && right < maxVisible) ||
                (left <= minVisible && right >= maxVisible)) {
                var uwidth = right - left;
                var width = Math.round(right) - Math.round(left) + 1;
                memo.push(_.extend({
                    left: left,
                    right: right,
                    width: width,
                    isMoment: uwidth < 10
                }, ev));
            }
            return memo;
        }, []);
        var allEvents = d3.select(self.el)
            .selectAll('event')
            .data(events, function (d) {
                return d.id + ' ' + d.isMoment;
            });
        allEvents.enter()
            .append('event')
            .style('background-color', function (d) {
                return d.color || null;
            })
            .attr('title', function (d) {
                return d.dateStr + '<br>' + d.desc.replace(/\n/g, ' <br> ');
            })
            .each(function (d) {
                $(this).tooltip({
                    placement: d.isMoment ? 'bottom': 'bottom'
                });
            })
            .append('div')
            .append('span')
            .text(function (d) { return d.descShort; });
        allEvents.exit()
            .each(function (d) {
                $(this).filter('[data-original-title]').tooltip('destroy');
            })
            .remove();
        var blocks = [];
        allEvents
            .attr('class', function (d) {
                return d.class || '';
            })
            .classed('moment', function (d) { return !!d.isMoment; })
            .style('width', function (d) {
                return d.isMoment ? null : d.width + 'px';
            })
            .style('left', function (d) {
                return Math.round(d.left) + 'px';
            })
            .style('bottom', function (d) {
                var left, right, height;
                if (d.isMoment) {
                    left = d.left - 5;
                    right = d.right + 5;
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
                return (top + axisHeight) + 'px';
            });
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
