bikeMe.namespace('Models');

bikeMe.Models.Location = function (location) {

    this.initialize(location);
};

bikeMe.Models.Location.prototype = {
    initialize: function (location) {
        this.longitude = location.Longitude;
        this.latitude  = location.Latitude;
        this.address   = location.Eng_Address;
    }
};