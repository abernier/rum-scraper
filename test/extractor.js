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

	scrap('http://www.adopteunmec.com/', 'antoine.bernier+rumlola@gmail.com', 'toto123').then(function (docs) {

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
	// Male/Female, test with Rumlola
	//

	t.test("male/female in common", function (t) {
		t.plan(15); // in case scraper fails

		scrap('http://www.adopteunmec.com/profile/17824159', 'antoine.bernier+rumlola@gmail.com', 'toto123').then(function (docs) {
			var doc = docs[0];
			console.log(doc);

			// id
			t.ok(''+doc.id === ''+17824159, "first doc should be 17804907");

			// pseudo
			t.ok(_.isString(doc.pseudo) && doc.pseudo === "Rumlola", "pseudo is Rumlola")

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
			t.ok(_.isArray(doc.pics) && doc.pics.length === 2, "Rumlola has 2 pics")

			// big pics
			t.ok(_.isArray(doc.bigPics) && doc.bigPics.length === doc.pics.length, "bigPics should be an array with same length than pics")

			// age
			function getAge(dateString) {
		    var today = new Date();
		    var birthDate = new Date(dateString);
		    var age = today.getFullYear() - birthDate.getFullYear();
		    var m = today.getMonth() - birthDate.getMonth();
		    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
		      age--;
		    }
		    return age;
			}
			t.ok(doc.age === getAge("01/01/1981"), "Rumlola is born 01/01/1981")

			// size
			t.ok(doc.size === 165, "Rumlola is 165cm")

			// weight
			t.ok(doc.weight === 65, "Rumlola is 65kg")

			// geo
			t.ok(_.isNumber(doc.geo.lat) && _.isNumber(doc.geo.lat), "geo should be {lat: <number>, lng: <number>}")

			// description
			t.ok(doc.description === "Petite nouvelle ici, apres tout, qui ne tente rien n'a rien : alors Messieurs, a vous de me découvrir ! ;)", "Rumlola description")

			// shoppinglist
			t.ok(doc.shoppinglist === "Un physique avant tout, puis juste derriere une tres bonne situation sociale, enfin, peut-etre un peu de love :p", "Rumlola shoppinglist")

			t.end()

		}).fail(function (e) {
		  t.end()
		});
	})
	

	//
	// Female specific (Rumlola)
	//

	t.test("female specific", function (t) {
		t.plan(2); // in case scraper fails

		scrap('http://www.adopteunmec.com/profile/17824159', 'antoine.bernier+rumlola@gmail.com', 'toto123').then(function (docs) {
			var doc = docs[0];
			console.log(doc)

			// sex
			t.ok(doc.sex === 'female', "Runlola is a female")

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

		scrap('http://www.adopteunmec.com/profile/26141696', 'antoine.bernier+rumlola@gmail.com', 'toto123').then(function (docs) {
			var doc = docs[0];
			console.log(doc)

			// sex
			t.ok(doc.sex === 'male', "26141696 is a male")

			t.end()

		}).fail(function (e) {
		  t.end()
		});
	})

}); 