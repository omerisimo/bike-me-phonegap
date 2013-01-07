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
    console.log('hello');
    radio('onSearchSuccess').broadcast();
  },

  onSearchSuccess: function () {
    alert('Success');
  },

  onSearchFailure: function () {
    alert('Failure');
  }
};
