<?php
if($_SESSION['id'] != ''){
	header('Location: /account.html');
	die();
}

$site['title'] = 'Registration';

$fields = array(
	'email' => 'Email Address',
	'password' => 'Password',
	'password2' => 'Password (repeat)',
	'firstName' => 'First Name',
	'lastName' => 'Last Name'
);

$message = '';
if(isset($_POST['submit'])){
	$errors = array();
	foreach($_POST as $key => $val){
		if($fields[$key] == ''){
			unset($_POST[$key]);
		}
	}
	foreach($fields as $field => $description){
		if(trim($_POST[$field]) == ''){
			$errors[] = 'Please provide the <i>'.$description.'</i>.';
		}
	}
	if($_POST['password'] != $_POST['password2']){
		$errors[] = 'The passwords do not match.';
	}
	if(count($errors) == 0){
        $email = mysql_fetch_assoc(mysql_query("select id from user where email = '".mysql_real_escape_string($_POST['email'])."'"));
		if($email['id'] != ''){
			$errors[] = 'This email address is already used by another account. Please provide a different email address.';
		}
	}
	if(count($errors) == 0){
		if(!mysql_query("insert into user set email = '".mysql_real_escape_string($_POST['email'])."', firstName = '".mysql_real_escape_string($_POST['firstName'])."', lastName = '".mysql_real_escape_string($_POST['lastName'])."', password = '".mysql_real_escape_string(crypt($_POST['password']))."'")){
			$errors[] = 'Your data could not be saved.';
		}
	}
	if(count($errors) == 0){
		$ok = true;
		$message = createMessage('Account successfully created. Please wait, you will be redirected...', 'confirm');
		echo '<meta http-equiv="refresh" content="3; URL=/index.php'.(($isExtension) ? '?extension' : '').'">';
	}
	else{
		$message = createMessage(implode('<br />', $errors));
	}
}
?>
<h1><?=$site['title']?></h1>
<?=$message?>
<?if(!$ok):?>
	<form action="" method="post">
	 <?foreach($fields as $field => $description):?>
	  <div class="row">
	   <label for="<?=$field?>"><?=$description?>:</label>
	   <input type="<?=((preg_match('!password!', $field)) ? 'password' : 'text')?>" id="<?=$field?>" name="<?=$field?>" value="<?=((preg_match('!password!', $field)) ? '' : ((isset($_POST[$field])) ? $_POST[$field] : $userdata[$field]))?>" />
	  </div>
	 <?endforeach;?>
	 <div class="row">
	  <input type="submit" name="submit" value="Create Account" />
	 </div>
     <a href="/index.php?<?if($isExtension):?>extension<?endif;?>" class="button backbutton"">Go Back</a>
	</form>
<?endif;?>