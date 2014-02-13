
//
// main JS for the dataset upload page.
//
define(     ['jquery', 'js/bccvl-form-validator', 'bootstrap', 'bootstrap-fileupload'],
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
                $('a#upload-dataset-title').text('Upload Layer Dataset');
            });        	

        });
    // ==============================================================
    }
);
