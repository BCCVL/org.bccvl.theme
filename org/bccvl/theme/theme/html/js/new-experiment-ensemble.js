//
// main JS for the new ensemble experiment page.
//
define(
    ['jquery', 'js/bccvl-wizard-tabs', 'js/bccvl-fadeaway', 'js/bccvl-form-validator', 'jquery-tablesorter', 'jquery-arrayutils', 'select2'],
    function($, wiztabs,                fadeaway,            formvalidator) {

    $(function() {

        console.log('ensemble experiment page behaviour loaded.');

        // init the fadeaway instructions
        fadeaway.init();

        // hook up the wizard buttons
        wiztabs.init();

        var appendToExperimentTable = function(experiment, type) {
            // Rows are hidden by default and displayed on selection.
            html =  '<tr data-experimenttype="' + type +'" hidden>';
            html += '<td class="bccvl-table-choose">';
            html +=  '<input id="'+experiment.uuid+'" class="bccvl-inputexperiment" type="checkbox" data-experimenttype="'+type+'" value="'+experiment.uuid+'"></input>';
            html += '</td>';
            html += '<td class="bccvl-table-label">';
            html +=  '<label for="'+experiment.uuid+'">'
            html +=   '<p>'+experiment.name+'</p>'
            html +=  '</label>'
            html += '</td>';
            html += '<td class="bccvl-table-controls">';
            html += '</td>';
            html += '</tr>';
            $('table.bccvl-sourceexperimenttable').find('tbody').append(html);
        };

        var appendToFilesTable = function(experiment, result) {
            html =  '<tr data-experimentid="' + experiment.uuid + '" hidden>';
            html += '<td class="bccvl-table-choose">';
            html +=  '<input id="'+result.uuid+'" class="bccvl-inputfile" type="checkbox" value="'+result.uuid+'"></input>';
            html += '</td>';
            html += '<td class="bccvl-table-label">';
            html +=  '<label for="'+result.uuid+'">'
            html +=   '<p>'+result.title+'</p>'
            html +=  '</label>'
            html += '</td>';
            html += '<td class="bccvl-table-controls">';
            html += '</td>';
            html += '</tr>';
            $('table.bccvl-inputfiletable').find('tbody').append(html);
        }

        var loadExperimentData = function(url, type, responseKey) {
            $.ajax({
                url: url,
                dataType: 'json',
                // We do this synchronously so that we can select all SDM exp types on page load.
                async: false,
            }).done(function(data){
                $.each(data[responseKey], function(i, e) {
                    appendToExperimentTable(e, type);
                    if (e.result) {
                        $.each(e.result, function(j, r) {
                            appendToFilesTable(e, r);
                        });
                    }
                });
            });
        };

        // Load in all experiment data
        loadExperimentData(portal_url + '/dm/getSDMDatasets', 'sdm', 'sdms');
        loadExperimentData(portal_url + '/dm/getProjectionDatasets', 'projection', 'projections');
        loadExperimentData(portal_url + '/dm/getBiodiverseDatasets', 'biodiverse', 'biodiverses');

        // Listener for change events on the source experiment type drop-down
        $('select.bccvl-inputdatasettype').on("change", function() {
            $('table.bccvl-sourceexperimenttable tbody').find('tr').hide();
            var expType = $(this).val();
            $('table.bccvl-sourceexperimenttable tbody').find('tr[data-experimenttype="'+expType+'"]').show();
        });

        // Listener for change events on source experiment checkboxes
        $('input.bccvl-inputexperiment').on("change", function() {
            var expId = $(this).val();
            if ($(this).is(':checked')) {
                // Show the corresponding files
                $('table.bccvl-inputfiletable tbody').find('tr[data-experimentid="'+expId+'"]').show();
            } else {
                // Hide the corresponding files if they haven't been checked.
                $('table.bccvl-inputfiletable tbody').find('tr[data-experimentid="'+expId+'"]').filter(function(i) {
                    return !$(this).find('input.bccvl-inputfile').is(':checked');
                }).hide();
            }
        });

        // Force a change on page load so we populate experiments 
        $('select.bccvl-inputdatasettype').change();

        // Listener for change events when layer files are selected - so we can create hidden inputs
        $('input.bccvl-inputfile').on("change", function() {
            var $hiddenInputsDiv = $('div#bccvl-hiddeninputs');
            $hiddenInputsDiv.empty();

            // Choose all selected layers
            var $selectedLayerCheckboxes = $('input.bccvl-inputfile').filter(':checked');
            $.each($selectedLayerCheckboxes, function(i, layerCheckbox) {
                var name = "form.widgets.dataset." + i;
                var html = '<input name="' + name + '" value="' + $(layerCheckbox).val() + '" type="hidden" />';
                $hiddenInputsDiv.append(html);
            });

            // Update the count of selected inputs
            var $thresholdCountInput = $('input[name="form.widgets.dataset.count"]');
            $thresholdCountInput.attr('value', $selectedLayerCheckboxes.length);
        });
    });
});
