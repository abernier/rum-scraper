#!/usr/bin/env node
var argv = require('optimist')
      .usage('Consolidate girls.\nUsage: $0 command [Options]')

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
function grabSpecificGirl(id) {
  return $.Deferred(function (dfd) {
    exec('casperjs casper/profile.js --uid=' + id, function (error, stdout, stderr) {
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

var DB = argv.couch;
var request = require('request');
function retrieveGirlToBeConsolidated() {
  var dfd = $.Deferred();

  request.get({url: DB + '/_design/app/_view/toBeConsolidated?limit=1'}, function (error, response, body) {
    //console.log(body);
    if (response.statusCode === 200) {
      dfd.resolve(JSON.parse(body).rows[0].value);
    } else {
      dfd.reject();
    }
  });

  return dfd.promise();
}

function storeGirl(jsonDoc) {
  var dfd = $.Deferred();

  request.put({
    url: DB + '/' + jsonDoc._id,
    json: jsonDoc
  }, function (error, response, body) {
    console.log(body);
    if (response.statusCode === 201) {
      dfd.resolve(body);
    } else {
      dfd.reject();
    }
  });

  return dfd.promise();
}

console.log('Retrieving a girl to be consolidated...');
retrieveGirlToBeConsolidated().then(function (girlDoc) {
  console.log('girl retrieved!');

  console.log('Grabbing fresh infos...');
  grabSpecificGirl(girlDoc.id).then(function (freshInfos) {
    console.log('fresh infos grabbed!', freshInfos);

    ['mail', 'charm', 'basket', 'visit', 'lastSeenAt', 'description', 'shoppinglist'].forEach(function (el, i) {
      if (el in freshInfos) {
        girlDoc[el] = freshInfos[el];
      }
    });
    girlDoc.updatedAt = new Date().getTime();

    console.log('Storing girl...');
    storeGirl(girlDoc).then(function () {
      console.log('couched!')
    });
  });
});