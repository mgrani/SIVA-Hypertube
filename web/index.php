<?php
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);

session_start();
session_regenerate_id();

$isExtension = isset($_GET['extension']);
$isProjectSelected = !empty($_SESSION['project']);

include(dirname(__FILE__).'/includes/config.php');
include(dirname(__FILE__).'/includes/functions.php');

if($config['installed']){
	establishDatabaseConnection();
    if($_SESSION['id'] != ''){
	    $userdata = mysql_fetch_assoc(mysql_query("select * from user where id = ".$_SESSION['id']));
	    if(empty($userdata['id'])) {
    		$_SESSION['id'] = '';
	    }
    }

    $startpage = ($isExtension ? 'projects.php' : 'home.php');
    $defaultTitle = ($isExtension ? "Welcome to the SIVA Web Producer!" : "");
    $page = (($_GET['page'] != '') ? $_GET['page'] : $startpage);
    if(!file_exists(dirname(__FILE__).'/pages/'.$page)){
        $page = 'error404.php';
    }
    if(substr($page, 0, 15) == 'administration/' and $userdata['id'] != '' and $userdata['role'] != 'admin'){
        $page = 'error403.php';
    }
    // handle requests for embedded player
    if(substr($page, 0, 9) == 'embed.php') {
        include(dirname(__FILE__).'/pages/'.$page);
        exit();
    }
} else {
    $page = 'administration/settings.php';
}

createNavigation($isExtension, $isProjectSelected, $_SESSION['id'] != '', $userdata['role'] == 'admin');

$site = array();
ob_start();
try{
	include(dirname(__FILE__).'/pages/'.$page);
}
catch(DatabaseException $e){
	echo createMessage($e->getMessage());
}
$site['content'] = ob_get_contents();
ob_end_clean();
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="de">
 <head>
  <title><?=$site['title']?></title>
  <meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
  <link rel="icon" href="/images/favicon.ico" type="image/x-icon" />
  <link rel="stylesheet" href="/css/style.css" type="text/css" />
  <script src="/js/jquery.min.js" type="text/javascript"></script>
  <script src="/js/scripts.js" type="text/javascript"></script>

  <?if($isExtension):?>
   <link rel="stylesheet" href="/css/extension.css" type="text/css" />
   <script src="/js/extension.js" type="text/javascript"></script>
  <?endif;?>
  <?=$site['script']?>
 </head>
 <body>
 <!-- <div id="header">
   <div id="logo">SIVA <span>Web</span> Producer</div>
  </div>-->
 <div id="navigation">
<?if (empty($config['navigationLeft']) && empty($config['navigationRight'])):?>
    <a href="" class="navigationLeft" style="opacity:0;">Dummy</a>

<?else: 
    if (!empty($config['navigationLeft'])):
        ksort($config['navigationLeft']);
        foreach ($config['navigationLeft'] as $link):
            $class = 'navigationLeft';
            if ('/' . $page == $link['url']):
                $class .= ' current';
            endif;?>
            <a href="<?= preg_replace('!\.php$!', '.html', $link['url']) . (($isExtension) ? '?extension' : '') ?>" class="<?= $class ?>"><?= $link['text'] ?></a>
        <?endforeach;
    endif;
    if (!empty($config['navigationRight'])):
        ksort($config['navigationRight']);
        foreach ($config['navigationRight'] as $link):
            $class = 'navigationRight';
            if ('/' . $page == $link['url']):
                $class .= ' current';
            endif; ?>
            <a href="<?= preg_replace('!\.php$!', '.html', $link['url']) . (($isExtension) ? '?extension' : '') ?>" class="<?= $class ?>"><?= $link['text'] ?></a>
        <?endforeach;
    endif;
endif;?>

    <span id="headerTitle"><?=($isExtension && $isProjectSelected ? $_SESSION['projectTitle'] : $defaultTitle)?></span>
  
 </div>
 <div id="content">
   <?=$site['content']?>
 </div>
 <div id="footer">
   &copy; Copyright 2015 by University of Passau, <a href="http://www.mirkul.uni-passau.de/ueberblick/" target="_blank">mirKUL</a> | <a href="/privacy.html<?if($isExtension):?>?extension<?endif;?>">Privacy</a> | <a href="/imprint.html<?if($isExtension):?>?extension<?endif;?>">Imprint</a>
 </div>
 </body>
</html>