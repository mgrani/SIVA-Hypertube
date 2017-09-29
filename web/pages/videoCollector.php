<?php
if($userdata['id'] == ''):
    $_POST['redirect'] = $_SERVER['REQUEST_URI'];
    include(dirname(__FILE__).'/login.php');
elseif (empty($_SESSION['project'])):
    redirect('/error400.html' . (($isExtension) ? '?extension' : ''));
    die();
else:
    $clips = mysql_query("SELECT * from clip WHERE project=".$_SESSION['project']." ORDER BY id DESC");
    $site['title'] = 'Collect clips';
    $site['script'] = '<script src="js/jquery.maskedinput.js" type="text/javascript"></script>';
?>
    <div id="clipCreation">
        <div id="clipCreationLeft">
            <img id="thumbnail" src="" alt="No thumbnail found for current video">
        </div>
        <div id="clipCreationRight">
            <input type="text" id="clipTitle"
                   placeholder="Title: Unnamed" maxlength="40"/>
            <a href="" class="button timeButton" id="startButton">Start Time</a>
            <a href="" class="button timeButton" id="endButton">End Time</a>
            <input type="text" class="timeString" id="startTime" />
            <span class="timeString" id="timeSeperator">/</span>
            <input type="text" class="timeString" id="endTime" />
            <a href="" class="button" id="addSceneButton" data-clipid="">Add Video Clip</a>
        </div>
    </div>
    <div class="separator"></div>
    <div id="clipContainer">
            <?while ($clip = mysql_fetch_assoc($clips)):
                appendClip($clip);
            endwhile;?>
    </div>
    <script>
        var project = <?=$_SESSION['project']?>;
        <?if (!empty($_GET['clipId'])):?>
            var clipToLoad = <?=intval($_GET['clipId'], 10)?>;
        <?endif;?>
    </script>
    <script type="text/javascript" src="js/videoCollector.js"></script>
<?php
endif;

function appendClip($clip) {
    $startPercentage = round($clip['startTime'] / $clip['videoLength'] * 100);
    $endPercentage = round($clip['endTime'] / $clip['videoLength'] * 100);
?>
    <div id="message"></div>
    <div class="clipElement" id="<?=$clip['id']?>" data-videoid="<?=$clip['videoId']?>">
        <img class="clipImage" src="https://img.youtube.com/vi/<?=$clip['videoId']?>/mqdefault.jpg" alt="No image available">
        <div class="clipHider" style="left: 0; right: <?=100 - $startPercentage?>%;">
        </div>
        <div class="clipHider" style="left:<?=$endPercentage?>%; right: 0;">
        </div>
        <div class="clipMarker" style="left:<?=$startPercentage?>%; right: <?=100 - $endPercentage?>%;">
        </div>
        <div class="clipEventPane" title="Title: <?=$clip['name']?> | Start: <?=formatTime($clip['startTime'])?> | End: <?=formatTime($clip['endTime'])?>">
        </div>
    </div>
<?php
}

function formatTime($time) {
    $intPart = floor($time);
    $hours = floor($intPart / 3600);
    $minutes = floor(($intPart - ($hours * 3600)) / 60);
    $seconds = $intPart - ($hours * 3600) - ($minutes * 60);
    $millis = round(($time - $intPart)*100);

    if ($hours   < 10) {$hours   = "0".$hours;}
    if ($minutes < 10) {$minutes = "0".$minutes;}
    if ($seconds < 10) {$seconds = "0".$seconds;}
    if ($millis < 10) {$millis = "0".$millis;}
    return $hours . ':' . $minutes . ':' . $seconds . '.' . $millis;
}
?>