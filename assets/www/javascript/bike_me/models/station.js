bikeMe.namespace('Models');

bikeMe.Models.Station = function (attributes) {
  this.initialize(attributes);
};

bikeMe.Models.Station.prototype = {
  initialize: function (attributes) {
    this.availableBikes      = attributes.availableBikes;
    this.availableDocks      = attributes.availableDocks;
    this.distanceFromStation = attributes.distanceFromStation;
    this.id                  = attributes.id;

    this.location = new bikeMe.Models.Location({
      address   : attributes.address,
      latitude  : attributes.latitude,
      longitude : attributes.longitude
    });
  },

  unsubscribe: function () {
    this.location.unsubscribe();
  }
};

bikeMe.Models.Station.findNearestStations = function (options) {
  var location   = options.location;
  var maxResults = options.maxResults || 5;
  var type       = options.type;

  function onSuccess (data) {
    var stationResults = $(data).find('Station');

    var nearestStations = _.map(stationResults, function (stationResult) {

      var station = new bikeMe.Models.Station({
        address             : $(stationResult).attr('Eng_Station_Name'),
        availableBikes      : $(stationResult).attr('NumOfAvailableBikes'),
        availableDocks      : $(stationResult).attr('NumOfAvailableDocks'),
        distanceFromStation : $(stationResult).attr('DistanceFromStationInMeters'),
        id                  : $(stationResult).attr('Station_id'),
        latitude            : $(stationResult).attr('Latitude'),
        longitude           : $(stationResult).attr('Longitude')
      });

      return station;
    });

    radio('nearestStationsFound').broadcast(nearestStations, type);
  }

  function onError () {
    alert('error');
  }

  var data = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">\
  <soapenv:Header/>\
  <soapenv:Body>\
  <tem:GetNearestStations>\
  <tem:longitude>' + location.latitude + '</tem:longitude>\
  <tem:langitude>' + location.longitude + '</tem:langitude>\
  <tem:radius>2000</tem:radius>\
  <tem:maxResults>' + maxResults + '</tem:maxResults>\
  </tem:GetNearestStations>\
  </soapenv:Body>\
  </soapenv:Envelope>';

  $.ajax({
    contentType : 'text/xml; charset=\"utf-8\"',
    data        : data,
    dataType    : 'xml',
    error       : onError,
    success     : onSuccess,
    type        : 'POST',
    url         : 'http://www.tel-o-fun.co.il:2470/ExternalWS/Geo.asmx'
  });
};

