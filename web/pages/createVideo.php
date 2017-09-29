<?php
if ($userdata['id'] == '') :
    $_POST['redirect'] = $_SERVER['REQUEST_URI'];
    include (dirname(__FILE__) . '/login.php');
elseif (empty($_SESSION['project'])):
     redirect('/error400.html' . (($isExtension) ? '?extension' : ''));
     die();
else:
    $project = mysql_fetch_assoc(
        mysql_query("select * from project where id = " . $_SESSION['project']));
    if (empty($project['id']) or $project['user'] != $userdata['id']) {
        redirect('/error401.html' . (($isExtension) ? '?extension' : ''));
        die();
    }
    $site['title'] = 'Connect clips';
?>

<script type="text/javascript">var projectId=<?=$_SESSION['project']?>;</script>
<link rel="stylesheet" type="text/css" href="/css/joint.css" />
<script src="/js/lodash.min.js" type="text/javascript"></script>
<script src="/js/backbone-min.js" type="text/javascript"></script>
<script src="/js/joint.js" type="text/javascript"></script>
<script src="/js/jquery.contextMenu.js"></script>
<script src="/js/jquery.ui.position.min.js"></script>
<script src="/js/url.js"></script>
<link rel="stylesheet" href="/css/jquery.contextMenu.css" type="text/css" />

<div id="createVideoContainer">
    <div id="graphButtons">
        <a href="" class="button graphButton" id="saveButton" title="Save current project state">Save</a>
        <a href="" class="button graphButton" id="saveAsButton" title="Save current state as a new project">Save as &hellip;</a>
        <a href="" class="button graphButton" id="revertChangesButton" title="Undo changes applied since the last save">Undo changes</a>
        <a href="" class="button graphButton" id="removeGraphButton" title="Delete current graph">Delete graph</a>
		<a href="" class="button zoomButton" id="zoomOutButton">-</a>
        <a href="" class="button zoomButton" id="zoomResetButton">O</a>
        <a href="" class="button zoomButton" id="zoomInButton">+</a>
        <div style="clear: both;"></div>
    </div>
  <div id="graphArea">
	<!-- <a href="" class="button nodeButton" id="selectionButton" title="Add selection node to graph">Selection</a> 
	<a href="" class="button nodeButton" id="resumeButton" data-timeout="4">Resume</a> -->
  </div>
</div>
<div id="sceneList">
   <?php
    $result = mysql_query(
            "SELECT clip.id, clip.name, clip.videoId, clip.videoLength,
         clip.startTime, clip.endTime FROM project, clip
         WHERE project.user = '" . $userdata['id'] . "'
         AND project.id = '" . $_SESSION['project'] .
                     "' AND clip.project = project.id;");
    if (!$result) {
        exit("Database error: " . mysql_error());
    }
    if (mysql_num_rows($result) == 0) {
        echo("<b>No clips for this project found!</b>");
    }
    while ($row = mysql_fetch_assoc($result)) {
        $marker = '<div style="position:absolute; top:0px; border:2px; ' .
                 'border-color:#f39c12; border-style:solid; width:0px' .
                 '%; left:0px' .
                 '%; height:87%; margin-top:5px; margin-bottom:5px; ' .
                 'margin-left:3px; margin-right:5px;" class="calcSize"></div>';
        $imgTag = '<img src="' . 'https://img.youtube.com/vi/' . $row['videoId'] .
                 '/mqdefault.jpg' . '" alt="' . 'Thumbnail of scene ' . $row['id'] .
                 '">';
        $editButton = '<a href="" class="editSceneButton"></a>';
        $html = '<div draggable="true" id="scene' . $row['id'] .
                 '" class="sceneListEntry" data-scene-id="' . $row['id'] .
                 '" data-scene-video-id="' . $row['videoId'] .
                 '" data-scene-start-time="' . $row['startTime'] .
                 '" data-scene-end-time="' . $row['endTime'] .
                 '" data-scene-video-length="' . $row['videoLength'] . '">' .
                 $imgTag . $marker . '<div>' . $row['name'] . '</div>' .
                 $editButton . '</div>';
        echo $html;
    }
    mysql_free_result($result);
    ?>
</div>
<div id="annotationOverlay" draggable="true">
  <div id="annotationOverlayHeader">
    <label for="nodeTitleOverlay">Scene title:</label>
    <input type="text" id="nodeTitleOverlay" placeholder="Scene title" size="90" />
    <img alt="Node thumbnail" id="nodeThumbnailOverlay" src=""> <a href=""
      class="button" id="saveAnnotationsButton"
    >X</a>
  </div>
  <div id="annotationContainer"></div>
  <div id="annotationButtonContainer">
    <a href="" class="button" id="addTextAnnotationButton">Add Text</a> <a
      href="" class="button" id="addImageAnnotationButton"
    >Add Image</a>
  </div>
</div>
<script src="/js/exporter.js"></script>
<script src="/js/createNewVideo.js"></script>
<?endif;?>