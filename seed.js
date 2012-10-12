#!/usr/bin/env node
var argv = require('optimist')
      .usage('Scrap AUM and couch girls.\nUsage: $0 command -u john@example.org -p XXXXXX [Options]')
      
      .alias('u', 'username')
      .demand('u')
      .describe('u', 'your AUM login')

      .alias('p', 'password')
      .demand('p')
      .describe('p', 'your AUM password')

      .alias('c', 'couch')
      .describe('c', 'where to couch girls')
      .default('c', 'https://abernier.iriscouch.com:6984/aum')

      .argv
    ;

var $ = require('nq');

//
// Grab Girls from AUM
//

var exec = require('child_process').exec;
function grabNewGirls() {
  return $.Deferred(function (dfd) {
    exec('casperjs casper/home.js --username=' + argv.username + ' --password=' + argv.password + ' --cookies-file=cookies.txt', function (error, stdout, stderr) {
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
// Couch girls
//

var DB = argv.couch;

var request = require('request');
function prepareGirlsToBeStored(girls) {
  var dfd = $.Deferred();

  //
  // _id and updatedAt
  //

  var updatedAt = new Date().getTime();
  girls.forEach(function (girl) {
    girl._id = girl.id;
    girl.updatedAt = updatedAt;
    girl.lastSeenAt = updatedAt;
  });

  //
  // filter not new ones
  //

  var keys = girls.map(function (el) {return ""+el.id;});

  request.post({
    url: DB + '/_all_docs',
    json: {keys: keys}
  }, function (error, response, body) {
    //console.log(body);
    if (response.statusCode === 200) {
      // Reject girls already stored in DB
      var _ids = body.rows.map(function (row) {return row.id;});
      var onlyNewGirls = girls.filter(function (girl) {
        return _ids.indexOf(girl.id) === -1;
      });

      dfd.resolve(onlyNewGirls);
    } else {
      dfd.reject();
    }
  });

  return dfd.promise();
}

function storeGirls(preparedGirls) {
  var dfd = $.Deferred();

  request.post({
    url: DB + '/_bulk_docs',
    json: {docs: preparedGirls}
  }, function (error, response, body) {
    console.log(body);
    if (response.statusCode === 201) {
      dfd.resolve();
    } else {
      dfd.reject();
    }
  });

  return dfd.promise();
}

//
// Flow
//
//   1- Grab girls from AUM
//   2- Couch them
//

console.log('Grabbing some girls from adopteunmec...');
grabNewGirls().then(function (newGirls) {
  console.log('%s girls grabbed!', newGirls.length);

  console.log('Preparing them to be stored (_id updatedAt and filter)...');
  prepareGirlsToBeStored(newGirls).then(function (preparedGirls) {
    console.log('OK, those girls are ready to be couched! (%s rejected)', (newGirls.length - preparedGirls.length), preparedGirls);

    if (preparedGirls.length > 0) {
      console.log("Let's couch them...");
      storeGirls(preparedGirls).then(function () {
        console.log('Couched!');
      });
    } else {
      console.log('nothing to do :p')
    }
  });
});