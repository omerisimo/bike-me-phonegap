bikeMe.namespace('Models');

bikeMe.Models.Route = function (routeData) {

    this.initialize(routeData);
};

bikeMe.Models.Route.prototyperouteData = {
  initialize: function () {
    this.source = routeData.source;
		this.sourceStation = routeData.sourceStation;
		this.targetStation = routeData.targetStation;
		this.target = routeData.target;
		this.distanceMap = {};
  },

  calculateTime: function (distanceMeters, transportMode) {
		if (_.Undefined(transportMode) || transportMode === 'walking') {
			return (distanceMeters * (60.0/5000.0));
		} else {
			return (distanceMeters * (60.0/5000.0) / 3);
		}
	},

	routeTime: function () {
		if (_.Undefined(this.routeTime)) {
			this.routeTime = this.calculateTime();
		}
		return this.routeTime;
	},

	calculateRouteTime: function () {
		var distances = this.routeDistance();

		this.routeTime = this.calculateTime(distance['walkingDistance1']) + 
											this.calculateTime(distance['cyclingDistance'], 'cycling') +
											this.calculateTime(distance['walkingDistance2']);
		return this.routeTime;
	},

	calculateRouteDistance: function () {
		var distances = {
			'walkingDistance1' : this.getDistance(this.source, this.sourceStation.location),
			'cyclingDistance'  : this.getDistance(this.sourceStation.location, this.targetStation.location),
			'walkingDistance2' : this.getDistance(this.targetStation.location, this.target)
		};
		return distances;
	},

	routeDistance: function () {
		if (_.Undefined(this.routeDistance)){
			this.routeDistance = this.calculateRouteDistance();
		}
		return this.routeDistance;
	},

	getDistance : function (sourceLocation, targetLocation) {
		if (_.Undefind(this.distanceMap[[sourceLocation, targetLocation]])) {
			this.distanceMap[[sourceLocation, targetLocation]] = calculateDistance(sourceLocation, targetLocation);
		}
		return this.distanceMap[[sourceLocation, targetLocation]];
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
	          contentType: "text/xml; charset=\"utf-8\"",
	          success: function (data) {
	          	var jsonResult = JSON.parse(data);
							distanceMeters = jsonResult["rows"][0]["elements"][0]["distance"]["value"];
	          }, 
	          error: this.OnError
	      });

		return distanceMeters;
  },

  OnError: function () {
  	alert('error');
  }
};

	
		
	

	// def self.calculate_best_routes(source, target)
	// 	source_stations = Station.nearest_stations(source, 5)
	// 	target_stations = Station.nearest_stations(target, 3)
		
	// 	potential_routes = []
		

	// 	source_stations.each do | source_station |
	// 		target_stations.each do | target_station |
	// 			potential_routes << Route.new(source, source_station, target_station, target)
	// 		end
	// 	end

	// 	potential_routes.sort!{|x,y| x.route_time <=> y.route_time}
	// end
