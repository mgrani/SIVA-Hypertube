var serverUrl = 'westbourne.dimis.fim.uni-passau.de';
//var serverUrl = 'localhost:444';

function sivaWebProducer_initPanel(){
    sivaWebProducer_cleanup();
    $('head').append('<style id="sivaWebProducer_css">.sivaWebProducer_spacer, .sivaWebProducer_resizeBorder, .sivaWebProducer_resizeHelper, .sivaWebProducer_iframe {float:left;width:100%;} .sivaWebProducer_iframe, .sivaWebProducer_resizeHelper{position:fixed;bottom:0;left:0;border:none;z-index:9999999999;background:#BF0B1A;}.sivaWebProducer_resizeHelper{background:none;z-index:10000000000;display:none;}body.sivaWebProducer_resizing *{cursor:n-resize;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;}body.sivaWebProducer_resizing .sivaWebProducer_resizeHelper{display:block;}.sivaWebProducer_resizeBorder{height:2px;background:#444;position:fixed;bottom:0;left:0;z-index:9999999999;cursor:n-resize;}.sivaWebProducer_closeButton{position:fixed;width:auto;height:auto;bottom:0;right:0;background:#444;color:#fff;padding:3px 5px;z-index:9999999999;cursor:pointer;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;}.sivaWebProducer_closeButton:hover{color:#444;background:#fff;} </style>');
	//$('head').append('<link id="sivaWebProducer_css" href="chrome-extension://' + sivaWebProducer_extensionId + '/css/content.css" rel="stylesheet" type="text/javascript" />');
	$('body').append('<div class="sivaWebProducer_spacer"></div><iframe id="sivaFrame" src="https://' + serverUrl + '/projects.html?' + '&extension" class="sivaWebProducer_iframe" allowfullscreen></iframe><div class="sivaWebProducer_resizeHelper"></div><div class="sivaWebProducer_closeButton">Close</div><div class="sivaWebProducer_resizeBorder"></div>')
	.mousemove(function(e){
		if($(body).hasClass('sivaWebProducer_resizing')){
			var height = $(window).height() - (e.pageY - window.scrollY);
			sivaWebProducer_setPanelHeight(height);
		}
	})
	.mouseup(function(e){
		$(body).removeClass('sivaWebProducer_resizing');
	})
	.mouseleave(function(e){
		$(body).removeClass('sivaWebProducer_resizing');
	});

   	$('.sivaWebProducer_resizeBorder')
	.mousedown(function(e){
		$(body).addClass('sivaWebProducer_resizing');
	});
	$('.sivaWebProducer_closeButton').click(function(){
		sivaWebProducer_cleanup();
        sivaWebProducer_sendMessageToBackgroundPage({request: 'close'});
	});

    $('#sivaFrame').load(function() {
        var height;
        if (typeof(localStorage['sivaWebProducer_height'] != 'undefined')) {
            height = parseInt(localStorage['sivaWebProducer_height'], 10);
        }
        if (height) {
            sivaWebProducer_setPanelHeight(height);
        } else {
            sivaWebProducer_setPanelHeight(window.innerHeight * 0.40);
        }
    });

    sivaWebProducer_registerListeners();
}

function sivaWebProducer_registerListeners() {
    if (document.getElementById('sivaWebProducer_injectedScript') === null) {
        var script = document.createElement('script');
        script.id = 'sivaWebProducer_injectedScript';
        script.innerText =
            "var sivaWebProducer_newVideo = false;" +
            "var sivaWebProducer_player = document.getElementById('movie_player');" +
            "function createPlayerEvent(evtName) {" +
                "var evt = new CustomEvent('playerResponse', {'detail': {" +
                    "'name' : evtName," +
                    "'id': sivaWebProducer_player.getVideoUrl().match(/v=([^&#]+)/)[1]," +
                    "'duration': sivaWebProducer_player.getDuration()," +
                    "'time': sivaWebProducer_player.getCurrentTime()}});" +
                "return evt;" +
            "}" +
            "document.addEventListener('playerRequest', function(e) {" +
                "var evt = createPlayerEvent(e.detail.detail);" +
                "document.dispatchEvent(evt);" +
            "});" +
            "function execPlayerCommand(evtName, evtValue) {" +
                "if (evtName === 'timeChange') {" +
                    "sivaWebProducer_player.seekTo(evtValue);" +
                "}" +
            "}" +
            "document.addEventListener('playerCommand', function(e) {" +
                "execPlayerCommand(e.detail.detail, e.detail.value);" +
            "});" +
            "function sivaWebProducer_videoChangeListener(e) {" +
                "if (e === -1) {" +
                    "sivaWebProducer_newVideo = true;" +
                "} else {" +
                    "if (sivaWebProducer_newVideo) {" +
                    "var evt = createPlayerEvent('videoChange');" +
                    "document.dispatchEvent(evt);" +
                "}" +
                "sivaWebProducer_newVideo = false;" +
                "}" +
            "}" +
            "sivaWebProducer_player.addEventListener('onStateChange', sivaWebProducer_videoChangeListener);";
        document.body.appendChild(script);

        // forward player events to iFrame
        document.addEventListener('playerResponse', function (e) {
            $('#sivaFrame')[0].contentWindow.postMessage(e.detail, 'https://' + serverUrl);
        });

        // handle iframe messages
        window.addEventListener("message", sivaWebProducer_receiveMessage, false);
    }
}

// Sets the height of the panel
function sivaWebProducer_setPanelHeight(height){
	var maxHeight = window.innerHeight * 0.95;
	if(height > maxHeight){
		height = maxHeight;
	}
	var minHeight = window.innerHeight * 0.05;
	if(height < minHeight){
		height = minHeight;
	}
    localStorage['sivaWebProducer_height'] = height;
    $('.sivaWebProducer_spacer, .sivaWebProducer_iframe, .sivaWebProducer_resizeHelper').height(height);
	$('.sivaWebProducer_resizeBorder').css('bottom', (height - 2) + 'px');
    $('.sivaWebProducer_closeButton').css('bottom', (height - $('.sivaWebProducer_closeButton').outerHeight() + 21) + 'px');
}

// Handle iFrame messages
function sivaWebProducer_receiveMessage(event) {
    if (event.origin !== 'https://' + serverUrl) {
        return;
    } else {
        if (event.data.request) {
            if (event.data.request == "changeUrl") {
                sivaWebProducer_sendMessageToBackgroundPage(event.data, null);
            } else if (event.data.request == 'playerRequest' || event.data.request == 'playerCommand') {
                var evt = new CustomEvent(event.data.request, {'detail': event.data});
                document.dispatchEvent(evt);
            }
        }
    }
}

// Sends message to background page and executes given callback function afterwards
function sivaWebProducer_sendMessageToBackgroundPage(message, callback){
    chrome.runtime.sendMessage(message, callback);
}

function sivaWebProducer_changeFramePage(request) {
    var query = '?extension';
    for (param in request.params) {
        var value = (request.params[param]);
        query += '&' + param + (value ? '=' + value : '');
    }
    $('#sivaFrame').attr('src', "https://" + serverUrl + request.url + query);
}

// Handle background page messages
chrome.runtime.onMessage.addListener(function (request) {
    switch (request.request) {
        case ('changeFrameUrl'):
            sivaWebProducer_changeFramePage(request);
            break;

        default:
            alert('Internal Error: Unknown Message');
            break;
    }
});

// Cleans page
function sivaWebProducer_cleanup(extensionDeactivated){
    $('.sivaWebProducer_iframe').attr('src', "about:blank");
	$('.sivaWebProducer_css, .sivaWebProducer_spacer, .sivaWebProducer_iframe, .sivaWebProducer_resizeHelper, .sivaWebProducer_resizeBorder, .sivaWebProducer_closeButton').remove();
}


// Creates UTF-8 representation of an ISO-8859-1 string
function utf8_encode(argString){
 
	// http://kevin.vanzonneveld.net
	// +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
	// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   improved by: sowberry
	// +    tweaked by: Jack
	// +   bugfixed by: Onno Marsman
	// +   improved by: Yves Sucaet
	// +   bugfixed by: Onno Marsman
	// +   bugfixed by: Ulrich
	// +   bugfixed by: Rafal Kukawski
	// +   improved by: kirilloid
	// +   bugfixed by: kirilloid
	// *     example 1: utf8_encode('Kevin van Zonneveld');
	// *     returns 1: 'Kevin van Zonneveld'
	if(argString === null || typeof argString === "undefined"){
		return "";
	}
	var string = (argString + '');
	var utftext = '', start, end, stringl = 0;
	start = end = 0;
	stringl = string.length;
	for(var n = 0; n < stringl; n++){
		var c1 = string.charCodeAt(n);
		var enc = null;
		if(c1 < 128){
			end++;
		}
		else if(c1 > 127 && c1 < 2048){
			enc = String.fromCharCode(
				(c1 >> 6)        | 192,
				( c1        & 63) | 128
			);
		}
		else if(c1 & 0xF800 != 0xD800){
			enc = String.fromCharCode(
				(c1 >> 12)       | 224,
				((c1 >> 6)  & 63) | 128,
				( c1        & 63) | 128
			);
		}
		else{ 
			if(c1 & 0xFC00 != 0xD800){
				throw new RangeError("Unmatched trail surrogate at " + n);
			}
			var c2 = string.charCodeAt(++n);
			if(c2 & 0xFC00 != 0xDC00){
				throw new RangeError("Unmatched lead surrogate at " + (n-1));
			}
			c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
			enc = String.fromCharCode(
				(c1 >> 18)       | 240,
				((c1 >> 12) & 63) | 128,
				((c1 >> 6)  & 63) | 128,
				( c1        & 63) | 128
			);
		}
		if(enc !== null){
			if(end > start){
				utftext += string.slice(start, end);
			}
			utftext += enc;
			start = end = n + 1;
		}
	}
	if(end > start){
		utftext += string.slice(start, stringl);
	}
	return utftext;
}

$(document).ready(function(){
    sivaWebProducer_initPanel();
});