<?php
$site['title'] = 'Edit user';

$user = mysql_fetch_assoc(mysql_query("select * from user where id = '".mysql_real_escape_string($_GET['id'])."'"));
if($user['id'] == '' and !$phpunit['isTest']){
	header('Location: /administration/users.html');
	die();
}

$fields = array(
	'firstName' => array('name' => 'First Name', 'required' => true),
	'lastName' => array('name' => 'Last Name', 'required' => true),
	'email' => array('name' => 'E-Mail', 'required' => true),
	'password' => array('name' => 'New Password', 'isPassword' => true),
	'password2' => array('name' => 'New Password (repeat)', 'isPassword' => true)	
);

$message = '';
if(isset($_POST['submit'])){
	$errors = array();
	foreach($_POST as $key => $val){
		if($fields[$key] == '' and $key != 'role'){
			unset($_POST[$key]);
		}
	}
	foreach($fields as $key => $field){
		if(trim($_POST[$key]) == '' and $field['required']){
			$errors[] = 'Please provide the <i>'.$field['name'].'</i>.';
		}
	}
	if(count($errors) == 0){
		if($_POST['password'] != '' and $_POST['password'] != $_POST['password2']){
			$errors[] = 'The passwords do not match.';
		}
	}
	if(count($errors) == 0){
		$tmpUser = mysql_fetch_assoc(mysql_query("select * from user where email = '".mysql_real_escape_string($_POST['email'])."' and id != '".mysql_real_escape_string($user['id'])."'"));
		if($tmpUser['id'] != ''){
			$errors[] = 'There is already a user having this email address.';
		}
	}
	if(count($errors) == 0){
		mysql_query("update user set firstName = '".mysql_real_escape_string($_POST['firstName'])."', lastName = '".mysql_real_escape_string($_POST['lastName'])."', email = '".mysql_real_escape_string($_POST['email'])."', ".(($_POST['password'] != '') ? "password = '".mysql_real_escape_string(crypt($_POST['password']))."'," : "")." role = '".(($_POST['role'] == 'admin') ? 'admin' : '')."' where id = '".mysql_real_escape_string($user['id'])."'");
		$message = createMessage('Changes successfully saved.', 'confirm');
	}
	else{
		$message = createMessage(implode('<br />', $errors));
	}
}
else{
	$_POST = $user;
}
?>
<h2><?php echo $site['title'];?></h2>
<?php echo $message;?>
<p><a href="/administration/users.html">... back to users</a></p>
<form action="" method="post">
 <?php
 foreach($fields as $key => $field){
	?>
	<div class="row">
		<label for="setting_<?=$key?>"><?=$field['name']?>:</label>
		<?php if(!$field['isHTML']){ ?>
			<input type="<?=(($field['isPassword']) ? 'password' : 'text')?>" id="setting_<?=$key?>" name="<?=$key?>" value="<?=(($field['isPassword']) ? '' : ((isset($_POST[$key])) ? $_POST[$key] : $config[$key]))?>" />
		<?php } else { ?>
			<textarea id="setting_<?=$key?>" name="<?=$key?>"><?=((isset($_POST[$key])) ? $_POST[$key] : $config[$key])?></textarea>
		<?php } ?>
	</div>
	<?php
}
 ?>
	<div class="row">
		<label for="setting_role">Administrator:</label>
		<input type="checkbox" id="setting_role" name="role" value="admin" <?=(($_POST['role'] == 'admin') ? 'checked="checked"' : '')?>" />
	</div>
 <div class="row">
  <input class="submit" type="submit" name="submit" value="Save changes" />
 </div>
</form>