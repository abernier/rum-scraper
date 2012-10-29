(function () {
  var $        = this.$ || require('nq');
  var _        = this._ || require('underscore');
  var Backbone = this.Backbone || require('backbone');

  function extractThumbs() {
    var ret = [];

    //
    // Determine sex context (Whether we are a male/female)
    //

    var sexContext;

    // not login, can't determine my sex (and thumbs' ones)
    var login = $('a[href*="auth/logout"]').length;
    if (!login) {
      return ret; 
    }

    var femaleClues = $('.basket:icontains("mon panier"), a[href*="/copines"], #buttons .recommend').length;
    var maleClues = $('.basket:contains("sous votre charme"), a[href*="myBasket"], a[href*="payment/upgrade"]').length;

    if (femaleClues + maleClues <= 0) {
      return ret;
    }

    sexContext = femaleClues > maleClues ? 'female' : 'male';

    //
    // Extract infos from thumbs
    //

    var ret = $.unique($('.photoMask').closest('a[href*="profile/"]:has(.online)').map(function (i, el) {
      return +$(el).attr('href').match(/\/([0-9]+)/)[1];
    })).map(function (i, id) {
      return {
        id: ''+id,
        sex: (sexContext === 'female' ? 'male' : 'female'),
        lastSeenAt: new Date().getTime()
      };
    });

    //
    // Augment with rolloverObject infos (if available)
    //

    var rolloverObject;
    try {
      // Don't have access to Memory => from DOM
      rolloverObject = JSON.parse($('script:contains("rolloverObject")').text().replace(/var\srolloverObject\s=\s/, '').replace(';', ''));
    } catch(e) {}

    if (rolloverObject) {(function () {
      for (var i = 0, l = ret.length; i < l; i++) {

        // Find corresponding (same id) rolloverObject
        var o = (function () {
          for (var j = 0, k = rolloverObject.length; j < k; j++) {
            if (rolloverObject[j]['id'] === ret[i]['id']) {
              return rolloverObject[j];
            }
          }
        }());
        
        if (!o) {
          continue;
        }
        
        ret[i].pseudo = o.pseudo;
        ret[i].age = str2int(o.age);
        ret[i].mail = str2int(o.mail);
        ret[i].basket = str2int(o.basket);
        ret[i].pics = o.pics;
      }
    }())}

    return ret.get();
  }

  function extractProfileData(id) {

    //
    // Little Extractor class just to catch exceptions and return undefined for $.extend
    //

    function Extractor(f) {
      this.f = f;
    }
    Extractor.prototype.try = function () {
      var ret;
      try {
        ret = this.f();
      } catch(e) {}

      if (!$.isNumeric(ret) && !typeof ret === "string" && !$.isArray(ret) && !$.isPlainObject(ret)) {
        ret = void 0;
      }

      return ret;
    }

    // Little helper
    function getStat(name) {
      var $statName = $('.statName:icontains("' + name + '")');
      var $statCalc = $statName.find('+ .statCalc');

      return str2int($.trim($statCalc.text()).split(/\s.\s/)[0]);
    }

    var extractors = {
      pseudo: new Extractor(function () {
        return $('#profileBanner h1').text();
      }),
      mail: new Extractor(function () {
        return getStat('mail');
      }),
      charm: new Extractor(function () {
        return getStat('charm');
      }),
      basket: new Extractor(function () {
        return getStat('panier');
      }),
      visit: new Extractor(function () {
        return getStat('visit');
      }),
      age: new Extractor(function () {
        return str2int($('.caracName:icontains("âge") + .caracValue').text().match(/[0-9]+/)[0]);
      }),
      size: new Extractor(function () {
        return str2int($('.caracName:icontains("mensuration") + .caracValue').text().match(/([0-9]+)\s?cm/)[1]);
      }),
      weight: new Extractor(function () {
        return str2int($('.caracName:icontains("mensuration") + .caracValue').text().match(/([0-9]+)\s?kg/)[1]);
      }),
      geo: new Extractor(function () {
        var matches = $('script:contains("map_initialize")').text().match(/map_initialize\(\s?([^,]+),\s?([^,]+)/);
        return {
          lat: parseFloat(matches[1]),
          lng: parseFloat(matches[2])
        };
      }),
      description: new Extractor(function () {
        return $('.usertext').eq(0).text().replace(/”/g,'');
      }),
      shoppinglist: new Extractor(function () {
        return $('.usertext').eq(1).text().replace(/”/g,'');
      }),
      pics: new Extractor(function () {
        var pic0 = $('#pictures .wrapper').attr('style').match(/url\(([^\)]+)\)/)[1].replace(/thumb[0-9]/, 'thumb1');
        var otherPics = $('#pictures img[src*="thumb"]').map(function (i, el) {return $(el).attr('src');}).get();

        return [pic0].concat(otherPics);
      }),
      bigPics: new Extractor(function () {
        var objPhotos = JSON.parse($('script:contains("objPhotos = [")').text().match(/objPhotos\s?=\s?(\[.*\]);/)[1]);

        return objPhotos.map(function (o) {return o.urlFullsize;});
      }),
      lastSeenAt: new Extractor(function () {
        var matches = $('.date').text().match(/(([0-9]+|une)\s(minute|jour|heure)|online)/i);

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
      }),
      sex: new Extractor(function () {
        var maleClues = $('.caracName:icontains("pilosité"), [data-tooltip*="bel homme"], .botActions:contains("Le bloquer"), .botActions:contains("ce boulet")').length;
        var femaleClues = $('.pop, .statName:icontains("charmes"), #pieChart, .tabs li:eq(2):icontains("sexo")').length;

        return maleClues > femaleClues ? 'male' : 'female';
      }),
      music: new Extractor(function () {
        return $('.fourblocks :icontains("musique") li').map(function (i, el) {
          return $(el).text();
        }).get();
      }),
      books: new Extractor(function () {
        return $('.fourblocks :icontains("livre") li').map(function (i, el) {
          return $(el).text();
        }).get();
      }),
      cinema: new Extractor(function () {
        return $('.fourblocks :icontains("cinéma") li').map(function (i, el) {
          return $(el).text();
        }).get();
      }),
      television: new Extractor(function () {
        return $('.fourblocks :icontains("télévision") li').map(function (i, el) {
          return $(el).text();
        }).get();
      })
    }

    //
    // Extract and merge
    //

    var o = {};
    for (k in extractors) {
      o[k] = extractors[k].try()
    }

    return $.extend({id: ''+id}, o);
  }

  //
  // Convert a string (with space separators) to an integer
  //
  // Ex: "  2 765" -> 2765
  //
  function str2int(str) {
    str = ''+str;
    return parseInt(str.replace(/\s/g, ''), 10);
  }

  //
  // http://api.jquery.com/contains-selector/#comment-29621264
  //
  $.expr[':'].icontains = $.expr[':'].icontains || function (obj, index, meta, stack) {
    return (obj.textContent || obj.innerText || jQuery(obj).text() || '').toLowerCase().indexOf(meta[3].toLowerCase()) >= 0;
  };

  // For jQuery < 1.7
  $.isNumeric = $.isNumeric || function () {return !$.isNaN;};

  //
  // Flow
  //

  var Router = Backbone.Router.extend({
    initialize: function (dfd) {
      //
      // Routes
      //

      // home
      this.route(/^$|^\/index$/, "home");
      // profile
      this.route(/profile\/([0-9]+)/, "profile");

      this.dfd = dfd;
    },
    home: function () {
      //console.log('home!');

      var docs = extractThumbs();
      //console.log(JSON.stringify(docs));

      this.dfd.resolve(docs);
    },
    profile: function (id) {
      //console.log('profile!', id);

      var profileData = extractProfileData(id);
      var thumbsData = extractThumbs();

      var docs = [profileData].concat(thumbsData);
      //console.log(JSON.stringify(docs));

      this.dfd.resolve(docs);
    },
  });

  // Exports

  var RUMScraper = this.RUM && this.RUM.scraper || require('./index.js')
  var extractor = RUMScraper.extractor = {
    extractThumbs: extractThumbs,
    extractProfileData: extractProfileData,
    start: start
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = extractor;
  }

  function start(cb) {
    var dfd = $.Deferred();

    new Router(dfd);
    Backbone.history.start({pushState: true});

    var promise = dfd.promise();
    promise.then(function (docs) {
      extractor.docs = docs;

      if (cb) {
        cb(docs);
      }
    });

    return promise;
  }
}).call(this);