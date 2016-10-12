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
            var traitsTable = new bccvl.SelectList("data_table");

            // -- hook up algo config -------------------------------
            // algorithm configuration blocks should be hidden and
            // revealed depending on whether the algorithm is
            // selected.

            var $algoCheckboxes = $('input[name="form.widgets.algorithm"]');
            $.each($algoCheckboxes, function(index, checkbox) {
                var $checkbox = $(checkbox);

                // when the checkbox changes, update the config block's visibility
                $checkbox.change( function(evt) {

                    // Hide all previously selected config blocks
                    $.each($('div.accordion-group:visible'), function(i1, div) {
                        $accordionGroup = $(div);
                        var $accordionToggle = $accordionGroup.find('.accordion-toggle');
                        var $accordionBody = $accordionGroup.find('.accordion-body');

                        // Collapse if necessary
                        if ($accordionBody.hasClass('in')) {
                            $accordionBody.collapse('hide');
                            $accordionToggle.addClass('collapsed');
                            $accordionBody.removeClass('in');
                        }

                        // This is to avoid validation thinking that there are validation errors on algo conifg items that have been
                        // deselected - so we put the default value back into the text field when deselected.
                        $.each($accordionGroup.find('input[type="number"], input[type="text"]'), function(i2, c) {
                            $(c).val($(c).attr('data-default'));
                        });

                        // Finally - hide
                        $accordionGroup.hide(250);
                    });

                    // Now show the one that was selected
                    $('.accordion-group[data-function="' + $(this).attr('value') + '"]').show(250);
                });

                // start with all algo config groups hidden.
                $('.accordion-group[data-function="' + $(this).attr('value') + '"]').hide(0);
            });

            $('.bccvl-new-speciestrait').on('widgetChanged', function(e){

                console.log(e.target);

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
                        console.log(urls);
                        
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
                                console.log(data);
                                var preview = [];
                                var columns = data.columns;
                                var truncData = data.filter(function(row,i){
                                    if (i < 5){
                                        return row;
                                    }
                                });
                                
                                console.log(truncData);
                                
                                columns.forEach(function(column, i){
                                    
                                    var col = {}
                                    col.name = column;
                                    col.values = []
                                    $.each(truncData, function(i,r){
                                       col.values.push(r[column]); 
                                    });
                                    preview.push(col);

                                });
                                
                                console.log(preview);
                                
                                $.each(preview, function(i, col){
                                    
                                   var newCol = document.createElement('div');
                                   newCol.className = 'span2 trait-column';
                                   var header = document.createElement('div');
                                   header.className = 'trait-title';
                                   header.innerHTML = col.name;
                                   var examples = document.createElement('div');
                                   examples.className = 'trait-row-vals';
                                   console.log(col.values);
                                   $.each(col.values, function(i,v){
                                       examples.innerHTML += '<p>'+v+'</p>'
                                   });
                                   examples.innerHTML += '<p>...</p>'
                                   var input = document.createElement('div');
                                   input.className = 'trait-nom-row';
                                   input.innerHTML = '<select class="trait-nom" name="trait-nomination_'+col.name+'" id="trait-nomination_'+col.name+'">'+
                                                     '<option selected>Please Select ...</option>'+
                                                     '</select>';
                                   
                                   newCol.appendChild(header);
                                   newCol.appendChild(examples);
                                   newCol.appendChild(input);
                                
                                   divTraits.appendChild(newCol);
                                });

                            });
                        })
                    });
                    
                    
                });
            });

        });

    }
);
