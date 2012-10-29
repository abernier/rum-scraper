(function () {
  var scraper = {};

  var RUM = this.RUM || {};
  this.RUM = RUM;

  RUM.scraper = scraper;

  if (typeof module !== "undefined" && module !== null) {
    module.exports = scraper;
  }
}).call(this);