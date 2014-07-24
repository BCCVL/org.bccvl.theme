
// JS code to initialise the visualiser map

define(     ['jquery', 'js/bccvl-preview-layout', 'OpenLayers'],
    function( $      ) {
        
        var map, mercator, geographic;
        var loading_panel;
        
        // DecLat, DecLng 
        geographic = new OpenLayers.Projection("EPSG:4326");
        
        // Spherical Meters
        // The official name for the 900913 (google) projection
        mercator = new OpenLayers.Projection("EPSG:3857");
        
        // Australia Bounds
        australia_bounds = new OpenLayers.Bounds();
        australia_bounds.extend(new OpenLayers.LonLat(111,-10));
        australia_bounds.extend(new OpenLayers.LonLat(152,-44));
        australia_bounds = australia_bounds.transform(geographic, mercator);
        var zoom_bounds = australia_bounds;

        map = new OpenLayers.Map('map', {
            projection: mercator,
            eventListeners: {
                "changelayer": mapLayerChanged
            }
        });

        //loading_panel = new OpenLayers.Control.LoadingPanel();
        //map.addControl(loading_panel);

        var myLayers = [];

        var osm = new OpenLayers.Layer.OSM();
        var gmap = new OpenLayers.Layer.Google("Google Streets", {visibility: false});
        myLayers.push(osm, gmap)

        var ls = new OpenLayers.Control.LayerSwitcher();
        map.addLayers(myLayers)
        map.addControl(ls);
        map.zoomToExtent(zoom_bounds);

        // eventListener which only allows one overlay to displayed at a time
        function mapLayerChanged(event) {
          ls.dataLayers.forEach(function(dataLayer) {
              if (dataLayer.layer.name == event.layer.name && event.layer.visibility) {
                  dataLayer.layer.visibility = true;
                  dataLayer.layer.display(true);
              }     
              else {
                  dataLayer.layer.visibility = false;
                  dataLayer.layer.display(false);
              }
          })
        }
    }
);
