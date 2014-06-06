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
            html +=  '<input id="'+experiment.uuid+'" type="checkbox" data-experimenttype="'+type+'" value="'+experiment.uuid+'"></input>';
            html += '</td>';
            html += '<td class="bccvl-table-label">';
            html +=  '<label for="'+experiment.uuid+'">'
            html +=   '<h1>'+experiment.name+'</h1>'
            html +=  '</label>'
            html += '</td>';
            html += '<td class="bccvl-table-controls">';
            html += '</td>';
            html += '</tr>';
            $('table.bccvl-sourceexperimenttable').find('tbody').append(html);
        };

        var loadExperimentData = function(url, type, responseKey) {
            $.ajax({
                url: url,
                dataType: 'json',
                // We do this synchronously so that we can select all SDM exp types on page load.
                async: false,
            }).done(function(data){
                $.each(data[responseKey], function(index, e){
                    appendToExperimentTable(e, type);
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

        // Force a change on page load so we populate experiments 
        $('select.bccvl-inputdatasettype').change();
    });
});
