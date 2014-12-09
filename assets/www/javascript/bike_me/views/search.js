bikeMe.namespace('Views');

bikeMe.Views.Search = function () {
  this.initialize();
};

bikeMe.Views.Search.prototype = {
  initialize: function () {
    //members
    this.autocompleteService = new google.maps.places.AutocompleteService();

    //page elements
    this.$page = $('#search-page');
    this.$el = $('#search');
    this.$from = this.$el.find('#from').prev().find('input');
    this.$to = this.$el.find('#to').prev().find('input');
    this.$routesSearchButton = this.$el.find('button#routes_search');
    this.$stationsSearchButton = this.$el.find('button#stations_search');
    this.$switchDirectionsButton = this.$el.find('#switchDirections>a');
    this.$autoComplete = this.$el.find('.autocomplete');
    this.$recentTripsList = this.$el.find('#history ul');
    this.$aroundMeButton = this.$page.find('#around_me');

    //events handlers
    this.$page.click(_.bind(this.hideAutoComplete, this));
    this.$page.on("pagebeforeshow", _.bind(this.beforeShow, this));
    $('form').submit(_.bind(this.handleFormSubmit, this));
    this.$el.submit(_.bind(this.stationsSearch, this));
    this.$routesSearchButton.on('click', _.bind(this.routesSearch, this));
    this.$stationsSearchButton.on('click', _.bind(this.stationsSearch, this));
    this.$from.focus(_.bind(this.clearCurrentLocationText, this));
    this.$from.blur(_.bind(this.setCurrentLocationText, this));
    this.$from.find('+a').on('touch', this.clearCurrentLocationText); // When clicking the 'clear text' button link, clears the 'Current Location' styling
    this.$switchDirectionsButton.on('click', _.bind(this.switchDirections, this));
    this.$autoComplete.on("listviewbeforefilter", this.autoComplete);
    this.$aroundMeButton.on('click', _.bind(this.nearbyStation, this))

    //events subscriptions
    radio('searchError').subscribe([this.onRoutingError, this]);

    //load recent trips from cache
    this.loadFromCache();
  },

  handleFormSubmit: function(e,data){
    e.preventDefault();
    this.$from.blur();
    this.$to.blur();
    if ($(e.target).find('input')[0] ==  this.$from[0]){
      this.hideAutoComplete();
      this.$to.focus();
    } else {
      this.hideAutoComplete();
      this.stationsSearch();
    }
  },

  beforeShow: function(){
    this.loadFromCache();
  },

  loadFromCache: function() {
    var recentTrips = bikeMe.Models.Search.recentTrips();
    var $recentTripsList = this.$recentTripsList;
    $recentTripsList.find(".recent_trip").remove();
    if (!_.isUndefined(recentTrips) && recentTrips.length > 0) {
      _.each(recentTrips, function(trip) {
        var tripHTML = '<li class="recent_trip"><a href=""#"" data-from="'+trip.from+'" data-to="'+trip.to+'">'+trip.from+' -&gt; '+trip.to+'</a></li>'
        $recentTripsList.append(tripHTML).listview('refresh');
      });
    }
    this.$el.find('.recent_trip').click(_.bind(this.selectRecentTrip, this));
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
    this.hideAutoComplete();
    var from = this.$from.val();
    var to   = this.$to.val();
    if (to.trim() == '') {
      bikeMe.alert("Please fill both 'from', and 'to' addresses.", "Sorry.");
      return false;
    }

    this.unsubscribePreviousSearchModel();

    this.searchModel = new bikeMe.Models.Search(from, to);
    this.searchModel.find(searchType);

    this.showLoadingIndicator(searchType);
  },

  showLoadingIndicator: function (searchType) {
    switch(searchType) {
    case 'stations':
      message = 'Looking for stations'
      break;
    case 'routes':
      message = 'Looking for the best route'
      break;
    case 'nearby':
      message = 'Looking for stations around you'
      break;
    }

    $.mobile.loading('show', {
      text        : message,
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
  },

  autoComplete: function(e, data) {
    var $ul = $(this),
      $input = $( data.input ),
      value = $input.val(),
      html = "";

    function callback(predictions, status){
      function choose(){
        var value = this.innerHTML;
        $ul.html("");
        $input.select().val(value);
      };

      $.each(predictions, function ( i, val ) {
        if(val.terms.length > 1 && (val.terms[1].value == "Tel Aviv" || val.terms[1].value == "תל אביב יפו")){
          html += "<li class='suggestion'>" + val.terms[0].value + "</li>";
        }
      });
      $ul.html(html);
      $ul.listview("refresh");
      $ul.trigger("updatelayout");

      $ul.find('.suggestion').on('click', choose);
    };

    if ($input.is(':focus') == false){
      return false;
    }
    bikeMe.searchView.hideAutoComplete();

    $ul.html("");
    if ( value && value.length > 2 ) {
      $ul.html( "<li><div class='ui-loader'><span class='ui-icon ui-icon-loading'></span></div></li>" );
      $ul.listview( "refresh" );

      bikeMe.searchView.autocompleteService.getQueryPredictions({input: value, location: new google.maps.LatLng(32.066181,34.77761), radius: 8000, componentRestrictions: {country: "il"}}, callback);
    }
  },

  hideAutoComplete: function(e, data){
    this.$autoComplete.html("");
  },

  selectRecentTrip: function(e, data){
    this.$from.val($(e.target).data('from')).blur();
    this.$to.val($(e.target).data('to')).blur();
  },

  nearbyStation: function() {
    this.unsubscribePreviousSearchModel();

    this.searchModel = new bikeMe.Models.Search();
    this.searchModel.nearby();

    this.showLoadingIndicator('nearby');
  }
};
