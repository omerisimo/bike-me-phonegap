bikeMe.namespace('Views');

bikeMe.Views.Map = function () {
  this.initialize();
};

bikeMe.Views.Map.prototype = {
  initialize: function () {
    this.$el = $('#map');

    this.googleMap = new google.maps.Map(this.$el[0], this.options);
  },

  options: {
    center    : new google.maps.LatLng(-34.397, 150.644),
    zoom      : 8,
    mapTypeId : google.maps.MapTypeId.ROADMAP
  }
};
