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
      var rendererOptions = { suppressMarkers: true };
      this.directionsRenderer = new google.maps.DirectionsRenderer(rendererOptions);
      this.directionsRenderer.setMap(this.googleMap);

      this.stationIcons = { avaliableStation:         new google.maps.MarkerImage("images/path_bike_spot_icon_green.png",
                                                                new google.maps.Size(25, 39),
                                                                new google.maps.Point(0,0),
                                                                new google.maps.Point(13, 38)),
                           partiallyAvailableStation: new google.maps.MarkerImage("images/path_bike_spot_icon_orange.png",
                                                                                    new google.maps.Size(25, 39),
                                                                                    new google.maps.Point(0,0),
                                                                                    new google.maps.Point(13, 38)),
                           noneAvailableStation:      new google.maps.MarkerImage("images/path_bike_spot_icon_red.png",
                                                                                    new google.maps.Size(25, 39),
                                                                                    new google.maps.Point(0,0),
                                                                                    new google.maps.Point(13, 38))
                          };

      this.originIcon = new google.maps.MarkerImage("images/path_green_arrow_icon.png",
                                                      new google.maps.Size(32, 42),
                                                      new google.maps.Point(0,0),
                                                      new google.maps.Point(16, 34));
      this.destinationIcon = new google.maps.MarkerImage("images/path_flag_icon.png",
                                                          new google.maps.Size(32, 42),
                                                          new google.maps.Point(0,0),
                                                          new google.maps.Point(4, 43));
    }
  },

  options: {
    center           : new google.maps.LatLng(-34.397, 150.644),
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
    var startStation = new google.maps.LatLng(route.sourceStation.location.latitude, route.sourceStation.location.longitude);
    var endStation = new google.maps.LatLng(route.targetStation.location.latitude, route.targetStation.location.longitude);

    var waypts = [{ location: startStation, stopover: true },
      { location: endStation, stopover: true }
    ];

    var request = { origin:start,
      destination:end,
      waypoints: waypts,
      optimizeWaypoints: false,
      travelMode: google.maps.TravelMode.WALKING
    };

    var succ = function(result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        this.directionsRenderer.setDirections(result);
        this.renderMarkers(route,
                            result.routes[0].legs[0].start_location,
                            result.routes[0].legs[2].end_location,
                            result.routes[0].legs[0].end_location,
                            result.routes[0].legs[2].start_location);
      }
    }

    var succ = _.bind(succ, this);

    this.googleDirectionsService.route(request, succ);
  },

  renderMarkers: function (route, start, end, startStation, endStation){
    var marker = new google.maps.Marker({position: start, title:"Origin", icon: this.originIcon});
    marker.setMap(this.googleMap);

    marker = new google.maps.Marker({position: end, title:"Destiantion", icon: this.destinationIcon});
    marker.setMap(this.googleMap);

    marker = new google.maps.Marker({position: startStation, title:"Origin Station", icon: this.getStationIcon(route.sourceStation.availableBikes)});
    marker.setMap(this.googleMap);

    marker = new google.maps.Marker({position: endStation, title:"Destiantion Station", icon: this.getStationIcon(route.targetStation.availableDocks)});
    marker.setMap(this.googleMap);
  },

  getStationIcon: function (availableCount) {
    if (availableCount > 2) {
      return this.stationIcons.avaliableStation;
    } else if (availableCount > 0) {
      return this.stationIcons.partiallyAvailableStation;
    } else {
      return this.stationIcons.noneAvailableStation;
    }
  }
};
