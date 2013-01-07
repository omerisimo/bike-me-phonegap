function createNamespace (namespace, context) {
  return namespace[context] || (namespace[context] = {});
}

telOFun = {
  initialize: function () {
    this.mapView = new telOFun.Views.Map();
  },

  namespace: function (namespace) {
    return _.reduce(namespace.split('.'), createNamespace, this);
  }
};

$(document).ready(function () {
  telOFun.initialize();
});
