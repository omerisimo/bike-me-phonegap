bikeMe.namespace('Views');

bikeMe.Views.Search = function () {
  this.initialize();
};

bikeMe.Views.Search.prototype = {
  initialize: function () {
    this.$el   = $('#search');
    this.$from = this.$el.find('input#from');
    this.$to   = this.$el.find('input#to');

    radio('onSearchSuccess').subscribe([this.onSearchSuccess, this]);
    radio('onSearchFailure').subscribe([this.onSearchFailure, this]);

    this.search = _.bind(this.search, this);
    this.$el.on('click', 'input[type="submit"]', this.search);
  },

  search: function () {
    var from = this.$from.val();
    var to   = this.$to.val();

    //router.search(from, to);
    var routes = JSON.parse(window.localStorage.getItem("routes3")) || [];
    routes.push({from: from, to: to});
    window.localStorage.setItem("routes3", JSON.stringify(routes));
    alert(routes.length);
    //radio('onSearchSuccess').broadcast();
  },

  onSearchSuccess: function () {
    alert('Success');
  },

  onSearchFailure: function () {
    alert('Failure');
  }
};
