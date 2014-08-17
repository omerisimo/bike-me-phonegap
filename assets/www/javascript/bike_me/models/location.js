bikeMe.namespace('Models');

bikeMe.Models.Location = function (attributes) {
  this.initialize(attributes);
};

bikeMe.Models.Location.CURRENT_LOCATION = "Current Location";

bikeMe.Models.Location.prototype = {

  initialize: function (attributes) {
    this.longitude = attributes.longitude;
    this.latitude  = attributes.latitude;
    this.address   = attributes.address;
    this.found     = false;

    this.onFetchCoordinatesSuccess   = _.bind(this.onFetchCoordinatesSuccess, this);
    this.onCurrentCoordinatesSuccess = _.bind(this.onCurrentCoordinatesSuccess, this);
    this.afterCompleteFetching = _.bind(this.afterCompleteFetching, this);
  },

  locate: function () {
    if (this.address.trim() === bikeMe.Models.Location.CURRENT_LOCATION) {
      this.currentCoordinates();
    } else {
      this.fetchCoordinates();
    }
  },

  fetchCoordinates: function () {
    var geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

    var data = {
      address    : this.address +", Tel Aviv",
      components : 'country:IL',
      language   : 'en',
      region     : 'il',
      sensor     : false,
      bounds     : "32.02925310,34.74251590|32.1466110,34.85197610"
    };

    $.ajax({
      url      : geocodeUrl,
      type     : 'GET',
      dataType : 'json',
      data     : data,
      complete : this.afterCompleteFetching,
      error    : this.onFetchCoordinatesError,
      success  : this.onFetchCoordinatesSuccess
    });
  },

  onFetchCoordinatesSuccess: function (data) {
    var result = _.first(data.results);
    if(_.isUndefined(result))
    {
      this.onFetchCoordinatesError();
      return false;
    }
    if (data.results.length > 1)
    {
      var isCorrectAddress = confirm("Is this the address you were looking for?\n"+ result.formatted_address);
      if (isCorrectAddress==false){
        this.found = false;
        return;
      }
    }

    this.longitude = result.geometry.location.lng;
    this.latitude  = result.geometry.location.lat;

    this.found = true;
  },
  
  onFetchCoordinatesError: function () {
    $.mobile.loading('hide');
    bikeMe.alert("The address was not found.","Oh Noes!");
  },

  afterCompleteFetching: function (jqXHR, textStatus) {
    if ((textStatus === 'success') && (!_.isUndefined(jqXHR))) {
      var json_result = JSON.parse(jqXHR.responseText);
      if (json_result["status"] === "OK") {
        if (!this.found) {
          $.mobile.loading('hide');
          bikeMe.alert("The address was not found.","Oh Noes!");
        }
        else {
          radio('locationFound').broadcast();
        }
      }
    }
  },

  currentCoordinates: function () {
    var options = {maximumAge: 1000, timeout: 15000, enableHighAccuracy: true};
    navigator.geolocation.getCurrentPosition(this.onCurrentCoordinatesSuccess, this.onCurrentCoordinatesFailure, options);
  },

  onCurrentCoordinatesSuccess: function (position) {
    this.latitude  = position.coords.latitude;
    this.longitude = position.coords.longitude;

    this.found = true;

    radio('locationFound').broadcast();
  },

  onCurrentCoordinatesFailure: function () {
    $.mobile.loading('hide');
    bikeMe.alert("The current location was not found.","Oh Noes!");
  },

  toString: function () {
    return this.address + " (" + this.latitude.toString() + ", " + this.longitude.toString() + ")";
  },

  unsubscribe: function () {
    // Nothing to unsubscribe from for now.
  },

  getLatLng: function() {
    if (_.isUndefined(this.LatLng)){
      this.LatLng = new google.maps.LatLng(this.latitude, this.longitude);
    }
    return this.LatLng;
  }
};
