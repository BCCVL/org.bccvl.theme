//
// main JS for the dataset upload page.
//
define(
    ['jquery', 'js/bccvl-form-validator', 'bootstrap', 'bootstrap-fileupload', 'parsley',
     'js/bccvl-form-popover'],
    function($, formvalidator ) {
        // ==============================================================
        $(function() {
            var formprefix = "bccvl-upload-";
            var $currentform = null;

            console.log('page behavior loaded');

            // configure popovers
            $('[data-toggle="popover"]').popover();

            // redefine popver click action
            // show new popover and hide currently active popover if any
            $('[data-toggle="popover"]').click(function (e) {
                //e.preventDefault();
                e.stopPropagation();
                $('[data-toggle="popover"]').not(this).popover('hide');
                //$(this).popover('show'); // should be toggle
            });

            // remove visible popover when clicking anywhere on page
            $(document).click(function (e) {
                // if (($('.popover').has(e.target).length == 0) || $(e.target).is('.close')) {
                //     $('.popoverThis').popover('hide');
                // }
                if ($(e.target).parent().find('[data-toggle="popover"]').length > 0) {
                    $('[data-toggle="popover"]').popover('hide');
                }
            });

            // gets the file upload handling working
            $('.fileupload').fileupload();

            $('#upload-dataset-type').change(function(e) {
                var $newform = $('div.' + formprefix + $(this).val());
                if (!$newform.is($currentform)){
                    if ($currentform) {
                        $currentform.addClass('hidden');
                        $currentform = null;
                    }
                    $newform.removeClass('hidden');
                    $currentform = $newform;
                }

                $('div.bccvl-datasetupload-prompt').addClass('hidden');
            });

            // assume parsleyconfig already loaded by bccvl-form-validator.js
            //$('form#addspecies').parsley();

            $("input[id$='-widgets-legalcheckbox']").change(function() {
                var idprefix = this.id.split('-')[0];
                var btnid = idprefix + '-buttons-save';
                if ($(this).is(":checked")) {
                    $("#" + btnid).removeAttr("disabled");
                }
                else {
                    $("#" + btnid).attr('disabled', 'disabled');
                }
            });

            $("div[id^='bccvl-upload-']").submit(function(event) {
                $('.modal').modal({
                    backdrop: 'static'
                });
            });

            $('.modal').on('show', function () {
                $("body").addClass("modal-open");
            });

        });

    // ==============================================================
    }
);
