bikeMe.namespace('Models');

bikeMe.Models.Station = function (stationData) {
  this.initialize(stationData);
};

bikeMe.Models.Station.nearestStations = function (location, maxResults, type) {

  var onSuccess = function (data, status) {
    var nearestStations = [];
    var stationsResult = data.getElementsByTagName('Station');

    $.each(stationsResult, function (index,value) {
      var stationData = {};
      for (var i=0; i< value.attributes.length; i++){
        stationData[value.attributes[i].name] = value.attributes[i].value;
      }
      var station = new bikeMe.Models.Station(stationData);
      nearestStations.push(station);
    });

    radio('nearestStationsFetched').broadcast(nearestStations, type);
  };

  var onError = function (request, status, error) {
    alert('error');
  };

  if (_.isUndefined(maxResults)) {
    maxResults = 5;
  }

  var body = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">\
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
    url: 'http://www.tel-o-fun.co.il:2470/ExternalWS/Geo.asmx',
    type: "POST",
    dataType: "xml",
    data: body,
    contentType: "text/xml; charset=\"utf-8\"",
    success: onSuccess,
    error: onError
  });
};

bikeMe.Models.Station.prototype = {
  initialize: function (stationData) {
    this.availableBikes      = stationData.NumOfAvailableBikes;
    this.availableDocks      = stationData.NumOfAvailableDocks;
    this.distanceFromStation = stationData.DistanceFromStationInMeters;
    this.id                  = stationData.Station_id;
    this.location            = new bikeMe.Models.Location(stationData.Latitude, stationData.Longitude, stationData.Eng_Address);
  }
};
