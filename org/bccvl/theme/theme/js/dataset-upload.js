
//
// main JS for the dataset upload page.
//
define(     ['jquery', 'bootstrap', 'bootstrap-fileupload'],
    function( $ ) {
    // ==============================================================
        $(function() {

        	console.log('page behavior loaded');

            // gets the file upload handling working
            $('.fileupload').fileupload();

        	$('#upload-species').click(function(e) {
            	$('div.bccvl-datasetuploadlayerform').addClass('hidden');
            	$('div.bccvl-datasetuploadspeciesform').removeClass('hidden');
            });

			$('#upload-layer').click(function(e) {
            	$('div.bccvl-datasetuploadlayerform').removeClass('hidden');
            	$('div.bccvl-datasetuploadspeciesform').addClass('hidden');
            });        	

        });
    // ==============================================================
    }
);
