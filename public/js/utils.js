
var monthsShort = 'jan,feb,mar,apr,may,jun,jul,aug,sep,oct,nov,dec'.split(',');
var monthsMap = _.reduce(monthsShort, function (memo, month, i) {
    memo[month] = i;
    return memo;
}, {});

function getShortMonth (s) {
    return s && s.substring(0, 3).toLowerCase();
}
function parseNum (s) {
    return s && parseFloat(s);
}

// \u2013 is a dash of some sort
var rgxDateRange = /^\s*([a-zA-Z][a-zA-Z][a-zA-Z][\w.]*[,\s]*)?((\d\d?)[,\s]+)?(\d\d\d\d)?[^-\u2013]*[-\u2013]?\s*([a-zA-Z][a-zA-Z][a-zA-Z][\w.]*[,\s]*)?((\d\d?)[,\s]+)?(\d\d\d\d)?/;
function parseDateRange (str) {
    var match = str.match(rgxDateRange);
    if (!match) {
        console.error('Unable to parse date range [' + str + ']');
        return { start: null, end: null };
    }
    var m0, d0, y0, m1, d1, y1;
    var month0 = getShortMonth(match[1]);
    var mnow = date().getMonth(), dnow = date().getDate(), ynow = date().getFullYear();

    if (month0 === 'now') {
        m0 = mnow;
        d0 = dnow;
        y0 = ynow;
    } else {
        m0 = monthsMap[month0];
        d0 = parseNum(match[3]);
        y0 = parseNum(match[4]);
    }
    var month1 = getShortMonth(match[5]);
    if (month1 === 'now') {
        m1 = mnow;
        d1 = dnow;
        y1 = ynow;
    } else {
        m1 = monthsMap[month1];
        d1 = parseNum(match[7]);
        y1 = parseNum(match[8]);
    }
    if ((month0 && m0 == null) || (month1 && m1 == null)) {
        console.error('Unable to parse month(s) from [' + str + ']', match, m0, m1);
    }
    // If only one date specified, use as both start and end
    if (y1 == null && m1 == null && d1 == null) {
        y1 = y0;
        m1 = m0;
        d1 = d0;
    }
    // Handle "MMM dd - dd, YYYY"
    if (y0 == null && m1 == null) {
        y0 = y1;
        m1 = m0;
    }
    var start = {
        year: y0 || y1,
        month: m0 || 0,
        day: d0 || 0
    };
    var end = {
        year: y1 || y0,
        month: m1 || 0,
        day: d1 || 0
    };
    // console.log(str, match.join(' | '));
    // console.log(str, start, end);

    if (d1 != null) {
        end.day += 1;
    } else if (m1 != null) {
        end.month += 1;
    } else {
        end.year += 1;
    }
    // console.log(str, start, end);

    var startDate = new Date(start.year, start.month || 0, start.day || 1, 0, 0, 0, 0);
    var endDate = new Date(end.year, end.month || 0, end.day || 1, 0, 0, 0, 0);
    // console.log(str, startDate + '', endDate + '');
    return {
        start: startDate,
        end: endDate
    };
}

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
