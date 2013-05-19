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

  find: function (findType) {
    this.findType = findType;
    window.localStorage.setItem("findType", this.findType);
    this.findNearestStations();
  },

  load_from_cache: function() {
    var me = this;
    function parse_station(attributes) {
      return new bikeMe.Models.Station(attributes);
    }
    function parse_route(attributes) {
      attributes.source = me.originLocation;
      attributes.target = me.destinationLocation;
      attributes.sourceStation = parse_station(attributes.sourceStation);
      attributes.targetStation = parse_station(attributes.targetStation);
      var route = new bikeMe.Models.Route(attributes);
      route.getRouteTime(); // expected to be pre-calculated
      return route;
    }

    var sourceStations = JSON.parse(window.localStorage.getItem("sourceStations")),
        targetStations = JSON.parse(window.localStorage.getItem("targetStations")),
        sortedRoutes   = JSON.parse(window.localStorage.getItem("routes"));

    this.findType            = window.localStorage.getItem("findType");

    this.sourceStations      = _.map(sourceStations, parse_station);
    this.targetStations      = _.map(targetStations, parse_station);

    if (this.findType == 'stations') {
        radio('stationsFound').broadcast();
    } else {
      this.sortedRoutes = _.map(sortedRoutes, parse_route);
      radio('routesFound').broadcast(this.sortedRoutes);
    }
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
      window.localStorage.setItem("sourceStations", JSON.stringify(nearestStations));
    } else {
      this.targetStations = nearestStations;
      window.localStorage.setItem("targetStations", JSON.stringify(nearestStations));
    }

    if (this.sourceStations && this.targetStations) {
      if (this.findType == 'stations') {
        radio('stationsFound').broadcast();
      } else {
        this.calculateBestRoutes();
      }
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

    // add the destination to the sourceStationsLocations array, so it could calculate a walking route
    sourceStationsLocations.push(this.destinationLocation);
    this.calculateDistance([this.originLocation], sourceStationsLocations, 'originToStation');
    this.calculateDistance(sourceStationsLocations, targetStationsLocations, 'stationToStation');
    this.calculateDistance(targetStationsLocations, [this.destinationLocation], 'stationToDestination');
  },

  calculateDistance: function (sourceLocations, targetLocations, type) {
    function onSuccess (data) {
      var distanceMetersAndDuration = [];
      var jsonResult = data;
      _.each(jsonResult.rows, function(sourceData){
        var results = [];
        _.each(sourceData.elements, function(targetData){
          results.push([targetData.distance.value,targetData.duration.value]);
        });
        distanceMetersAndDuration.push(results);
      });
      radio('distanceMetersSuccess').broadcast(distanceMetersAndDuration, type);
    }

    function onError () {
      $.mobile.loading('hide');
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

  onDistanceMetersSuccess: function(distanceMetersAndDuration, type) {
    switch (type) {
      case 'originToStation':
        this.originToStation = distanceMetersAndDuration;
        break;
      case 'stationToStation':
        this.stationToStation = distanceMetersAndDuration;
        break;
      case 'stationToDestination':
        this.stationToTarget = distanceMetersAndDuration;
        break;
      default:
        console.log('Something wrong happened');
    }

    if (this.originToStation && this.stationToStation && this.stationToTarget){
      radio('distanceMetersSuccess').unsubscribe(this.onDistanceMetersSuccess);

      var potentialRoutes = this.createRoutesArray(this.originToStation, this.stationToStation, this.stationToTarget);

      //remove the waling route from the potential routes
      var walkingRoute = potentialRoutes[potentialRoutes.length-1];
      potentialRoutes.splice(potentialRoutes.length-1,1);
      this.sortedRoutes = (_.sortBy(potentialRoutes, function(route) {
        return route.getRouteTime();
      }));

      // If the walking route is faster, than this is the only ressult
      if (this.sortedRoutes.length > 0 && walkingRoute.getRouteTime() <= this.sortedRoutes[0].routeTime) {
        this.sortedRoutes = [walkingRoute];
      }

      window.localStorage.setItem("routes", JSON.stringify(this.sortedRoutes));
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
          walkingDistance1  : originToStationsDistances[0][i][0],
          cyclingDistance   : stationsToStationsDistances[i][j][0],
          walkingDistance2  : stationsToTargetDistances[j][0][0],
          cyclingDuration   : stationsToStationsDistances[i][j][1]/3.0,
          walkingDuration1  : originToStationsDistances[0][i][1],
          walkingDuration2  : stationsToTargetDistances[j][0][1]
        }
        ));
      }
    }

    // push walking route
    routes.push(new bikeMe.Models.Route(
      {
      source            : this.originLocation,
      target            : this.destinationLocation,
      walkingDistance1  : originToStationsDistances[0][originToStationsDistances[0].length-1][0],
      cyclingDistance   : 0,
      walkingDistance2  : 0,
      cyclingDuration  :  0,
      walkingDuration1  : originToStationsDistances[0][originToStationsDistances[0].length-1][1],
      walkingDuration2  : 0
    }
    ));

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
