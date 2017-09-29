<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="de">
<head>
    <title>SIVA Player</title>
    <meta name="HandheldFriendly" content="True" />
    <meta name="MobileOptimized" content="400" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no" />
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
    <link rel="stylesheet" href="/js/SivaPlayer/css/examplePage.css" type="text/css" />
</head>
<body style="margin:0">

<?php
if (empty($_GET['watch'])):
    include(dirname(__FILE__).'/error400.html');

else:
    $project = mysql_fetch_assoc(mysql_query("select * from project where hash = '" . mysql_real_escape_string($_GET['watch']) . "'"));

    if (empty($project['id']) || !file_exists(dirname(__FILE__).'/../projects/' . $project['hash'] . '/export.js')):
        include(dirname(__FILE__).'/error404.php');

    else:?>
     <div class="sivaPlayer" style="display:none;">
      <div class="sivaPlayer_configuration">
       <span class="style_primaryColor"><?=(empty($_GET['primaryColor']) ? '#ffffff' : '#' . $_GET['primaryColor'])?></span>
       <span class="style_secondaryColor"><?=(empty($_GET['secondaryColor']) ? '#BF0B1A' : '#' .$_GET['secondaryColor'])?></span>
      </div>
     </div>
     <script src="https://www.youtube.com/iframe_api" type="text/javascript"></script>
     <script src="/projects/<?=$project['hash']?>/export.js" type="text/javascript"></script>
     <script src="/js/SivaPlayer/js/initSivaPlayer.js?lang=en,de" type="text/javascript"></script>
    <?endif;
endif;?>
</body>
</html>