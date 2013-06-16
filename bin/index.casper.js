//
// Usage: casperjs index.casper.js --url=http://www.adopteunmec.com/ --username=john --password=XXXX --cookies-file=cookies.txt --dirname=`pwd`
//
// cookies.txt must exist
//

var casper = require('casper').create();
var dirname = casper.cli.get("dirname");

var casper = require('casper').create({
  verbose: true,
  //logLevel: 'debug',
  pageSettings: {
    loadImages: false
  },
  clientScripts: [
    //dirname + "/../node_modules/nq/lib/index.js",
    dirname + "/../node_modules/underscore/underscore.js",
    dirname + "/../node_modules/backbone/backbone.js",
    dirname + "/../lib/index.js",
    dirname + "/../lib/extractor.js"
  ]
});

//
// Make sure we have all the required options
//
// http://casperjs.org/cli.html
//

var url      = casper.cli.get("url");
var username = casper.cli.get("username");
var password = casper.cli.get("password");
if (!url || !username || !password) {
  casper.die('Missing some required options', 1);
}

//
// Visit profile
//

casper.start(url, function () {
  casper.log('visiting url...', 'debug');
  //this.debugHTML();
});

//
// sign-in
//

casper.then(function() {
  casper.log('checking we are logged-in...', 'debug');

  var loggedIn = this.exists('a[href*="auth/logout"]');

  if (!loggedIn) {
    //casper.log("no, let's login...", 'debug');

    this.fill('form[action*="auth/login"]', {
      'username': ''+username,
      'password': ''+password,
      'remember': true
    }, true);
  } else {
    casper.log('ok, we are logged-in!', 'debug');
  }
});

//
// Check we are logged-in and on the right URL
//

casper.then(function () {
  // Die if not logged-in
  this.evaluateOrDie(function() {
    return !!document.querySelector('a[href*="auth/logout"]');
  }, 'Not logged-in!');

  //
  if (this.getCurrentUrl() !== url) {
    casper.log('Not on the right URL, let visit it...', 'debug');
    this.open(url);
  }
});

//
// Extract information
//

casper.then(function () {
  casper.log('let waitandstart', 'debug');
  this.evaluate(function () {
    RUM.scraper.extractor.start();
  });
});

casper.waitFor(function () {
  casper.log('let waitfor', 'debug');
  return this.evaluate(function () {
    return RUM.scraper.extractor.docs;
  });
});

casper.run(function () {
  var docs = this.evaluate(function (){
    return RUM.scraper.extractor.docs;
  });

  this.echo(JSON.stringify(docs));

  this.exit(0);
});