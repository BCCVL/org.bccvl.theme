

define(
    ['jquery', 'selectize', 'selectize-remove-single'],
    function( $ ) {

        function init_region_selector() {

            var select_type, $select_type;
            var select_region, $select_region;

            $select_type = $('#select-region-type').selectize({
                onChange: function(value) {
                    var xhr;
                    if (!value.length) return;
                    select_region.disable();
                    select_region.clearOptions();
                    select_region.load(function(callback) {
                        xhr && xhr.abort();
                        xhr = $.ajax({
                            url: '/_spatial/ws/field/' + value,
                            success: function(data) {
                                select_region.enable();
                                
                                var results = [];
                                
                                $.each(data.objects, function (key, feature) {
                                    
                                    var match = {
                                        'name': feature.name,
                                        'pid': feature.pid
                                    }
                                    results.push(match);
                                });
                                callback(results);
                            },
                            error: function() {
                                callback();
                            }
                        })
                    });
                }
            });

            $select_region = $('#select-region').selectize({
                valueField: 'pid',
                labelField: 'name',
                searchField: ['name'],
                onChange: function(value){
                    $.ajax({
                        url: '/_spatial/ws/shape/geojson/' + value,
                        success: function(result) {
                            // have to clean up ALA's geojson format
                            var geojson = {
                                'type': 'Feature',
                                'geometry': result
                            }
                            $('#selected-geojson').data('geojson', JSON.stringify(geojson));
                        },
                        error: function(error) {
                            console.log(error);
                        }
                    })
                }
            });

            select_region  = $select_region[0].selectize;
            select_type = $select_type[0].selectize;

            select_region.disable();

        }
        
        return {
            init_region_selector: init_region_selector
        }
    }
)

       
