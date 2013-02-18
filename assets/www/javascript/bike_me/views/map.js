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
    this.popupScroll = new iScroll('directionWrapper');

    this.currentRouteIndex = 0;
    this.routes = [];

    radio('searchSuccess').subscribe([this.onSearchSuccess, this]);
    radio('searchStationsSuccess').subscribe([this.onSearchStationsSuccess, this]);
    var nextRoute = _.bind(this.nextRoute, this);
    this.$nextRouteButton.on('click', nextRoute);
    var previousRoute = _.bind(this.previousRoute, this);
    this.$previousRouteButton.on('click', previousRoute);
    var routeInfoPopup = _.bind(this.routeInfoPopup, this);
    this.$routesInfoButton.on('click', routeInfoPopup);

    this.updateDirections = _.bind(this.updateDirections, this);
  },

  initializeGoogleMap: function () {
    if (_.isUndefined(this.googleMap)){
      this.googleMap = new google.maps.Map(this.$googleMap[0], this.options);

      this.googleDirectionsService = new google.maps.DirectionsService();

      this.directionsRenderer = new google.maps.DirectionsRenderer(this.rendererOptions);
      this.directionsRenderer.setMap(this.googleMap);

      // Create the info window
      this.infoWindow = new InfoBubble(this.infoWindowOptions);
      this.closeInfoWindow = _.bind(this.closeInfoWindow, this);
      google.maps.event.addListener(this.googleMap, 'click', this.closeInfoWindow);

      // Create markers for the dffierent location
      this.originMarker = new google.maps.Marker({map: this.googleMap, title: 'Origin', icon: this.originIcon, shadow: this.originShadow, zIndex: 0});
      this.destinationMarker = new google.maps.Marker({map: this.googleMap, title: 'Destiantion', icon: this.destinationIcon, shadow: this.destinationShadow, zIndex: 0});
      this.originStationMarker = new google.maps.Marker({map: this.googleMap, title: 'Origin Station', icon: this.getStationIcon(0), shadow: this.stationShadow, zIndex: 1});
      this.destinationStationMarker = new google.maps.Marker({map: this.googleMap, title: 'Destiantion Station', icon: this.getStationIcon(0), shadow: this.stationShadow, zIndex: 1});

      // Create marker clicked events, that will display the info window with relevant text
      var onMarkerClicked = function (event) {
        bikeMe.mapView.infoWindow.setContent('<div class="infoWondowText">'+this.getTitle()+'</div>');
        bikeMe.mapView.infoWindow.open(bikeMe.mapView.googleMap,this);
        $('.infoWindowBackground').click(bikeMe.mapView.closeInfoWindow);
        return false;
      }
      onOriginMarkerClicked = _.bind(onMarkerClicked, this.originMarker);
      onDestinationMarkerClicked = _.bind(onMarkerClicked, this.destinationMarker);
      onOriginStationMarkerClicked = _.bind(onMarkerClicked, this.originStationMarker);
      onDestinationStationMarkerClicked = _.bind(onMarkerClicked, this.destinationStationMarker);

      google.maps.event.addListener(this.originMarker, 'click', onOriginMarkerClicked);
      google.maps.event.addListener(this.destinationMarker, 'click', onDestinationMarkerClicked);
      google.maps.event.addListener(this.originStationMarker, 'click', onOriginStationMarkerClicked);
      google.maps.event.addListener(this.destinationStationMarker, 'click', onDestinationStationMarkerClicked);

      this.originStationsMarkers = [];
      for (var i=0;i<4;i++) {
        this.originStationsMarkers[i] = new google.maps.Marker({map: this.googleMap, title: 'Origin Station', icon: this.getStationIcon(0), shadow: this.stationShadow, zIndex: 1});
        onOriginStationMarkerClicked = _.bind(onMarkerClicked, this.originStationsMarkers[i]);
        google.maps.event.addListener(this.originStationsMarkers[i], 'click', onOriginStationMarkerClicked);
      }

      this.destinationStationsMarkers = [];
      for (var i=0;i<4;i++) {
        this.destinationStationsMarkers[i] = new google.maps.Marker({map: this.googleMap, title: 'Destiantion Station', icon: this.getStationIcon(0), shadow: this.stationShadow, zIndex: 1});
        onDestinationStationMarkerClicked = _.bind(onMarkerClicked, this.destinationStationsMarkers[i]);
        google.maps.event.addListener(this.destinationStationsMarkers[i], 'click', onDestinationStationMarkerClicked);
      }
    }
  },

  onSearchSuccess: function (routes) {
    // Chage to the map page
    $.mobile.changePage(this.$el);
    //triger the map resize event to allow the map to be displayed in full mode
    google.maps.event.trigger(this.googleMap, 'resize');

    this.setMapRoutesControls()
    this.currentRouteIndex = 0;
    this.routes = routes;
    // render the first route
    this.renderRoute(routes[0]);
    return false;
  },

  onSearchStationsSuccess: function (origin, destination, originStations, destinationStations) {
    this.closeInfoWindow();
    // Chage to the map page
    $.mobile.changePage(this.$el);
    //triger the map resize event to allow the map to be displayed in full mode
    google.maps.event.trigger(this.googleMap, 'resize');

    this.setMapStationControls();
    var mapBounds = new google.maps.LatLngBounds();

    this.originMarker.setPosition(origin.getLatLng());
    this.originMarker.setTitle(origin.address);
    mapBounds.extend(origin.getLatLng());

    this.destinationMarker.setPosition(destination.getLatLng());
    this.destinationMarker.setTitle(destination.address);
    mapBounds.extend(destination.getLatLng());

    for (var i=0;i<this.originStationsMarkers.length;i++) {
      this.originStationsMarkers[i].setPosition(originStations[i].location.getLatLng());
      this.originStationsMarkers[i].setIcon(this.getStationIcon(originStations[i].availableBikes));
      this.originStationsMarkers[i].setTitle(this.stationInfoHtml(originStations[i]));
      mapBounds.extend(originStations[i].location.getLatLng());
    }

    for (var i=0;i<this.destinationStationsMarkers.length;i++) {
      this.destinationStationsMarkers[i].setPosition(destinationStations[i].location.getLatLng());
      this.destinationStationsMarkers[i].setIcon(this.getStationIcon(destinationStations[i].availableDocks));
      this.destinationStationsMarkers[i].setTitle(this.stationInfoHtml(destinationStations[i]));
      mapBounds.extend(destinationStations[i].location.getLatLng());
    }

    this.googleMap.fitBounds(mapBounds);
    return false;
  },

  renderRoute: function (route) {
    this.closeInfoWindow();
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

    this.googleDirectionsService.route(request, this.updateDirections);
  },

  updateDirections: function (result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
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

  renderMarkers: function (route, start, end, startStation, endStation){
    this.originMarker.setPosition(start);
    this.originMarker.setTitle(route.source.address);

    this.destinationMarker.setPosition(end);
    this.destinationMarker.setTitle(route.target.address);

    if (!_.isUndefined(route.sourceStation) && !_.isUndefined(route.targetStation)) {
      this.originStationMarker.setPosition(startStation);
      this.originStationMarker.setIcon(this.getStationIcon(route.sourceStation.availableBikes));
      this.originStationMarker.setTitle(this.stationInfoHtml(route.sourceStation));
      this.originStationMarker.setVisible(true);

      this.destinationStationMarker.setPosition(endStation);
      this.destinationStationMarker.setIcon(this.getStationIcon(route.targetStation.availableDocks));
      this.destinationStationMarker.setTitle(this.stationInfoHtml(route.targetStation));
      this.destinationStationMarker.setVisible(true);
    }
    else {
      this.originStationMarker.setVisible(false);
      this.destinationStationMarker.setVisible(false);
    }

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
    this.directionsRenderer.setMap(null);
    this.originStationMarker.setMap(null);
    this.destinationStationMarker.setMap(null);
    this.$routeInfo.hide();
    this.$previousRouteButton.hide();
    this.$nextRouteButton.hide();
    this.$routesIndexInfo.hide();
    this.$routesInfoButton.hide();

    for (var i=0;i<this.originStationsMarkers.length;i++) {
      this.originStationsMarkers[i].setMap(this.googleMap);
    }

    for (var i=0;i<this.destinationStationsMarkers.length;i++) {
      this.destinationStationsMarkers[i].setMap(this.googleMap);
    }
  },

  setMapRoutesControls: function () {
    this.directionsRenderer.setMap(this.googleMap);
    this.originStationMarker.setMap(this.googleMap);
    this.destinationStationMarker.setMap(this.googleMap);
    this.$routeInfo.show();
    this.$previousRouteButton.show();
    this.$nextRouteButton.show();
    this.$routesIndexInfo.show();
    this.$routesInfoButton.show();

    for (var i=0;i<this.originStationsMarkers.length;i++) {
      this.originStationsMarkers[i].setMap(null);
    }

    for (var i=0;i<this.destinationStationsMarkers.length;i++) {
      this.destinationStationsMarkers[i].setMap(null);
    }
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
