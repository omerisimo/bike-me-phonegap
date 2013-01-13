bikeMe.namespace('Models');

bikeMe.Models.RoutesFetcher = function (source, target) {

    this.initialize(source, target);
};

bikeMe.Models.RoutesFetcher.prototype = {
  initialize: function (source, target) {
  	this.source = source;
  	this.target = target;

		radio('nearestStationsFetched').subscribe([this.onNearestStationsFetched, this]);
		bikeMe.Models.Station.nearestStations(source, 4, 'source');
		bikeMe.Models.Station.nearestStations(target, 4, 'target');
  },

  calculateBestRoutes: function () {
		var sourceStationsLocations = [];
    var targetStationsLocations = [];

    _.each(this.sourceStations, function(sourceStation) {
      sourceStationsLocations.push(sourceStation.location)
    });


    _.each(this.targetStations, function(targetStation) {
      targetStationsLocations.push(targetStation.location)
    });

    var originToStationsDistances = this.calculateDistance([this.source], sourceStationsLocations);
    var stationsToStationsDistances = this.calculateDistance(sourceStationsLocations, targetStationsLocations);
    var stationsToTargetDistances = this.calculateDistance(targetStationsLocations, [this.target]);

    var potentialRoutes = this.createRoutesArray(originToStationsDistances, stationsToStationsDistances, stationsToTargetDistances);

		return (_.sortBy(potentialRoutes, function(route) {
			return route.getRouteTime();
		}));
	},

	calculateDistance: function (sourceLocations, targetLocations) {
    var sourcesParam = "";
    var targetsParam = "";

    _.each(sourceLocations, function(location) {
      sourcesParam += location.latitude + "," + location.longitude +"|"
    });
    sourcesParam = sourcesParam.substring(0, sourcesParam.length - 1);

    _.each(targetLocations, function(location) {
      targetsParam += location.latitude + "," + location.longitude +"|"
    });
    targetsParam = targetsParam.substring(0, targetsParam.length - 1);

  	var strParams = "?origins=" + sourcesParam  +
  				"&destinations=" + targetsParam +
  				"&mode=walking&sensor=false";
  	var url = "http://maps.googleapis.com/maps/api/distancematrix/json" + strParams;

  	var distanceMeters = [];

  	$.ajax({
            url: url,
            type: "GET",
            dataType: "json",
            async: false,
            success: function (data) {
            	var jsonResult = data;
            	_.each(jsonResult["rows"], function(sourceData){
            	    var distances = [];
          	      _.each(sourceData["elements"], function(targetData){
            	      distances.push(targetData["distance"]["value"]);
          	      });
          	      distanceMeters.push(distances)
            	});
            },
            error: function () {
            	alert('error');
            }
        });

  	return distanceMeters;
  },

  createRoutesArray: function (originToStationsDistances, stationsToStationsDistances, stationsToTargetDistances){
    var routes = [];
    
    for (var i=0;i<this.sourceStations.length;i++){
      for (var j=0;j<this.targetStations.length;j++){
        routes.push(new bikeMe.Models.Route(
          {
            source            : this.source,
            sourceStation     : this.sourceStations[i],
            targetStation     : this.targetStations[j],
            target            : this.target,
            walkingDistance1  : originToStationsDistances[0][i],
            cyclingDistance   : stationsToStationsDistances[i][j],
            walkingDistance2  : stationsToTargetDistances[j][0]
          }
        ));
      }
    }
    
    return routes;
  },

	onNearestStationsFetched: function(nearestStations, type) {
		if (type === 'source') {
			this.sourceStations = nearestStations;
		} else {
			this.targetStations = nearestStations;
		}

		if (_.isUndefined(this.sourceStations) || _.isUndefined(this.targetStations)) {
			return;
		}

		this.routes = this.calculateBestRoutes();
	}

};