$('#deleteProjectButton').click(confirmDeleteProject);

function confirmDeleteProject(event){
    if(!confirm('You are about to delete this project. All settings will be lost afterwards.\n\nContinue?')) {
        event.preventDefault();
    }
}

$('#exportProjectButton').click(function(event) {
    event.preventDefault();
    $('#errorMsg').remove();
    $.post('/pages/ajax.php', {
            request: 'exportProject',
            extension: isExtension,
            project: project
        },
        function(data, status, xhr) {
            $('#exportProjectInfo').text('Last export: ' + data.exportTime);
            $('#projectPublishCheck').prop("disabled", false);
            $('#videoDirectLink').text('https://westbourne.dimis.fim.uni-passau.de/project.html?watch=' + data.hash);
            $('#videoEmbedLink').text('<iframe width="1280" height="720" src="https://westbourne.dimis.fim.uni-passau.de/embed.html?watch='
                + data.hash + '&primaryColor=ffffff&secondaryColor=BF0B1A" frameborder="0" allowfullscreen></iframe>');
        },
        'json'
    ).fail(function(jqXHR, textStatus, error) {
            var errorMsg = $(jqXHR.responseText).attr('id', 'errorMsg');
            $('#content').prepend(errorMsg);
    });
});

$('#projectPublishCheck').click(publishProject);

function publishProject() {
    $('#errorMsg').remove();
    $.post('/pages/ajax.php', {
            request: 'publishProject',
            extension: isExtension,
            project: project,
            publish: ($(this)[0].checked ? 1 : 0)
        },
        'json'
    ).fail(function(jqXHR, textStatus, error) {
            var errorMsg = $(jqXHR.responseText).attr('id', 'errorMsg');
            $('#content').prepend(errorMsg);
            $(this)[0].checked = !$(this)[0].checked;
    });
}

$('.projectLink').click(function() {
    this.select();
});