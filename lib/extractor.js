(function () {
  var $        = this.$ || require('nq');
  var _        = this._ || require('underscore');
  var Backbone = this.Backbone || require('backbone');

  //
  // Find all online thumbnails in the page and extract information from them
  //

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
    // Extract infos from (online) thumbs
    //

    var ret = $.unique($('img[src*="thumb"]').closest('a[href*="profile/"]:has(.online)').map(function (i, el) {
      return +$(el).attr('href').match(/\/([0-9]+)/)[1];
    })).map(function (i, id) {
      return {
        id: ''+id,
        sex: (sexContext === 'female' ? 'male' : 'female'),
        lastSeenAt: new Date().getTime() // online!
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

      // validate values
      var str = _.isString(ret) && (ret = $.trim(ret)) && ret.length; // not empty string
      var num = _.isNumber(ret) && !_.isNaN(ret);                     // not NaN number
      var arr = _.isArray(ret) && ret.length;                         // not empty array
      var obj = $.isPlainObject(ret);                                 // {}
      var valid = (str || num || arr || obj);
      if (!valid) {
        ret = void 0; // undefined for $.extend
      }

      return ret;
    }

    // Extract statistic (for example 'Mails: 4 x 50 = 200' => 4) from table
    function getStat(name) {
      return str2int($(':icontains("' + name + '")').closest('tr').text().match(/([0-9]+)\s*x\s*/)[1]);
    }

    var extractors = {
      pseudo: new Extractor(function () {
        return $('#profile-infos .title').text();
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
        return str2int($('#profile-infos .age').text().split('ans')[0]);
      }),
      size: new Extractor(function () {
        return str2int($(':icontains("mensuration")').closest('td').text().match(/([0-9]+)\s*cm/)[1]);
      }),
      weight: new Extractor(function () {
        return str2int($(':icontains("mensuration")').closest('td').text().match(/([0-9]+)\s*kg/)[1]);
      }),
      geo: new Extractor(function () {
        var matches = JSON.parse(JSON.stringify(eval("(" + $('script:contains("map_coords")').text().match(/map_coords\s*=\s*(\{[^\}]*\})/)[1] + ")")));
        return {
          lat: matches.memberLat,
          lng: matches.memberLng
        };
      }),
      description: new Extractor(function () {
        return $('#view_description_girl .data').text();
      }),
      shoppinglist: new Extractor(function () {
        return $('#view_shoppinglist_girl .data').text();
      }),
      pics: new Extractor(function () {
        return $('#user-pics img').not('[src*="thumb2.jpg"]').map(function (i, el) {
          return $(el).attr('src').replace(/thumb[0-9]/, 'thumb2'); // thumb2 is larger (250x200) than thumb1 (100x100)
        }).get();
      }),
      bigPics: new Extractor(function () {
        return JSON.parse($('script:contains("userPics:")').text().match(/userPics\s*:\s*(\[.*\])/)[1]).map(function (el) {return el.urlFullsize;});
      }),
      lastSeenAt: new Extractor(function () {
        var matches = $('.last-cnx').text().match(/(([0-9]+|une)\s(minute|jour|heure)|online)/i);

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
        var fur = $(':icontains("pilosité")').length;

        var gender = fur ? 'male' : 'female'

        return gender;
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
      console.log('home!');

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

    // pass the deferred to Backbone's Router so it can resolve it
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