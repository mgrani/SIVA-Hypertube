var selectedClipId;

function addTimeMasks() {
    $('.timeString').mask('99:99:99.99',{placeholder:" "});
}

function parseTime(timeString) {
    var split = timeString.split(':');
    var floatTime = parseInt(split[0])*3600;
    floatTime += parseInt(split[1])*60;
    floatTime += parseFloat(split[2]);
    return floatTime;
}

function addTimeWarning() {
    $('<div>', {id : "errorMsg"}).addClass('errorMessage')
        .html("<b>Error:</b> Start time has to be lower than end time.")
        .prependTo('#content');
}

function setTime() {
    $('#errorMsg').remove();
    var time = parseTime(event.target.value);
	var timeId = event.target.id;
    if ((timeId === 'startTime' && time >= sessionStorage['endTime'])
        || (timeId === 'endTime' && time <= sessionStorage['startTime'])){
        addTimeWarning();
    }
	if ((timeId === 'endTime' && time > sessionStorage['videoLength'])) {
		updateTime('endTime', sessionStorage.videoLength);
		$('<div>', {id : "errorMsg"}).addClass('errorMessage')
        .html("<b>Error:</b> End time exceeded video length. Reset to video length.")
        .prependTo('#content');
	}
    sessionStorage[timeId] = time;
}

function floorTimeToTwoDecimals(time) {
    return Math.floor((parseFloat(time)*100))/100;
}

function updateThumbnail(videoId){
    $('#thumbnail').attr('src', "https://img.youtube.com/vi/" + videoId + "/mqdefault.jpg");
}

function formatTime(time) {
    var intPart = Math.floor(time);
    var hours   = Math.floor(intPart / 3600);
    var minutes = Math.floor((intPart - (hours * 3600)) / 60);
    var seconds = intPart - (hours * 3600) - (minutes * 60);
    var millis = Math.floor((time - intPart)*100);

    if (hours   < 10) {hours   = "0" + hours;}
    if (minutes < 10) {minutes = "0" + minutes;}
    if (seconds < 10) {seconds = "0" + seconds;}
    if (millis < 10) {millis = "0" + millis;}
    return hours + ':' + minutes + ':' + seconds + '.' + millis;
}

function updateTime(timeId, timeValue) {
    sessionStorage[timeId] = timeValue;
    $('#' + timeId).val(formatTime(timeValue));
}

function updateVideoInfo(videoInfo) {
    sessionStorage.videoId = videoInfo.id;
    sessionStorage.videoLength = floorTimeToTwoDecimals(videoInfo.duration);
    updateThumbnail(videoInfo.id);
    updateTime('startTime', 0);
    updateTime('endTime', floorTimeToTwoDecimals(videoInfo.duration));
}


// interact with player via content script
window.addEventListener("message", receiveMessage, false);

function receiveMessage(event) {
    if (event.origin !== 'https://www.youtube.com') {
        return;
    } else if (event.data.name === 'startTime' || event.data.name === 'endTime') {
        var receivedTime = floorTimeToTwoDecimals(event.data.time);
        if ((event.data.name === 'startTime' && receivedTime >= sessionStorage['endTime'])
                || (event.data.name === 'endTime' && receivedTime <= sessionStorage['startTime'])){
            addTimeWarning();
        }
        updateTime(event.data.name, receivedTime);
    } else if (event.data.name === 'videoChange') {
        updateVideoInfo(event.data);
    }
}

function requestVideoInfo() {
    window.parent.postMessage({request: 'playerRequest', detail: 'videoChange'}, 'https://www.youtube.com');
}

function requestTime(event) {
    event.preventDefault();
    $('#errorMsg').remove();
    var timeId = event.target.id.replace('Button', 'Time');
    window.parent.postMessage({request: 'playerRequest', detail: timeId}, 'https://www.youtube.com');
}

function requestTimeChange(time) {
    window.parent.postMessage({request: 'playerCommand', detail: 'timeChange', value: time}, 'https://www.youtube.com');
}

function appendClipThumb(clipData) {
    var imgContainer = $('<div/>', {
        id: clipData.id
    }).addClass('clipElement').attr("data-videoid", clipData.videoId);
    $('<img/>', {
        src: "https://img.youtube.com/vi/" + clipData.videoId + "/mqdefault.jpg",
        alt: "No thumbnail available"
    }).addClass('clipImage').appendTo(imgContainer);
    var startPercentage = Math.round((clipData.startTime / clipData.videoLength) * 100);
    var endPercentage = Math.round((clipData.endTime / clipData.videoLength) * 100);
    $('<div/>').addClass('clipHider').css({'left': '0', 'right': 100 - startPercentage + '%'}).appendTo(imgContainer);
    $('<div/>').addClass('clipHider').css({'left': endPercentage + '%', 'right': '0'}).appendTo(imgContainer);
    $('<div/>').addClass('clipMarker').css({'left': startPercentage + '%', 'right': (100 - endPercentage) + '%'}).appendTo(imgContainer);
    $('<div/>', {
        title: "Title: "+ clipData.name + " | Start: " + formatTime(clipData.startTime) + " | End: " + formatTime(clipData.endTime)
    }).addClass('clipEventPane').appendTo(imgContainer).click(handleClipClick);
    $('#clipContainer').prepend(imgContainer);
}

function updateClipThumb(clipData) {
    var startPercentage = Math.round((clipData.startTime / clipData.videoLength) * 100);
    var endPercentage = Math.round((clipData.endTime / clipData.videoLength) * 100);
    var clipHider = $('.clipElement[id='+ selectedClipId + '] .clipHider');
    $(clipHider[0]).css({'left': '0', 'right': 100 - startPercentage + '%'});
    $(clipHider[1]).css({'left': endPercentage + '%', 'right': '0'});
    $('.clipElement[id='+ selectedClipId + '] .clipMarker').css({'left': startPercentage + '%', 'right': (100 - endPercentage) + '%'});

    $('.clipElement[id='+ selectedClipId + '] .clipEventPane').attr("title", "Title: "+ clipData.name + " | Start: " + formatTime(clipData.startTime) + " | End: " + formatTime(clipData.endTime));
}

// ajax calls
function storeClip() {
    event.preventDefault();
    $('#errorMsg').remove();
    $.post('/pages/ajax.php', {
            request: 'addClip',
            extension: true,
            project: project,
            name: $('#clipTitle').val(),
            clipId: (selectedClipId ? selectedClipId : ''),
            videoId: sessionStorage.videoId,
            videoLength: sessionStorage.videoLength,
            startTime: sessionStorage.startTime,
            endTime: sessionStorage.endTime
        },
        function(data, status, xhr) {
            if (!selectedClipId) {
                appendClipThumb(data);
            } else {
                updateClipThumb(data);
            }
        },
        'json'
    ).fail(function(jqXHR, textStatus, error) {
            var errorMsg = $(jqXHR.responseText).attr('id', 'errorMsg');
            $('#content').prepend(errorMsg);
    });
}

function resetData() {
    $('#clipTitle').val('');
    updateTime('startTime', 0);
    updateTime('endTime', sessionStorage.videoLength);
}

function addClipSelector(clipId) {
    selectedClipId = clipId;
    var evtPane = $('.clipElement[id='+ clipId + '] .clipEventPane');
    $('<div/>').addClass('clipSelector').insertBefore(evtPane[0]);
    var deleteButton = $('<div/>', {
        id: 'clipDeleteButton'
    }).addClass('clipSelector');
    deleteButton.click(function() {
        removeClip(evtPane.parent().get(0));
    });
    deleteButton.text('X').insertAfter(evtPane[0]);
}

function setSelectedClipState(clipData) {
    updateThumbnail(clipData.videoId);
    $('#clipTitle').val(clipData.name);
    updateTime('startTime', clipData.startTime);
    updateTime('endTime', clipData.endTime);
    sessionStorage.videoLength = clipData.videoLength;
    sessionStorage.videoId = clipData.videoId;
    addClipSelector(clipData.id);
    $('#addSceneButton').text('Change Selected Clip').attr('data-clipid', clipData.id);
}

function loadClipData(clipId) {
    $.post('/pages/ajax.php', {
            request: 'loadClip',
            extension: true,
            project: project,
            clipId: clipId
        },
        function(data, status, xhr) {
            setSelectedClipState(data);
        },
        'json'
    ).fail(function(jqXHR, textStatus, error) {
            var errorMsg = $(jqXHR.responseText).attr('id', 'errorMsg');
            $('#content').prepend(errorMsg);
    });
}

function requestUrlChange(videoId, clipId) {
    window.parent.postMessage({
        request: "changeUrl",
        url: "https://www.youtube.com/watch?v=" + videoId,
        frameUrl: "/videoCollector.html",
        frameParams: {clipId: clipId}
        }, "https://www.youtube.com"
    );
}

function handleClipClick() {
    var clipId = this.parentNode.id;
    var videoId = this.parentNode.dataset.videoid;
    if (selectedClipId) {
        $('.clipSelector').remove();
        if (selectedClipId === clipId) {
            selectedClipId = null;
            $('#addSceneButton').text('Add Video Clip').attr('data-clipid', '');
            resetData();
            return;
        }
    }
    if (sessionStorage.videoId === videoId) {
        loadClipData(clipId);
    } else {
        requestUrlChange(videoId, clipId);
    }
}

function removeClip(clipElement) {
    deleteClip(clipElement.id);
}

function deleteClip(id) {
    $('#errorMsg').remove();
    $.post('/pages/ajax.php', {
            request: 'deleteClip',
            extension: true,
            project: project,
            clipId: id
        },
        function(data, status, xhr) {
            $('#' + data.clipId).remove();
			selectedClipId = null;
            $('#addSceneButton').text('Add Video Clip').attr('data-clipid', '');
            resetData();
        },
        'json'
    ).fail(function(jqXHR, textStatus, error) {
            var errorMsg = $(jqXHR.responseText).attr('id', 'errorMsg');
            $('#content').prepend(errorMsg);
        });
}

addTimeMasks();
$('.timeButton').click(requestTime);
$('.timeString').focus(function() {
    requestTimeChange(parseTime(event.target.value));
});
$('.timeString').keyup(function() {
    requestTimeChange(parseTime(event.target.value));
});
$('.timeString').blur(setTime);
$('#addSceneButton').click(storeClip);
$('.clipEventPane').click(handleClipClick);

if ((typeof(clipToLoad) == 'undefined') || ($('.clipElement[id='+ clipToLoad + ']').size() == 0)) {
    requestVideoInfo();
} else {
    loadClipData(clipToLoad);
}