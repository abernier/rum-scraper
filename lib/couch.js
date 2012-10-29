(function () {
  var $  = this.$ || require('nq');
  var _  = this._ || require('underscore');

  $.ajaxSetup({
    contentType: 'application/json',
    dataType: 'json',
    processData: false,
    headers: {'X-Requested-With': 'XMLHttpRequest'}
  });

  function Couch(DB) {
    this.DB = DB;
  }
  Couch.prototype.fetch = function (ids) {
    // http://wiki.apache.org/couchdb/HTTP_Bulk_Document_API#Fetch_Multiple_Documents_With_a_Single_Request
    return $.ajax(this.DB + '/_all_docs?include_docs=true', {
      type: 'POST',
      data: JSON.stringify({
        keys: ids
      }),
      dataFilter: function (data) {
        var docs = JSON.parse(data).rows.filter(function (row) {
          return row.doc;
        }).map(function (row) {return row.doc;});

        return JSON.stringify(docs);
      }
    });
  };
  Couch.prototype.store = function (docs) {
    // _id and updatedAt
    var now = new Date().getTime();
    docs.forEach(function (doc, i) {
      docs[i]._id = doc.id;
      docs[i].updatedAt = now;
    });

    // http://wiki.apache.org/couchdb/HTTP_Bulk_Document_API#Modify_Multiple_Documents_With_a_Single_Request
    return $.ajax(this.DB + '/_bulk_docs', {
      type: 'POST',
      data: JSON.stringify({
        docs: docs
      })
    });
  };
  Couch.prototype.mergeWithOldDocs = function (newDocs) {
    var dfd = $.Deferred();

    //
    // 1- Fetch old docs matching new ones
    //

    var newDocsIds = newDocs.map(function (newDoc) {return newDoc.id});
    this.fetch(newDocsIds).done(function (oldDocs) {

      //
      // 2- Merge new docs with properties of old ones
      //

      newDocs.forEach(function (newDoc, i) {
        // Find corresponding old doc
        var oldDoc = _(oldDocs).find(function (oldDoc) {return oldDoc.id === newDoc.id;});

        if (!oldDoc) {
          return;
        }

        // by reference
        newDocs[i] = $.extend(true, {}, oldDoc, newDoc);
      });

      dfd.resolve(newDocs);
    });

    return dfd.promise();
  };

  // Exports

  var RUMScraper = this.RUM && this.RUM.scraper || require('./index.js')
  RUMScraper.Couch = Couch;

  if (typeof module !== "undefined" && module !== null) {
    module.exports = Couch;
  }

}).call(this);