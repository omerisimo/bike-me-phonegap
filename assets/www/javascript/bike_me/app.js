function createNamespace (namespace, context) {
  return namespace[context] || (namespace[context] = {});
}

bikeMe = {
  MAX_RESULTS: 5,
  initialize: function () {
    document.addEventListener('deviceready', this.onDeviceReady, false);
    this.setJqueryMobileDefaults();

    this.searchView = new bikeMe.Views.Search();
    this.mapView    = new bikeMe.Views.Map();
    this.mapView.initializeGoogleMap();
  },

  namespace: function (namespace) {
    return _.reduce(namespace.split('.'), createNamespace, this);
  },

  setJqueryMobileDefaults: function () {
    $.mobile.defaultPageTransition = 'none';
  },

  onDeviceReady: function() {
    if(navigator.splashscreen) {
      navigator.splashscreen.hide();
    }
  },

  alert: function (message, title) {
    if (navigator.notification) {
      navigator.notification.alert(message, null, title);
    } else {
      alert(message);
    }
  }
};

