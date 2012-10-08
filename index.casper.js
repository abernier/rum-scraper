//
// Usage: casperjs --username=john --password=XXXX --cookies-file=cookies.txt
//
// cookies.txt must exist
//

var casper = require('casper').create({
    //verbose: true,
    //logLevel: "debug",
    pageSettings: {
        //javascriptEnabled: false,
        loadImages: false
    }
});

//
// Make sure we have a username and passworkd as CLI options
//
// http://casperjs.org/cli.html
//
var username = casper.cli.get("username");
var password = casper.cli.get("password");
if (!username || !password) {
    casper.die('Missing --username or --password', 1);
}

casper.start('http://www.adopteunmec.com/', function () {
    //this.debugHTML();
});

casper.then(function() {
    //this.echo('checking we are logged-in...', 'INFO');

    var loggedIn = this.exists('a[href*="auth/logout"]');

    if (!loggedIn) {
        //this.echo("no, let's login...", 'INFO');

        this.fill('form[action*="auth/login"]', {
            'username': username,
            'password': password,
            'remember': true
        }, true);
    } else {
        //this.echo('ok, we are logged-in!', 'INFO');
    }
});

casper.then(function() {
    this.evaluateOrDie(function() {
        return !!document.querySelector('a[href*="auth/logout"]');
    }, 'Not logged-in!');
});

casper.then(function() {
    this.echo(JSON.stringify(this.getGlobal('rolloverObject')));
});

casper.run(function () {
    this.exit(0);
});