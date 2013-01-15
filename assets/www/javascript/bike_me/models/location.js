bikeMe.namespace('Models');

bikeMe.Models.Location = function (latitude, longitude, address) {
  this.longitude = longitude;
  this.latitude  = latitude;
  this.address   = address;
};

bikeMe.Models.Location.prototype = {
  fetchCoordinates: function () {

  },

  locate: function () {
    if (this.address === 'Current Location') {
      this.current();
    } else {
      this.fetchCoordinates();
    }

    return this;
  },

  toString: function () {
    return this.address + " (" + this.latitude.toString() + ", " + this.longitude.toString() + ")";
  },

  current: function () {
    var onSuccess = function (position) {
      this.latitude  = position.coords.latitude;
      this.longitude = position.coords.longitude;
    };

    var onFailure = function () {};

    navigator.geolocation.getCurrentPosition(onSuccess, onFailure);
  }
};

