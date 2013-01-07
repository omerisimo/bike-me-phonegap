bikeMe.namespace('Models');

bikeMe.Models.Station = function (stationData) {

    this.initialize(stationData);
};

bikeMe.Models.Station.nearestStations = function (location, maxResults) {
		if (_.isUndefined(maxResults)) {
			maxResults = 5;
		}
		var nearestStations = [];

		//soap request to get nearest stations
		var body = '<?xml version="1.0" encoding="utf-8"?>\
        <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">\
  <soap12:Body>\
    <GetNearestStations xmlns="http://tempuri.org/">\
      <longitude>' + location.longitude +'</longitude>\
      <langitude>' + location.latitude + '</langitude>\
      <radius>2000</radius>\
      <maxResults>' + maxResults +'</maxResults>\
    </GetNearestStations>\
  </soap12:Body>\
</soap12:Envelope>';


		
		
		$.ajax({
            url: 'http://www.tel-o-fun.co.il:2470/ExternalWS/Geo.asmx?WSDL', 
            type: "POST",
            dataType: "xml", 
            data: body, 
            contentType: "text/xml; charset=\"utf-8\"",
            success: bikeMe.Models.Station.OnSuccess, 
            error: bikeMe.Models.Station.OnError
        });



		// var response;
		
		// response.body['get_nearest_stations_response']['get_nearest_stations_result']['stations_close_by']['station'].each do | station |
		// 	nearest_stations << Station.new(station)
		// end


    };
    bikeMe.Models.Station.OnSuccess = function (data, status) {
		alert('Success');
    };

    bikeMe.Models.Station.OnError = function (request, status, error) {
		alert('error');
    };

bikeMe.Models.Station.prototype = {
    initialize: function (stationData) {
        this.id 				 = stationData.station_id;
        this.location  			 = new bikeMe.Models.Location(stationData);
        this.distanceFromStation = stationData.distance_from_station_in_meters;
        this.availableBikes 	 = stationData.num_of_available_bikes;
        this.availableDocks 	 = stationData.num_of_available_docks;
    }
};