function createNamespace (namespace, context) {
  return namespace[context] || (namespace[context] = {});
}

bikeMe = {
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
    navigator.splashscreen.hide();
    var networkState = navigator.connection.type;

        var states = {};
        states[Connection.UNKNOWN]  = 'Unknown connection';
        states[Connection.ETHERNET] = 'Ethernet connection';
        states[Connection.WIFI]     = 'WiFi connection';
        states[Connection.CELL_2G]  = 'Cell 2G connection';
        states[Connection.CELL_3G]  = 'Cell 3G connection';
        states[Connection.CELL_4G]  = 'Cell 4G connection';
        states[Connection.NONE]     = 'No network connection';

        
        networkState = navigator.network.connection.type
  },

  alert: function (message, title) {
    if (navigator.notification) {
      navigator.notification.alert(message, null, title);
    } else {
      alert(message);
    }
  }
};

