bikeMe.namespace('Models');

bikeMe.Models.Route = function (routeData) {

    this.initialize(routeData);
};



bikeMe.Models.Route.prototype = {
  initialize: function (routeData) {
    this.source = routeData.source;
		this.sourceStation = routeData.sourceStation;
		this.targetStation = routeData.targetStation;
		this.target = routeData.target;
		this.distanceMap = {};
  },


	getRouteTime: function () {
		if (_.isUndefined(this.routeTime)) {
			var distances = this.calculateRouteDistances();

			this.routeTime = this.calculateTime(distances['walkingDistance1']) + 
												this.calculateTime(distances['cyclingDistance'], 'cycling') +
												this.calculateTime(distances['walkingDistance2']);

			}

		return this.routeTime;
	},

  calculateTime: function (distanceMeters, transportMode) {
		if (_.isUndefined(transportMode) || transportMode === 'walking') {
			return (distanceMeters * (60.0/5000.0));
		} else {
			return (distanceMeters * (60.0/5000.0) / 3);
		}
	},

	calculateRouteDistances: function () {
		if (_.isUndefined(this.routeDistances)){
			this.routeDistances = {
				'walkingDistance1' : this.calculateDistance(this.source, this.sourceStation.location),
				'cyclingDistance'  : this.calculateDistance(this.sourceStation.location, this.targetStation.location),
				'walkingDistance2' : this.calculateDistance(this.targetStation.location, this.target)
			};
		}
		return this.routeDistances;
	},

	calculateDistance: function (sourceLocation, targetLocation) {
		var strParams = "?origins=" + sourceLocation.latitude + "," + sourceLocation.longitude + 
					"&destinations=" + targetLocation.latitude + "," + targetLocation.longitude +
					"&mode=walking&sensor=false";
		var url = "http://maps.googleapis.com/maps/api/distancematrix/json" + strParams;

		var distanceMeters;

		$.ajax({
	          url: url, 
	          type: "GET",
	          dataType: "json", 
	          async: false, 
	          success: function (data) {
	          	var jsonResult = data;
							distanceMeters = jsonResult["rows"][0]["elements"][0]["distance"]["value"];
	          }, 
	          error: this.OnError
	      });

		return distanceMeters;
	},

	OnError: function () {
		alert('error');
	}

	// getDistance : function (sourceLocation, targetLocation) {
	// 	//maybe add caching...
	// 	return this.calculateDistance(sourceLocation, targetLocation);
	// },

};
