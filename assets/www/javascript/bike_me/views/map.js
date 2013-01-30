bikeMe.namespace('Views');

bikeMe.Views.Map = function () {
  this.initialize();
};

bikeMe.Views.Map.prototype = {
  initialize: function () {
    this.$el        = $('#map');
    this.$googleMap = $('#googleMap');
    this.$walkingDistanceInfo = $('#walkingDistance');
    this.$cyclingDistanceInfo = $('#cyclingDistance');
    this.$totalTimeInfo = $('#totalTime');
    this.$previousRouteButton = $('#previousRoute');
    this.$nextRouteButton = $('#nextRoute');
    this.$routesIndexInfo = $('#routesIndex')

    this.currentRouteIndex = 0;
    this.routes = [];

    radio('searchSuccess').subscribe([this.onSearchSuccess, this]);
    var nextRoute = _.bind(this.nextRoute, this);
    this.$nextRouteButton.on('click', nextRoute);
    var previousRoute = _.bind(this.previousRoute, this);
    this.$previousRouteButton.on('click', previousRoute);
  },

  initializeGoogleMap: function () {
    if (_.isUndefined(this.googleMap)){
      this.googleMap = new google.maps.Map(this.$googleMap[0], this.options);
      this.googleDirectionsService = new google.maps.DirectionsService();
      var rendererOptions = { suppressMarkers     : true,
                              suppressInfoWindows : true
                            };
      this.directionsRenderer = new google.maps.DirectionsRenderer(rendererOptions);

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

      this.stationShadow = new google.maps.MarkerImage("images/shadow-path_bike_spot_icon.png",
                                                        new google.maps.Size(45.0, 39.0),
                                                        new google.maps.Point(0, 0),
                                                        new google.maps.Point(10, 38));
      this.originIcon = new google.maps.MarkerImage("images/path_green_arrow_icon.png",
                                                      new google.maps.Size(32, 42),
                                                      new google.maps.Point(0,0),
                                                      new google.maps.Point(16, 32));
      this.originShadow = new google.maps.MarkerImage("images/shadow-path_green_arrow_icon.png",
                                                        new google.maps.Size(45.0, 39.0),
                                                        new google.maps.Point(0, 0),
                                                        new google.maps.Point(16, 32));
      this.destinationIcon = new google.maps.MarkerImage("images/path_flag_icon.png",
                                                          new google.maps.Size(32, 42),
                                                          new google.maps.Point(0,0),
                                                          new google.maps.Point(4, 43));
      this.destinationShadow = new google.maps.MarkerImage("images/shadow-path_flag_icon.png",
                                                        new google.maps.Size(45.0, 39.0),
                                                        new google.maps.Point(0, 0),
                                                        new google.maps.Point(4, 43));
      this.mapMarkers = [];
      this.infoWindow = new InfoBubble({
                map: this.googleMap,
                shadowStyle: 1,
                padding: 0,
                backgroundColor: 'rgb(57,57,57)',
                borderRadius: 4,
                arrowSize: 10,
                borderWidth: 1,
                borderColor: '#2c2c2c',
                disableAutoPan: true,
                hideCloseButton: true,
                arrowPosition: 40,
                backgroundClassName: 'infoWindowBackground',
                arrowStyle: 0
              });

      this.closeInfoWindow = _.bind(this.closeInfoWindow, this);
      google.maps.event.addListener(this.googleMap, 'click', this.closeInfoWindow);
    }

    this.googleMap.setCenter(this.options.center);
    google.maps.event.trigger(this.googleMap, 'resize');
  },

  routeIndexClasses: ['routeOne', 'routeTwo',  'routeThree',  'routeFour',  'routeFive',  'routeSix',  'routeSeven',  'routeEight',  'routeNine'],

  options: {
    center           : new google.maps.LatLng(32.066181,34.77761),
    disableDefaultUI : true,
    zoomControl      : true,
    zoomControlOptions: { position: google.maps.ControlPosition.LEFT_CENTER },
    mapTypeId        : google.maps.MapTypeId.ROADMAP,
    zoom             : 15
  },

  onSearchSuccess: function (routes) {
    this.currentRouteIndex = 0;
    this.routes = routes;
    this.options.center = new google.maps.LatLng(routes[0].source.latitude, routes[0].source.longitude);
    this.show();
    this.renderRoute(routes[0]);
    return false;
  },

  show: function () {
    $.mobile.changePage(this.$el);
    this.initializeGoogleMap();
    this.clearMarkers();
  },

  renderRoute: function (route) {
    this.clearMarkers();

    var start = new google.maps.LatLng(route.source.latitude, route.source.longitude);
    var end   = new google.maps.LatLng(route.target.latitude, route.target.longitude);

    var waypts = [];
    if (!_.isUndefined(route.sourceStation) && !_.isUndefined(route.targetStation)) {
      var startStation = new google.maps.LatLng(route.sourceStation.location.latitude, route.sourceStation.location.longitude);
      var endStation = new google.maps.LatLng(route.targetStation.location.latitude, route.targetStation.location.longitude);

      waypts = [{ location: startStation, stopover: true },
        { location: endStation, stopover: true }
      ];
    }
    var request = { origin:start,
      destination:end,
      waypoints: waypts,
      optimizeWaypoints: false,
      travelMode: google.maps.TravelMode.WALKING
    };

    this.googleDirectionsService.route(request, function(result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        bikeMe.mapView.directionsRenderer.setDirections(result);
        bikeMe.mapView.directionsRenderer.setMap(bikeMe.mapView.googleMap);
        // In case this is a walking route (no stations to render)
        if (result.routes[0].legs.length == 1) {
          bikeMe.alert('Take a walk!!!', "Yehh...")
          bikeMe.mapView.renderMarkers(route,
                              result.routes[0].legs[0].start_location,
                              result.routes[0].legs[0].end_location,
                              null, null);
        }
        else {
          bikeMe.mapView.renderMarkers(route,
                              result.routes[0].legs[0].start_location,
                              result.routes[0].legs[2].end_location,
                              result.routes[0].legs[0].end_location,
                              result.routes[0].legs[2].start_location);
        }
      }
      return false;
    });

    this.updateRouteInfo(route);
    this.showRouteButtons();
  },

  renderMarkers: function (route, start, end, startStation, endStation){
    this.displayMarker(start, "Origin", this.originIcon, this.originShadow, route.source.address, 0);
    this.displayMarker(end, "Destiantion", this.destinationIcon, this.destinationShadow, route.target.address, 0);

    if (!_.isUndefined(route.sourceStation) && !_.isUndefined(route.targetStation)) {
      this.displayMarker(startStation,
                          "Origin Station",
                          this.getStationIcon(route.sourceStation.availableBikes),
                          this.stationShadow,
                          this.stationInfoHtml(route.sourceStation), 1);
      this.displayMarker(endStation,
                          "Destiantion Station",
                          this.getStationIcon(route.targetStation.availableDocks),
                          this.stationShadow,
                          this.stationInfoHtml(route.targetStation), 1);
    }
  },

  stationInfoHtml: function (station){
    return "<div class='infowWindowHeader'>"+station.location.address+"</div>\
    <br>\
    <div>Available bikes: "+station.availableBikes+"</div>\
    <br>\
    <div>Available docks: "+station.availableDocks+"</div>"
  },

  displayMarker: function (position, title, icon, shadow, infoContent, zIndex) {
    var marker = new google.maps.Marker({map: this.googleMap, position: position, title: title, icon: icon, shadow: shadow, zIndex: zIndex});
    this.mapMarkers.push(marker);

    var onMarkerClicked = function (event) {
      bikeMe.mapView.infoWindow.setContent('<div class="infoWondowText">'+infoContent+'</div>');
      bikeMe.mapView.infoWindow.open(bikeMe.mapView.googleMap,this);
      $('.infoWindowBackground').click(bikeMe.mapView.closeInfoWindow);
      return false;
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
    this.directionsRenderer.setMap(null);
    return false;
  },

  closeInfoWindow: function () {
    if (!_.isUndefined(this.infoWindow)){
        this.infoWindow.close();
    }
  },

  updateRouteInfo: function (route) {
    this.$walkingDistanceInfo[0].innerHTML = route.totalWalkinDistance().toString() + " km";
    this.$cyclingDistanceInfo[0].innerHTML = route.totalCyclingDistance().toString() + " km";
    this.$totalTimeInfo[0].innerHTML = route.routeTime.toFixed().toString() + " min";
  },

  showRouteButtons: function () {
    if (this.currentRouteIndex > 0 ) {
      this.$previousRouteButton.removeClass('hide');
    } else {
      this.$previousRouteButton.addClass('hide');
    }

    if (this.currentRouteIndex < this.routes.length-1 &&  this.currentRouteIndex < 8) {
      this.$nextRouteButton.removeClass('hide');
    } else {
      this.$nextRouteButton.addClass('hide');
    }

    this.$routesIndexInfo.removeClass();
    this.$routesIndexInfo.addClass('mapInfo routeIndex ' + this.routeIndexClasses[this.currentRouteIndex] + ' ' + this.routeIndexClasses[Math.min(this.routes.length,9)-1])
  },

  nextRoute: function () {
    this.currentRouteIndex = this.currentRouteIndex + 1;
    this.renderRoute(this.routes[this.currentRouteIndex]);
    return false;
  },

  previousRoute: function () {
    this.currentRouteIndex = this.currentRouteIndex - 1;
    this.renderRoute(this.routes[this.currentRouteIndex]);
    return false;
  }
};
