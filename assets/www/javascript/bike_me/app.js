function createNamespace (namespace, context) {
  return namespace[context] || (namespace[context] = {});
}

bikeMe = {
  initialize: function () {
    this.mapView = new bikeMe.Views.Map();
  },

  namespace: function (namespace) {
    return _.reduce(namespace.split('.'), createNamespace, this);
  }
};

$(document).ready(function () {
  bikeMe.initialize();
});
