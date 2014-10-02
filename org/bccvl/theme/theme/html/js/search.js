//
// main JS for the search page.
//
define(
    ['jquery', 'bootstrap'],
    function( $) {
        // ==============================================================
        $(function() {

            var filterToggle = false;

            // Prevent the in line javascript
            $('#pt_toggle').prop('onchange', '');

            // This is to hide and show the Filter options on the search results page
            $('#search-filter-toggle').click(function(event){
                event.preventDefault();

                if (filterToggle){
                    $('.actionMenuContent').css('display', 'none');
                    filterToggle = false;
                }
                else {
                    $('.actionMenuContent').css('display', 'block');
                    filterToggle = true;
                }

            });

            //This is for the Select All/None checkbox
            $('#pt_toggle').click(function(event){
                var checked = $('#pt_toggle').prop('checked');
                $( ":checkbox" ).prop('checked', checked);
            });

            // This uncheck the Select All/None if any of the checkboxes are unchecked
            $( ":checkbox" ).click(function(event){
                if ($(this).prop('checked') == false){
                    $('#pt_toggle').prop('checked', false);
                }
            });

        });
        // ==============================================================
    }
);
