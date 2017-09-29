$('#unpublishSingleProjectButton').click(unpublishSingleProject);
$('#unpublishAllProjectsButton').click(unpublishAllProjects);

function unpublishSingleProject(event) {
	if (confirm('You are about to unpublish a user project currently published on the platform.\n\nContinue?')) {
		event.preventDefault();
		$('#errorMsg').remove();
		$.post('/pages/ajax.php', {
				request: 'publishProject',
				extension: isExtension,
				project: project,
				publish: 0
			},
			'json'
		).fail(function(jqXHR, textStatus, error) {
				var errorMsg = $(jqXHR.responseText).attr('id', 'errorMsg');
				$('#content').prepend(errorMsg);
		}).done(function(data) {
				window.location.href = "home.html";
		});
	}
}

function unpublishAllProjects(event) {
	if (confirm('You are about to unpublish all projects currently published on the platform.\n\nContinue?')) {
        event.preventDefault();
		$('#errorMsg').remove();
		$.post('/pages/ajax.php', {
				request: 'unpublishAllProjects'
			},
			'json'
		).fail(function(jqXHR, textStatus, error) {
				var errorMsg = $(jqXHR.responseText).attr('id', 'errorMsg');
				$('#content').prepend(errorMsg);
		});
	}
}