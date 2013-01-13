bikeMe.namespace('Views');

bikeMe.Views.Search = function () {
  this.initialize();
};

bikeMe.Views.Search.prototype = {
  initialize: function () {
    this.$el = $('#search');

    this.search = _.bind(this.search, this);
    this.$el.on('click', 'input[type="submit"]', this.search);
  },

  search: function () {
    var from = this.$el.find('input#from').val();
    var to   = this.$el.find('input#to').val();

    //bikeMe.Models.RouteFinder(from, to);
  },

  unbind: function () {
    this.$el.unbind();
  }
};
