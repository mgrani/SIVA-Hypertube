<?php
$config = json_decode(@file_get_contents(dirname(__FILE__).'/config.txt'), true);
$config['installed'] = file_exists(dirname(__FILE__).'/config.txt');

function createNavigation($isExtension, $isProjectSelected, $isLoggedIn, $isAdmin) {
    global $config;
    if($isLoggedIn){
        $config['navigationRight'][3] = array('text' => 'My Account', 'url' => '/account.php');
		$config['navigationRight'][1] = array('text' => 'Logout', 'url' => '/logout.php');

		if($isExtension) {
			
			$config['navigationLeft'][1] = array('text' => 'Select Project', 'url' => '/projects.php');
			
			if($isProjectSelected) {
				$config['navigationLeft'][2] = array('text' => 'Collect Clips', 'url' => '/videoCollector.php');
				$config['navigationLeft'][3] = array('text' => 'Connect Clips', 'url' => '/createVideo.php');
				$config['navigationLeft'][4] = array('text' => 'Preview', 'url' => '/preview.php');
			}
		}
		else{
			if ($isAdmin) {
				$config['navigationRight'][2] = array('text' => 'Administration', 'url' => '/administration/index.php');
			}
			$config['navigationLeft'][1] = array('text' => 'My Projects', 'url' => '/projects.php');
		}
    }

    if (!$isExtension) {
        $config['navigationLeft'][0] = array('text' => 'Home', 'url' => '/home.php');
		if(!$isLoggedIn){
			$config['navigationRight'][0] = array('text' => 'My Account', 'url' => '/account.php');
		}
    }
}
?>