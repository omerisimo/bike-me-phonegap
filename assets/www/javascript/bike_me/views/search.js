bikeMe.namespace('Views');

bikeMe.Views.Search = function () {
  this.initialize();
};

bikeMe.Views.Search.prototype = {
  initialize: function () {
    this.$el = $('#search');
    this.$from = this.$el.find('input#from');
    this.$to = this.$el.find('input#to');

    this.search = _.bind(this.search, this);
    this.$el.submit(this.search);

    this.clearCurrentLocationText = _.bind(this.clearCurrentLocationText, this);
    this.$from.focus(this.clearCurrentLocationText);

    this.setCurrentLocationText = _.bind(this.setCurrentLocationText, this);
    this.$from.blur(this.setCurrentLocationText);

    radio('searchError').subscribe([this.onRoutingError, this]);
  },

  search: function () {
    // Disable until we fix the bug of a popup window
    //this.enableAutoCompleteForm();

    var from = this.$from.val();
    var to   = this.$to.val();

    this.unsubscribePreviousSearchModel();

    this.searchModel = new bikeMe.Models.Search(from, to);
    this.searchModel.find();

    this.showLoadingIndicator();
    return false;
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
  },

  // This code is a hack to enable autocomplete history of the form above.
  // http://stackoverflow.com/questions/8400269/browser-native-autocomplete-for-ajaxed-forms
  enableAutoCompleteForm: function () {
    var iFrameWindow = document.getElementById("iframe-for_autocomplete").contentWindow;
    iFrameWindow.document.body.appendChild(document.getElementById("search").cloneNode(true));
    var frameForm = iFrameWindow.document.getElementById("search");
    frameForm.onsubmit = null;
    frameForm.submit();
  },

  clearCurrentLocationText: function () {
    if (this.$from.val() == bikeMe.Models.Location.CURRENT_LOCATION) {
      this.$from.val('');
      this.$from.removeClass('current-location_text-input');
    }
  },

  setCurrentLocationText: function () {
    if (this.$from.val().trim() == '') {
      this.$from.val(bikeMe.Models.Location.CURRENT_LOCATION);
      this.$from.addClass('current-location_text-input');
    }
  },
};
