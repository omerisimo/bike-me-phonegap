bikeMe.namespace('Models');

bikeMe.Models.Location = function (latitude, longitude, address) {

    this.initialize(latitude, longitude, address);
};

bikeMe.Models.Location.prototype = {
    initialize: function (latitude, longitude, address) {
        this.longitude = longitude;
        this.latitude  = latitude;
        this.address   = address;
        return this;
    },
    toString: function () {
        return this.address + " (" + this.latitude.toString() + ", " + this.longitude.toString() + ")";
    }
};