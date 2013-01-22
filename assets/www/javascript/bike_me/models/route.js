bikeMe.namespace('Models');

bikeMe.Models.Route = function (routeData) {
  this.initialize(routeData);
};

bikeMe.Models.Route.prototype = {
  walkingSpeed: 3600.0/5000.0,
  cyclingSpeed: (3600.0/17000.0),

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
    this.routeDurations = {
      cyclingDuration              : routeData.cyclingDuration,
      walkingDurationFromOrigin    : routeData.walkingDuration1,
      walkingDurationToDestination : routeData.walkingDuration2
    };
  },

  getRouteTime: function () {
    if (_.isUndefined(this.routeTime)) {

      if (_.isUndefined(this.routeDurations.cyclingDuration)) {
        this.routeDurations.cyclingDuration = this.calculateTime(
          this.routeDistances.cyclingDistance, 'cycling'
        );
      }

      if (_.isUndefined(this.routeDurations.walkingDurationFromOrigin)) {
        this.routeDurations.walkingDurationFromOrigin = this.calculateTime(
          this.routeDistances.walkingDistanceFromOrigin
        );
      }

      if (_.isUndefined(this.routeDurations.walkingDurationToDestination)) {
        this.routeDurations.walkingDurationToDestination = this.calculateTime(
          this.routeDistances.walkingDistanceToDestination
        );
      }

      this.routeTime = (this.routeDurations.walkingDurationFromOrigin + this.routeDurations.cyclingDuration + this.routeDurations.walkingDurationToDestination)/60.0;
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
