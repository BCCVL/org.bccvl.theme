
//
// main JS for the dataset upload page.
//
define(     ['jquery', 'js/bccvl-form-validator', 'bootstrap', 'bootstrap-fileupload', 'parsley'],
    function( $      ,  formvalidator ) {
    // ==============================================================
        $(function() {

        	console.log('page behavior loaded');

            $(document).popover({selector: ".bccvlfieldhelp",
                                 placement: "left"});


            // gets the file upload handling working
            $('.fileupload').fileupload();

        	/*$('#upload-species').click(function(e) {
            	$('div.bccvl-datasetuploadlayerform').addClass('hidden');
                $('div.bccvl-datasetspeciestraitsform').addClass('hidden');
            	$('div.bccvl-datasetuploadspeciesform').removeClass('hidden');
                $('a#upload-dataset-title').text('Upload Species Dataset');
            });

			$('#upload-layer').click(function(e) {
            	$('div.bccvl-datasetuploadlayerform').removeClass('hidden');
            	$('div.bccvl-datasetuploadspeciesform').addClass('hidden');
                $('div.bccvl-datasetspeciestraitsform').addClass('hidden');
                $('a#upload-dataset-title').text('Upload Environmental Layer');
            });*/

            $('#upload-dataset-type').change(function(e){
                console.log($(this).val())
                if ($(this).val() == "species"){
                    $('div.bccvl-datasetuploadlayerform').addClass('hidden');
                    $('div.bccvl-datasetuploadspeciesform').removeClass('hidden');
                } else if ($(this).val() == "environmental-layer"){
                    $('div.bccvl-datasetuploadlayerform').removeClass('hidden');
                    $('div.bccvl-datasetuploadspeciesform').addClass('hidden');
                }
                $('div.bccvl-datasetupload-prompt').addClass('hidden');
            });

            $('#upload-trait').click(function(e) {
                $('div.bccvl-datasetuploadlayerform').addClass('hidden');
                $('div.bccvl-datasetuploadspeciesform').addClass('hidden');
                $('div.bccvl-datasetspeciestraitsform').removeClass('hidden');
                $('a#upload-dataset-title').text('Upload Species Trait Dataset');
            });

            // assume parsleyconfig already loaded by bccvl-form-validator.js
            $('form#addspecies').parsley();

            $("#dataset-legal-checkbox:checkbox").change(function() {
                if ($(this).is(":checked")) {
                    $("#dataset-save-btn").removeAttr("disabled");
                }
                else {
                    $("#dataset-save-btn").attr('disabled', 'disabled');
                }
            });

            $("#env-legal-checkbox:checkbox").change(function() {
                if ($(this).is(":checked")) {
                    $("#env-save-btn").removeAttr("disabled");
                }
                else {
                    $("#env-save-btn").attr('disabled', 'disabled');
                }
            });

            $("#traits-legal-checkbox:checkbox").change(function() {
                if ($(this).is(":checked")) {
                    $("#addtraits-buttons-save").removeAttr("disabled");
                }
                else {
                    $("#addtraits-buttons-save").attr('disabled', 'disabled');
                }
            });

            $("#addspecies").submit(function(event) {
                $('.modal').modal({
                    backdrop: 'static'
                });
            });

            $("#addlayer").submit(function(event) {
                $('.modal').modal({
                    backdrop: 'static'
                });
            });

            $('.modal').on('show', function () {
                $("body").addClass("modal-open");
            });

            $('i.icon-info-sign').popover();

        });

    // ==============================================================
    }
);
