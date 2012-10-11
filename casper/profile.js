//
// Usage: casperjs profile.casper.js --uid=16258072
//
// cookies.txt must exist
//

var casper = require('casper').create({
  //verbose: true,
  //logLevel: "debug",
  pageSettings: {
    loadImages: false
  }
});

//
// Make sure we have a uid
//
// http://casperjs.org/cli.html
//

var uid = casper.cli.get("uid");
if (!uid) {
  casper.die('Missing --uid', 1);
}

//
// Visit profile
//

casper.start('http://www.adopteunmec.com/profile/' + uid, function () {
  //this.debugHTML();
});

//
// Extract information
//


function lastSeenAt(str) {
  var matches = str.match(/(([0-9]+|une)\s(minute|jour|heure)|online)/i);

  var unit = matches[3];
  var amount = matches[2];

  var ret;
  switch (unit) {
    case 'minute':
      ret = (amount === 'une' ? 1 : amount) * 60*1000;
    break;
    case 'heure':
      ret = amount * 60*60*1000;
    break;
    case 'jour':
      ret = amount * 24*60*60*1000;
    break;
    default:
      ret = 0;
    break;
  }

  return new Date().getTime() - ret;
}

casper.run(function () {
  var o = {};

  //
  // # mails, charms, baskets, visits
  //
  if (this.exists('.statCalc')) {
    var mailsCharmesPanierVisites = this.evaluate(function () {
      return $('.statCalc').map(function (i, el) {
        return $.trim($(el).text()).split(/\s.\s/)[0];
      }).slice(0, 4).get();
    });

    o.mail = mailsCharmesPanierVisites[0];
    o.charm = mailsCharmesPanierVisites[1];
    o.basket = mailsCharmesPanierVisites[2];
    o.visit = mailsCharmesPanierVisites[3];
  }
  
  //
  // last seen online
  //
  if (this.exists('.date')) {
    var dateStr = this.evaluate(function () {
      return $('.date').text();
    });

    o.lastSeenAt = lastSeenAt(dateStr);
  }

  //
  // Description and shopping-list
  //
  if (this.exists('.usertext')) {
    var descriptionAndShoppinglist = this.evaluate(function () {
      $('.usertext .quote').remove();
      var $usertext = $('.usertext');
      return [$usertext.eq(0).text(), $usertext.eq(1).text()];
    });

    o.description = descriptionAndShoppinglist[0];
    o.shoppinglist = descriptionAndShoppinglist[1];
  }

  this.echo(JSON.stringify(o)).exit(0);
});