bikeMe.namespace('Views');

bikeMe.Views.Map = function () {
  this.initialize();
};

bikeMe.Views.Map.prototype = {
  initialize: function () {
    this.$el        = $('#map');
    this.$googleMap = $('#googleMap');

    radio('routesFound').subscribe([this.onRoutesFound, this]);
  },

  initializeGoogleMap: function () {
    this.googleMap = new google.maps.Map(this.$googleMap[0], this.options);
  },

  options: {
    center           : new google.maps.LatLng(-34.397, 150.644),
    zoom             : 8,
    disableDefaultUI : true,
    mapTypeId        : google.maps.MapTypeId.ROADMAP
  },

  onRoutesFound: function (routes) {
    this.show();
  },

  show: function () {
    $.mobile.changePage(this.$el);
    this.initializeGoogleMap();
  }
};
