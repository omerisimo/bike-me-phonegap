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
      this.mapMarkers = [];
      this.infoWindow = new google.maps.InfoWindow();
      var onMapClicked = _.bind(this.closeInfoWindow, this);
      google.maps.event.addListener(this.googleMap, 'click', onMapClicked);
    }

    this.googleMap.setCenter(this.options.center);
    google.maps.event.trigger(this.googleMap, 'resize');
  },

  options: {
    center           : new google.maps.LatLng(32.066181,34.77761),
    disableDefaultUI : true,
    zoomControl      : true,
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
    this.clearMarkers();
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

    this.googleDirectionsService.route(request, function(result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        bikeMe.mapView.directionsRenderer.setDirections(result);
        bikeMe.mapView.renderMarkers(route,
                            result.routes[0].legs[0].start_location,
                            result.routes[0].legs[2].end_location,
                            result.routes[0].legs[0].end_location,
                            result.routes[0].legs[2].start_location);
      }
    });
  },

  renderMarkers: function (route, start, end, startStation, endStation){
    this.displayMarker(start, "Origin", this.originIcon, "Origin");
    this.displayMarker(end, "Destiantion", this.destinationIcon, "Destiantion");
    this.displayMarker(startStation, "Origin Station", this.getStationIcon(route.sourceStation.availableBikes), "Origin Station");
    this.displayMarker(endStation, "Destiantion Station", this.getStationIcon(route.targetStation.availableDocks), "Destiantion Station");
  },

  displayMarker: function (position, title, icon, infoContent) {
    var marker = new google.maps.Marker({map: this.googleMap, position: position, title: title, icon: icon});
    this.mapMarkers.push(marker);

    var onMarkerClicked = function (event) {
      bikeMe.mapView.infoWindow.setContent(infoContent);
      bikeMe.mapView.infoWindow.open(bikeMe.mapView.googleMap,this);
    }
    onMarkerClicked = _.bind(onMarkerClicked, marker);

    google.maps.event.addListener(marker, 'click', onMarkerClicked);
  },

  getStationIcon: function (availableCount) {
    if (availableCount > 2) {
      return this.stationIcons.avaliableStation;
    } else if (availableCount > 0) {
      return this.stationIcons.partiallyAvailableStation;
    } else {
      return this.stationIcons.noneAvailableStation;
    }
  },

  clearMarkers: function () {
    for (var i = 0; i < this.mapMarkers.length; i++ ) {
        this.mapMarkers[i].setMap(null);
    }
    this.mapMarkers = [];
    this.closeInfoWindow();
  },

  closeInfoWindow: function () {
    if (!_.isUndefined(this.infoWindow)){
        this.infoWindow.close();
    }
  }

};
