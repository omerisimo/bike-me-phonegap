bikeMe.namespace('Models');

bikeMe.Models.Search = function (origin, destination) {
    this.initialize(origin, destination);
};

bikeMe.Models.Search.prototype = {
    initialize: function(origin, destination) {
        this.origin_string = origin;
        this.destination_string = destination;
        this.origin = null;
        this.destination = null;
        return this;
    },
    /*
     * will search for the locations that they entered and call the appropriate callback
     *
     * @param callback a set of key/value pairs
     *          success the function that will be called after the locations are successfully found. The function will
     *                  take receive two parameters - the origin Location and the destination Location
     *          error   the function that will be called if either the origin or destination locations can't be found.
     *                  The function will receive two parameters - the origin Location and the destination Location. If
     *                  the Location wasn't found, then it will be null.
     */
    findLocations: function(callback) {
        var geoCodeParams, i, geocode, notifyIfFinished, numResults = 0;

        if (!callback || !callback.hasOwnProperty("success") || !callback.hasOwnProperty("error") ||
          !_.isFunction(callback.success) || !_.isFunction(callback.error)) {
            throw new Error("the callback for findLocations() must be an Object with two properties, success & error, which are both functions")
        }

        notifyIfFinished = _.bind(function () {
            numResults += 1;
            if (numResults === 2) {
                if (this.origin && this.destination) {
                    callback.success(this.origin, this.destination);
                } else {
                    callback.error(this.origin, this.destination);
                }
            }
        }, this);

        geocode = _.bind(function (accessor, address) {
            var geoCodeParams = {},
              url = "https://maps.googleapis.com/maps/api/geocode/json";
            if (address === "Current Location") {
                navigator.geolocation.getCurrentPosition(function (position) {
                    this[accessor] = new bikeMe.Models.Location(position.coords.latitude, position.coords.longitude, address);
                    notifyIfFinished();
                }, function (error) {
                    //There was an error, so we won't set anything and the notifyIfFinished will end up calling the error callback
                    notifyIfFinished();
                });
            } else {
                geoCodeParams.address = address;
                geoCodeParams.components = "country:IL";
                geoCodeParams.language = "en";
                geoCodeParams.region = "il";
                geoCodeParams.sensor = false;
                $.ajax({
                    url: url + "?" + $.param(geoCodeParams),
                    type: "GET",
                    dataType: "json",
                    success: _.bind(function (geocodeResult) {
                        var latlng;
                        if (geocodeResult.status === "OK") {
                            latlng = geocodeResult.results[0].geometry.location;
                            this[accessor] = new bikeMe.Models.Location(latlng.lat, latlng.lng, address);
                        }
                        notifyIfFinished();
                    }, this),
                    error: _.bind(function () {
                        notifyIfFinished();
                    }, this)
                });
            }
        }, this);

        geocode('origin', this.origin_string);
        geocode('destination', this.destination_string);
    }
};
