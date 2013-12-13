
function parseDate (str, roundUp) {

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
