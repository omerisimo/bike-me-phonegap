bikeMe.namespace('Views');

bikeMe.Views.Map = function () {
  this.initialize();
};

bikeMe.Views.Map.prototype = {
  initialize: function () {
    this.$el        = $('#map');
    this.$googleMap = $('#googleMap');
    this.$routeInfo = $('#routeInfo');
    this.$walkingDistanceInfo = $('#walkingDistance');
    this.$cyclingDistanceInfo = $('#cyclingDistance');
    this.$totalTimeInfo = $('#totalTime');
    this.$previousRouteButton = $('#previousRoute');
    this.$nextRouteButton = $('#nextRoute');
    this.$routesIndexInfo = $('#routesIndex')
    this.$routesInfoButton = $('#directionsButton');
    this.$locationButton = $('#mapLocationButton');
    this.$backButton = $('#backButton');
    this.popupScroll = new iScroll('directionWrapper');

    this.currentRouteIndex = 0;
    this.routes = [];

    radio('searchSuccess').subscribe([this.onSearchSuccess, this]);
    radio('searchStationsSuccess').subscribe([this.onSearchStationsSuccess, this]);
    radio('nearbyStationsSuccess').subscribe([this.onNearbyStationsSuccess, this]);
    var nextRoute = _.bind(this.nextRoute, this);
    this.$nextRouteButton.on('click', nextRoute);
    var previousRoute = _.bind(this.previousRoute, this);
    this.$previousRouteButton.on('click', previousRoute);
    var routeInfoPopup = _.bind(this.routeInfoPopup, this);
    this.$routesInfoButton.on('click', routeInfoPopup);
    this.$locationButton.on('click', _.bind(this.watchLocation, this));
    this.$backButton.on('click', _.bind(this.pauseMap, this));

    this.updateDirections = _.bind(this.updateDirections, this);
  },

  initializeGoogleMap: function () {
    if (_.isUndefined(this.googleMap)){
      this.googleMap = new google.maps.Map(this.$googleMap[0], this.options);

      this.googleDirectionsService = new google.maps.DirectionsService();

      this.directionsRenderer = new google.maps.DirectionsRenderer();

      // Create the info window
      this.infoWindow = new InfoBubble(this.infoWindowOptions);
      this.closeInfoWindow = _.bind(this.closeInfoWindow, this);

      // Create markers for the dffierent location
      this.originMarker = new google.maps.Marker();
      this.destinationMarker = new google.maps.Marker();
      this.originStationMarker = new google.maps.Marker();
      this.destinationStationMarker = new google.maps.Marker();

      this.originStationsMarkers = [];
      for (var i=0;i<bikeMe.MAX_RESULTS;i++) {
        this.originStationsMarkers[i] = new google.maps.Marker();
      }

      this.destinationStationsMarkers = [];
      for (var i=0;i<bikeMe.MAX_RESULTS;i++) {
        this.destinationStationsMarkers[i] = new google.maps.Marker();
      }

      this.nearbyStationsMarkers = [];
      for (var i=0;i<bikeMe.MAX_RESULTS*2;i++) {
        this.nearbyStationsMarkers[i] = new google.maps.Marker();
      }
    }
  },

  onSearchSuccess: function (routes) {
    // Chage to the map page
    $.mobile.changePage(this.$el);

    this.setMapRoutesControls()
    this.currentRouteIndex = 0;
    this.routes = routes;
    // render the first route
    this.renderRoute(routes[0]);
    return false;
  },

  onSearchStationsSuccess: function (origin, destination, originStations, destinationStations) {
    // Chage to the map page
    $.mobile.changePage(this.$el);
    this.setMapStationControls();
    $.mobile.loading('show', {
      text        : 'Loading stations...',
      textVisible : true
    });
    this.closeInfoWindow();
    this.clearOverlay();
    this.createNewMap();

    this.mapBounds = new google.maps.LatLngBounds();

    this.originMarker = this.createMarker(origin.address, this.originIcon,      this.originShadow,      0, origin.getLatLng());
    this.mapBounds.extend(origin.getLatLng());

    this.destinationMarker  = this.createMarker(destination.address, this.destinationIcon, this.destinationShadow, 0, destination.getLatLng());
    this.mapBounds.extend(destination.getLatLng());

    for (var i=0;i<this.originStationsMarkers.length;i++) {
      this.originStationsMarkers[i] = this.createMarker(this.stationInfoHtml(originStations[i]),
                                                        this.getStationIcon(originStations[i].availableBikes),
                                                        this.stationShadow,
                                                        1,
                                                        originStations[i].location.getLatLng()
                                                       );
      this.mapBounds.extend(originStations[i].location.getLatLng());
    }

    for (var i=0;i<this.destinationStationsMarkers.length;i++) {
      this.destinationStationsMarkers[i] = this.createMarker(this.stationInfoHtml(destinationStations[i]),
                                                              this.getStationIcon(destinationStations[i].availableDocks),
                                                              this.stationShadow,
                                                              1,
                                                              destinationStations[i].location.getLatLng()
                                                             );
      this.mapBounds.extend(destinationStations[i].location.getLatLng());
    }

    this.googleMap.fitBounds(this.mapBounds);
    return false;
  },

  onNearbyStationsSuccess: function (location, nearbyStations) {
    // Chage to the map page
    $.mobile.changePage(this.$el);
    this.setMapStationControls();
    $.mobile.loading('show', {
      text        : 'Loading stations...',
      textVisible : true
    });
    this.closeInfoWindow();
    this.clearOverlay();
    this.createNewMap();

    this.mapBounds = new google.maps.LatLngBounds();
    this.mapBounds.extend(location.getLatLng());

    for (var i=0;i<this.nearbyStationsMarkers.length;i++) {
      this.nearbyStationsMarkers[i] = this.createMarker(this.stationInfoHtml(nearbyStations[i]),
                                                        this.getStationIcon(nearbyStations[i].availableBikes),
                                                        this.stationShadow,
                                                        1,
                                                        nearbyStations[i].location.getLatLng()
                                                       );
      this.mapBounds.extend(nearbyStations[i].location.getLatLng());
    }

    this.googleMap.fitBounds(this.mapBounds);
    this.watchLocation();
    return false;
  },

  createNewMap: function () {
    this.options.zoom = this.googleMap.getZoom();
    this.options.center = this.googleMap.getCenter();
    this.googleMap = new google.maps.Map(this.$googleMap[0], this.options);
    google.maps.event.addListener(this.googleMap, 'click', this.closeInfoWindow);
    google.maps.event.addListenerOnce(this.googleMap, 'idle', function(){
      $.mobile.loading('hide');
    });
  },

  watchLocation: function() {
    this.clearLocation();
    $.mobile.loading('show', {
      text        : 'Waiting for location',
      textVisible : true
    });
    this.geoMarker = new GeolocationMarker(this.googleMap);
    this.geoMarker.setPositionOptions({ enableHighAccuracy: true, maximumAge: 5000, timeout: 3000});
    
    google.maps.event.addListenerOnce(this.geoMarker, 'position_changed', function(e) {
      bikeMe.mapView.mapBounds.extend(this.getPosition());
      bikeMe.mapView.googleMap.fitBounds(bikeMe.mapView.mapBounds);
      $.mobile.loading('hide');
    });

    var geolocationError = function (e) {
      $.mobile.loading('hide');
      if(e) {
        bikeMe.alert('There was an error obtaining your location. Message:' + e.message);
        bikeMe.mapView.clearLocation();
      }
    };
    google.maps.event.addListener(this.geoMarker, 'geolocation_error', geolocationError);
    setTimeout(geolocationError, 3000); // In case the geolocation timeout did not fire.
  },

  clearLocation: function() {
    if(this.geoMarker) {
      this.geoMarker.setMap();
    }
  },

  pauseMap: function() {
    this.clearLocation();
  },

  renderRoute: function (route) {
    $.mobile.loading('show', {
      text        : 'Loading route...',
      textVisible : true
    });
    this.closeInfoWindow();
    this.clearOverlay();
    this.createNewMap();
    var start = route.source.getLatLng();
    var end   = route.target.getLatLng();

    var waypts = [];
    if (!_.isUndefined(route.sourceStation) && !_.isUndefined(route.targetStation)) {
      var startStation = route.sourceStation.location.getLatLng();
      var endStation = route.targetStation.location.getLatLng();

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

    this.googleDirectionsService.route(request, this.updateDirections);
  },

  updateDirections: function (result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      this.directionsRenderer = new google.maps.DirectionsRenderer(this.rendererOptions);
      this.directionsRenderer.setMap(this.googleMap);
      this.directionsRenderer.setDirections(result);
      // In case this is a walking route (no stations to render)
      if (result.routes[0].legs.length == 1) {
        bikeMe.alert('Take a walk!!!', "Yehh...")
        this.renderMarkers(this.routes[this.currentRouteIndex],
                            result.routes[0].legs[0].start_location,
                            result.routes[0].legs[0].end_location,
                            null, null);
      }
      else {
        this.renderMarkers(this.routes[this.currentRouteIndex],
                            result.routes[0].legs[0].start_location,
                            result.routes[0].legs[2].end_location,
                            result.routes[0].legs[0].end_location,
                            result.routes[0].legs[2].start_location);
      }
      this.updateRouteInfo(this.routes[this.currentRouteIndex]);
      this.showRouteButtons();
    }
    return false;
  },

  renderMarkers: function (route, start, end, startStation, endStation) {

    this.originMarker       = this.createMarker(route.source.address, this.originIcon,      this.originShadow,      0, start);
    this.destinationMarker  = this.createMarker(route.target.address, this.destinationIcon, this.destinationShadow, 0, end  );

    if (!_.isUndefined(route.sourceStation) && !_.isUndefined(route.targetStation)) {
      this.originStationMarker      = this.createMarker(
                                                          this.stationInfoHtml(route.sourceStation),
                                                          this.getStationIcon(route.sourceStation.availableBikes),
                                                          this.stationShadow,
                                                          1,
                                                          startStation
                                                        );
      this.destinationStationMarker = this.createMarker(
                                                          this.stationInfoHtml(route.targetStation),
                                                          this.getStationIcon(route.targetStation.availableDocks),
                                                          this.stationShadow,
                                                          1,
                                                          endStation
                                                        );
    }
    return false;
  },

  clearOverlay: function () {
    // Clrear the directionsRenderer by setting the map to null, and suppressing polyline
    this.directionsRenderer.setOptions({
                                          suppressPolylines: true,
                                          polylineOptions: { visible: false },
                                          map: null
                                        });
    // Clear markers by removing click listener, ans setting map to null
    google.maps.event.clearListeners(this.originMarker, 'click');
    this.originMarker.setMap(null);
    google.maps.event.clearListeners(this.destinationMarker, 'click');
    this.destinationMarker.setMap(null);
    google.maps.event.clearListeners(this.originStationMarker, 'click');
    this.originStationMarker.setMap(null);
    google.maps.event.clearListeners(this.destinationStationMarker, 'click');
    this.destinationStationMarker.setMap(null);

    for (var i=0;i<this.originStationsMarkers.length;i++) {
      google.maps.event.clearListeners(this.originStationsMarkers[i], 'click');
      this.originStationsMarkers[i].setMap(null);
    }

    for (var i=0;i<this.destinationStationsMarkers.length;i++) {
      google.maps.event.clearListeners(this.destinationStationsMarkers[i], 'click');
      this.destinationStationsMarkers[i].setMap(null);
    }

    for (var i=0;i<this.nearbyStationsMarkers.length;i++) {
      google.maps.event.clearListeners(this.nearbyStationsMarkers[i], 'click');
      this.nearbyStationsMarkers[i].setMap(null);
    }
  },

  createMarker: function (title, icon, shadow, zIndex, position) {
    var marker = new google.maps.Marker({map: this.googleMap, title: title, icon: icon, shadow: shadow, zIndex: zIndex, position: position});
    var onMarkerClicked = _.bind(this.onMarkerClicked, marker);
    google.maps.event.addListener(marker, 'click', onMarkerClicked);
    return marker;
  },

  onMarkerClicked: function (event) {
    // 'this. will be binded to the marker object
    bikeMe.mapView.infoWindow.setContent('<div class="infoWondowText">'+this.getTitle()+'</div>');
    bikeMe.mapView.infoWindow.open(bikeMe.mapView.googleMap,this);
    $('.infoWindowBackground').click(bikeMe.mapView.closeInfoWindow);
    return false;
  },

  stationInfoHtml: function (station){
    return "<div class='infowWindowHeader'>"+station.location.address+"</div>\
    <br>\
    <div>Available bikes: "+station.availableBikes+"</div>\
    <br>\
    <div>Available docks: "+station.availableDocks+"</div>"
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

  routeInfoPopup: function () {
    $('#directionPopup div#scroller')[0].innerHTML = ''
    route = this.routes[this.currentRouteIndex];
    // Set directions waypoints to be the route addresses
    this.directionsRenderer.directions.routes[0].legs[0].start_address = route.source.address;
    if (this.directionsRenderer.directions.routes[0].legs.length == 3) {
      this.directionsRenderer.directions.routes[0].legs[0].end_address = "Take a bike from: " + route.sourceStation.location.address + " [Available bikes: " + route.sourceStation.availableBikes + "]";
      this.directionsRenderer.directions.routes[0].legs[1].end_address = "Park bike at: " + route.targetStation.location.address + " [Available docks: " + route.targetStation.availableDocks + "]";
      this.directionsRenderer.directions.routes[0].legs[2].end_address = route.target.address;
      // Set the 2nd leg (cycling) with the route's cycling timeduration
      this.directionsRenderer.directions.routes[0].legs[1].duration.text = route.getCyclingTime().toFixed().toString() + " min";
    } else {
      this.directionsRenderer.directions.routes[0].legs[0].end_address = route.target.address;
    }

    this.directionsRenderer.setPanel($('#directionPopup div#scroller')[0]);
    $( "#directionPopup" ).popup( "open" );

    //refresh the popup scroll asynch, to reflect the data rednered on the directions panel
    setTimeout(function () {
    		bikeMe.mapView.popupScroll.refresh();
    		bikeMe.mapView.popupScroll.scrollTo(0, 0, 0);
    	}, 0);
    return false;
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
  },

  setMapStationControls: function () {
    this.clearOverlay();
    this.$routeInfo.hide();
    this.$previousRouteButton.hide();
    this.$nextRouteButton.hide();
    this.$routesIndexInfo.hide();
    this.$routesInfoButton.hide();
  },

  setMapRoutesControls: function () {
    this.clearOverlay();
    this.$routeInfo.show();
    this.$previousRouteButton.show();
    this.$nextRouteButton.show();
    this.$routesIndexInfo.show();
    this.$routesInfoButton.show();
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

  rendererOptions: {
    suppressMarkers     : true,
    suppressInfoWindows : true
  },

  stationIcons: {
    avaliableStation: new google.maps.MarkerImage(
      "images/path_bike_spot_icon_green.png",
      new google.maps.Size(25, 39),
      new google.maps.Point(0,0),
      new google.maps.Point(13, 38)),
    partiallyAvailableStation: new google.maps.MarkerImage(
      "images/path_bike_spot_icon_orange.png",
      new google.maps.Size(25, 39),
      new google.maps.Point(0,0),
      new google.maps.Point(13, 38)),
    noneAvailableStation: new google.maps.MarkerImage(
      "images/path_bike_spot_icon_red.png",
      new google.maps.Size(25, 39),
      new google.maps.Point(0,0),
      new google.maps.Point(13, 38))
    },

    stationShadow: new google.maps.MarkerImage(
      "images/shadow-path_bike_spot_icon.png",
      new google.maps.Size(45.0, 39.0),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 38)),

    originIcon: new google.maps.MarkerImage(
      "images/path_green_arrow_icon.png",
      new google.maps.Size(32, 42),
      new google.maps.Point(0,0),
      new google.maps.Point(16, 32)),

    originShadow: new google.maps.MarkerImage(
      "images/shadow-path_green_arrow_icon.png",
      new google.maps.Size(45.0, 39.0),
      new google.maps.Point(0, 0),
      new google.maps.Point(16, 32)),

    destinationIcon: new google.maps.MarkerImage(
      "images/path_flag_icon.png",
      new google.maps.Size(32, 42),
      new google.maps.Point(0,0),
      new google.maps.Point(4, 43)),

    destinationShadow: new google.maps.MarkerImage(
      "images/shadow-path_flag_icon.png",
      new google.maps.Size(45.0, 39.0),
      new google.maps.Point(0, 0),
      new google.maps.Point(4, 43)),

    infoWindowOptions: {
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
    }
};
