bikeMe.namespace('Models');

bikeMe.Models.Route = function (routeData) {
  this.initialize(routeData);
};

bikeMe.Models.Route.prototype = {
  walkingSpeed: 60.0/5000.0,
  cyclingSpeed: (60.0/5000.0)/3,

  initialize: function (routeData) {
    this.source = routeData.source;
    this.target = routeData.target;

    this.sourceStation = routeData.sourceStation;
    this.targetStation = routeData.targetStation;

    this.routeDistances = {
      cyclingDistance              : routeData.cyclingDistance,
      walkingDistanceFromOrigin    : routeData.walkingDistance1,
      walkingDistanceToDestination : routeData.walkingDistance2
    };
  },

  getRouteTime: function () {
    if (_.isUndefined(this.routeTime)) {

      var cyclingTime = this.calculateTime(
        this.routeDistances.cyclingDistance, 'cycling'
      );

      var walkingTimeFromOrigin = this.calculateTime(
        this.routeDistances.walkingDistanceFromOrigin
      );

      var walkingTimeToDestination = this.calculateTime(
        this.routeDistances.walkingDistanceToDestination
      );

      this.routeTime = walkingTimeFromOrigin + cyclingTime + walkingTimeToDestination;
    }

    return this.routeTime;
  },

  calculateTime: function (distanceMeters, transportMode) {
    var mode = transportMode || 'walking';

    if (mode === 'walking') {
      return (distanceMeters * this.walkingSpeed);
    } else {
      return (distanceMeters * this.cyclingSpeed);
    }
  },

  totalWalkinDistance: function() {
    return ((this.routeDistances.walkingDistanceFromOrigin + this.routeDistances.walkingDistanceToDestination)/1000).toFixed(1);
  },

  totalCyclingDistance: function() {
    return ((this.routeDistances.cyclingDistance)/1000).toFixed(1);
  }
};
