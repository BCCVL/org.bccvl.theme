
//
// main JS for the dataset upload page.
//
define(     ['jquery', 'js/bccvl-form-validator', 'bootstrap', 'bootstrap-fileupload', 'parsley'],
    function( $      ,  formvalidator ) {
    // ==============================================================
        $(function() {

        	console.log('page behavior loaded');

            // gets the file upload handling working
            $('.fileupload').fileupload();

        	$('#upload-species').click(function(e) {
            	$('div.bccvl-datasetuploadlayerform').addClass('hidden');
            	$('div.bccvl-datasetuploadspeciesform').removeClass('hidden');
                $('a#upload-dataset-title').text('Upload Species Dataset');
            });

			$('#upload-layer').click(function(e) {
            	$('div.bccvl-datasetuploadlayerform').removeClass('hidden');
            	$('div.bccvl-datasetuploadspeciesform').addClass('hidden');
                $('a#upload-dataset-title').text('Upload Environmental Layer');
            });        	

            $('form#addspecies').parsley({
                excluded:     'input[type=hidden], :disabled',  // effectively enable validation of input type file (this is disbaled by default)
                focus:        'none',                           // don't switch focus to errors (we do that manually below)
                successClass: 'success',                        // use these two Bootstrap classes for the error
                errorClass:   'error',                          // and no-error states, and it'll look pretty.
                errors: {
                    // this error handling and elements make parsley errors Bookstrap friendly
                    classHandler: function(el) { return $(el).closest('.control-group'); },
                    container: function(el) {
                        var $controlGroup = $(el).closest('.control-group');
                        var $tableHeader = $controlGroup.find('th');
                        // if the element is in a table, use the table header..
                        if ($tableHeader.length > 0) return $tableHeader;
                        // otherwise use the controlGroup
                        return $controlGroup;
                    },
                    errorsWrapper: '<span class=\"help-inline bccvl-formerror\"></span>',
                    errorElem:     '<span></span>'
                }
            });

        });
    // ==============================================================
    }
);
