bikeMe.namespace('Models');

bikeMe.Models.Location = function (attributes) {
  this.initialize(attributes);
};

bikeMe.Models.Location.prototype = {
  initialize: function (attributes) {
    this.longitude = attributes.longitude;
    this.latitude  = attributes.latitude;
    this.address   = attributes.address;
    this.found     = false;

    this.onFetchCoordinatesSuccess   = _.bind(this.onFetchCoordinatesSuccess, this);
    this.onCurrentCoordinatesSuccess = _.bind(this.onCurrentCoordinatesSuccess, this);
  },

  locate: function () {
    if (this.address === 'Current Location') {
      this.currentCoordinates();
    } else {
      this.fetchCoordinates();
    }
  },

  fetchCoordinates: function () {
    var geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

    var data = {
      address    : this.address,
      components : 'country:IL',
      language   : 'en',
      region     : 'il',
      sensor     : false
    };

    $.ajax({
      url      : geocodeUrl,
      type     : 'GET',
      dataType : 'json',
      data     : data,
      success  : this.onFetchCoordinatesSuccess
    });
  },

  onFetchCoordinatesSuccess: function (data) {
    var result = _.first(data.results);

    this.longitude = result.geometry.location.lng;
    this.latitude  = result.geometry.location.lat;

    this.found = true;

    radio('locationFound').broadcast();
  },

  currentCoordinates: function () {
    navigator.geolocation.getCurrentPosition(this.onCurrentCoordinatesSuccess, function () {});
  },

  onCurrentCoordinatesSuccess: function (position) {
    this.latitude  = position.coords.latitude;
    this.longitude = position.coords.longitude;

    this.found = true;

    radio('locationFound').broadcast();
  },

  toString: function () {
    return this.address + " (" + this.latitude.toString() + ", " + this.longitude.toString() + ")";
  }

};
