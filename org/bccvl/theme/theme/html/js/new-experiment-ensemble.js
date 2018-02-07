//
// main JS for the new ensemble experiment page.
//
define(
    ['jquery', 'bccvl-wizard-tabs', 'bccvl-form-jquery-validate',
     'jquery.tablesorter', 'bccvl-widgets'],
    function($, wiztabs, formvalidator, tablesorter, bccvl) {

        $(function() {

            console.log('ensemble experiment page behaviour loaded.');

            // hook up the wizard buttons
            wiztabs.init();

            var datasets = new bccvl.SelectDict("datasets");
            // Let Ensemble use facet variants based on experiment type select box
            var $experiment_type = $('#form-widgets-experiment_type');
            datasets.modal.settings.remote = datasets.$modaltrigger.attr("href") + '_' + $experiment_type.val();

            $experiment_type
                .on('change', function(event, par1, par2) {
                    // update settings with new search parameters
                    var exptype = $(this).val();

                    datasets.modal.settings.remote = datasets.$modaltrigger.attr("href") + '_' + exptype;

                    // clear dependent widget

                    datasets.$widget.empty();
                });
                
            $('body').on('click', '#datasets-modal #modal-select-buttons a.select-all', function(e){
                e.preventDefault();
            
                $(this).parents('#datasets-modal').find('input.modal-item-checkbox').each(function(){
                    if ($(this).prop('checked') == false){
                        $(this).trigger('click');
                    }
                });
            });
            
            $('body').on('click', '#datasets-modal #modal-select-buttons a.select-none', function(e){
                e.preventDefault();
                
                $(this).parents('#datasets-modal').find('input.modal-item-checkbox').each(function(){
                   if ($(this).prop('checked') == true){
                        $(this).trigger('click');
                    }
                });
            });

        });
    }
);
