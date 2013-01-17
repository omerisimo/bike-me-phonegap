bikeMe.namespace('Views');

bikeMe.Views.Map = function () {
  this.initialize();
};

bikeMe.Views.Map.prototype = {
  initialize: function () {
    this.$el        = $('#map');
    this.$googleMap = $('#googleMap');

    radio('searchSuccess').subscribe([this.onSearchSuccess, this]);
  },

  initializeGoogleMap: function () {
    if (_.isUndefined(this.googleMap)){
      this.googleMap = new google.maps.Map(this.$googleMap[0], this.options);
      this.googleDirectionsService = new google.maps.DirectionsService();
      this.directionsRenderer = new google.maps.DirectionsRenderer();
      this.directionsRenderer.setMap(this.googleMap);
    }
    google.maps.event.trigger(this.googleMap, 'resize');
  },

  options: {
    center           : new google.maps.LatLng(32.0833, 34.8000),
    disableDefaultUI : true,
    mapTypeId        : google.maps.MapTypeId.ROADMAP,
    zoom             : 8
  },

  onSearchSuccess: function (routes) {
    this.show();
    this.renderRoute(routes[0]);
  },

  show: function () {
    $.mobile.changePage(this.$el);
    this.initializeGoogleMap();
  },

  renderRoute: function (route) {
    var start = new google.maps.LatLng(route.source.latitude, route.source.longitude);
    var end   = new google.maps.LatLng(route.target.latitude, route.target.longitude);

    var waypts = [{ location:new google.maps.LatLng(route.sourceStation.location.latitude, route.sourceStation.location.longitude), stopover:true },
      { location:new google.maps.LatLng(route.targetStation.location.latitude, route.targetStation.location.longitude), stopover:true }
    ];

    var request = { origin:start,
      destination:end,
      waypoints: waypts,
      optimizeWaypoints: true,
      travelMode: google.maps.TravelMode.WALKING
    };

    var renderer = this.directionsRenderer;

    this.googleDirectionsService.route(request, function(result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        renderer.setDirections(result);
      }
    });
  }
};
