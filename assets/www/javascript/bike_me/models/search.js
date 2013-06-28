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
    window.localStorage.setItem("originString", this.originString);
    window.localStorage.setItem("destinationString", this.destinationString);

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

  onLocationFound: function () {
    if (this.originLocation.found && this.destinationLocation.found) {

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

    if (!_.isUndefined(this.originLocation)) {
      this.originLocation.unsubscribe();
    }
    if (!_.isUndefined(this.destinationLocation)) {
      this.destinationLocation.unsubscribe();
    }
    if (!_.isUndefined(this.routeFinder)) {
      this.routeFinder.unsubscribe();
    }
  }
};

bikeMe.Models.Search.loadLastSearch = function() {
  return {
    originString: window.localStorage.getItem("originString"),
    destinationString: window.localStorage.getItem("destinationString")
  }
}