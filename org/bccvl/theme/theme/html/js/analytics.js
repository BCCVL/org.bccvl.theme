//
// analytics code and events for app
//


//
// THESE ARE CUSTOM TRACKING EVENTS FOR ANALYTICS REPORTING
// CODE IS INCLUDED VIA PLONE INTERFACE, NOT REQUIREJS
// THIS FILE IS MERELY USED AS A LOGICAL STORAGE SPACE
// FOR DEVS TO FIND EVENTS AND TRACK THEM.
//

$(function(){

    // Datasets page events
    $('section.bccvl-datasetlist').on('click', '.datasets-list-entry .dropdown-button', function(){
        _gaq.push(['_trackEvent', 'Datasets Browse Interface', 'View Dataset Details', 'Dataset Details Button Click']);
    });
    $('section.bccvl-datasetlist').on('click', '.datasets-list-entry .dataset-download-btn', function(){
        var label = $(this).attr('href');
        _gaq.push(['_trackEvent', 'Datasets Browse Interface', 'Download', label ]);
    });
    $('section.bccvl-datasetlist').on('change', '.filter input[type="checkbox"]', function(){
        var label = $(this).attr('name')+', '+$(this).attr('value');
        _gaq.push(['_trackEvent', 'Datasets Browse Interface', 'Filter Selection', label ]);
    });
    $('section.bccvl-datasetlist').on('change', '.filter #datasets-filter-text', function(){
        _gaq.push(['_trackEvent', 'Datasets Browse Interface', 'Keyword Filter Input', $(this).val() ]);
    });
    $('section.bccvl-datasetlist').on('click', '#datasets-filter-submit', function(){
        _gaq.push(['_trackEvent', 'Datasets Browse Interface', 'Submit', 'Apply Filters Button Click']);
    });
    // TO DO: Get rid of query keys, send only values
    if ($('section.bccvl-datasetlist').length > 0  && $('section.bccvl-datasetlist').find('.datasets-list-entry').length <= 0) {
        // send event for no results
        var query = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&').join(' ');
        _gaq.push(['_trackEvent', 'Datasets Browse Interface', 'No Results', query ]);
    }


    // Dataset import page
    $('section.bccvl-datasetimport').on('change', '.bccvl-datasetimportform input[name="searchOccurrence_query"]', function(){
        _gaq.push(['_trackEvent', 'Datasets Import Interface', 'Keyword Search', $(this).val() ]);
    });
    $('section.bccvl-datasetimport').on('click', '.bccvl-datasetimportform .import-dataset-btn', function(){
        var label = $(this).data('friendlyname');
        _gaq.push(['_trackEvent', 'Datasets Import Interface', 'Submit', label ]);
    });
    // Dataset upload page
    $('section.bccvl-datasetupload').on('change', '#upload-dataset-type', function(){
        _gaq.push(['_trackEvent', 'Datasets Upload Interface', 'Type Selection', $(this).val() ]);
    });
    $('section.bccvl-datasetupload').on('click', 'button[type="submit"]', function(){
        var label = $(this).attr('id');
        _gaq.push(['_trackEvent', 'Datasets Upload Interface', 'Submit', label ]);
    });
    // Experiments page events
    $('section.bccvl-experimentlist').on('click', '.bccvl-table-controls .experiment-view-btn', function(){
         var label = $(this).data('friendlyname');
        _gaq.push(['_trackEvent', 'Experiments Page', 'View Experiment', label ]);
    });
    $('section.bccvl-experimentlist').on('click', '.bccvl-table-controls .experiment-rerun-btn', function(){
         var label = $(this).data('uuid');
        _gaq.push(['_trackEvent', 'Experiments Page', 'Rerun Experiment', label ]);
    });
    // Knowledge base events
    $('section.bccvl-knowledgebase').on('click', '.bccvl-kbsearchcontent a.title_link', function(){
        _gaq.push(['_trackEvent', 'Support', 'Title Click', $(this).text() ]);
    });
    // New Experiment tab events
    $('section.bccvl-new-sdm .bccvl-wizardtabs a[data-toggle="tab"]').on('shown', function(e){
        /*  e.target // activated tab
            e.relatedTarget // previous tab */
            var label = $(e.target).text()+' - '+$(e.relatedTarget).text();
        _gaq.push(['_trackEvent', 'New SDM Experiment', 'Tab Change', label ]);
    });
    $('section.bccvl-new-projection .bccvl-wizardtabs a[data-toggle="tab"]').on('shown', function(e){
        var label = $(e.target).text()+' - '+$(e.relatedTarget).text();
        _gaq.push(['_trackEvent', 'New CCE Experiment', 'Tab Change', label ]);
    });
    $('section.bccvl-new-biodiverse .bccvl-wizardtabs a[data-toggle="tab"]').on('shown', function(e){
        var label = $(e.target).text()+' - '+$(e.relatedTarget).text();
        _gaq.push(['_trackEvent', 'New Biodiverse Experiment', 'Tab Change', label ]);
    });
    $('section.bccvl-new-speciestrait .bccvl-wizardtabs a[data-toggle="tab"]').on('shown', function(e){
        var label = $(e.target).text()+' - '+$(e.relatedTarget).text();
        _gaq.push(['_trackEvent', 'New Species Trait (Spatial) Experiment', 'Tab Change', label ]);
    });
    $('section.bccvl-new-speciestrait-temporal .bccvl-wizardtabs a[data-toggle="tab"]').on('shown', function(e){
        var label = $(e.target).text()+' - '+$(e.relatedTarget).text();
        _gaq.push(['_trackEvent', 'New Species Trait (Temporal) Experiment', 'Tab Change', label ]);
    });
    $('section.bccvl-new-ensemble .bccvl-wizardtabs a[data-toggle="tab"]').on('shown', function(e){
        var label = $(e.target).text()+' - '+$(e.relatedTarget).text();
        _gaq.push(['_trackEvent', 'New Ensemble Experiment', 'Tab Change', label ]);
    });
    $('input[name="constraints_type"]').on('click', function(e){
        var label = $(e.target).attr('id');
        _gaq.push(['_trackEvent', 'New Experiment', 'Constraint Selection', label ]);
    });
    $('section.bccvl-new-sdm').on('click', 'button.bccvllinks-experiment-start', function(){
        _gaq.push(['_trackEvent', 'New SDM Experiment', 'Submit' ]);
    });
    $('section.bccvl-new-projection').on('click', 'button.bccvllinks-experiment-start', function(){
        _gaq.push(['_trackEvent', 'New CCE Experiment', 'Submit' ]);
    });
    $('section.bccvl-new-biodiverse').on('click', 'button.bccvllinks-experiment-start', function(){
        _gaq.push(['_trackEvent', 'New Biodiverse Experiment', 'Submit' ]);
    });
    $('section.bccvl-new-speciestrait').on('click', 'button.bccvllinks-experiment-start', function(){
        _gaq.push(['_trackEvent', 'New Species Trait (Spatial) Experiment', 'Submit' ]);
    });
    $('section.bccvl-new-speciestrait-temporal').on('click', 'button.bccvllinks-experiment-start', function(){
        _gaq.push(['_trackEvent', 'New Species Trait (Temporal) Experiment', 'Submit' ]);
    });
    $('section.bccvl-new-ensemble').on('click', 'button.bccvllinks-experiment-start', function(){
        _gaq.push(['_trackEvent', 'New Ensemble Experiment', 'Submit' ]);
    });
    // Validation events for new experiment tabs
    $('section.bccvl-new-sdm').prev('section.bccvl-flashmessages').on('validationError', function(){
        _gaq.push(['_trackEvent', 'New SDM Experiment', 'Validation Error' ]);
    });
    $('section.bccvl-new-projection').prev('section.bccvl-flashmessages').on('validationError', function(){
        _gaq.push(['_trackEvent', 'New CCE Experiment', 'Validation Error' ]);
    });
    $('section.bccvl-new-biodiverse').prev('section.bccvl-flashmessages').on('validationError', function(){
        _gaq.push(['_trackEvent', 'New Biodiverse Experiment', 'Validation Error' ]);
    });
    $('section.bccvl-new-speciestrait').prev('section.bccvl-flashmessages').on('validationError', function(){
        _gaq.push(['_trackEvent', 'New Species Trait (Spatial) Experiment', 'Validation Error' ]);
    });
    $('section.bccvl-new-speciestrait-temporal').prev('section.bccvl-flashmessages').on('validationError', function(){
        _gaq.push(['_trackEvent', 'New Species Trait (Temporal) Experiment', 'Validation Error' ]);
    });
    $('section.bccvl-new-ensemble').prev('section.bccvl-flashmessages').on('validationError', function(){
        _gaq.push(['_trackEvent', 'New Ensemble Experiment', 'Validation Error' ]);
    });
    // Generic events to track
    $('.bccvl-main').on('click', 'a.export-map', function(){
        _gaq.push(['_trackEvent', 'Map Interaction', 'Image Export', $(this).attr('download') ]);
    });
    $('#portal-globalnav').on('click', 'a', function(){
        var label = $(this).text();
        _gaq.push(['_trackEvent', 'Main nav', 'Click', label ]);
    });

    // login events
    $('#portal-nav').on('click', '.bccvllinks-login', function(){
        _gaq.push(['_trackEvent', 'Main Nav', 'Login Button' ]);
    });
    // Dashboard events
    $('.bccvl-dashboardlists').on('click', '.bccvllinks-datasets', function(){
        var label = $(this).text();
        _gaq.push(['_trackEvent', 'Dashboard', 'Exit to datasets', label ]);
    });
    $('.bccvl-dashboardlists').on('click', '.bccvllinks-experiments', function(){
        var label = $(this).text();
        _gaq.push(['_trackEvent', 'Dashboard', 'Exit to experiments', label ]);
    });
});
