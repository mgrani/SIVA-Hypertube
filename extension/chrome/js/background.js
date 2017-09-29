var extensionTabs = new Set();

function isYoutubePage(url){
	return (url.indexOf('http://www.youtube.com') > -1 || url.indexOf('https://www.youtube.com') > -1);
}

function isYoutubeVideoPage(url){
	var videoId = extractVideoIdFromURL(url);
	return (videoId != undefined && videoId != '');
}

function extractVideoIdFromURL(url){
	return getURLParameters(url)['v'];
}

function getURLParameters(url){
	var parameters = {};
	url = url.split('?');
	if(url.length > 1){
		url = url[1].split('&');
		for(var i = 0; i < url.length; i++){
			var param = url[i].split('=');
			parameters[(param[0])] = param[1];
		}
	}
	return parameters;
}

// Sets new sate of extension
function setExtensionState(){
	// Check if is extension should be active  for that tab and set correct extension button
	chrome.tabs.query({currentWindow: true, active: true}, function(tab){
		if(tab.length > 0 && isYoutubePage(tab[0].url) && isYoutubeVideoPage(tab[0].url))
			chrome.browserAction.setIcon({'path':'images/icon-19.png'});
		else
			chrome.browserAction.setIcon({'path':'images/icon-19-inactive.png'});
	});
}

// Creates the panel for the SIVA Web Producer
function handleBrowserAction(tab){
	if(!isYoutubePage(tab.url) || !isYoutubeVideoPage(tab.url)){
		alert('Please go to a video page on youtube.com to use this extension.');
	}
	else {
        loadExtension(tab.id);
        extensionTabs.add(tab.id);
	}
}

// Inserts needed code into current tab
function handleURLChange(tabId, checkForInitiation){
	// Get current tab
	chrome.tabs.query({active:true, currentWindow:true}, function(tab){
        if(!isYoutubePage(tab[0].url) || !isYoutubeVideoPage(tab[0].url)) {
            extensionTabs.delete(tabId);
            return;
        } else {
           // loadExtension();
        }
	});
}

function loadExtension(tabId, callback) {
    //(extensionTabs.has(tabId)) {
    // Get extension id for extension urls
    var extensionId = chrome.i18n.getMessage('@@extension_id');

    // Insert extension id into current tab and execute code
    chrome.tabs.executeScript(tabId, {
        code: 'var sivaWebProducer_extensionId = "' + extensionId + '";',
        allFrames: false
    }, function() {
        // Insert JavaScript files into current tab and execute code
        chrome.tabs.executeScript(tabId, {file: 'js/jquery.js', allFrames: false}, function() {
            chrome.tabs.executeScript(tabId, {file: 'js/content.js', allFrames: false}, callback);
        });
    });
}

// Generates hash code
function hashCode(s){
	return hex_sha1(s);              
}

function handleUrlUpdate(request) {
   function updateListener(tabId, info, tab) {
       if (info.status == 'complete') {
           loadExtension(tabId, function () {
               if (request.frameUrl) {
                   chrome.tabs.sendMessage(tabId, {
                       request: 'changeFrameUrl',
                       url: request.frameUrl,
                       params: request.frameParams
                   });
               }
           });
           chrome.tabs.onUpdated.removeListener(updateListener);
       }
   }
   chrome.tabs.onUpdated.addListener(updateListener);
}

// Listen for messages from content scripts and execute related code
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.request) {
        // close panel on tab
		case 'close':
            if (sender.tab) {
                extensionTabs.delete(sender.tab.id);
            }
		break;
		case 'changeUrl':
            chrome.tabs.update(sender.tab.id, {url : request.url}, function() {
                handleUrlUpdate(request);
            });
		break;
		// Inform User if message is not known
		default:
			alert('Internal Error: Unknown Message');
		break;
    }
	
	// Return true to inform sender to wait for a reply
	return true;
});

// Create stats on button click
chrome.browserAction.onClicked.addListener(function(tab){handleBrowserAction(tab);});

// Check for any changes of the main frame url
chrome.webNavigation.onHistoryStateUpdated.addListener(function (details){
     if (details.frameId === 0) {
         setExtensionState();
         handleURLChange();
    }
},{url: [{hostEquals: 'www.youtube.com', queryContains: 'v='}]});

// Run extension main code on tab selection
chrome.tabs.onActivated.addListener(function(activeInfo){setExtensionState(); handleURLChange(activeInfo.tabId, true);});

// Remove tab from list of tabs where extension is active
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {extensionTabs.delete(tabId);});