bikeMe.namespace('Views');

bikeMe.Views.Search = function () {
  this.initialize();
};

bikeMe.Views.Search.prototype = {
  initialize: function () {
    this.$el = $('#search');
    this.$from = this.$el.find('input#from');
    this.$to = this.$el.find('input#to');
    this.$routesSearchButton = this.$el.find('button#routes_search');
    this.$stationsSearchButton = this.$el.find('button#stations_search');
    this.$lastSearchButton = this.$el.find('button#last_search');

    this.routesSearch = _.bind(this.routesSearch, this);
    this.$routesSearchButton.on('click', this.routesSearch);

    this.lastSearch = _.bind(this.lastSearch, this);
    this.$lastSearchButton.on('click', this.lastSearch);

    this.stationsSearch = _.bind(this.stationsSearch, this);
    this.$stationsSearchButton.on('click', this.stationsSearch);
    this.$el.submit(this.stationsSearch);

    this.clearCurrentLocationText = _.bind(this.clearCurrentLocationText, this);
    this.$from.focus(this.clearCurrentLocationText);

    this.setCurrentLocationText = _.bind(this.setCurrentLocationText, this);
    this.$from.blur(this.setCurrentLocationText);

    // When clicking the 'clear text' button link, cleasr the 'Current Location' styling
    this.$from.find('+a').on('touch', this.clearCurrentLocationText);

    radio('searchError').subscribe([this.onRoutingError, this]);
  },

  routesSearch: function () {
    this.search('routes');
    return false;
  },

  stationsSearch: function() {
    this.search('stations');
    return false;
  },

  lastSearch: function() {
    this.unsubscribePreviousSearchModel();

    this.searchModel = new bikeMe.Models.Search(null, null);
    this.showLoadingIndicator();
    this.searchModel.load_from_cache();
    return false;
  },

  search: function(searchType) {
    var from = this.$from.val();
    var to   = this.$to.val();
    if (to.trim() === '') {
      bikeMe.alert("Please fill both 'from', and 'to' addresses.", "Sorry.");
      return false;
    }

    this.unsubscribePreviousSearchModel();

    this.searchModel = new bikeMe.Models.Search(from, to);
    this.searchModel.find(searchType);

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
    bikeMe.alert("No reasonable route was found.", "Oh Noes!");
  },

  unsubscribePreviousSearchModel: function () {
    if (this.searchModel) {
      this.searchModel.unsubscribe();
    }
  },

  clearCurrentLocationText: function () {
    if (this.$from.val() == bikeMe.Models.Location.CURRENT_LOCATION) {
      this.$from.val('');
    }
    this.$from.removeClass('current-location_text-input');
    return false;
  },

  setCurrentLocationText: function () {
    if (this.$from.val().trim() == '' || this.$from.val() == bikeMe.Models.Location.CURRENT_LOCATION) {
      this.$from.val(bikeMe.Models.Location.CURRENT_LOCATION);
      this.$from.addClass('current-location_text-input');
    }
    return false;
  },
};
