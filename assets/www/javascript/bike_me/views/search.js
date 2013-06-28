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
    this.$switchDirectionsButton = this.$el.find('#switchDirections>a');

    this.routesSearch = _.bind(this.routesSearch, this);
    this.$routesSearchButton.on('click', this.routesSearch);

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

    this.switchDirections = _.bind(this.switchDirections, this);
    this.$switchDirectionsButton.on('click', this.switchDirections);
    this.loadFromCache();
  },

  loadFromCache: function() {
    var previousSearch = bikeMe.Models.Search.loadLastSearch();
    if (!_.isUndefined(previousSearch)) {
      if (previousSearch.originString != null && previousSearch.originString != bikeMe.Models.Location.CURRENT_LOCATION) {
        this.$from.val(previousSearch.originString);
        if(previousSearch.originString == bikeMe.Models.Location.CURRENT_LOCATION) {
          this.$from.addClass('current-location_text-input');
        } else {
          this.$from.removeClass('current-location_text-input');
        }
      }
      if (previousSearch.destinationString != null) {
        this.$to.val(previousSearch.destinationString);
      }
    }
  },

  routesSearch: function () {
    this.search('routes');
    return false;
  },

  stationsSearch: function() {
    this.search('stations');
    return false;
  },

  search: function(searchType) {
    var from = this.$from.val();
    var to   = this.$to.val();
    if (to.trim() == '') {
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

  switchDirections: function(){
    var originString = this.$from.val();
    var destinationString = this.$to.val();
    this.$to.val(originString);
    this.$from.val(destinationString);
    if(destinationString == bikeMe.Models.Location.CURRENT_LOCATION) {
      this.$from.addClass('current-location_text-input');
    } else {
      this.$from.removeClass('current-location_text-input');
    }
  }
};
