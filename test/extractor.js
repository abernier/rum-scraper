var test = require("tap").test;

var $ = require('nq');
var _ = require('underscore');

// scraper helper
var exec = require('child_process').exec;
function scrap(url, username, password) {
  return $.Deferred(function (dfd) {
    exec(__dirname + '/../bin/index.js -a ' + url + ' -u ' + username + ' -p ' + password, function (error, stdout, stderr) {
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

test("Seed from thumbnails", function (t) {
	t.plan(2)

	scrap('http://www.adopteunmec.com/', 'antoine.bernier@gmail.com', '292901').then(function (docs) {

		// [{}, ...]
		t.ok(_.isArray(docs) && docs.length > 0, "should be a not empty array");

		// {id:}, {id:}, ...
		t.ok((function () {
			var l = docs.length;
			while (--l) {
				if (!docs[l].id) {
					return false;
				}
			}

			return true;
		}()), "each doc should have an ID")

		// TODO: sex, lastSeenAt, +rolloverObject properties

	}).fail(function (e) {
	  t.end()
	});
});

test("Consolidate from profile", function (t) {

	//
	// Male/Female
	//

	t.test("male/female in common", function (t) {
		t.plan(15); // in case scraper fails

		scrap('http://www.adopteunmec.com/profile/17804907', 'antoine.bernier@gmail.com', '292901').then(function (docs) {
			var doc = docs[0];
			//console.log(docs);

			// id
			t.ok(''+doc.id === ''+17804907, "first doc should be 17804907");

			// sex
			t.ok(doc.sex.length, "sex should exist")

			// lastSeenAt : not null + <= now
			t.ok(_.isNumber(doc.lastSeenAt) && doc.lastSeenAt <= new Date().getTime(), "lastSeenAt")

			// mail
			t.ok(_.isNumber(doc.mail) && doc.mail >= 0, "mail should be a positive number")

			// visit
			t.ok(_.isNumber(doc.visit) && doc.visit >= 0, "visit should be a positive number")

			// basket
			t.ok(_.isNumber(doc.basket) && doc.basket >= 0, "basket should be a positive number")

			// pics
			t.ok(_.isArray(doc.pics) && doc.pics.length >= 1, "pics should be a not empty array")

			// big pics
			t.ok(_.isArray(doc.bigPics) && doc.bigPics.length === doc.pics.length, "bigPics should be an array with same length than pics")

			// pseudo
			t.ok(_.isString(doc.pseudo) && doc.pseudo.length, "pseudo should be a not empty string")

			// age
			t.ok(_.isNumber(doc.age) && doc.age >= 0, "age should be a positive number")

			// size
			t.ok(_.isNumber(doc.size) && doc.size >= 0, "size should be a positive number")

			// weight
			t.ok(_.isNumber(doc.weight) && doc.weight >= 0, "weight should be a positive number")

			// geo
			t.ok(_.isNumber(doc.geo.lat) && _.isNumber(doc.geo.lat), "geo should be {lat: <number>, lng: <number>}")

			// description
			t.ok(_.isString(doc.description) && doc.description.length, "description should be a not empty string")

			// shoppinglist
			t.ok(_.isString(doc.shoppinglist) && doc.shoppinglist.length, "shoppinglist should be a not empty string")

			t.end()

		}).fail(function (e) {
		  t.end()
		});
	})
	

	//
	// Female specific
	//

	t.test("female specific", function (t) {
		t.plan(2); // in case scraper fails

		scrap('http://www.adopteunmec.com/profile/17804907', 'antoine.bernier@gmail.com', '292901').then(function (docs) {
			var doc = docs[0];
			// console.log(doc)

			// sex
			t.ok(doc.sex === 'female', "17804907 is a female")

			// charm
			t.ok(_.isNumber(doc.charm) && doc.charm >= 0, "charm should be a positive number")

			t.end()

		}).fail(function (e) {
		  t.end()
		});
	})

	//
	// Male specific
	//

	t.test("male specific", function (t) {
		t.plan(1); // in case scraper fails

		scrap('http://www.adopteunmec.com/profile/26141696', 'antoine.bernier@gmail.com', '292901').then(function (docs) {
			var doc = docs[0];
			//console.log(doc)

			// sex
			t.ok(doc.sex === 'male', "26141696 is a male")

			t.end()

		}).fail(function (e) {
		  t.end()
		});
	})

}); 