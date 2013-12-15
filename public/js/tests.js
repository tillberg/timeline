module('date');

function eqstr (a, b) {
    equal(a + '', b + '');
}

test('parseDateRange Full', function () {
    var dr = parseDateRange('June 2004');
    eqstr(dr.start, date('June 2004'));
    eqstr(dr.end, date('July 2004'));

    dr = parseDateRange('December 2004');
    eqstr(dr.end, date('January 2005'));

    dr = parseDateRange('2004');
    eqstr(dr.start, date('January 2004'));
    eqstr(dr.end, date('January 2005'));

    dr = parseDateRange('June 3, 2004');
    eqstr(dr.start, date('June 3, 2004'));
    eqstr(dr.end, date('June 4, 2004'));

    dr = parseDateRange('June 30, 2004');
    eqstr(dr.end, date('July 1, 2004'));

    dr = parseDateRange('August 31, 2004');
    eqstr(dr.end, date('Sept 1, 2004'));

    dr = parseDateRange('December 31, 2004');
    eqstr(dr.end, date('January 1, 2005'));

    dr = parseDateRange('Sept 2011 - Jan 2012');
    eqstr(dr.start, date('Sept 2011'));
    eqstr(dr.end, date('Feb 2012'));

    dr = parseDateRange('Dec. 15, 1988 – Jan. 6, 1989');
    eqstr(dr.start, date('Dec 15 1988'));
    eqstr(dr.end, date('Jan 7 1989'));

    dr = parseDateRange('now');
    var today = date('now');
    today.setHours(0, 0, 0, 0);
    eqstr(dr.start, today);
    var tomorrow = date('now');
    tomorrow.setHours(24, 0, 0, 0);
    eqstr(dr.end, tomorrow);

});

test('parseDateRange Partial', function () {
    var dr = parseDateRange('January 4 - 7, 1990');
    eqstr(dr.start, date('January 4, 1990'));
    eqstr(dr.end, date('January 8, 1990'));

    dr = parseDateRange('August 21 - 27, 1992');
    eqstr(dr.start, date('August 21, 1992'));
    eqstr(dr.end, date('August 28, 1992'));

    dr = parseDateRange('March - June, 2000');
    eqstr(dr.start, date('March 1, 2000'));
    eqstr(dr.end, date('July, 2000'));

    dr = parseDateRange('March 17 - June, 2000');
    eqstr(dr.start, date('March 17, 2000'));

    dr = parseDateRange('March - June 20, 2000');
    eqstr(dr.start, date('March 1, 2000'));
    eqstr(dr.end, date('June 21, 2000'));
});