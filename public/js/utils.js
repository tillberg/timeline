
var rgxYear = /^\s*(\d\d\d\d)/;
var rgxMonth = /^\s*(\w\w\w)\w*\s+(\d\d\d\d)/;
var rgxDay = /^\s*(\w\w\w)\w*\s+(\d\d?)[,\s]+(\d\d\d\d)/;
var rgxNow = /^\s*now/;
var monthsShort = 'jan,feb,mar,apr,may,jun,jul,aug,sep,oct,nov,dec'.split(',');
var monthsMap = _.reduce(monthsShort, function (memo, month, i) {
    memo[month] = i;
    return memo;
}, {});
function parseDate (str, roundUp) {
    var yearMatch = str.match(rgxYear);
    if (yearMatch) {
        var year = parseFloat(yearMatch[1]);
        return date('' + (year + (roundUp ? 1 : 0)));
    }
    var monthMatch = str.match(rgxMonth);
    if (monthMatch) {
        var month = monthsMap[monthMatch[1].toLowerCase()];
        if (month == null) {
            console.error('Unknown month: ' + month + ' in ' + str);
        }
        var year = parseFloat(monthMatch[2]);
        if (roundUp) {
            month = month + 1;
            if (month === monthsShort.length) {
                month = 0;
                year++;
            }
        }
        return date(monthsShort[month] + ' ' + year);
    }
    var dayMatch = str.match(rgxDay);
    if (dayMatch) {
        var base = date(str);
        if (roundUp) {
            return date(ms(base) + 24 * 60 * 60 * 1000);
        } else {
            return base;
        }
    }
    var nowMatch = str.match(rgxNow);
    if (rgxNow) {
        var now = date('now');
        now.setHours((roundUp ? 24 : 0), 0, 0, 0);
        return now;
    }
    console.error('No parseDate match found for ' + str);
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
