
// JS code to make BCCVL dimension equations work.
//
// A dimension chooser is a tag with the class .bccvl-dimension-selection.
// TODO: better docs

define(     ['jquery'],
    function( $      ) {
        // ==========================================================

        // only need an init function...
        return { init: function() {

            // find all the dimension choosers..
            var selectors = $('.bccvl-dimension-selection');

            // loop through each dimension chooser, setting up any dimension values in it.
            $.each(selectors, function(dsIndex, selector) {
                // get some jQuery objects together..
                var $selector = $(selector);
                var $values = $selector.find('.bccvl-dimension-value');

                if ($values.length == 0) return; // bail if there's no values to update

                // find the product values and remove them from the set
                var $products = $selector.find('.bccvl-dimension-value[data-dimension-name="projProduct"]');
                $values = $values.not($products);

                // set up the relevant form fields for each dimension value
                $.each($values, function(valIndex, value) {
                    var $value = $(value);
                    // pick out the dimension's name
                    var dName = $value.attr('data-dimension-name');
                    // bail if there's no dimension name, or it's a product.
                    if (!dName || dName == 'projProduct') return;

                    // find the checkboxes that correspond with that name
                    var $checkboxes = $selector.find('input[type="checkbox"][name="' + dName + '"]');

                    $checkboxes.change(function(evt) {
                        $value.text($checkboxes.filter(':checked').length);
                        var product = 1;
                        $.each($values, function(valueIndex, val) {
                            product = product * parseInt($(val).text(), 10);
                        });
                        $products.text(product);
                    });
                });
            });
        }};
    }
);
