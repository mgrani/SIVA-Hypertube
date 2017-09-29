/**
 * Contains all methods for creating, loading and storing the scene graph.
 */
var graph;
var paper;
var graphArea = document.getElementById('graphArea');

// Adds the event listeners
document.getElementById('saveButton').addEventListener('click', updateJSON.bind(null, false));
document.getElementById('saveAsButton').addEventListener('click', saveAs);
document.getElementById('revertChangesButton').addEventListener('click', revertChanges);
document.getElementById('zoomInButton').addEventListener('click', zoomIn);
document.getElementById('zoomOutButton').addEventListener('click', zoomOut);
document.getElementById('zoomResetButton').addEventListener('click', zoomReset);
document.getElementById('removeGraphButton').addEventListener('click', removeGraph);

// Resume node deactivated for now
// document.getElementById('resumeButton').addEventListener('click',
    // addResumeButton.bind(null, null, 0, 0));
// document.getElementById('resumeButton').addEventListener('dragstart',
    // dragStartHandler);
document.getElementById('graphArea').addEventListener('dragenter',
    dragEnterHandler);
document.getElementById('graphArea').addEventListener('drop', dropHandler);
document.getElementById('graphArea').addEventListener('dragover',
    dragOverHandler);

// For the annoations overlay; the listener for saving the annotations is
// defined in the function for showing the overlay because it must provide
// the selected node as parameter
document.getElementById('addTextAnnotationButton').addEventListener('click',
    addTextAnnotation);
document.getElementById('addImageAnnotationButton').addEventListener('click',
    addImageAnnotation);
document.getElementById('annotationOverlay').addEventListener('dragstart',
    dragStartHandlerOverlay);
document.body.addEventListener('drop', dropHandlerOverlay);
document.body.addEventListener('dragover', dragOverHandlerOverlay);
// http://stackoverflow.com/a/34588661/3992979
document.getElementById('nodeTitleOverlay').addEventListener('mousedown', function() {
    document.getElementById('annotationOverlay').setAttribute("draggable", false)});
document.getElementById('nodeTitleOverlay').addEventListener('mouseup', function() {
    document.getElementById('annotationOverlay').setAttribute("draggable", true)});

document.addEventListener("DOMContentLoaded", adjustMarkerSize.bind(null, null, null, null));

window.addEventListener("beforeunload", saveBeforeLeaving);

$(document).ready(function() {
    $(window).resize(setContentSize);
    setContentSize();
});
function setContentSize() {
    var height = window.innerHeight - $('#navigation').height() - parseInt($('#content').css('padding-top')) * 2;
    $('#sceneList, #createVideoContainer').height(height);

    $('#graphArea').height(height - $('#graphButtons').height());
    if (paper != null) {
        paper.setDimensions(graphArea.offsetWidth, graphArea.offsetHeight);
    }
}


var sceneElements = document.getElementsByClassName('sceneListEntry');
for (var i = 0; i < sceneElements.length; ++i) {
    // sceneElements.item(i).addEventListener('click',
    // addScene.bind(null, null, 0, 0));
    sceneElements.item(i).addEventListener('dblclick', loadVideoCollector);
    sceneElements.item(i).addEventListener('dragstart', dragStartHandler);
}

var editSceneButtons = document.getElementsByClassName('editSceneButton');
for (var i = 0; i < editSceneButtons.length; ++i) {
    editSceneButtons.item(i).addEventListener('click', loadVideoCollector);
}

// Check if graph is already present
var graphLoaded = false;
if (!graphLoaded) {
    initGraph();
}
var cellViewTemp;
var unsavedData = false;
var usedScenesCounter = 1;
var annotationCounter = 1;
// A number follows the '_'
var PREFIX_SCENE = "NodeScene_";
var PREFIX_LOAD_SCENE = "select-load-NodeScene_";
var PREFIX_SELECTION = "select-NodeSelection_"
var PREFIX_ANNOTATION_RICHTEXT = "show-NodeAnnotationRichtext_";
var PREFIX_ANNOTATION_PICTURE = "show-NodeAnnotationPicture_";
var NODE_TYPE_SCENE = "scene";
var NODE_TYPE_RESUME = "resume";
var THUMBNAIL_PREFIX = "https://img.youtube.com/vi/";
var THUMBNAIL_SUFFIX = "/mqdefault.jpg";
// http://colorbrewer2.org/ qualitative 12 levels
var COLOR_PALETTE = ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99",
                     "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a",
                     "#ffff99", "#b15928"];

// Flags
// Autosave got some performance impact, disabled is the best setting!
var FLAG_AUTOSAVE = false;

function zoomIn(event) {
    event.preventDefault();
    if (paper != null) {
        var scaleOld = V(paper.viewport).scale().sx;
        var scaleNew = scaleOld + 0.25;
        // Prevent from zooming to more than 200 %
        if (scaleNew > 2) {
            return;
        }
        paper.setOrigin(0, 0);
        paper.scale(scaleNew, scaleNew);
        var boundingBox = paper.getContentBBox();
        paper.setOrigin(-boundingBox.x + 10, -boundingBox.y + 10);
    }
}

function zoomOut(event) {
    event.preventDefault();
    if (paper != null) {
        var scaleOld = V(paper.viewport).scale().sx;
        var scaleNew = scaleOld - 0.25;
        // Prevent from zooming to 0 % or lower
        if (scaleNew <= 0) {
            return;
        }
        paper.setOrigin(0, 0);
        paper.scale(scaleNew, scaleNew);
        var boundingBox = paper.getContentBBox();
        paper.setOrigin(-boundingBox.x + 10, -boundingBox.y + 10);
    }
}

function zoomReset(event) {
    event.preventDefault();
    if (paper != null) {
        paper.setOrigin(0, 0);
        paper.scale(1, 1);
    }
}

// Handles the start of the dragging of a scene element
function dragStartHandler(event) {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", event.currentTarget.id);
}

// Handles the start of the dragging of the annotation overlay
function dragStartHandlerOverlay(event) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", "annotationOverlay");
}

function dropHandlerOverlay(event) {
    event.preventDefault();
    event.stopPropagation();
    var overlay = document.getElementById("annotationOverlay");
    overlay.style.marginTop = (event.clientY - 100) + "px";
    overlay.style.marginLeft = (event.clientX - 100) + "px";
}

function dragEnterHandler(event) {
    event.preventDefault();
}

// Handles the dropping of an element
function dropHandler(event) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.getData("text/plain") == "annotationOverlay") {
        dropHandlerOverlay(event);
    }
    var droppedElement =
        document.getElementById(event.dataTransfer.getData("text/plain"));
    var graphAreaCoords =
        document.getElementById("graphArea").getBoundingClientRect();
    console.log("Coordinates of drop: X:"
        + event.clientX + " Y:" + event.clientY);
    var scaleFactor = Math.pow(V(paper.viewport).scale().sx, -1);
	console.log("PaperX: " + paper.options.origin.x + ", PaperY: " + paper.options.origin.y);
    var adjustX = (event.clientX - paper.options.origin.x - graphAreaCoords.left) * scaleFactor;
    var adjustY = (event.clientY - paper.options.origin.y - graphAreaCoords.top) * scaleFactor;
    console.log("Adjusted coords: X: " + adjustX + " Y: " + adjustY);
    if (droppedElement.id.indexOf("scene") != -1) {
        addScene(droppedElement, adjustX, adjustY, null);
    } else if (droppedElement.id == "resumeButton") {
        addResumeButton(droppedElement, adjustX, adjustY, null);
    }
    return false;
}

function dragOverHandler(event) {
    event.preventDefault();
    return false;
}

function dragOverHandlerOverlay(event) {
    if (event.dataTransfer.effectAllowed == "move") {
        event.preventDefault();
        return false;
    }
}

// Removes a graph and it's corresponding JSON data file
function removeGraph(event) {
    event.preventDefault();
    if (paper != null) {
        // https://websanova.com/plugins/url
        // var projectId = url('?id', window.location.href);
        if (projectId == undefined) {
            console.log("No project id provided!");
            return;
        }
        var removeGraphForSure = window.confirm("Really remove the graph?");
        if (removeGraphForSure) {
            $.post(
                '/pages/ajax.php', {
                    request: 'removeGraph',
                    extension: true,
                    project: projectId
                },
                function (data, status, xhr) {
                    graph.clear();
                    addStartEvent();
                    // Clear all scene selection markers in palette
                    var markers =
                        document.getElementsByClassName("sceneCounterOverlay");
                    // Markers is a "live" list, i.e. a removal is immediate
                    while (markers.length > 0) {
                        markers[0].parentNode.style.borderColor = "black";
                        markers[0].parentNode.style.borderWidth = "1px";
                        markers[0].parentNode.removeChild(markers[0]);
                    }
                    usedScenesCounter = 1;
                    console.log("Graph successfully removed.");
                }).fail(function (xhr, textStatus, errorThrown) {
                    console.log("An error occurred, graph was not removed.");
                });
        }
    }
}

// Updates the JSON string and calls the method for writing to it as file
function updateJSON(isTemp, event) {
    if (event != null) {
        // Prevent page reload after button click (because its an <a>)
        event.preventDefault();
    }
    if (projectId == undefined) {
        console.log("No project id provided!");
        return;
    }

    var graphAsJSON = graph.toJSON();
    graphAsJSON.storedAnnotationCounter = annotationCounter;
    var graphData = JSON.stringify(graphAsJSON, null, 2);

    var exportJS = doExport();
    if (exportJS != null) {
        playerData = JSON.stringify(exportJS, null, 2);
        // Add additional required constant data
        playerData = "if(!sivaVideoConfiguration){var sivaVideoConfiguration=[];};sivaVideoConfiguration.push(" + playerData + ");";
    } else {
        playerData = '';
    }

    $.post('/pages/ajax.php', {
        request: 'updateJSON',
        extension: true,
        project: projectId,
        graphData: graphData,
        playerData: playerData,
        isTemp: isTemp
    }, function (data, status, xhr) {
        console.log("JSON files successfully saved.");
        unsavedData = false;
    }).fail(function (xhr, textStatus, errorThrown) {
        console.log("An error occurred, JSON files not saved.");
    });
}

// Loads a graph from JSON data from a file if it exists
function loadGraphFromFile(event) {
    if (event != null) {
        event.preventDefault();
    }
    // var projectId = url('?id', window.location.href);
    if (projectId == undefined) {
        console.log("No project id provided!");
        return;
    }
    var jsonData = null;
    $
        .post(
        '/pages/ajax.php', {
            request: 'loadJSON',
            extension: true,
            project: projectId,
        },
        function (data, status, xhr) {
            jsonData = data;
            if ((jsonData != null)
                && (typeof jsonData != 'undefined')) {
                console.log("JSON data for graph successfully loaded!");
                graph.clear();
                var parsedJSON = JSON.parse(jsonData);
                annotationCounter = parsedJSON.storedAnnotationCounter;
                console.log("Current annotation counter: " + annotationCounter);
                // Set variable if it was not present
                if (isNaN(annotationCounter)
                        || (annotationCounter == undefined)) {
                    annotationCounter = 1;
                }
                graph.fromJSON(parsedJSON);
                
                // Check for scenes no longer existing in the scene list
                var sceneData = [];
                var sceneElements =
                    document.getElementsByClassName('sceneListEntry');
                for (var i = 0; i < sceneElements.length; ++i) {
                    sceneData.push([
                        sceneElements.item(i).getAttribute(
                            'data-scene-id'), sceneElements.item(i)]);
                }
                var nodes = graph.getElements();
                for (var i = 0; i < nodes.length; ++i) {
                    if (!((nodes[i].attributes.prop.videoData.sceneId == 'resumeNode') 
							|| (nodes[i].attributes.prop.videoData.sceneId == 'selectionNode')
                            || (nodes[i].attributes.prop.videoData.sceneId == 'startNode'))) {
                        var sceneId =
                            nodes[i].attributes.prop.videoData.sceneId;
                        if (sceneData.filter(function (value) {
                                return value[0] == sceneId;
                            }).length == 0) {
                            nodes[i].attr({
                                '.title': {
                                    text: "Invalid node"
                                },
                                rect: {
                                    fill: "grey",
                                    stroke: "grey"
                                }
                            });
                            nodes[i].attributes.prop.videoData.sceneId
                                == "invalidNode";
                            console.log("Scene " + sceneId
                                + " was removed from the DB!");
                        } else {
                            var sceneDataEntry = sceneData.filter(function (value) {
                                if (value[0] == sceneId) {
                                    return value[0];
                                }
                            });
                            // Update video data in node with the db data
                            nodes[i].attributes.prop.videoData.startTime =
                                sceneDataEntry[0][1].getAttribute("data-scene-start-time");
                            nodes[i].attributes.prop.videoData.endTime =
                                sceneDataEntry[0][1].getAttribute("data-scene-end-time");
                            // Assign counter number in the palette if the
                            // scene is used in the graph
                            // Example for a label in the graph "3\nSceneName"
                            var counterNumber =
                                nodes[i].attributes.attrs['.number'].text;
                            if ($.isNumeric(counterNumber)) {
                                if(counterNumber >= usedScenesCounter) {
                                    usedScenesCounter = counterNumber;
                                    ++usedScenesCounter;
                                }
                                var targetListEntry =
                                    sceneData
                                        .filter(function (value) {
                                            if (value[1]
                                                    .getAttribute('data-scene-id') == sceneId) {
                                                return value[1];
                                            }
                                        })[0][1];
                                targetListEntry.style.borderColor = 
                                    COLOR_PALETTE[counterNumber % COLOR_PALETTE.length];
                                targetListEntry.style.borderWidth = "7px";
                                addMarkerCounterOverlay(targetListEntry,
                                    counterNumber);
                                var clipName = sceneDataEntry[0][1].children[2].innerText;
                                if (clipName.length > 10) {
                                    clipName = clipName.substring(0, 10) + "…";
                                }
                                nodes[i].attr({
                                    '.number': {
                                        text: counterNumber
                                    },
                                    '.title': {
                                        text: clipName
                                    }
                                });
                            }
                        }
                    }
                }
            } else {
                console.log("Error loading JSON data for graph from the "
                    + "database!\nMaybe there is no saved JSON data!");
            }
        }, "json").fail(function (xhr, textStatus, errorThrown) {
            console.log("Loading graph error:");
            console.log(xhr.responseText);
            console.log(textStatus);
            console.log(errorThrown);
            console.log("Loading graph error end!");
        });
}

// Adds a resume button to the graph (deactivated for now)
// function addResumeButton(element, coordX, coordY, event) {
    // if (event != null) {
        // event.preventDefault();
        // element = event.target;
        // coordX = 300;
        // coordY = 200;
    // }
    // // Will be 'null' when not present
    // var timeout = element.getAttribute('data-timeout');
    // if (timeout != null) {
        // timeout = parseFloat(timeout);
    // }
    // var nodeId = PREFIX_LOAD_SCENE
        // + getNextNodeId("resume");
    // var rect = new joint.shapes.devs.Model({
        // inPorts: ['in'],
        // outPorts: ['out'],
        // position: {
            // x: coordX,
            // y: coordY
        // },
        // size: {
            // width: 100,
            // height: 30
        // },
        // attrs: {
            // '.label': {
                // text: 'Resume',
                // 'ref-x': .4,
                // 'ref-y': .2
            // },
            // rect: {
                // fill: 'red'
            // },
            // '.inPorts circle': {
                // fill: '#e8ff04',
                // magnet: 'passive',
                // type: 'input'
            // },
            // '.outPorts circle': {
                // fill: '#E74C3C',
                // type: 'output'
            // }
        // },
        // prop: {
            // videoData: {
                // sceneId: 'resumeNode',
                // timeout: timeout,
                // nodeId: nodeId
            // }
        // }
    // });
    // graph.addCells([rect]);
    // unsavedData = true;
// }

function addSelection(coordX, coordY, event) {
    if (event != null) {
        event.preventDefault();
        element = event.target;
        coordX = 300;
        coordY = 200;
    }
        
    var nodeId = PREFIX_SELECTION
        + getNextNodeId("selection");
    var rect = new joint.shapes.devs.Model({
        inPorts: [''],
        outPorts: [''],
        position: {
            x: coordX,
            y: coordY
        },
        size: {
            width: 112,
            height: 48
        },
        attrs: {
            '.label': {
                text: 'Selection',
				'fill': 'white',
                'ref-x': .5,
				'ref-y': .5,
				'y-alignment': 'middle'
                
            },
            rect: {
				'fill': '#000000',
                'fill-opacity': 0.9,
			},
            '.inPorts circle': {
                fill: '#e8ff04',
                magnet: 'passive',
                type: 'input'
            },
            '.outPorts circle': {
                fill: '#E74C3C',
                type: 'output'
            }
        },
        prop: {
            videoData: {
                sceneId: 'selectionNode',
				sceneName: 'New selection',
                nodeId: nodeId
            }
        }
    });
    graph.addCells([rect]);
    unsavedData = true;
}

// Define custom model with two labels for number and title of scene nodes
joint.shapes.devs.Mirkul = joint.shapes.basic.Generic.extend(_.extend({}, joint.shapes.basic.PortsModelInterface, {

    markup: '<g class="rotatable"><g class="scalable"><rect class="body"/></g><text class="label number"/><text class="label title"/><g class="inPorts"/><g class="outPorts"/></g>',
    portMarkup: '<g class="port port<%= id %>"><circle class="port-body"/><text class="port-label"/></g>',

    defaults: joint.util.deepSupplement({

        type: 'devs.Mirkul',
        size: { width: 1, height: 1 },

        inPorts: [],
        outPorts: [],

        attrs: {
            '.': { magnet: false },
            '.body': {
                width: 150, height: 250,
                stroke: '#000000'
            },
            '.port-body': {
                r: 10,
                magnet: true,
                stroke: '#000000'
            },
            text: {
                'pointer-events': 'none'
            },
            '.label': { text: 'Model', 'ref-x': .5, 'ref-y': 10, ref: '.body', 'text-anchor': 'middle', fill: '#000000' },
            '.inPorts .port-label': { x:-15, dy: 4, 'text-anchor': 'end', fill: '#000000' },
            '.outPorts .port-label':{ x: 15, dy: 4, fill: '#000000' },
            '.inPorts circle': {fill: '#e8ff04', magnet: 'passive', type: 'input'},
            '.outPorts circle': {fill: '#E74C3C', type: 'output'}
        }

    }, joint.shapes.basic.Generic.prototype.defaults),

    getPortAttrs: function(portName, index, total, selector, type) {

        var attrs = {};

        var portClass = 'port' + index;
        var portSelector = selector + '>.' + portClass;
        var portLabelSelector = portSelector + '>.port-label';
        var portBodySelector = portSelector + '>.port-body';

        attrs[portLabelSelector] = { text: portName };
        attrs[portBodySelector] = { port: { id: portName || _.uniqueId(type) , type: type } };
        attrs[portSelector] = { ref: '.body', 'ref-y': (index + 0.5) * (1 / total) };

        if (selector === '.outPorts') { attrs[portSelector]['ref-dx'] = 0; }

        return attrs;
    }
}));

// Custom view with model name as prefix needed for ports to work (object name matching seems to be done in JointJS)
joint.shapes.devs.MirkulView = joint.shapes.devs.ModelView;

// Adds a new node to the graph
function addScene(element, coordX, coordY, event) {
    if (event != null) {
        event.preventDefault();
        // 'currentTarget' in order to get the <div> even when the containing
        // <img> was clicked
        element = event.currentTarget;
        coordX = 300;
        coordY = 200;
    }
    // Mark scene in the palette with the current number, if it not already
    // marked. In this case, the assigned number will be used in the graph
    var counterToUse;
    var markedCounter = element.getElementsByClassName("sceneCounterOverlay");
    if (markedCounter.length == 0) {
        counterToUse = usedScenesCounter;
        addMarkerCounterOverlay(element, counterToUse);
        ++usedScenesCounter;
    } else {
        counterToUse = markedCounter[0].innerText;
    }
    var sceneId = element.getAttribute('data-scene-id');
    var clipName = element.children[2].innerText;
    if (clipName.length > 10) {
        clipName = clipName.substring(0, 10) + "…";
    }
    element.style.borderColor =
        COLOR_PALETTE[counterToUse % COLOR_PALETTE.length];
    element.style.borderWidth = "7px";
    var sceneName = element.children[2].innerText;
    var startTime = element.getAttribute('data-scene-start-time');
    var endTime = element.getAttribute('data-scene-end-time');
    var videoLength = element.getAttribute('data-scene-video-length');
    var filesHref = element.getAttribute('data-scene-video-id');
    var nodeId = PREFIX_SCENE
        + getNextNodeId("scene");
    var sceneNode = new joint.shapes.devs.Mirkul({
        inPorts: [''],
        outPorts: [''],
        position: {
            x: coordX,
            y: coordY
        },
        size: {
            width: 128,
            height: 72
        },
        attrs: {
            '.number': {
                text: counterToUse,
                'font-size': '28px',

                'stroke': 'black',
                'stroke-width': '0.5',
                'ref-x': .5,
                'ref-y': .15,
                fill: 'white',
                overflow: 'hidden'
            },
            '.title': {
                text: clipName,
                'ref-x': .5,
                'ref-y': .6,
                fill: 'white',
                overflow: 'hidden'
            },
            rect: {
                fill: '#000000',
                'fill-opacity': 0.6,
                'stroke-width': 7,
                stroke: COLOR_PALETTE[counterToUse % COLOR_PALETTE.length]
            }
        },
        prop: {
            videoData: {
                sceneId: sceneId,
                startTime: startTime,
                endTime: endTime,
                filesHref: filesHref,
                nodeId: nodeId,
                sceneName: sceneName,
                videoLength: videoLength
            },
            annotations: []
        }
    });
    graph.addCells([sceneNode]);
    unsavedData = true;
}

// Adds the overlay with the scene number in the graph to the palette
function addMarkerCounterOverlay(element, counterToUse) {
    var markerCounter = document.createElement("div");
    markerCounter.className = "sceneCounterOverlay";
    markerCounter.innerText = counterToUse;
    element.appendChild(markerCounter);
}

// Initalizes the graph
function initGraph() {
    graph = new joint.dia.Graph;
    graph.storedAnnotationCounter = annotationCounter;
    var width = graphArea.offsetWidth;
    var height = graphArea.offsetHeight;
    var gridSize = 1;

    paper =
        new joint.dia.Paper({
                el: graphArea,
                width: width,
                height: height,
                model: graph,
                gridSize: gridSize,
                linkPinning: false,
                restrictTranslate: true,
                defaultLink: new joint.shapes.devs.Link({
                    attrs: {
                        '.marker-target': {
                            d: 'M 10 0 L 0 5 L 10 10 z'
                        }
                    }
                }),
                validateConnection: function (cellViewS, magnetS, cellViewT,
                                              magnetT, end, linkView) {
                    // Prevent linking from input ports.
                    if (magnetS
                        && (magnetS.getAttribute('type') === 'input')) {
                        return false;
                    }
                    // Prevent linking from output ports to input ports within
                    // one element.
                    if (cellViewS === cellViewT) {
                        return false;
                    }
                    // Prevent linking to input ports.
                    if (!(magnetT && (magnetT.getAttribute('type') === 'input'))) {
                        return false;
                    }
                    // Allow only one outgoing edge from 'start node' and
                    // 'resume nodes', i.e. prevent adding a second edge if
                    // there is already one
                    if ((cellViewS.model.attributes.prop.videoData.sceneId == "resumeNode")
                        || (cellViewS.model.attributes.prop.videoData.sceneId == "startNode")) {
                        var opt = {};
                        opt.outbound = true;
                        var numOutgoingEdges =
                            (graph.getConnectedLinks(cellViewS.model, opt)).length;
                        // The edge currently being dragged is included in the
                        // number
                        if (numOutgoingEdges > 1) {
                            return false;
                        }
                    }
                    return true;
                },
                // Enable link snapping within 50px lookup radius
                snapLinks: {
                    radius: 50
                },
                // Enable marking available cells & magnets
                markAvailable: true
            });

    // Autosave graph on change when flag is set to true
    graph.on('change', function (cell) {
        unsavedData = true;
        if (FLAG_AUTOSAVE) {
            // 'unsavedData' is set to false at the end of the update function
            updateJSON(true, null);
        }
    });

    addStartEvent();

	// Start dragging the paper
	paper.on('blank:pointerdown', function(evt, x, y) {
		var scale = V(paper.viewport).scale().sx;
		dragStartPosition = {x: x * scale, y: y * scale};
	});
	
	// Stop dragging the paper
	paper.on('blank:pointerup', function(evt) {
		delete dragStartPosition;
	});
	
	// Move paper while dragging it 
	$("#graphArea").mousemove(function(evt) {
		if (typeof dragStartPosition !== 'undefined') {
			paper.setOrigin(
				evt.offsetX - dragStartPosition.x,
				evt.offsetY - dragStartPosition.y
			);
		}
	});
	
	// Capture right mouse clicks and...
	paper.on('blank:contextmenu', function(evt, x, y) {
		var scale = V(paper.viewport).scale().sx;
		rightClickPosition = {x: x, y: y};
	});
	
	// ...add context menu to graph area
	$(function() {
		$.contextMenu({
			selector: '#graphArea',
			items: {
				addSelection: {
					name: "Add Selection",
					icon: "add",
					callback: function(itemkey, opt) {
						if (typeof rightClickPosition !== 'undefined') {
							addSelection(rightClickPosition.x, rightClickPosition.y);
							delete rightClickPosition;
						}
					}
				}
			}
		});
	});
	
    // Function called when a node is double clicked
    paper
        .on(
        'cell:pointerdblclick',
        function (cellView, evt, x, y) {
            if (cellView.model.attributes.prop.videoData.sceneId == "resumeNode") {
                var newWaitTime =
                    window.prompt(
                        'Enter the new waiting time in seconds!', '0');
                newWaitTime = parseFloat(newWaitTime);
                cellView.model.prop({
                    videoData: {
                        waitTime: newWaitTime
                    },
                });
            } else if (cellView.model.attributes.prop.videoData.sceneId == "selectionNode") {
				var newSelectionTitle =
                    window.prompt(
                        'Enter selection title', cellView.model.attributes.prop.videoData.sceneName);
				if (newSelectionTitle != null) {
					cellView.model.attributes.prop.videoData.sceneName = newSelectionTitle;
				}
			} else if (cellView.model.attributes.prop.videoData.sceneId == "startNode") {
                console.log("Can't edit start node!");
            } else {
                cellViewTemp = cellView;
                openAnnotationOverlay();
//                var oldText =
//                    cellView.model.attributes.prop.videoData.sceneName;
//                var newText =
//                    window.prompt('Enter the new name for the node',
//                        oldText);
//                if (newText != null) {
//                    cellView.model.attributes.prop.videoData.sceneName = newText;
//                }
            }
        });
	
    // Function called when a node is right clicked
    paper
        .on(
        'cell:contextmenu',
        function (cellView, evt, x, y) {
            cellViewTemp = cellView;
            // Adds the context menu (based on
            // http://swisnl.github.io/jQuery-contextMenu/demo.html)
            $
                .contextMenu({
                    selector: '.element',
                    position: function(opt, x, y) {
                        var elementPos =
                            opt['$trigger'][0].getBoundingClientRect();
                        opt.$menu.css({top: elementPos.top + 50 + "px",
                            left: elementPos.left + 50 + "px"});
                    },
                    events: {
                        show : function(options) {
                            if (cellViewTemp.model.attributes.prop.videoData.sceneId
                                    == 'startNode') {
                                // window.alert("Start node can't be edited or removed!");
                                return false;
                            }
                        }
                    },
                    callback: function (key, options) {
                        if (key == "edit") {
							if (cellViewTemp.model.attributes.prop.videoData.sceneId == "selectionNode") {
								var newSelectionTitle =
									window.prompt(
										'Enter selection title', cellView.model.attributes.prop.videoData.sceneName);
								if (newSelectionTitle != null) {
									cellView.model.attributes.prop.videoData.sceneName = newSelectionTitle;
								}
							} else {
								openAnnotationOverlay();
							}
                        } else if (key == "remove") {
							var isUserSure = true;
                                //window
                                //    .confirm("Really remove the node?");
                            if (isUserSure) {
                                if (cellViewTemp.model.attributes.prop.videoData.sceneId == "selectionNode"
									|| cellViewTemp.model.attributes.attrs['.title'].text == "Invalid node") {
                                    cellViewTemp.model.remove();
                                    return true;
                                }
                                var counterNumber =
                                    cellViewTemp.model.attributes.attrs['.number'].text;
                                if ($.isNumeric(counterNumber)) {
                                    // Remove scene marker in palette if it
                                    // is now unused
                                    var elements = graph.getElements();
                                    var isSceneUnused = true;
                                    for (var i = 0; i < elements.length; ++i) {
                                        var attributes = elements[i].attributes.attrs;
                                        if (attributes.hasOwnProperty('.number')) {
                                            var nodeCounterNumber = attributes['.number'].text;
                                            console.log("got on with number: " +nodeCounterNumber);
                                            if ($.isNumeric(nodeCounterNumber)
                                                && (cellViewTemp.model.id != elements[i].id)
                                                && (nodeCounterNumber == counterNumber)) {
                                                isSceneUnused = false;
                                                break;
                                            }
                                        }
                                    }
                                    if (isSceneUnused) {
                                        var overlay =
                                            document
                                                .evaluate(
                                                "//div[@class='sceneCounterOverlay' and text()="
                                                + counterNumber
                                                + "]",
                                                document,
                                                null,
                                                XPathResult.FIRST_ORDERED_NODE_TYPE,
                                                null).singleNodeValue;
                                        overlay.parentNode.style.borderColor =
                                            "black";
                                        overlay.parentNode.style.borderWidth = "1px";
                                        overlay.parentNode
                                            .removeChild(overlay);
                                    }
                                    // TODO bug in context menu plugin
                                    // causes the cellView of the first call
                                    // to be reused, therefor a temp var is used
                                    cellViewTemp.model.remove();
                                }
                            }
                        }
                        // For closing the context menu
                        return true;
                    },
                    items: {
                        "edit": {
                            name: "Open Editor",
                            icon: "edit"
                        },
                        "sep1": "---------",
                        "remove": {
                            name: "Remove Node",
                            icon: "delete"
                        }
                    }
                });
        });

    loadGraphFromFile(null);
    graphLoaded = true;
}

// Adds the start event to the graph
function addStartEvent() {
    var startSymbol = new joint.shapes.devs.Model({
        outPorts: [''],
        position: {
            x: 100,
            y: 0
        },
        size: {
            width: 100,
            height: 30
        },
        attrs: {
            '.label': {
                text: 'Start',
                'ref-x': .4,
                'ref-y': .2
            },
            rect: {
                fill: 'yellow'
            },
            '.outPorts circle': {
                fill: '#E74C3C',
                type: 'output'
            }
        },
        prop: {
            videoData: {
                sceneId: 'startNode'
            }
        }
    });

    graph.addCells([startSymbol]);
}

// Returns the node id to use next (the current most highest one + 1)
// nodeType currently is irrelevant
function getNextNodeId(nodeType) {
    var scenes = graph.getElements();
    var currentNodeId = 0;
    var highestNodeId = 0;
    for (var i = 0; i < scenes.length; ++i) {
        var currentNode = scenes[i];
        // Start node is a dummy without an id
        if (currentNode.attributes.prop.videoData.sceneId == 'startNode') {
            continue;
        }
        var currentNodeId = currentNode.attributes.prop.videoData.nodeId;
        currentNodeId = currentNodeId.split("_")[1];
        currentNodeId = parseInt(currentNodeId, 10);
        if (currentNodeId > highestNodeId) {
            highestNodeId = currentNodeId;
        }
    }
    return ++highestNodeId;
}

// Saves all annotations shown in the overlay to the nodes metadata
function saveAnnotations(cellView, event) {
    if (cellView == null) {
        console.log("No node provided!");
        return;
    }
    console.log("Test save Annotations: "
            + cellViewTemp.model.attributes.prop.videoData.sceneName);
    // Reset annotations in node data
    cellView.model.attributes.prop.annotations = [];
    event.preventDefault();
    var sceneTitle = document.getElementById("nodeTitleOverlay").value;
    cellView.model.attributes.prop.videoData.sceneName = sceneTitle;
    var elements = document.getElementById("annotationContainer");
    for (var i = 0; i < elements.children.length; ++i) {
        var annotationElement = elements.children[i];
        var titleContent = annotationElement.children[0].children[0].value;
        // The entered text or URL
        var content = annotationElement.children[1].children[0].value;
        var nextId;
        var annotation;
        var isGlobalAnnotation = false;
        if (annotationElement.className == "annotationTextElement") {
            nextId = PREFIX_ANNOTATION_RICHTEXT + annotationCounter;
            annotation = {
                "id": nextId,
                "type": "richText",
                "title": {
                    "en-en": {
                        "content": titleContent
                    }
                },
                "content": {
                    "en-en": {
                        "href": "",
                        "content": content
                    }
                },
                "isSidebarAnnotation": true,
                "pauseVideo": false,
                "muteVideo": false,
                "disableable": true
            };
        } else if (annotationElement.className == "annotationImageElement") {
            nextId = PREFIX_ANNOTATION_PICTURE + annotationCounter;
            annotation = {
                "id": nextId,
                "type": "image",
                "title": {
                    "en-en": {
                        "content": titleContent
                    }
                },
                "content": {
                    "en-en": {
                        "href": content
                    }
                },
                "isSidebarAnnotation": true,
                "pauseVideo": false,
                "muteVideo": false,
                "disableable": true
            };
        }
        ++annotationCounter;
        cellView.model.attributes.prop.annotations.push(annotation);
    }
    // Autosave if desired (changing annoations doesn't fire the 'change' event
    // of the graph)
    if (FLAG_AUTOSAVE) {
        updateJSON(true, null);
    }
    // Hide overlay and remove it's content in the DOM, also kill the event
    // listener and the marker overlay
    var overlay = document.getElementById("annotationOverlay");
    overlay.style.display = "none";
    var annotationContainer = document.getElementById("annotationContainer");
    annotationContainer.innerHTML = "";
    var annotationOverlayHeader = document.getElementById("annotationOverlayHeader");
    annotationOverlayHeader.removeChild(annotationOverlayHeader.children[3]);
    var dimmer = document.getElementById("dimmer");
    document.body.removeChild(dimmer);
    // Clone element in order to get rid of the event listener
    var el = document.getElementById("saveAnnotationsButton"),
    elClone = el.cloneNode(true);
    el.parentNode.replaceChild(elClone, el);
}

function addTextAnnotation(event) {
    addNewAnnotation("text", null, null, event);
}

function addImageAnnotation(event) {
    addNewAnnotation("image", null, null, event);
}

// Adds a new annoation entry. 'type' can be 'text' or 'image'
// This function is also used to add already existing entries when opening
// the overlay
function addNewAnnotation(type, title, content, event) {
    if (event != null) {
        event.preventDefault();
    }
    var container = document.getElementById("annotationContainer");
    var newAnnotation = document.createElement("div");
    if (type == "text") {
        newAnnotation.className = "annotationTextElement";
        newAnnotation.innerHTML =
            '<div class="annotationElementHeader">'
            + '<input type="text" placeholder="Text Annotation title" '
            + 'class="annotationTextElementTitle">'
            + '<a href="" class="button">X</a>'
            + '<a href="" class="button">&#5169;</a>'
            + '<a href="" class="button">&#5167;</a></div>'
            + '<div class="annotationTextElementContent"><textarea rows="5"'
            + 'cols="80">Enter your text here</textarea></div>';
    } else if (type == "image") {
        newAnnotation.className = "annotationImageElement";
        newAnnotation.innerHTML =
            '<div class="annotationElementHeader">'
            + '<input type="text" placeholder="Image Annotation title" '
            + 'class = "annotationImageElementTitle">'
            + '<a href="" class="button">X</a>'
            + '<a href="" class="button">&#5169;</a>'
            + '<a href="" class="button">&#5167;</a></div>'
            + '<div class="annotationImageElementContent"><input type="text"'
            + 'placeholder="Link to image (png, jpg, bmp, gif)" size="90"></input></div>';
    }
    if ((title != null)
        && (title.length > 0)) {
        newAnnotation.children[0].children[0].value = title;
    }
    if ((content != null)
        && (content.length > 0)) {
        newAnnotation.children[1].children[0].value = content;
    }
    // newAnnotation ==> <div> ==> <a>
    newAnnotation.children[0].children[1].addEventListener('click',
        removeAnnotation);
    newAnnotation.children[0].children[2].addEventListener('click',
        moveAnnotationUp);
    newAnnotation.children[0].children[3].addEventListener('click',
        moveAnnotationDown);
    // Add validator for an image link
    /*if (type == "image") {
        newAnnotation.children[1].children[0].addEventListener('input',
            imageURLValidator);
    }*/
    // http://stackoverflow.com/a/34588661/3992979
    newAnnotation.addEventListener('mousedown', function() {
        document.getElementById('annotationOverlay').setAttribute("draggable", false)});
    newAnnotation.addEventListener('mouseup', function() {
        document.getElementById('annotationOverlay').setAttribute("draggable", true)});
    container.appendChild(newAnnotation);
    unsavedData = true;
}

// Loads stored annotations from a node into the overlay
function loadAnnotationsIntoOverlay(cellView) {
    for (var i = 0; i < cellView.model.attributes.prop.annotations.length; ++i) {
        var currentAnnotation = cellView.model.attributes.prop.annotations[i];
        var type = currentAnnotation.type;
        var titleContent = currentAnnotation.title['en-en'].content;
        var content;
        // Player needs "richText" for internal use
        if (type == "richText") {
            type = "text";
            content = currentAnnotation.content['en-en'].content;
        } else if (type == "image") {
            content = currentAnnotation.content['en-en'].href;
        }
        addNewAnnotation(type, titleContent, content, null);
    }
}

// Removes an annotation entry
function removeAnnotation(event) {
    event.preventDefault();
    var annotationToRemove = event.target.parentNode.parentNode;
    annotationToRemove.remove();
    console.log("Annotation removed!");
    unsavedData = true;
}

// Calls the function for validating the URL and warns the user about malformed
// input
/*function imageURLValidator(event) {
    if ((event.target.value != "")
        && (!isValidImageURL(event.target.value))) {
        event.target.className = "invalidImageURL";
    } else {
        event.target.className = "";
    }
}

// Checks if the entered string is a valid URL to an image
function isValidImageURL(string) {
    if (string != null) {
        // https://github.com/jzaefferer/jquery-validation/blob/master/src/core.js#L1288
        if (/^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i
                .test(string)) {
            // Check if the URL ends in a supported file format
            return /.+(\.jpe?g|\.png|\.gif|\.bmp)$/i.test(string);
        } else {
            return false;
        }
    } else {
        return false;
    }
}*/

// Warn the user if he wants to close the window when with unsaved data
function saveBeforeLeaving(event) {
      //updateJSON(true, null);
	event.returnValue = "You didn't save your changes. Are you sure you want to leave?"
}

// Loads the Youtube page with the id of the current video and opens the
// video collector
function loadVideoCollector(event) {
    event.preventDefault();
    var targetElement = null;
    // If the clip was doubleclicked
    if (event.currentTarget.id.indexOf("scene") != -1) {
        targetElement = event.currentTarget;
        // For the edit button
    } else if (event.currentTarget.parentNode.id.indexOf("scene") != -1) {
        targetElement = event.currentTarget.parentNode;
    } else {
        return;
    }
    window.parent.postMessage({
        request: "changeUrl",
        url: "https://www.youtube.com/watch?v=" + targetElement.dataset.sceneVideoId,
        frameUrl: "/videoCollector.html",
        frameParams: {clipId: targetElement.dataset.sceneId}
        }, "https://www.youtube.com"
    );
}

function moveAnnotationUp(event) {
    moveAnnotation("up", event);
}

function moveAnnotationDown(event) {
    moveAnnotation("down", event);
}

// Moves an annotation in the overlay "up" or "down
function moveAnnotation(direction, event) {
    if (event != null) {
        event.preventDefault();
    }
    var elementToMove = event.currentTarget.parentNode.parentNode;
    if (direction == "up") {
        // Only move if element is not already at the top
        if (elementToMove.previousSibling != null) {
            elementToMove.parentNode.insertBefore(elementToMove,
                elementToMove.previousSibling);
        }
    } else if (direction == "down") {
        // Only move if element is not already at the bottom
        if (elementToMove.nextSibling != null) {
            elementToMove.parentNode.insertBefore(elementToMove.nextSibling,
                elementToMove);
        }
    }
}

// Adjust the size of the time frame marker to the size of the image
// The original size is relative to the scene duration (e.g. 50%)
// Works on a single marker (for the overlay where relative width and
// height are given via parameter) or all markers for the palette
// (where the relative size is taken from the video metadata stored in
// the parent <div>). The absolute marker size is in px (20% of 100px
// wide image ==> 20px marjer width)
function adjustMarkerSize(marker, pRelativeWidth, pRelativeLeft, event) {
    var markers = [];
    if (marker != null) {
        markers.push(marker);
    } else {
        markers = document.getElementsByClassName("calcSize");
    }
    for (var i = 0; i < markers.length; ++i) {
        var relativeWidth;
        var relativeLeft;
        // Calc if relative sizes not given by params
        if ((pRelativeWidth == null) && (pRelativeLeft == null)) {
            relativeWidth = ((markers[i].parentNode.getAttribute('data-scene-end-time')
                - markers[i].parentNode.getAttribute('data-scene-start-time'))
                / markers[i].parentNode.getAttribute('data-scene-video-length')) * 100;
            relativeLeft = (markers[i].parentNode.getAttribute('data-scene-start-time')
                / markers[i].parentNode.getAttribute('data-scene-video-length')) * 100;
        // Use param data if relative sizes are given
        } else {
            relativeWidth = pRelativeWidth;
            relativeLeft = pRelativeLeft;
        }
        markers[i].style.width =
            ((relativeWidth / 100) * markers[i].previousSibling.width) + "px";
        markers[i].style.left =
            ((relativeLeft / 100) * markers[i].previousSibling.width) + "px";
    }
}

// Open the overlay for editing the annotations, loading existing annoations
// into the overlay takes place in loadAnnotationsIntoOverlay(cellViewTemp)
function openAnnotationOverlay() {
    if (cellViewTemp == undefined) {
        return;
    }
    if (cellViewTemp.model.attributes.prop.videoData.sceneId == 'startNode') {
        window.alert("Start node can't be edited or removed!");
        return;
    }
    var overlay = document.getElementById("annotationOverlay");
    overlay.style.display = "block";
    overlay.children[0].children[1].value =
            cellViewTemp.model.attributes.prop.videoData.sceneName;
    overlay.children[0].children[2].src =
            THUMBNAIL_PREFIX
                    + cellViewTemp.model.attributes.prop.videoData.filesHref
                    + THUMBNAIL_SUFFIX;
    // Dim background while overlay is shown
    var dimmer = document.createElement("div");
    dimmer.setAttribute("style", "opacity: 0.4; background-color: grey; "
            + "width: 100%; height: 100vh; z-index: 100;"
            + " position: absolute;");
    dimmer.setAttribute("id", "dimmer");
    document.body.insertBefore(dimmer, document.body.children[0]);
    // For the time marker
    var markerWidth =
            ((parseFloat(cellViewTemp.model.attributes.prop.videoData.endTime) - parseFloat(
                    cellViewTemp.model.attributes.prop.videoData.startTime)) / parseFloat(
                    cellViewTemp.model.attributes.prop.videoData.videoLength)) * 100;
    var markerLeft =
            (parseFloat(cellViewTemp.model.attributes.prop.videoData.startTime) / parseFloat(
                    cellViewTemp.model.attributes.prop.videoData.videoLength)) * 100;
    var marker = document.createElement("div");
    marker.setAttribute(
                    "style",
                    "position:absolute; top:75px; border:2px; border-color:#f39c12; border-style:solid; width:"
                            + "0px; left:0px; height:62%; margin-left: 180px;");
    overlay.children[0].children[2].parentNode.insertBefore(marker,
            overlay.children[0].children[2].nextSibling);
    adjustMarkerSize(marker, markerWidth, markerLeft, null);
    loadAnnotationsIntoOverlay(cellViewTemp);
    document.getElementById('saveAnnotationsButton').addEventListener('click',
            saveAnnotations.bind(null, cellViewTemp));
}

// Saves the current project with another name
function saveAs(event) {
    event.preventDefault();
    var newName = window.prompt("Enter the name for the copied project!",
        "Unnamed project");
    $.post('/pages/ajax.php', {
        request : 'saveAs',
        extension : true,
        name : newName,
        project: projectId
    }, function(data, status, xhr) {
        console.log(data);
        projectId = data;
        updateClipIds();
        $(document).ajaxStop(function() {
            $(this).unbind("ajaxStop");
            document.getElementById("headerTitle").innerText = newName;
            console.log("All clip ids updated, saving new graph.");
            updateJSON(false, null);
            updateJSON(true, null);
        });
    }).fail(function(xhr, textStatus, errorThrown) {
        console.log("An error occured, \"Save as\" not performed!");
    });
}

var elements;

// Updates the clip ids after cloning the project
function updateClipIds() {
    var clipsToClone = [];
    var sceneElements = document.getElementsByClassName('sceneListEntry');
    for (var i = 0; i < sceneElements.length; ++i) {
        clipsToClone.push(sceneElements.item(i).getAttribute('data-scene-id'));
    }
    elements = graph.getElements();
    for (var i = 0; i < elements.length; ++i) {
        if (!((elements[i].attributes.prop.videoData.sceneId == 'resumeNode')
				|| (elements[i].attributes.prop.videoData.sceneId == 'selectionNode')
                || (elements[i].attributes.prop.videoData.sceneId == 'startNode'))) {
            // Remove clip from todo list
            var index = clipsToClone.indexOf(elements[i].attributes.prop.videoData.sceneId);
            if (index > -1) {
                clipsToClone.splice(index, 1);
            }
            // Ajax calls in a loop: http://stackoverflow.com/a/2687739/3992979
            _cloneClip(i, true, elements[i].attributes.prop.videoData.sceneId);
        }
    }
    // Clone the rest, i.e. the unused clips
    for (var i = 0; i < clipsToClone.length; ++i) {
        _cloneClip(0, false, clipsToClone[i]);
    }
}

// i: index; updateInGraph: 'true' when new value has to be stored in the graph
// (clip is used); oldClipId: the old clip id
function _cloneClip(i, updateInGraph, oldClipId) {
    $.post('/pages/ajax.php', {
        request : 'cloneClip',
        extension : true,
        project: projectId,
        oldClipId: oldClipId
    }, function(data, status, xhr) {
        console.log(data);
        if (updateInGraph) {
            if (elements[i].attributes.prop.videoData.sceneId == oldClipId) {
                elements[i].attributes.prop.videoData.sceneId = data.newClipId;
            }
        }
    }, "json").fail(function(xhr, textStatus, errorThrown) {
        console.log("An error occured, clip " + oldClipId + " not cloned!");
    });
}

// Replaces the temp files with the last saved ones
function revertChanges(event) {
    event.preventDefault();
    $.post('/pages/ajax.php', {
        request : 'revertChanges',
        extension : true,
        project: projectId
    }, function(data, status, xhr) {
        console.log(data);
        loadGraphFromFile(null);
    }).fail(function(xhr, textStatus, errorThrown) {
        console.log("An error occured, the changes were not reverted!");
    });
}
