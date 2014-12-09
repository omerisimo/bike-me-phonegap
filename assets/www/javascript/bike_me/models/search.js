bikeMe.namespace('Models');

bikeMe.Models.Search = function (origin, destination) {
  this.initialize(origin, destination);
};

bikeMe.Models.Search.prototype = {
  initialize: function (origin, destination) {
    this.originString        = origin || bikeMe.Models.Location.CURRENT_LOCATION;
    this.destinationString   = destination;
    this.originLocation      = null;
    this.destinationLocation = null;

    radio('locationFound').subscribe([this.onLocationFound, this]);
    radio('routesFound').subscribe([this.onRoutesFound, this]);
    radio('stationsFound').subscribe([this.onStationsFound, this]);
  },

  find: function(searchType) {
    // Cache interest points
    bikeMe.Models.Search.cacheRecentTrips(this.originString, this.destinationString)

    this.searchType = searchType;
    this.originLocation = new bikeMe.Models.Location({
      address: this.originString
    });

    this.originLocation.locate();

    this.destinationLocation = new bikeMe.Models.Location({
      address: this.destinationString
    });

    this.destinationLocation.locate();
  },

  nearby: function() {
    this.searchType = 'nearby';
    this.originLocation = new bikeMe.Models.Location({
      address: bikeMe.Models.Location.CURRENT_LOCATION
    });

    this.originLocation.locate();
  },

  searchNearbyStations: function() {
    radio('nearestStationsFound').subscribe([this.onNearbyStationsFound, this]);
    bikeMe.Models.Station.findNearestStations({
      location   : this.originLocation,
      maxResults : bikeMe.MAX_RESULTS*2,
      type       : 'source'
    });
  },

  onNearbyStationsFound: function(nearbyStations, type) {
    radio('nearestStationsFound').unsubscribe(this.onNearbyStationsFound);
    radio('nearbyStationsSuccess').broadcast(this.originLocation, nearbyStations);
  },

  onLocationFound: function () {
    if(this.searchType == 'nearby') {
      this.searchNearbyStations();
    }
    else if (this.originLocation.found && this.destinationLocation.found) {

      this.routeFinder = new bikeMe.Models.RoutesFinder(
        this.originLocation,
        this.destinationLocation
      );

      this.routeFinder.find(this.searchType );
    }
  },

  onRoutesFound: function (routes) {
    this.routes = routes;

    if (routes.length === 0) {
      radio('searchError').broadcast();
    } else {
      radio('searchSuccess').broadcast(routes);
    }
  },

  onStationsFound: function () {
    if (this.routeFinder.sourceStations.length === 0 || this.routeFinder.targetStations.length == 0) {
      radio('searchError').broadcast();
    } else {
      radio('searchStationsSuccess').broadcast(this.routeFinder.originLocation, this.routeFinder.destinationLocation, this.routeFinder.sourceStations, this.routeFinder.targetStations);
    }
  },

  unsubscribe: function () {
    radio('locationFound').unsubscribe(this.onLocationFound);
    radio('routesFound').unsubscribe(this.onRoutesFound);
    radio('stationsFound').unsubscribe(this.onStationsFound);

    if (this.originLocation) {
      this.originLocation.unsubscribe();
    }
    if (this.destinationLocation) {
      this.destinationLocation.unsubscribe();
    }
    if (!_.isUndefined(this.routeFinder)) {
      this.routeFinder.unsubscribe();
    }
  }
};

bikeMe.Models.Search.recentTripsArray = null;

bikeMe.Models.Search.recentTrips = function() {
  if (bikeMe.Models.Search.recentTripsArray == null){
    bikeMe.Models.Search.recentTripsArray = JSON.parse(window.localStorage.getItem("recentTripsArray")) || [];
  }
  return bikeMe.Models.Search.recentTripsArray;
};

bikeMe.Models.Search.cacheRecentTrips = function(originString, destinationString) {
  var max_size = 4;
  var updatedRecentTrips = [];
  var currentTrip = {from: originString, to:destinationString};
  updatedRecentTrips.push(currentTrip);
  i = 0;
  while (updatedRecentTrips.length < max_size && i < bikeMe.Models.Search.recentTrips().length){
    if (!_.isEqual(currentTrip, bikeMe.Models.Search.recentTrips()[i]) && !_.isEqual({from: destinationString, to:originString}, bikeMe.Models.Search.recentTrips()[i])){
      updatedRecentTrips.push(bikeMe.Models.Search.recentTrips()[i]);
    }
    i++;
  }

  bikeMe.Models.Search.recentTripsArray = updatedRecentTrips;
  window.localStorage.setItem("recentTripsArray", JSON.stringify(updatedRecentTrips));
};