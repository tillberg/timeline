module('parseDate');

function eqstr (a, b) {
    equal(a + '', b + '');
}

test('stuff', function () {
    eqstr(parseDate('June 2004'), date('June 2004'));
    eqstr(parseDate('June 2004', true), date('July 2004'));
    eqstr(parseDate('December 2004', true), date('January 2005'));
    eqstr(parseDate('2004'), date('2004'));
    eqstr(parseDate('2004', true), date('2005'));
    eqstr(parseDate('June 3, 2004'), date('June 3, 2004'));
    eqstr(parseDate('June 3, 2004', true), date('June 4, 2004'));
    eqstr(parseDate('June 30, 2004', true), date('July 1, 2004'));
    eqstr(parseDate('August 31, 2004', true), date('Sept 1, 2004'));
    eqstr(parseDate('December 31, 2004', true), date('January 1, 2005'));
    var today = date('now');
    today.setHours(0, 0, 0, 0);
    eqstr(parseDate('now'), today);
    var tomorrow = date('now');
    tomorrow.setHours(24, 0, 0, 0);
    eqstr(parseDate('now', true), tomorrow);
});
