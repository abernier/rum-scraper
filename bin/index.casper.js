//
// Usage: casperjs index.casper.js --url=http://www.adopteunmec.com/* --username=john --password=XXXX --cookies-file=cookies.txt
//
// cookies.txt must exist
//

var casper = require('casper').create({
  //verbose: true,
  //logLevel: "debug",
  pageSettings: {
    loadImages: false
  },
  clientScripts: [
    //"../node_modules/nq/lib/index.js",
    "../node_modules/underscore/underscore.js",
    "../node_modules/backbone/backbone.js",
    "../lib/index.js",
    "../lib/extractor.js"
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
  //this.echo('visiting url...', 'INFO');
  //this.debugHTML();
});

//
// sign-in
//

casper.then(function() {
  //this.echo('checking we are logged-in...', 'INFO');

  var loggedIn = this.exists('a[href*="auth/logout"]');

  if (!loggedIn) {
    //this.echo("no, let's login...", 'INFO');

    this.fill('form[action*="auth/login"]', {
      'username': ''+username,
      'password': ''+password,
      'remember': true
    }, true);
  } else {
    //this.echo('ok, we are logged-in!', 'INFO');
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
    //this.echo('Not on the right URL, let visit it...', 'INFO');
    this.open(url);
  }
});

//
// Extract information
//

casper.then(function () {
  //this.echo('let waitandstart', 'INFO');
  this.evaluate(function () {
    RUM.scraper.extractor.start();
  });
});

casper.waitFor(function () {
  //this.echo('let waitfor', 'INFO');
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