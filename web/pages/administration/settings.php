<?php
if($config['installed'] and $userdata['id'] == ''):
	$_POST['redirect'] = $_SERVER['REQUEST_URI'];
	include(dirname(__FILE__).'/../login.php');
else:

	$site['title'] = 'Settings';

	$fields = array(
		'db_host' => 'Database Host',
		'db_user' => 'Database User',
		'db_pass' => 'Database Password',
		'db_name' => 'Database Name',
		'project_name' => 'Project Name',
		'project_email' => 'Project eMail Address'
	);

	if(!$config['installed']){
		$fields['admin_email'] = 'Administrator\'s Email Address';
		$fields['admin_pass'] = 'Administrator\'s Password';
		$fields['admin_pass2'] = 'Administrator\'s Password (repeat)';
	}

	$message = '';
	if(isset($_POST['submit'])){
		$errors = array();
		foreach($_POST as $key => $val){
			if($fields[$key] == ''){
				unset($_POST[$key]);
			}
		}
		foreach($fields as $field => $description){
			if((trim($_POST[$field]) == '') && !($field == 'db_pass')){
				$errors[] = 'Please provide the <i>'.$description.'</i>.';
			}
		}
		if(!$installed){
			if($_POST['admin_pass'] != $_POST['admin_pass2']){
				$errors[] = 'The administrator\'s passwords do not match.';
			}
		}
		if(count($errors) == 0){
			$projectConfig = array('project_name' => $_POST['project_name'], 'project_email' => $_POST['project_email'], 'db_name' => $_POST['db_name'], 'db_host' => $_POST['db_host'], 'db_user' => $_POST['db_user'], 'db_pass' => $_POST['db_pass']);
			$config = array_merge($config, $projectConfig);
			if(!establishDatabaseConnection(true)){
				$errors[] = 'Could not connect to database.';
			}
		}
		if(count($errors) == 0){
			if(!$config['installed']){
				if(installDatabase()){
					if(!mysql_query("insert into user set email = '".mysql_real_escape_string($_POST['admin_email'])."', password = '".mysql_real_escape_string(crypt($_POST['admin_pass']))."', role = 'admin', registered = '".time()."'")){
						$errors[] = 'An error occurred during the creation of the administration account.';
					}
				}
				else{
					$errors[] = 'An error occurred during the installation of the database schema: '.mysql_error();
				}
			}
		}
		if(count($errors) == 0){
			$open = fopen(dirname(__FILE__).'/../../includes/config.txt', 'w+');
			fwrite($open, json_encode($projectConfig));
			fclose($open);
			$message = createMessage('Changes successfully saved.', 'confirm');
			if(!$config['installed']){
				$message .= createMessage('Please wait. You will be redirected.', 'confirm');
				echo '<meta http-equiv="refresh" content="3; URL=/'.(($isExtension) ? '?extension' : '').'">';
			}
		}
		else{
			$message = createMessage(implode('<br />', $errors));
		}
	}
	?>
	<h1><?=$site['title']?></h1>
	<?=$message?>
	<form action="" method="post">
	 <?foreach($fields as $field => $description):?>
	  <div class="row">
	   <label for="<?=$field?>"><?=$description?>:</label>
	   <input type="<?=((preg_match('!_pass!', $field)) ? 'password' : 'text')?>" id="<?=$field?>" name="<?=$field?>" value="<?=((isset($_POST[$field])) ? $_POST[$field] : $config[$field])?>" />
	  </div>
	 <?endforeach;?>
	 <div class="row">
	  <input type="submit" name="submit" value="Save Settings" />
	 </div>
	</form>
<?endif;?>