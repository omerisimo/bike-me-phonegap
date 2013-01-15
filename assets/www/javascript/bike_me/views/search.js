bikeMe.namespace('Views');

bikeMe.Views.Search = function () {
  this.initialize();
};

bikeMe.Views.Search.prototype = {
  initialize: function () {
    this.$el = $('#search');

    this.search = _.bind(this.search, this);
    this.$el.on('click', 'input[type="submit"]', this.search);
  },

  search: function () {
    var from = this.$el.find('input#from').val();
    var to   = this.$el.find('input#to').val();

    var search = new bikeMe.Models.Search(from, to);
    search.findLocations({success: this.onSearchSuccess, error: this.onSearchError});
  },

  onSearchSuccess: function (originLocation, destinationLocation) {
    var routesFinder = new bikeMe.Models.RoutesFetcher(originLocation, destinationLocation);
  },

  onSearchError: function () {
    alert('could not find the address you typed');
  },

  unbind: function () {
    this.$el.unbind();
  }
};
