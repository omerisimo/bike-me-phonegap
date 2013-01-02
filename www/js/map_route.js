var map;

$("div.my_location").on("click", function() {
  alert("Getting location...");
  try
    {
      navigator.geolocation.getCurrentPosition(onSuccess, onError);
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
};

// onSuccess Callback
//   This method accepts a `Position` object, which contains
//   the current GPS coordinates
var onSuccess = function(position) {
    alert('Latitude: '          + position.coords.latitude          + '\n' +
          'Longitude: '         + position.coords.longitude         + '\n' +
          'Altitude: '          + position.coords.altitude          + '\n' +
          'Accuracy: '          + position.coords.accuracy          + '\n' +
          'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
          'Heading: '           + position.coords.heading           + '\n' +
          'Speed: '             + position.coords.speed             + '\n' +
          'Timestamp: '         + position.timestamp                + '\n');
    map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude), 13);
};

// onError Callback receives a PositionError object
function onError(error) {
    alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
}