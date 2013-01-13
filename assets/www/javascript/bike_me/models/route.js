bikeMe.namespace('Models');

bikeMe.Models.Route = function (routeData) {

    this.initialize(routeData);
};


bikeMe.Models.Route.prototype = {
  initialize: function (routeData) {
    this.source = routeData.source;
    this.target = routeData.target;

		this.sourceStation = routeData.sourceStation;
		this.targetStation = routeData.targetStation;

		this.routeDistances = {
			'walkingDistanceFromOrigin' : routeData.walkingDistance1,
			'cyclingDistance'  : routeData.cyclingDistance,
			'walkingDistanceToDestination' : routeData.walkingDistance2
		};
  },


	getRouteTime: function () {
		if (_.isUndefined(this.routeTime)) {
			this.routeTime = this.calculateTime(this.routeDistances['walkingDistanceFromOrigin']) + 
												this.calculateTime(this.routeDistances['cyclingDistance'], 'cycling') +
												this.calculateTime(this.routeDistances['walkingDistanceToDestination']);
			}

		return this.routeTime;
	},

  calculateTime: function (distanceMeters, transportMode) {
		if (_.isUndefined(transportMode) || transportMode === 'walking') {
			return (distanceMeters * (60.0/5000.0));
		} else {
			return (distanceMeters * (60.0/5000.0) / 3);
		}
	}
};
