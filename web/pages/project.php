<?php
// request video by hash value (id and session status can be ignored)
if (!empty($_GET['watch'])):
    $project = mysql_fetch_assoc(mysql_query("select * from project where hash = '" . mysql_real_escape_string($_GET['watch']) . "'"));
    if (empty($project['id'])):
        include(dirname(__FILE__).'/error404.php');
    endif;
    portalVersion($project, $userdata);

// the selected project cannot be identified
elseif (empty($_GET['id']) && empty($_SESSION['project'])):
        include(dirname(__FILE__).'/error400.html');

// a new project has been selected
elseif (empty($_SESSION['project']) || (!empty($_GET['id']) && ($_SESSION['project'] != $_GET['id']))):
    $project = mysql_fetch_assoc(mysql_query("select * from project where id = " . $_GET['id']));

    if (empty($project['id'])) {
        include(dirname(__FILE__).'/error404.php');
    } elseif ($project['user'] != $userdata['id']) {
        include(dirname(__FILE__).'/error401.php');
    } else {
        $_SESSION['project'] = $project['id'];
        $_SESSION['projectTitle'] = $project['name'];
        $_SESSION['projectDescription'] = $project['description'];
        // Reload page to get correct navigation bar
        redirect($_SERVER['REQUEST_URI']);
    }

else:
    $project = mysql_fetch_assoc(mysql_query("select * from project where id = " . $_SESSION['project']));
	$site['title'] = $project['name'];
    $isExported = $project['exported'] != '';
	if($isExtension):?>
	 <div id="projectInfo" xmlns="http://www.w3.org/1999/html">
      <h1 id="projectInfoTitle"><?=$site['title']?></h1>
      <a href="/projects.html?delete=<?=$_SESSION['project']?><?if($isExtension):?>&amp;extension<?endif;?>" class="button projectInfoButton" id="deleteProjectButton">Delete Project</a>
      <a href="/editProjectSettings.html?<?if($isExtension):?>extension<?endif;?>" class="button projectInfoButton">Edit Settings</a>
      <div id="projectInfoDescr">
        <?if(trim($project['description']) != ''):?>
            <?=$project['description']?>
        <?endif;?>
      </div>
     </div>
     <div class="separator"></div>
     <div id="projectActions">
      <h1>Create a video:</h1>
      <a href="/videoCollector.html?<?if($isExtension):?>extension<?endif;?>" class="button">Collect Clips</a>
      <a href="/createVideo.html?<?if($isExtension):?>extension<?endif;?>" class="button">Connect Clips</a>
      <a href="/preview.html?<?if($isExtension):?>extension<?endif;?>" class="button">Preview</a>
     </div>
     <div class="separator"></div>
     <div id="projectPublish">
      <!--<h1>Distribute project:</h1>-->
      <a href="" class="button" id="exportProjectButton">Export video</a>
      <input type="checkbox" id="projectPublishCheck"<?=($project['isPublic'] === '1' ? ' checked="checked"' : '')?><?=($isExported ? '' : ' disabled="disabled"')?>>
      <label for="projectPublishCheck">Publish on <a class="hyperlink" target="_blank" href="https://hypertube.fim.uni-passau.de">Hypertube</a></label>
      <div id="exportProjectInfo">Last export: <?=($isExported ? $project['exported'] : 'N/A');?></div>
      <label for="videoDirectLink" class="projectLinkLabel">Copy direct link:</label>
      <textarea id="videoDirectLink" class="projectLink" readonly wrap="off"><?=($isExported ? htmlspecialchars('https://westbourne.dimis.fim.uni-passau.de/project.html?watch=' . $project['hash']) : '')?></textarea>
      <label for="videoEmbedLink" class="projectLinkLabel">Copy embed code:</label>
      <textarea id="videoEmbedLink" class="projectLink" readonly wrap="off"><?=($isExported ? htmlspecialchars('<iframe width="1280" height=720" src="https://westbourne.dimis.fim.uni-passau.de/embed.html?watch=' . $project['hash'] . '&primaryColor=ffffff&secondaryColor=BF0B1A" frameborder="0" allowfullscreen></iframe>') : '')?></textarea>
     </div>
     <script>
        var project = <?=$_SESSION['project']?>;
        var isExtension = <?=$isExtension?>;
     </script>
     <script src="js/project.js"></script>
	<?else:
        portalVersion($project, $userdata);
	endif;
endif;

function portalVersion($project, $userdata) {
?>
 <h1><?=$project['name']?> <a href="/report.html?id=<?=$project['id']?>" class="reportLink">(report video)</a></h1>
    <?if($userdata['role'] == 'admin'):?>
      <div><a href="" class="button projectInfoButton" id="unpublishSingleProjectButton">Unpublish Project</a></div>
       <script>
        var project = <?=$project['id']?>;
        var isExtension = 0;
       </script>
      <script src="js/administration.js"></script>
    <?endif;?>
    <?if(file_exists(dirname(__FILE__).'/../projects/' . $project['hash'] . '/export.js')):?>
     <div class="sivaPlayer" style="display:none;">
      <div class="sivaPlayer_configuration">
       <span class="style_primaryColor">#ffffff</span>
       <span class="style_secondaryColor">#BF0B1A</span>
       <span class="style_height">400</span>
      </div>
     </div>
     <script src="https://www.youtube.com/iframe_api" type="text/javascript"></script>
     <script src="/projects/<?=$project['hash']?>/export.js" type="text/javascript"></script>
     <script src="/js/SivaPlayer/js/initSivaPlayer.js?lang=en,de" type="text/javascript"></script>
     <script type="text/javascript">
        $(document).ready(function(){
            setPlayerSize();
            setTimeout('setPlayerSize', 1000);
            $(self).resize(function(){
                setPlayerSize();
            });
        });

        function setPlayerSize(){
            var height = window.innerHeight - $('#navigation').height() - $('#footer').height() - parseInt($('#content').css('padding-top')) * 2 - 10;
            $('.sivaPlayer').height(parseInt(height));
            sivaPlayerArray[0].configuration.style.height = height;
        }
     </script>
    <?else:?>
     <div style="clear: both;">Sorry. The author has no video generated yet.</div>
    <?endif;
}?>
