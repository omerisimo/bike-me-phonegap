var map, GeoMarker;

$("div.my_location").on("click", function() {
  alert("Getting location...");
  try
    {
      navigator.geolocation.getCurrentPosition(onSuccess, onError);
      $('#loading').show(); 
    }
  catch(err)
    {
      txt="There was an error on this page.\n\n";
      txt+="Error description: " + err.message + "\n\n";
      txt+="Click OK to continue.\n\n";
      alert(txt);
    }
});

function showMap() {
  var mapOptions = { center: new google.maps.LatLng(-34.397, 150.644),
                      zoom: 8,
                      mapTypeId: google.maps.MapTypeId.ROADMAP };
  map = new google.maps.Map(document.getElementById("map_canvas"),mapOptions);
  $('#loading').hide();
};

// onSuccess Callback
//   This method accepts a `Position` object, which contains
//   the current GPS coordinates
var onSuccess = function(position) {
  $('#loading').hide();
  var mapOptions = { center: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
                      zoom: 16,
                      mapTypeId: google.maps.MapTypeId.ROADMAP };
   map.setOptions(mapOptions);

   GeoMarker = new GeolocationMarker();
   GeoMarker.setCircleOptions({fillColor: '#808080'});

   GeoMarker.setMap(map);
};

// onError Callback receives a PositionError object
function onError(error) {
    alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
    $('#loading').hide();
}