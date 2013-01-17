bikeMe.namespace('Views');

bikeMe.Views.Search = function () {
  this.initialize();
};

bikeMe.Views.Search.prototype = {
  initialize: function () {
    this.$el = $('#search');

    this.search = _.bind(this.search, this);
    this.$el.on('click', 'input[type="submit"]', this.search);

    radio('searchError').subscribe([this.onRoutingError, this]);
  },

  search: function () {
    var from = this.$el.find('input#from').val();
    var to   = this.$el.find('input#to').val();

    this.unsubscribePreviousSearchModel();

    this.searchModel = new bikeMe.Models.Search(from, to);
    this.searchModel.find();

    this.showLoadingIndicator();
  },

  showLoadingIndicator: function () {
    $.mobile.loading('show', {
      text        : 'Looking for the best route',
      textVisible : true
    });
  },

  onRoutingError: function () {
    $.mobile.loading('hide');
    var msg = "No reasonable route was found.";
    if (navigator.notification) {
      navigator.notification.alert(msg, null, "Oh Noes!");
    } else {
      alert(msg);
    }
  },

  unsubscribePreviousSearchModel: function () {
    if (this.searchModel) {
      this.searchModel.unsubscribe();
    }
  }
};
