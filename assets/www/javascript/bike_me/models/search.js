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
  },

  find: function() {
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

      this.routeFinder.find();
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

  unsubscribe: function () {
    radio('locationFound').unsubscribe(this.onLocationFound);
    radio('routesFound').unsubscribe(this.onRoutesFound);

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
