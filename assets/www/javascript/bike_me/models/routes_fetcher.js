bikeMe.namespace('Models');

bikeMe.Models.RoutesFetcher = function (source, target) {

    this.initialize(source, target);
};

bikeMe.Models.RoutesFetcher.prototype = {
  initialize: function (source, target) {
  	this.source = source;
  	this.target = target;

		radio('nearestStationsFetched').subscribe([this.onNearestStationsFetched, this]);
		bikeMe.Models.Station.nearestStations(source, 5, 'source');
		bikeMe.Models.Station.nearestStations(target, 3, 'target');	
  },

  calculateBestRoutes: function () {
		var potentialRoutes = [];
		var sourceStations = this.sourceStations;
		var targetStations = this.targetStations;
		var source = this.source;
		var target = this.target;

		_.each(sourceStations, function(sourceStation) {
			_.each(targetStations, function(targetStation) {
				potentialRoutes.push(new bikeMe.Models.Route(
					{
						source 				: source,
						sourceStation : sourceStation,
						targetStation : targetStation,
						target 				: target
					}
				));
			});
		});

		return (_.sortBy(potentialRoutes, function(route) {
			return route.getRouteTime();
		}));
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