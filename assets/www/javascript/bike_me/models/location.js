bikeMe.namespace('Models');

bikeMe.Models.Location = function (location) {

    this.initialize(location);
};

bikeMe.Models.Location.prototype = {
    initialize: function (location) {
        this.longitude = location.longitude;
        this.latitude  = location.latitude;
        this.address   = location.address;
    }
};