//
// main JS for the new species trait model experiment page.
//
define(
    ['jquery', 'bccvl-preview-layout',
     'bccvl-wizard-tabs', 'bccvl-search', 'bccvl-form-jquery-validate',
     'jquery-tablesorter', 'jquery-arrayutils',
     'bccvl-form-popover', 'bccvl-visualiser-map',
     'bbq', 'faceted_view.js', 'bccvl-widgets', 'livechat', 'd3'],
    function($, preview_layout, wiztabs, search, formvalidator, tablesorter, arrayutils, popover, vizmap, bbq, faceted, bccvl, livechat, d3) {

        $(function() {

            console.log('species trait model experiment page behaviour loaded.');

            // hook up stretchers
            //stretch.init({ topPad: 60, bottomPad: 10 });

            // hook up the wizard buttons
            wiztabs.init();

            // hook up the search fields
            search.init();
            
            // dataset manager getMetadata endpoint url
            var dmurl = portal_url + '/API/dm/v1/metadata';
            
            // setup dataset select widgets
            var traitsTable = new bccvl.SelectList("species_traits_dataset");
            new bccvl.SelectDict("environmental_datasets");

            // -- hook up algo config -------------------------------
            // algorithm configuration blocks should be hidden and
            // revealed depending on whether the algorithm is
            // selected.

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
                        var jqxhr = $.Deferred();
                        
                        var urls = [];
                        // get file urls using uuid from widget basket
                        $.ajax({
                            url: dmurl,
                            type: 'GET',
                            dataType: 'xml json',
                            converters: {'xml json': $.xmlrpc.parseDocument},
                            data: {'uuid': uuid}
                        }).done(function(response) {
                            $.each(response, function(i,d){
                                urls.push(d.file);
                            });
                            jqxhr.resolve(urls);
                        });
                        
                        // after getting urls, request file
                        jqxhr.then(function(data, status, jqXHR) {
                            
                            $.each(urls, function(i, url){
                                
                                // set up dom node
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
                                
                                // parse and filter for columns and five rows
                                d3.csv(url, function(error, data) {
    
                                    var preview = [];
                                    var columns = data.columns;
                                    var truncData = data.filter(function(row,i){
                                        if (i < 5){
                                            return row;
                                        }
                                    });
                                    
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
                                                         '<option value="trait_cat">Trait (categorical)</option>'+
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
                            })
                        });
                        
                        
                    });
                }
            });

        });

    }
);
