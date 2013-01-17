function createNamespace (namespace, context) {
  return namespace[context] || (namespace[context] = {});
}

bikeMe = {
  initialize: function () {
    document.addEventListener('deviceready', this.onDeviceReady, false);
    this.setJqueryMobileDefaults();

    this.searchView = new bikeMe.Views.Search();
    this.mapView    = new bikeMe.Views.Map();
  },

  namespace: function (namespace) {
    return _.reduce(namespace.split('.'), createNamespace, this);
  },

  setJqueryMobileDefaults: function () {
    $.mobile.defaultPageTransition = 'none';
  },

  onDeviceReady: function() {
    navigator.splashscreen.hide();
  }
};

