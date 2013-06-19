#!/usr/bin/env node
var argv = require('optimist')
      .usage('Scrap AUM and couch girls.\nUsage: $0 -a http://www.adopteunmec.com/ -u john@example.org -p XXXXXX [Options]')
      
      .alias('a', 'url')
      .demand('a')
      .describe('a', 'URL to visit')

      .alias('u', 'username')
      .demand('u')
      .describe('u', 'your AUM login')

      .alias('p', 'password')
      .demand('p')
      .describe('p', 'your AUM password')

      .alias('c', 'couch')
      .describe('c', 'where to couch docs')
      .default('c', 'http://localhost:5984/rum')

      .argv
    ;

var $ = require('nq');

//
// Grab Girls from AUM
//

var exec = require('child_process').exec;
function casper() {
  return $.Deferred(function (dfd) {
    exec('casperjs ' + __dirname + '/index.casper.js --url=' + argv.url + ' --username=' + argv.username + ' --password=' + argv.password + ' --cookies-file=' + __dirname + '/cookies.txt --dirname=' + __dirname, function (error, stdout, stderr) {
      if (error === null) {
        try {
          dfd.resolve(JSON.parse(''+stdout));
        } catch (e) {
          dfd.reject(e);
        }
      } else {
        dfd.reject(''+stderr);
      }
    });
  }).promise();
}

//
// Flow
//

//console.log('> Scraping docs from %s...', argv.url);
casper().then(function (newDocs) {
  console.log(JSON.stringify(newDocs));
  process.exit(0);
  /*//
  // 1- Merge new docs with old ones
  //

  var Couch = require('../lib/couch.js');
  var couch = new Couch(argv.couch);

  console.log('> Merging docs...');
  couch.mergeWithOldDocs(newDocs).done(function (mergedDocs) {
    console.log('< OK, docs merged!');

    //
    // 2- Store merged docs
    //

    console.log('> Storing docs...');
    couch.store(mergedDocs).done(function (data) {
      console.log('< OK, docs stored!', data);
    });
  });*/
}).fail(function (e) {
  process.stderr.write(e + '\n')
  process.exit(1);
});