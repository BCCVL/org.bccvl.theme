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

        

    });
});
