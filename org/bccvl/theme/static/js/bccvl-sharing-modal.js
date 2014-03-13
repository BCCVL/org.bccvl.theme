define(     ['jquery', 'bootstrap', 'jquery-tablesorter', 'jquery-form'],
    function( $      ) {
    	return { init: function() {

			$(".sharing-btn").click(function(e) {
				e.preventDefault();

				var url = $(this).attr('href');

				if (url.indexOf('#') == 0) {
					$(url).modal('open');
				} 
				else {
					$.get(url, function(data) {
		            	$('.modal').html(data);
		            	$('.modal').modal();

		            	$('#user-group-sharing').addClass('table');
		            	$('#sharing-save-button').addClass('btn btn-primary');
		            	$('.standalone').addClass('btn btn-danger');
		            	$('.standalone').attr('data-dismiss', 'modal');

		            	bindUserSearch(url);
		          	})
				}
			})

			// when the modal is shown
		    $('.modal').on('shown', function () {
				// scroll to the top of the modal
				$('.modal-body').scrollTop(0);

				// make sure there is no redirect when the form is submitted
				// also hide and empty the modal
				var $form = $('.modal form');

				$form.ajaxForm(function() { 
					$('.modal').modal('hide')
					$('.modal').empty();
				}); 
		    })
		}
	}

	// fix the search feature because we're not taking the js from plone
	function bindUserSearch(url) {
		var endPointURL = url.replace('/@@sharing', '//@@updateSharingInfo');
		var $searchField = $('#sharing-user-group-search');
		var $searchButton = $('#sharing-search-button');

		$searchButton.click(function(e){
			e.preventDefault();

			var query = $searchField.val();
			$.ajax({
				url: endPointURL,
				data: {'search_term': query},
				success: function(data) {
					$('#user-group-sharing-container').html(data.body);
					$('#user-group-sharing').addClass('table');
				}
			})
		})
	}
})