/**
 * Functions for exporting the JSON data of the JointJS graph to the format the
 * 'export.js' file must have.
 */

function doExport() {
   // Clear error storage
   localStorage.exportErrorText = "";
   // Constants
   var END_TAG = "end-siva";
   // Youtube-URL (without video id, id will be added at the end)
   var YOUTUBE_URL = "https://www.youtube.com/embed/";
   var THUMBNAIL_PREFIX = "https://img.youtube.com/vi/";
   var THUMBNAIL_SUFFIX = "/mqdefault.jpg";
   // A number follows the '_'
   var SCENESELECT_PREFIX = "select-SceneNodeSelection_";
   var opt = {};
   opt.outbound = true;
   // Check validity
   var startNode = validateOnlyOneStartNode();
   var eachResumeGotATarget = validateNoResumeWithoutTarget();
   var eachSelectionGotATarget = validateNoSelectionWithoutTarget();
   var noInvalidNodes = validateValidNodes();
   // TODO more checks
   if ((startNode == null) || !eachResumeGotATarget || !eachSelectionGotATarget || !noInvalidNodes) {
      return null;
   }
   // Array holding the nodes with 2 or more outgoing edges. For them,
   // a following selection node have to be generated later
   var selectionNodes = [];
   // The object later converted to the JSON in 'export.js'
   var exportObject = {
      "configPath" : document.getElementsByTagName('script')[document
            .getElementsByTagName('script').length - 1].src,
      "languages" : [ "en-en" ],
      "defaultLanguage" : "en-en",
      "videoTitle" : {
         "en-en" : {
            "content" : "Table of Contents"
         }
      },
      "accessRestrictions" : {},
      "style" : {
         "resolutionWidth" : 1280,
         "resolutionHeight" : 720,
         "nodeSelectionSidebarWidth" : 0.2,
         "annotationSidebarWidth" : 0.2,
         "primaryColor" : "#FFFFFF",
         "secondaryColor" : "#BF0B1A"
      },
      "common" : {
         "annotationSidebarVisibility" : "",
         "annotationSidebarOverlay" : true,
         "userDiary" : false,
         "autoStart" : true,
         "collaboration" : false,
         "log" : false,
         "logUrl" : ""
      },
      "sceneNodes" : {},
      "scenes" : {},
      "startScene" : "",
      "endScene" : {
         "node" : "end-siva",
         "title" : {
            "en-en" : {
               "content" : "End"
            }
         }
      },
      "parentNodes" : {
         "end-siva" : []
      },
      "globalAnnotations" : [],
      "annotations" : {},
      "index" : {}
   };

   // scenes (the actual video scenes)
   // Get all nodes from the graph
   var scenes = graph.getElements();
   for (var i = 0; i < scenes.length; ++i) {
      var currentNode = scenes[i];
      var outgoingEdges = graph.getConnectedLinks(currentNode, opt);
      var numOutgoingEdges = outgoingEdges.length;
      // Handle start node
      if (currentNode.attributes.prop.videoData.sceneId == 'startNode') {
         if (numOutgoingEdges == 1) {
            // The start node is only a dummy, look for the node connected to it
            var firstNodeId = outgoingEdges[0].attributes.target.id;
            var firstNode = graph.getCell(firstNodeId);
            exportObject.startScene = firstNode.attributes.prop.videoData.nodeId;
         } else {
            localStorage.exportErrorText += "There is no scene connected to the start node.<br/>";
            return null;
         }
         // As the start node is only a dummy, it won't be further processed
         continue;
         // Handle resume nodes
      } else if (currentNode.attributes.prop.videoData.sceneId == 'resumeNode') {
         // Assume only one child node is allowed for a resume node
         var currentResumeNodeId = currentNode.attributes.prop.videoData.nodeId;
         var nextNodeAfterResumeId = outgoingEdges[0].attributes.target.id;
         var nextNodeAfterResume = graph.getCell(nextNodeAfterResumeId);
         var nextNodeAfterResumeNodeId = nextNodeAfterResume.attributes.prop.videoData.nodeId;
         var timeout = nextNodeAfterResume.attributes.prop.videoData.timeout;
         var currentResumeNode = {
            "title" : {
               "en-en" : {
                  "content" : "Resume"
               }
            },
            "next" : [ {
               "title" : {
                  "en-en" : {
                     "content" : "Resume"
                  }
               },
               "node" : nextNodeAfterResumeNodeId,
               "type" : "scene"
            } ]
         };
         // Add 'timeout' property if it is set
         if (timeout != null) {
            currentResumeNode.next[0].timeout = timeout;
         }
         // Add currentResumeNode to 'sceneNodes'
         exportObject.sceneNodes[currentResumeNodeId] = currentResumeNode;
         // add outgoing parent relationship
         exportObject.parentNodes[nextNodeAfterResumeNodeId] = [ currentResumeNodeId ];
         // add ingoing parent relationship
         var optNeighbors = {};
         optNeighbors.inbound = true;
         var parentsOfResumeNode = graph
               .getNeighbors(currentNode, optNeighbors);
         exportObject.parentNodes[currentNode.attributes.prop.videoData.nodeId] = [];
         for (var j = 0; j < parentsOfResumeNode.length; ++j) {
            var parentOfResumeNode = parentsOfResumeNode[j];
            exportObject.parentNodes[currentNode.attributes.prop.videoData.nodeId]
                  .push(parentOfResumeNode.attributes.prop.videoData.nodeId);
         }
         continue;
      } else if (currentNode.attributes.prop.videoData.sceneId == 'selectionNode') {
		var selectionName = currentNode.attributes.prop.videoData.nodeId;
		var titleContent = currentNode.attributes.prop.videoData.sceneName;
		var currentSelection = {
			"title" : {
				"en-en" : {
					"content" : titleContent
				}
			},
			"next" : []
		}
      
		var outgoingEdges = graph.getConnectedLinks(currentNode, opt);
		for (var j = 0; j < outgoingEdges.length; ++j) {
			var targetNodeId = outgoingEdges[j].attributes.target.id;
			var targetNode = graph.getCell(targetNodeId);
			var targetNodeContent = targetNode.attributes.prop.videoData.sceneName;
			var targetNodeName = targetNode.attributes.prop.videoData.nodeId;
			var targetNodeType;
			if (targetNode.attributes.prop.videoData.sceneId == 'selectionNode') {
				targetNodeType = "node";
			} else {
				targetNodeType = "scene";
			}
			var parentArray = exportObject.parentNodes[targetNodeName];
			if (typeof parentArray != 'undefined') {
				parentArray.push(selectionName);
			} else {
				exportObject.parentNodes[targetNodeName] = [ selectionName ];
			}
			
			var nextNode = {
				"title" : {
					"en-en" : {
						"content" : targetNodeContent
					}
				},
				"node" : targetNodeName,
				"type" : targetNodeType
			};
			currentSelection.next.push(nextNode);
		}
			// Add scene to 'sceneNodes' object
			exportObject.sceneNodes[selectionName] = currentSelection;
			continue;
	  }
      // The name of the object in JSON, e.g. here 'NodeScene_1'
      // "scenes": { "NodeScene_1": { "title": {
      // Scene number is one-indexed
      var nodeId = currentNode.attributes.prop.videoData.nodeId;
      var titleContent = currentNode.attributes.prop.videoData.sceneName;
      var next = "";
      var thumbnailHref = THUMBNAIL_PREFIX
            + currentNode.attributes.prop.videoData.filesHref
            + THUMBNAIL_SUFFIX;
      // Acually an URL
      var filesHref = YOUTUBE_URL
            + currentNode.attributes.prop.videoData.filesHref;
      var startTime = currentNode.attributes.prop.videoData.startTime;
      var endTime = currentNode.attributes.prop.videoData.endTime;
      startTime = parseInt(startTime, 10);
      endTime = parseInt(endTime, 10);
      // 0 ==> End node
      if (numOutgoingEdges == 0) {
         next = END_TAG;
         exportObject.parentNodes['end-siva'].push(nodeId);
      } else {
		 var nextVideoNodeId = outgoingEdges[0].attributes.target.id;
         var nextNode = graph.getCell(nextVideoNodeId)
		 // 1 scene node ==> Point to next node
		 if (numOutgoingEdges == 1 
			&& nextNode.attributes.prop.videoData.sceneId != 'selectionNode') {
				next = nextNode.attributes.prop.videoData.nodeId;
				exportObject.parentNodes[next] = [ nodeId ];
		 // 2 or more ==> Create a 'sceneNode' (selection Element)
		 } else {
			// Index is one-based, must add it temporay here in order to set the
			// 'next' attribute of the node correctly
			var selectionName = SCENESELECT_PREFIX + (i + 1);
			next = selectionName;
			var selectionParentArray = exportObject.parentNodes[next];
			if (typeof selectionParentArray != 'undefined') {
					selectionParentArray.push(nodeId);
			} else {
					exportObject.parentNodes[next] = [nodeId];
			}
			currentNode.selectionName = selectionName;
			selectionNodes.push(currentNode);
		}
	  }

      var singleScene = {
         "title" : {
            "en-en" : {
               "content" : titleContent
            }
         },
         "next" : next,
         "thumbnail" : {
            "en-en" : {
               "href" : thumbnailHref
            }
         },
         "files" : [ {
            "url" : {
               "en-en" : {
                  "href" : filesHref
               }
            }
         } ],
         "annotations" : [],
         "type" : "youtube",
         "start" : startTime,
         "end" : endTime
      };

      // Add annotations
      for (var j = 0; j < currentNode.attributes.prop.annotations.length; ++j) {
         var nextAnnotation = currentNode.attributes.prop.annotations[j];
         var nextAnnotationId = nextAnnotation.id;
         // The annotation should be showed for the whole scene duration, this
         // means a start time of 0 and the end time equivalent to the scene
         // length
         var startTimeForAnnotation = 0;
         var endTimeForAnnotation = endTime - startTime;
         var singleAnnotationRef = {
            "start" : startTimeForAnnotation,
            "end" : endTimeForAnnotation,
            "annotationId" : nextAnnotationId,
            "triggerId" : j
         }
         // Add reference of annotation to the scene node it belongs
         singleScene.annotations.unshift(singleAnnotationRef);
         // Add whole annotation data to the global export object
         exportObject.annotations[nextAnnotationId] = nextAnnotation;
      }
      // Add scene to 'scenes' object
      exportObject.scenes[nodeId] = singleScene;
   }

   // sceneNodes (selection nodes in the desktop tool)
   for (var i = 0; i < selectionNodes.length; ++i) {
      var currentNode = selectionNodes[i];
      selectionName = currentNode.selectionName;
      var singleSelect = {
         "title" : {
            "en-en" : {
               "content" : ""
            }
         },
         "next" : []
      };
      var outgoingEdges = graph.getConnectedLinks(currentNode, opt);
      for (var j = 0; j < outgoingEdges.length; ++j) {
         var targetNodeId = outgoingEdges[j].attributes.target.id;
         var targetNode = graph.getCell(targetNodeId);
         var targetNodeContent = targetNode.attributes.prop.videoData.sceneName;
         var targetNodeName = targetNode.attributes.prop.videoData.nodeId;
         var parentArray = exportObject.parentNodes[targetNodeName];
			if (typeof parentArray != 'undefined') {
				parentArray.push(selectionName);
			} else {
				exportObject.parentNodes[targetNodeName] = [ selectionName ];
			}
		 var targetNodeType;	
		 if (targetNode.attributes.prop.videoData.sceneId == 'selectionNode') {
		 	targetNodeType = "node";
		 } else {
			targetNodeType = "scene";
		 }
		 var selectPossibleNextNode = {
            "title" : {
               "en-en" : {
                  "content" : targetNodeContent
               }
            },
            "node" : targetNodeName,
            "type" : targetNodeType
         };
         singleSelect.next.push(selectPossibleNextNode);
      }
      // Add scene to 'sceneNodes' object
      exportObject.sceneNodes[selectionName] = singleSelect;
   }

   // The final object holding all the data
   return exportObject;
}

// Checks if there is only one start node (i.e. a node without ingoing edges)
// Returns the start node if there is only one start node, otherwise null
function validateOnlyOneStartNode() {
   var startNodes = [];
   var scenes = graph.getElements();
   var opt = {};
   opt.inbound = true;
   for (var i = 0; i < scenes.length; ++i) {
      var currentNode = scenes[i];
      var ingoingEdges = graph.getConnectedLinks(currentNode, opt);
      var numIngoingEdges = ingoingEdges.length;
      if (numIngoingEdges == 0) {
         startNodes.push(currentNode);
      }
   }
   if (startNodes.length == 1) {
      return startNodes[0];
   } else {
      localStorage.exportErrorText += "All scenes need to be connected to the start node.<br/>";
      return null;
   }
}

// Checks if all resume nodes got a target. Returns 'true' if yes, 'false'
// otherwise
function validateNoResumeWithoutTarget() {
   var scenes = graph.getElements();
   var opt = {};
   opt.outbound = true;
   for (var i = 0; i < scenes.length; ++i) {
      var currentNode = scenes[i];
      if (currentNode.attributes.prop.videoData.sceneId == 'resumeNode') {
         var outgoingEdges = graph.getConnectedLinks(currentNode, opt);
         // Only one outgoing edge allowed
         if (outgoingEdges.length != 1) {
            return false;
         }
         // Check if outgoing edges have a target
         for (var j = 0; j < outgoingEdges.length; ++j) {
            if ((outgoingEdges[j].attributes.target == undefined)
                  || (outgoingEdges[j].attributes.target == null)) {
               return false;
            }
         }
      }
   }
   // All resume nodes have an outgoing edge connected with a target
   return true;
}

// Checks if all selection nodes got at least one target. Returns 'true' if yes, 'false'
// otherwise
function validateNoSelectionWithoutTarget() {
	   var scenes = graph.getElements();
   var opt = {};
   opt.outbound = true;
   for (var i = 0; i < scenes.length; ++i) {
      var currentNode = scenes[i];
      if (currentNode.attributes.prop.videoData.sceneId == 'selectionNode') {
         var outgoingEdges = graph.getConnectedLinks(currentNode, opt);
         // Only one outgoing edge allowed
         if (outgoingEdges.length < 1) {
            return false;
         }
         // Check if outgoing edges have a target
         for (var j = 0; j < outgoingEdges.length; ++j) {
            if ((outgoingEdges[j].attributes.target == undefined)
                  || (outgoingEdges[j].attributes.target == null)) {
               return false;
            }
         }
      }
   }
   // All selection nodes have at least one outgoing edge connected with a target
   return true;
}

// Returns 'false' if there are invalid nodes in the graph, i.e. ones where the
// corresponding scene was removed from the DB, 'true' otherwise
function validateValidNodes() {
    var scenes = graph.getElements();
    for (var i = 0; i < scenes.length; ++i) {
       if (scenes[i].attributes.prop.videoData.sceneId == 'invalidNode') {
           localStorage.exportErrorText += "The graph contains invalid nodes.<br/>";
           return false;
       }
    }
    // No invalid nodes there
    return true;
}
