bikeMe.namespace('Models');

bikeMe.Models.RoutesFinder = function (origin, destination) {
  this.initialize(origin, destination);
};

bikeMe.Models.RoutesFinder.prototype = {
  initialize: function (origin, destination) {
    this.originLocation      = origin;
    this.destinationLocation = destination;

    radio('nearestStationsFound').subscribe([this.onNearestStationsFound, this]);
    radio('distanceMetersSuccess').subscribe([this.onDistanceMetersSuccess, this]);
  },

  find: function () {
    this.findNearestStations();
  },

  findNearestStations: function () {
    bikeMe.Models.Station.findNearestStations({
      location   : this.originLocation,
      maxResults : 4,
      type       : 'source'
    });

    bikeMe.Models.Station.findNearestStations({
      location   : this.destinationLocation,
      maxResults : 4,
      type       : 'target'
    });
  },

  onNearestStationsFound: function(nearestStations, type) {
    if (type === 'source') {
      this.sourceStations = nearestStations;
    } else {
      this.targetStations = nearestStations;
    }

    if (this.sourceStations && this.targetStations) {
      this.calculateBestRoutes();
    }
  },

  calculateBestRoutes: function () {
    var sourceStationsLocations = [];
    var targetStationsLocations = [];

   _.each(this.sourceStations, function(sourceStation) {
      sourceStationsLocations.push(sourceStation.location);
    });


    _.each(this.targetStations, function(targetStation) {
      targetStationsLocations.push(targetStation.location);
    });

    this.calculateDistance([this.originLocation], sourceStationsLocations, 'originToStation');
    this.calculateDistance(sourceStationsLocations, targetStationsLocations, 'stationToStation');
    this.calculateDistance(targetStationsLocations, [this.destinationLocation], 'stationToDestination');
  },

  calculateDistance: function (sourceLocations, targetLocations, type) {
    function onSuccess (data) {
      var distanceMeters = [];
      var jsonResult = data;
      _.each(jsonResult.rows, function(sourceData){
        var distances = [];
        _.each(sourceData.elements, function(targetData){
          distances.push(targetData.distance.value);
        });
        distanceMeters.push(distances);
      });
      radio('distanceMetersSuccess').broadcast(distanceMeters, type);
    }

    function onError () {
      alert('Error');
    }

    var sourcesParam = '';
    var targetsParam = '';

    _.each(sourceLocations, function(location) {
      sourcesParam += location.latitude + "," + location.longitude +"|";
    });

    sourcesParam = sourcesParam.substring(0, sourcesParam.length - 1);

    _.each(targetLocations, function(location) {
      targetsParam += location.latitude + "," + location.longitude +"|";
    });

    targetsParam = targetsParam.substring(0, targetsParam.length - 1);

    var url = 'http://maps.googleapis.com/maps/api/distancematrix/json';

    $.ajax({
      data: {
        destinations : targetsParam,
        mode         : 'walking',
        origins      : sourcesParam,
        sensor       : false
      },
      dataType : 'json',
      error    : onError,
      success  : onSuccess,
      type     : 'GET',
      url      : url
    });
  },

  onDistanceMetersSuccess: function(distanceMeters, type) {
    switch (type) {
      case 'originToStation':
        this.originToStation = distanceMeters;
        break;
      case 'stationToStation':
        this.stationToStation = distanceMeters;
        break;
      case 'stationToDestination':
        this.stationToTarget = distanceMeters;
        break;
      default:
        console.log('Something wrong happened');
    }

    if (this.originToStation && this.stationToStation && this.stationToTarget){
      radio('distanceMetersSuccess').unsubscribe(this.onDistanceMetersSuccess);

      var potentialRoutes = this.createRoutesArray(this.originToStation, this.stationToStation, this.stationToTarget);

      this.sortedRoutes = (_.sortBy(potentialRoutes, function(route) {
        return route.getRouteTime();
      }));

      radio('routesFound').broadcast(this.sortedRoutes);
    }

  },

  createRoutesArray: function (originToStationsDistances, stationsToStationsDistances, stationsToTargetDistances){
    var routes = [];

    for (var i=0;i<this.sourceStations.length;i++){
      for (var j=0;j<this.targetStations.length;j++){
        routes.push(new bikeMe.Models.Route(
          {
          source            : this.originLocation,
          sourceStation     : this.sourceStations[i],
          targetStation     : this.targetStations[j],
          target            : this.destinationLocation,
          walkingDistance1  : originToStationsDistances[0][i],
          cyclingDistance   : stationsToStationsDistances[i][j],
          walkingDistance2  : stationsToTargetDistances[j][0]
        }
        ));
      }
    }

    return routes;
  },

  unsubscribe: function () {
    radio('nearestStationsFound').unsubscribe(this.onNearestStationsFound);
    radio('distanceMetersSuccess').unsubscribe(this.onDistanceMetersSuccess);

    this.unsubscribeStations(this.sourceStations);
    this.unsubscribeStations(this.targetStations);
  },

  unsubscribeStations: function (stations) {
    _.each(stations, function (station) {
      station.unsubscribe();
    });
  }
};
