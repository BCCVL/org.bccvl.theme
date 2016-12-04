//
// main JS for the dataset list page.
//
// TODO: load whole modal via ajax? or just content?
//
define(
    ['jquery', 'bccvl-modals', 'bootstrap2', 'bccvl-raven'],

    function($, modals) {

        $(document).ready(function() {
            var infomodal = new modals.InfoModal('info-modal');
            infomodal.bind("[data-toggle='InfoModal']");
        });

    }
);
