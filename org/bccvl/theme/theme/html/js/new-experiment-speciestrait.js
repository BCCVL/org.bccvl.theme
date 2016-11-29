//
// main JS for the new species trait model experiment page.
//
define(
    ['jquery', 'bccvl-visualiser-common',
     'bccvl-wizard-tabs', 'bccvl-search', 'bccvl-form-jquery-validate',
     'jquery-tablesorter', 'jquery-arrayutils',
     'bccvl-form-popover', 'bccvl-visualiser-map',
     'bbq', 'faceted_view.js', 'bccvl-widgets', 'openlayers3', 'livechat', 'd3', 'zip', 'bccvl-api'],
    function($, vizcommon, wiztabs, search, formvalidator, tablesorter, arrayutils, popover, vizmap, bbq, faceted, bccvl, ol, livechat, d3, zip, bccvlapi) {

        $(function() {

            console.log('species trait model experiment page behaviour loaded.');

            // hook up stretchers
            //stretch.init({ topPad: 60, bottomPad: 10 });
            
            // check for Firefox to avoid ZIP issue
            if(typeof InstallTrigger !== 'undefined'){
                $('#experimentSetup .alert').after('<div class="alert alert-block alert-error fade in">'+
                    '<button type="button" class="close" data-dismiss="alert">×</button>'+
                    '<h4 class="alert-heading">Features on this page are incompatible with Firefox</h4>'+
                    '<p>Currently there are issues preventing the use of Firefox for submitting this experiment type.  The BCCVL support team are working to resolve them, but recommend using <a href="https://www.google.com/chrome/browser/desktop/" target="_blank">Google Chrome</a> as your browser for the BCCVL until further notice.</p>'+
                '</div>');
            }

            // hook up the wizard buttons
            wiztabs.init();

            // hook up the search fields
            search.init();
            
            // setup dataset select widgets
            var traitsTable = new bccvl.SelectList("species_traits_dataset");
            new bccvl.SelectDict("environmental_datasets");
            
            // -- region selection ---------------------------------

            var xhr;
            var select_type, $select_type;
            var select_region, $select_region;

            $select_type = $('#select-region-type').selectize({
                onChange: function(value) {
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

            // -- hook up algo config -------------------------------
            // algorithm configuration blocks should be hidden and
            // revealed depending on whether the algorithm is
            // selected.
            
            $('#tab-enviro').on('click', '#form-widgets-environmental_datasets a.select-all', function(){
                $(this).parents('.selecteditem').find('ul li input[type="checkbox"]').prop('checked', 'checked');
            });

            $('#tab-enviro').on('click', '#form-widgets-environmental_datasets a.select-none', function(){
                // for some reason we have to remove the property as well to get the html to update in chrome, though the UI works fine
                $(this).parents('.selecteditem').find('ul li input[type="checkbox"]').each(function(){
                    $(this).prop('checked', false);
                });
            });
            
            // TODO: move  select-all / select-none into widget?
            $('#tab-configuration').on('click', 'a.select-all', function(){
                console.log('what');
                $(this).parents('table').find('tbody input[type="checkbox"]').prop('checked', 'checked').trigger('change');
            });

            $('#tab-configuration').on('click', 'a.select-none', function(){
                $(this).parents('table').find('tbody input[type="checkbox"]').prop('checked', false).trigger('change');;  
            });

            var $algoCheckboxes = $('input[name^="form.widgets.algorithms_"]');
            $.each($algoCheckboxes, function(index, checkbox) {
                var $checkbox = $(checkbox);

                // when the checkbox changes, update the config block's visibility
                $checkbox.change( function(evt) {
                    var $algoCheckbox = $(evt.target);
                    // the config block is the accordion-group that has the checkbox's "value" as its data-function attribute.
                    var $configBlock = $('.accordion-group[data-function="' + $algoCheckbox.attr('value') + '"]');
                    var $accordionToggle = $configBlock.find('.accordion-toggle');
                    var $accordionBody = $configBlock.find('.accordion-body');
                    if ($configBlock.length > 0) {
                        // if there is a config block..
                        if ($algoCheckbox.prop('checked')) {
                            $configBlock.show(250);
                            // By default, pa strategy is random when no pseudo absence data. Otherwise is none i.e. do not generate pseudo absence points.
                            $('select[name="form.widgets.' + $algoCheckbox.attr('value') + '.pa_strategy:list"]').val($('#have_absence').checked ? 'none' : 'random');
                        } else {
                            // make sure that the accordion closes before hiding it
                            if ($accordionBody.hasClass('in')) {
                                $accordionBody.collapse('hide');
                                $accordionToggle.addClass('collapsed');
                                $accordionBody.removeClass('in');
                            }
                            // This is to avoid validation thinking that there are validation errors on algo conifg items that have been
                            // deselected - so we put the default value back into the text field when deselected.
                            $.each($configBlock.find('input[type="number"], input[type="text"]'), function(i, c) {
                                $(c).val($(c).attr('data-default'));
                            });

                            $configBlock.hide(250);
                        }
                    } else {
                        if (console && console.log) {
                            console.log("no config block located for algorithm/function '" + $algoCheckbox.attr('value') + "'");
                        }
                    }
                });
                // finally, invoke the change handler to get the inital visibility sorted out.
                $checkbox.change();
            });

            $('.bccvl-new-speciestrait').on('widgetChanged', function(e){
                
                if (e.target.id === 'form-widgets-species_traits_dataset' && traitsTable.modal.basket.uuids.length > 0) {
                    
                    $('#'+e.target.id+' .trait-dataset-summary').empty();

                    $.each(traitsTable.modal.basket.uuids, function(i, uuid){
                        // get file urls using uuid from widget basket
                        var jqxhr = bccvlapi.dm.metadata(uuid)
                        
                        // after getting urls, request file
                        jqxhr.then(function(data, status, jqXHR) {
                            // it's an xmlrpc call.... get first element in array
                            data = data[0]
                            /* data keys:
                                  headers ... all headers in csv
                                  traits ... all headers with trait variables
                                  environ ... all headers with environ variables
                                  mimetype ... application/zip ?
                                  file ... download url
                            */

                            // set up dom node
                            var text = document.createElement('div');
                            text.className = 'row-fluid';
                            text.innerHTML += '<div class="span12"><p>You can select which traits and/or environmental variables should be used in the analyses by using the drop down menus below. Note that at least one trait variable must be nominated. Environmental variables are optional here, as BCCVL-provided environmental data can be selected in the next tab.</p></div>'
                            e.target.appendChild(text);
                            var div = document.createElement('div');
                            div.className = 'row-fluid trait-dataset-summary';
                            var divHeader = document.createElement('div');
                            divHeader.className = 'trait-dataset-summary-header span2';
                            divHeader.innerHTML += '<div class="trait-title">Column Header</div><div class="trait-row-vals">Example Values</div><div class="trait-nom-row">Input Type</div>'
                            div.appendChild(divHeader);
                            var divTraits = document.createElement('div');
                            divTraits.className = 'trait-dataset-summary-traits span10'
                            div.appendChild(divTraits);
                            e.target.appendChild(div);

                            var csv = $.Deferred();
                            if (data.mimetype == 'application/zip') {

                                // iterate over layers and pick first one as csv data file
                                // FIXME: should use proper criteria to find traits data file
                                //        like layer identifier or class etc...
                                var filename;
                                for(var layer in data.layers) {
                                    if (data.layers.hasOwnProperty(layer)) {
                                        if (data.layers[layer].filename.toLowerCase().indexOf('citation') < 0) {
                                            filename = data.layers[layer].filename
                                            break
                                        }
                                    }
                                }

                                // Extract traits data from zip file
                                zip.useWebWorkers = false;
                                var httpReader = new zip.HttpReader(data.file);
                                var zipReader = zip.createReader(httpReader, function(reader) {
                                    // get all entries from the zip
                                    reader.getEntries(function(entries) {
                                        // Look for file that end with filename.
                                        for (var i = 0; i < entries.length; i++) {
                                            if (!entries[i].filename.endsWith(filename)) {
                                                continue;
                                            }
                                            // Get the data
                                            entries[i].getData(new zip.TextWriter(), function(data) {
                                                // Parse data to extract the coordinates
                                                var traits = d3.csvParse(data);
                                                // close the zip reader
                                                reader.close();

                                                csv.resolve({
                                                    columns: traits.columns,
                                                    truncData: traits.filter(function(row, i) {
                                                        if (i < 5) {
                                                            return row;
                                                        }
                                                    })
                                                })
                                                             
                                            });
                                        }
                                    });
                                    
                                }, function(error) {
                                    // onerror callback
                                    console.log("drawConvexhullPolygon:", error);
                                    throw error;
                                });
                                
                            } else if (data.mimetype == 'text/csv') {
                                // parse and filter for columns and five rows
                                d3.csv(data.file, function(error, data) {
                                    var columns = data.columns
                                    var truncData = data.filter(function(row,i) {
                                        if (i < 5){
                                            return row;
                                        }
                                    })
                                    csv.resolve({columns: columns, truncData: truncData})
                                })
                            }

                            // continue once we have the csv data....
                            csv.then(function(params) {
                                var columns = params.columns
                                var truncData = params.truncData

                                var preview = [];
                                columns.forEach(function(column, i){
                                    
                                    var col = {}
                                    col.name = column;
                                    col.values = []
                                    $.each(truncData, function(i,r){
                                        col.values.push(r[column]); 
                                    });
                                    preview.push(col);
                                });

                                $.each(preview, function(i, col){
                                        
                                    var newCol = document.createElement('div');
                                    newCol.className = 'span3 trait-column';
                                    var header = document.createElement('div');
                                    header.className = 'trait-title';
                                    header.innerHTML = col.name;
                                    var examples = document.createElement('div');
                                    examples.className = 'trait-row-vals';
                                    $.each(col.values, function(i,v){
                                        examples.innerHTML += '<p>'+v+'</p>'
                                    });
                                    examples.innerHTML += '<p>...</p>'
                                    var input = document.createElement('div');
                                    input.className = 'trait-nom-row';
                                    input.innerHTML = '<select class="trait-nom required" name="trait-nomination_'+col.name+'" id="trait-nomination_'+col.name+'">'+
                                        '<option selected value="ignore">Ignore</option>'+
                                        '<option value="lat">Latitude</option>'+
                                        '<option value="lon">Longitude</option>'+
                                        '<option value="species">Species Name</option>'+
                                        '<option value="trait_con">Trait (continuous)</option>'+
                                        '<option value="trait_ord">Trait (ordinal)</option>'+
                                        '<option value="trait_nom">Trait (nominal)</option>'+
                                        '<option value="env_var_con">Env. Variable (continuous)</option>'+
                                        '<option value="env_var_cat">Env. Variable (categorical)</option>'+
                                        '</select>';
                                    
                                    $(input).find('select option').each(function(){
                                        if (col.name.toLowerCase() === $(this).val().toLowerCase()){
                                            $(this).prop('selected', true);
                                        }
                                    });
                                    
                                    newCol.appendChild(header);
                                    newCol.appendChild(examples);
                                    newCol.appendChild(input);
                                    
                                    divTraits.appendChild(newCol);
                                });
                                
                            });

                        });
                        
                    });
                }
            });


            // submit button:

            $("button[name='form.buttons.save']").on('click', function(e) {
                e.preventDefault()
                // find form
                var $form = $(e.target.form)
                // validate form
                var validator = $form.validate()
                if (! validator.form()) {
                    // validation errors .... stop here
                    return
                }
                // find all form values
                var formvalues = $form.serializeArray()
                // convert formvalues to object:
                var params = {
                    environmental_data: {},
                    algorithms: {},
                    columns: {}
                }
                var algoparams = {}
                var env_layers = {}
                var env_idx_map = {}
                for (var i=0; i < formvalues.length; i++) {
                    var param = formvalues[i]
                    // column definition?
                    if (param.name.startsWith('trait-nomination_')) {
                        param.name = param.name.slice('trait-monitanion_'.length)
                        params.columns[param.name] = param.value
                        continue
                    }
                    // other?
                    if (param.name.startsWith('form.widgets.')) {
                        param.name = param.name.slice('form.widgets.'.length)
                    }
                    // title, description
                    if (param.name.startsWith('IDublinCore.')) {
                        params[param.name.slice('IDublinCore.'.length)] = param.value
                        continue
                    }
                    if (param.name == "species_traits_dataset:list") {
                        params.traits_data = {
                            source: 'bccvl',
                            id: param.value
                        }
                        continue
                    }
                    if (param.name.startsWith('environmental_datasets.')) {
                        var name_parts = param.name.split('.')
                        //
                        if (name_parts[1] != 'item') {
                            // skip non item fields
                            continue
                        }
                        var idx = name_parts[2]
                        // environmental_datasets.item.0
                        // environmental_datasets.item.0.item:list
                        if (name_parts.length == 3) {
                            // a dataset id
                            env_idx_map[idx] = param.value
                            continue
                        }
                        // a layer id within dataset -> array
                        if (! env_layers.hasOwnProperty(idx)) {
                            env_layers[idx] = []
                        }
                        env_layers[idx].push(param.value)
                        continue
                    }
                    if (param.name == 'modelling_region' && param.value) {
                        params[param.name] = JSON.parse(param.value)
                        continue
                    }
                    if (param.name == 'algorithms_species:list'
                        || param.name == 'algorithms_diff:list') {
                        // collect selected algorithms
                        params.algorithms[param.value] = {}
                        continue
                    }

                    var name_parts = param.name.split('.')
                    if (name_parts.length > 1) {
                        // should be algo params here
                        if (! algoparams.hasOwnProperty(name_parts[0])) {
                            algoparams[name_parts[0]] = {}
                        }
                        algoparams[name_parts[0]][name_parts[1]] = param.value
                        continue
                    }
                    
                }
                // assign algo params to selected algorithms
                for (var algoid in params.algorithms) {
                    params.algorithms[algoid] = algoparams[algoid]
                }
                // build env_ds option
                for (var envds in env_idx_map) {
                    if (env_layers[envds].length >0) {
                        params.environmental_data[env_idx_map[envds]] = env_layers[envds]
                    }
                }
                
                // submit ... disable button
                $(e.target).prop('disabled', true)                
                var submit = bccvlapi.em.submittraits(params)
                $.when(submit).then(
                    function(data, status, jqxhr) {
                        // success - redirect to result page
                        window.location.replace(data.experiment.url)  // simulate redirect rather than click navigate
                    },
                    function(jqxhr, status, error) {
                        // on error update form ...
                        // status=="error"
                        // error ... http status string
                        // jqxhr.status == 503
                        // errors = jqxhr.responseJSON
                        // ct = jqxhr.getResponseHeader('Content-Type')
                        // l = jqxhr.getResponseHeader('Content-Length')


                        // 503 - Service Unavailable ... generic error?
                        //     {"errors": [{"title": "algorithm_species"}]}
                        //

                        // 400  - Bad Request
                        // ... normal parameter error?
                        alert('Experiment submission failed.\n' + JSON.stringify(jqxhr.responseJSON, null, 2))

                        // reactivate button
                        $(e.target).prop('disabled', false)
                    }
                )

            });
            
            $.when(vizcommon.renderBase($('.constraints-map').attr('id'))).then(function(map, visLayers) {
                // add layers for bboxes and drawing area
                var features = new ol.Collection(); // drawn feature
                var constraintsLayer = new ol.layer.Vector({
                    source: new ol.source.Vector({
                        wrapX: false,
                        features: features
                    }),
                    id: 'constraints_layer',
                    style: new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'rgba(0, 160, 228, 0.1)'
                        }),
                        stroke: new ol.style.Stroke({
                            color: 'rgba(0, 160, 228, 0.9)',
                            width: 2
                        })
                    })
                });
                var bboxLayer = new ol.layer.Vector({
                    source: new ol.source.Vector({wrapX: false}),
                    id: 'dataset_bounds'
                });
                var vectors = new ol.layer.Group({
                    // extent: ... set to Mercator bounds [-180, -85, +180, +85]
                    layers: [
                        bboxLayer,
                        constraintsLayer
                    ]
                });
                map.addLayer(vectors);
                var mapid = $('.constraints-map').attr('id');

                // map.updateSize()
                if ($('.constraints-map').not(':visible')) {
                    $('a[href="#tab-geo"]').one('shown', function(evt) {
                        map.updateSize();
                        var world = [-20037508.342789244, -19971868.880408563, 20037508.342789244, 19971868.88040853];
                        // visLayers-> group
                        // bboxLayer
                        // constraintsLayer
                        var bext = bboxLayer.getSource().getExtent();
                        map.getView().fit(world, map.getSize(), {'constrainResolution': false});
                    });
                }
                
                // set up constraint tools
                vizcommon.constraintTools(map, constraintsLayer, 'form-widgets-modelling_region');

                
                $('.bccvl-new-speciestrait').on('widgetChanged', function(e){
                    // bind widgets to the constraint map
                    // recreate legend
                    $('#'+map.getTarget()).find('.olLegend').remove();
                    vizcommon.createLegendBox(map.getTarget(), 'Selected Datasets');

                    // clear any existing layers.
                    visLayers.getLayers().clear(); // clear species layers
                    bboxLayer.getSource().clear(); // clear bboxes as well
                    vizcommon.setOccurrencePolygon(null); // reset the occurrence convex-hull polygon
                    constraintsLayer.getSource().clear(); // clear the constraint

                    var geometries = [];
                    // FIXME: the find is too generic (in case we add bboxes everywhere)
                    $('body').find('input[data-bbox]').each(function(){
                        var type = $(this).data('genre');
                        if (type == 'DataGenreSpeciesOccurrence' ||
                            type == 'DataGenreSpeciesAbsence' ||
                            type == 'DataGenreTraits') {

                            var data_url = $(this).data('url');
                            vizcommon.addLayersForDataset($(this).val(), data_url, mapid, null, visLayers).then(function(newLayers) {
                                // FIXME: assumes only one layer because of species data
                                var newLayer = newLayers[0];
                                vizcommon.addLayerLegend(
                                    map.getTarget(),
                                    newLayer.get('title'),
                                    newLayer.get('bccvl').layer.style.color, null, null);
                                
                            })
                        } else {

                            var geom = $(this).data('bbox');
                            geom = new ol.geom.Polygon([[
                                [geom.left, geom.bottom],
                                [geom.right, geom.bottom],
                                [geom.right, geom.top],
                                [geom.left, geom.top],
                                [geom.left, geom.bottom]
                            ]]);
                            geom.type = type;
                            geometries.push(geom);
                        }

                    });
                    // draw collected geometries
                    vizcommon.drawBBoxes(map, geometries, bboxLayer);
                });

            });
        });
        
    }
);
