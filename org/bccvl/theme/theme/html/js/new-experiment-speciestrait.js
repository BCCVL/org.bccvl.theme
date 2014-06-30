//
// main JS for the new species trait model experiment page.
//
define(
    ['jquery', 'js/bccvl-visualiser', 'js/bccvl-wizard-tabs',
     'js/bccvl-stretch', 'js/bccvl-fadeaway', 'js/bccvl-search',
     'js/bccvl-form-validator', 'jquery-tablesorter', 'jquery-arrayutils',
     'select2'],
    function($, viz, wiztabs, stretch, fadeaway, search, formvalidator) {

    $(function() {

        console.log('species trait model experiment page behaviour loaded.');

        // hook up stretchers
        stretch.init({ topPad: 60, bottomPad: 10 });

        // init the visualiser
        viz.init();

        // init the fadeaway instructions
        fadeaway.init();

        // hook up the wizard buttons
        wiztabs.init();

        // hook up the search fields
        search.init();


        // -- hook up algo config -------------------------------
        // algorithm configuration blocks should be hidden and
        // revealed depending on whether the algorithm is
        // selected.

        var $algoCheckboxes = $('input[name="form.widgets.algorithm"]');
        $.each($algoCheckboxes, function(index, checkbox) {
            var $checkbox = $(checkbox);
            // when the checkbox changes, update the config block's visibility
            $checkbox.change( function(evt) {
                var $algoCheckbox = $(evt.target);
                // the config block is the accordion-group that has the checkbox's "value" as its data-function attribute.
                var $configBlock = $('.accordion-group[data-function="' + $algoCheckbox.attr('value') + '"]');
                var $accordionToggle = $configBlock.find('.accordion-toggle');
                var $accordionBody = $configBlock.find('.accordion-body');
                if ($configBlock.length > 0) {
                    // if there is a config block..
                    if ($algoCheckbox.prop('checked')) {
                        $configBlock.show(250);
                    } else {
                        // make sure that the accordion closes before hiding it
                        if ($accordionBody.hasClass('in')) {
                            $accordionBody.collapse('hide');
                            $accordionToggle.addClass('collapsed');
                            $accordionBody.removeClass('in');
                        }
                        // This is to avoid parsley thinking that there are validation errors on algo conifg items that have been
                        // deselected - so we put the default value back into the text field when deselected.
                        $.each($configBlock.find('input[type="number"], input[type="text"]'), function(i, c) {
                            $(c).val($(c).attr('data-default'));
                            $(c).parsley().validate();
                        });
                        
                        $configBlock.hide(250);
                    }
                } else {
                    if (console && console.log) {
                        console.log("no config block located for algorithm/function '" + $algoCheckbox.attr('value') + "'");
                    }
                }
            });
            // finally, invoke the change handler to get the inital visibility sorted out.
            $checkbox.change();
        });

    });
});
