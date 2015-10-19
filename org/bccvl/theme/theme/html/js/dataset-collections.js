//
// main JS for the dataset list page.
//
// TODO: load whole modal via ajax? or just content?
//
define(
    ['jquery', 'js/bccvl-modals'],

    function($, modals) {

        $(document).ready(function() {
            var infomodal = new modals.InfoModal('info-modal');
            infomodal.bind("[data-toggle='InfoModal']");
        });

    }
);
