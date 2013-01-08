bikeMe.namespace('Models');

bikeMe.Models.Station = function (stationData) {

    this.initialize(stationData);
};

bikeMe.Models.Station.nearestStations = function (location, maxResults) {
		if (_.isUndefined(maxResults)) {
			maxResults = 5;
		}
		var nearestStations = [];
        
        var body = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">\
                        <soapenv:Header/>\
                            <soapenv:Body>\
                             <tem:GetNearestStations>\
                                <tem:longitude>32.079956</tem:longitude>\
                                <tem:langitude>34.775759</tem:langitude>\
                                <tem:radius>2000</tem:radius>\
                                <tem:maxResults>5</tem:maxResults>\
                             </tem:GetNearestStations>\
                            </soapenv:Body>\
                    </soapenv:Envelope>';
		$.ajax({
            url: 'http://www.tel-o-fun.co.il:2470/ExternalWS/Geo.asmx', 
            type: "POST",
            dataType: "xml", 
            data: body,
            async: false, 
            contentType: "text/xml; charset=\"utf-8\"",
            success: function (data, status) {
                alert('Success');
                var stationsResult = data.getElementsByTagName('Station');
                $.each(stationsResult, function (index,value) {
                    var stationData = {};
                    for (var i=0; i< value.attributes.length; i++){
                        stationData[value.attributes[i].name] = value.attributes[i].value;
                    }
                    var station = new bikeMe.Models.Station(stationData);
                    nearestStations.push(station);
                });
            },
            error: bikeMe.Models.Station.OnError
        });
        
        return nearestStations;
    };


    bikeMe.Models.Station.OnError = function (request, status, error) {
		alert('error');
    };

bikeMe.Models.Station.prototype = {
    initialize: function (stationData) {
        this.id 				 = stationData.Station_id;
        this.location  			 = new bikeMe.Models.Location(stationData);
        this.distanceFromStation = stationData.DistanceFromStationInMeters;
        this.availableBikes 	 = stationData.NumOfAvailableBikes;
        this.availableDocks 	 = stationData.NumOfAvailableDocks;
    }
};