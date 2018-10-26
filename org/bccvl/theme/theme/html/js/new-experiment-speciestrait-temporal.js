//
// main JS for the new species trait (temporal) model experiment page.
//
define(
    ['jquery', 'bccvl-visualiser-common',
     'bccvl-wizard-tabs', 'bccvl-form-jquery-validate',
     'jquery.tablesorter',
     'bccvl-form-popover', 'bccvl-visualiser-map',
     'bccvl-widgets', 'openlayers', 'd3', 'zip', 'bccvl-api',
     'new-experiment-common'],
    function($, vizcommon, wiztabs, formvalidator, tablesorter, popover, vizmap, bccvl, ol, d3, zip, bccvlapi, expcommon) {
        $(function() {
            // hook up the wizard buttons
            wiztabs.init();
            
            // set up validator var
            var validator;
            var g_speciesList = [];

            // setup dataset select widgets
            var traitsTable = new bccvl.SelectList("species_traits_dataset");
            new bccvl.SelectDict("environmental_datasets");

            // -- hook up algo config -------------------------------
            expcommon.init_algorithm_selector('input[name^="form.widgets.algorithms_"]', true)
            // -- region selection ---------------------------------
            expcommon.init_region_selector()
            
            var getParameterByName = function(name, url) {
                if (!url) {
                  url = window.location.href;
                }
                name = name.replace(/[\[\]]/g, "\\$&");
                var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                    results = regex.exec(url);
                if (!results) return null;
                if (!results[2]) return '';
                return decodeURIComponent(results[2].replace(/\+/g, " "));
            }
            
            var isRerun = getParameterByName('uuid');
            
            var initTraitsNominationUI = function(target, uuids){
                    $('#nomination-table').empty();
                    //var target = document.getElementById(target);
                    var target = $('#nomination-table')[0];

                    // Determine if the GLMM option is selected in the
                    // Algorithms tab by picking up if the checkbox that
                    // contains the name is checked
                    var isGLMM = $("input[data-friendlyname$='Generalized Linear Mixed Model']").is(":checked");

                    $.each(uuids, function(i, uuid){
                        // get file urls using uuid from widget basket
                        bccvlapi.dm.metadata(uuid).then(function(data, status, jqXHR) {
                            // after getting urls, request file
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
                            target.appendChild(text);
                            var errorDiv = document.createElement('div');
                            errorDiv.setAttribute('id', 'errorMessages');
                            errorDiv.className = 'alert alert-danger';
                            errorDiv.style.display = 'none';
                            target.appendChild(errorDiv);
                            var div = document.createElement('div');
                            div.className = 'row-fluid trait-dataset-summary';
                            var divHeader = document.createElement('div');
                            divHeader.className = 'trait-dataset-summary-header span2';
                            divHeader.innerHTML += '<div class="trait-title">Column Header</div><div class="trait-row-vals">Example Values</div><div class="trait-nom-row">Input Type</div>'
                            div.appendChild(divHeader);
                            var divTraits = document.createElement('div');
                            divTraits.className = 'trait-dataset-summary-traits span10'
                            div.appendChild(divTraits);
                            target.appendChild(div);

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

                                                // Get the species from the trait data
                                                var speciesList = [];
                                                traits.forEach(function(row) {
                                                    if (speciesList.indexOf(row.species) < 0) {
                                                        speciesList.push(row.species);
                                                    }
                                                })
                                                csv.resolve({
                                                    columns: traits.columns,
                                                    truncData: traits.filter(function(row, i) {
                                                        if (i < 5) {
                                                            return row;
                                                        }
                                                    }),
                                                    speciesList: speciesList
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
                                    var speciesList = [];
                                    data.forEach(function(row) {
                                        if (speciesList.indexOf(row.species) < 0) {
                                            speciesList.push(row.species);
                                        }
                                    })
                                    csv.resolve({columns: columns, truncData: truncData, speciesList: speciesList})
                                })
                            }

                            // continue once we have the csv data....
                            csv.then(function(params) {
                                g_speciesList = params.speciesList
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

                                    // Each column gets its own <select> menu to nominate the column
                                    // as a certain type of column (e.g. that it represents the
                                    // latitude data)
                                    //
                                    // At the moment for the temporal STM, we are requesting a
                                    // `Date` column but this may change in future to be split into
                                    // a day/month/year set of three
                                    var input = document.createElement('div');
                                    input.className = 'trait-nom-row';
                                    if(isGLMM){
                                        input.innerHTML = '<select class="trait-temporal-nom required" name="trait-nomination_'+col.name+'" id="trait-nomination_'+col.name+'">'+
                                            '<option selected value="ignore">Ignore</option>'+
                                            '<option value="lat">Latitude</option>'+
                                            '<option value="lon">Longitude</option>'+
                                            '<option value="species">Species Name</option>'+
                                            '<option value="date">Date</option>'+
                                            '<option value="trait_con">Trait (continuous)</option>'+
                                            '<option value="trait_ord">Trait (ordinal)</option>'+
                                            '<option value="trait_nom">Trait (nominal)</option>'+
                                            '<option value="env_var_con">Fixed Factor (continuous)</option>'+
                                            '<option value="env_var_cat">Fixed Factor (categorical)</option>'+
                                            '<option value="random_con" class="glmm">Random Factor (continuous, GLMM only)</option>'+
                                            '<option value="random_cat" class="glmm">Random Factor (categorical, GLMM only)</option>'+
                                            '</select>';
                                    } else {
                                         input.innerHTML = '<select class="trait-temporal-nom required" name="trait-nomination_'+col.name+'" id="trait-nomination_'+col.name+'">'+
                                            '<option selected value="ignore">Ignore</option>'+
                                            '<option value="lat">Latitude</option>'+
                                            '<option value="lon">Longitude</option>'+
                                            '<option value="species">Species Name</option>'+
                                            '<option value="date">Date</option>'+
                                            '<option value="trait_con">Trait (continuous)</option>'+
                                            '<option value="trait_ord">Trait (ordinal)</option>'+
                                            '<option value="trait_nom">Trait (nominal)</option>'+
                                            '<option value="env_var_con">Fixed Factor (continuous)</option>'+
                                            '<option value="env_var_cat">Fixed Factor (categorical)</option>'+
                                            '<option value="random_con" class="glmm" disabled>Random Factor (continuous, GLMM only)</option>'+
                                            '<option value="random_cat" class="glmm" disabled>Random Factor (categorical, GLMM only)</option>'+
                                            '</select>';
                                    }

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

            $('.bccvl-new-speciestrait-temporal').on('widgetChanged', function(e){
                if (e.target.id === 'form-widgets-species_traits_dataset' && traitsTable.modal.basket.uuids.length > 0) {
                    initTraitsNominationUI(e.target.id, traitsTable.modal.basket.uuids); 
                } else if (isRerun){
                    var uuids = []
                    uuids.push($('#form-widgets-species_traits_dataset .selecteditem input[type="hidden"]').data('uuid'));
                    initTraitsNominationUI('form-widgets-species_traits_dataset', uuids); 
                }
            });
            
            
            $('.bccvl-new-speciestrait-temporal').on('click', '#form-widgets-algorithms_species-2', function(){
                if($(this).prop('checked')){
                    $('select.trait-temporal-nom option.glmm').prop('disabled', false);
                } else {
                    $('select.trait-temporal-nom option.glmm').prop('disabled', true);
                }
                if ($(this).parents('form').find('select.trait-temporal-nom').length < 0){
                    validator = $(this).parents('form').validate();
                    validator.element('select.trait-temporal-nom');
                }
            });

            // On click of the submission button
            $("button[name='form.buttons.save']").on('click', function(e) {
                e.preventDefault();

                // Find and validate the form associated with the submit button
                var $form = $(e.target.form);
                var validator = $form.validate();
                if (!validator.form()) {
                    // Validation errors encountered; halt immediately
                    return;
                }

                // Serialise the entire form (all tabs)
                /** @type {{ name: string, value: string }[]} */
                var formValues = $form.serializeArray();

                /** Parameters to be sent to the job API */
                var params = {
                    /**
                     * Selected layers per environmental dataset
                     * 
                     * @type {{[datasetId: string]: string[]}}
                     */
                    environmental_data: {},

                    /**
                     * Parameters for selected algorithms
                     * 
                     * @type {{[algorithmId: string]: {[param: string]: string}}}
                     */
                    algorithms: {},

                    /** 
                     * Dataset columns mapped to their trait nomination values
                     * (e.g. "my_data_species_column" => "species")
                     * 
                     * @type {{[columnName: string]: string}}
                     */
                    columns: {},

                    /**
                     * Species list?
                     * 
                     * @type {any[] | undefined}
                     */
                    species_list: undefined,

                    /** 
                     * Identifies the input dataset's source and ID?
                     * 
                     * @type {object}
                     */
                    traits_data: undefined,

                    /*
                     * Indicate this is a temporal STM
                     */
                    temporal_stm: true
                };

                /**
                 * Temporary object for the copying of algorithm parameters,
                 * containing possibly configuration parameters for algorithms
                 * which have not been selected by the user
                 * 
                 * @type {{[algorithmId: string]: {[param: string]: string}}}
                 */
                var algoparams = {};

                /**
                 * Stores the selected environment dataset index (as appearing
                 * on form) mapped to their respective selected layers
                 * 
                 * @type {{[datasetIndex: string]: string[]}}
                 */
                var env_layers = {};

                /**
                 * Stores the selected environment dataset index (as appearing
                 * on form) mapped to their respective dataset IDs
                 * 
                 * @type {{[datasetIndex: string]: string}}
                 */
                var env_idx_map = {};

                // Go through all form key-value pairs
                for (var i = 0; i < formValues.length; i++) {
                    var param = formValues[i];

                    // Assign `g_speciesList` to `params` object once per form
                    // key-value pair???
                    params.species_list = g_speciesList;

                    // Strip `trait-nomination` prefix in form key-value pairs,
                    // and copy KV pair over to the `columns` object
                    if (param.name.startsWith('trait-nomination_')) {
                        param.name = param.name.slice('trait-nomination_'.length);
                        params.columns[param.name] = param.value;
                        continue;
                    }

                    // Strip `form.widgets` prefix from the name of any form
                    // key-value pairs ahead of below checks
                    if (param.name.startsWith('form.widgets.')) {
                        param.name = param.name.slice('form.widgets.'.length);
                    }

                    // Title and description are elements generated by Dublin
                    // and are encoded directly into the object to be sent to
                    // API
                    if (param.name.startsWith('IDublinCore.')) {
                        // Note this copies the form values to `params`
                        params[param.name.slice('IDublinCore.'.length)] = param.value;
                        continue;
                    }

                    // Extract the ID of the dataset and put it into
                    // `traits_data`
                    if (param.name == "species_traits_dataset:list") {
                        // Note this copies the form values to `params`
                        params.traits_data = {
                            source: 'bccvl',
                            id: param.value     // ID of selected dataset
                        };
                        continue;
                    }

                    // Process environmental dataset selections
                    if (param.name.startsWith('environmental_datasets.')) {
                        var name_parts = param.name.split('.')
                        
                        // Skip non-item fields
                        if (name_parts[1] != 'item') {
                            continue;
                        }

                        /**
                         * Environmental dataset index, as encoded in form
                         * elements
                         */
                        var idx = name_parts[2];

                        // The small checkboxes (for dataset layers) have names
                        // that resemble:
                        //
                        //      `environmental_datasets.item.0.item:list`
                        //
                        // which are different from the general sections, which
                        // are named:
                        //
                        //      `environmental_datasets.item.0`
                        //
                        // Therefore, there the length of the split name is 3,
                        // we only have the general section:
                        if (name_parts.length == 3) {
                            // Save the dataset ID to `env_idx_map`
                            env_idx_map[idx] = param.value;
                            continue;
                        }

                        // We expect only the dataset layer fields to be present
                        // from here onwards

                        // Initialise array if not yet present in `env_layers`
                        if (!env_layers.hasOwnProperty(idx)) {
                            env_layers[idx] = [];
                        }

                        // Push layer name into this dataset's selected layers
                        // array
                        env_layers[idx].push(param.value);

                        continue;
                    }

                    // For the geographic constraint, if there is value set
                    // under `modelling_region` then we parse the JSON and use
                    // that as part of the data sent in the API request
                    if (param.name == 'modelling_region' && param.value) {
                        // Note this copies the form values to `params`
                        params[param.name] = JSON.parse(param.value);
                        continue;
                    }

                    // Collect all selected algorithms (those found on 
                    // "Algorithms" tab); a mapping object is initialised in
                    // advance of the algorithm parameter/configuration
                    //
                    // Note that this is *separate* from `algoparams` which
                    // is used as the temporary algorithm parameter mapping
                    // object and is copied over later
                    if (param.name == 'algorithms_species:list'
                        || param.name == 'algorithms_diff:list') {
                        params.algorithms[param.value] = {};
                        continue;
                    }

                    // At this point we assume that we are only processing
                    // algorithm parameter/configuration information (e.g. GLMM
                    // parameters)
                    //
                    // These are formatted as:
                    //      `[algorithm ID].[parameter_name]`
                    //
                    // Split the name of the input fields to get the parameter
                    // values
                    var name_parts = param.name.split('.');

                    // We expect at least 2 halves for algorithm parameters
                    if (name_parts.length > 1) {
                        // Set up algorithm parameter object in `algoparams` if
                        // not yet present
                        if (!algoparams.hasOwnProperty(name_parts[0])) {
                            algoparams[name_parts[0]] = {};
                        }

                        // Save algorithm parameters into `algoparams`,
                        // stripping ':list' at end of param name if present
                        // (e.g. in the case of <select> fields)
                        algoparams[name_parts[0]][name_parts[1].replace(/:list$/g, '')] = param.value;
                        continue
                    }

                }

                // Copy algorithm parameters only for *selected* algorithms
                for (var algoid in params.algorithms) {
                    params.algorithms[algoid] = algoparams[algoid];
                }

                // For each environment dataset, copy layers only where the 
                // array of layers actually contains content
                for (var envds in env_idx_map) {
                    if (env_layers[envds].length > 0) {
                        params.environmental_data[env_idx_map[envds]] = env_layers[envds];
                    }
                }

                // Disable the submission button while we send the request
                var $submitButton = $(e.target);
                $submitButton.prop('disabled', true);

                // Send request to API
                var submit = bccvlapi.em.submittraits(params);
                $.when(submit).then(
                    function(data, status, jqxhr) {
                        // Success - redirect to result page
                        //
                        // This replaces the current location in the browser's
                        // history to simulate a redirect, rather than just a
                        // normal navigation
                        window.location.replace(data.experiment.url);
                    },
                    function(jqxhr, status, error) {
                        // Failure
                        alert('Experiment submission failed.\n' + JSON.stringify(jqxhr.responseJSON, null, 2));

                        // Re-enable submit button
                        $submitButton.prop('disabled', false);
                    }
                );
            });

            var constraints = expcommon.init_constraints_map('.constraints-map', $('a[href="#tab-geo"]'), 'form-widgets-modelling_region')

            $('.bccvl-new-speciestrait-temporal').on('widgetChanged', function(e){
                // bind widgets to the constraint map

                // FIXME: the find is too generic (in case we add bboxes everywhere)
                expcommon.update_constraints_map(constraints, $('body').find('input[data-bbox]'));
                // always default to convex hull after a selection.
                $("#use_convex_hull").prop('checked', true);

            })
            
            $('.bccvl-new-speciestrait-temporal').trigger('widgetChanged');
            
            $('.bccvl-new-speciestrait-temporal').on('change', 'select.trait-temporal-nom', function(e){
                // find form
                var $form = $(e.target.form)
                // validate form
                var validator = $form.validate()
                $('select.trait-temporal-nom').each(function(el){
                    validator.element($(this));
                });
                
            })
        });
    }
);
