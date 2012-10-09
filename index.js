var argv = require('optimist')
      .usage('Scrap AUM and couch girls.\nUsage: $0 -u john@example.org -p XXXXXX [Options]')
      
      .demand('u')
      .alias('u', 'username')
      .describe('u', 'your AUM login')

      .demand('p')
      .alias('p', 'password')
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
    exec('casperjs index.casper.js --username=' + argv.username + ' --password=' + argv.password + ' --cookies-file=cookies.txt', function (error, stdout, stderr) {
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
function augmentWithIdAndRev(newGirls) {
  var dfd = $.Deferred();

  var keys = newGirls.map(function (el, i) {
    return "" + el.id;
  });

  request.post({
    url: DB + '/_all_docs',
    json: {keys: keys}
  }, function (error, response, body) {
    var idsrevs = {};

    //console.log(body);

    if (response.statusCode === 200) {

      body.rows.forEach(function (row) {
        if (row.value && row.value.rev) {
          idsrevs[row.id] = row.value.rev;
        }
      });

      var updatedAt = new Date().getTime();
      newGirls.forEach(function (girl) {
        girl._id = girl.id;

        if (girl.id in idsrevs) {
          girl._rev = idsrevs[girl.id]
        }

        girl.updatedAt = updatedAt;
      });
      dfd.resolve(newGirls);
    } else {
      dfd.reject();
    }
  });

  return dfd.promise();
}

function storeGirls(preparedGirls) {
  var dfd = $.Deferred();

  // curl
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

  console.log('Preparing them to be stored (_id and _rev)...');
  augmentWithIdAndRev(newGirls).then(function (data) {
    console.log('OK, those girls are ready to be couched!');

    console.log("Let's couch them...");
    storeGirls(data).then(function () {
      console.log('Couched!');
    });
  });
});
