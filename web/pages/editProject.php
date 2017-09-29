<?php
if($userdata['id'] == ''):
	$_POST['redirect'] = $_SERVER['REQUEST_URI'];
	include(dirname(__FILE__).'/login.php');
else:

	$site['title'] = 'Edit Project';
	$project = mysql_fetch_assoc(mysql_query("select * from project where id = '".mysql_real_escape_string($_GET['id'])."'"));

	if($project['id'] == '' or $project['user'] != $userdata['id']){
		redirect('/error401.html'.(($isExtension) ? '?extension' : ''));
        die();
	}
	?>

  <h1><?=$site['title']?></h1>
  <?if(trim($project['description']) != ''):?><p><?=$project['description']?></p><?endif;?>



	<?php
endif;
?>