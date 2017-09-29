<?php
$site['title'] = 'Create new user';

$fields = array(
	'firstName' => array('name' => 'First Name'),
	'lastName' => array('name' => 'Last Name'),
	'email' => array('name' => 'E-Mail')
);

$message = '';
if(isset($_POST['submit'])){
	$errors = array();
	foreach($_POST as $key => $val){
		if($fields[$key] == ''){
			unset($_POST[$key]);
		}
	}
	foreach($fields as $key => $field){
		if(trim($_POST[$key]) == ''){
			$errors[] = 'Please provide the <i>'.$field['name'].'</i>.';
		}
	}
	if(count($errors) == 0){
		$user = mysql_fetch_assoc(mysql_query("select * from user where email = '".mysql_real_escape_string($_POST['email'])."'"));
		if($user['id'] != ''){
			$errors[] = 'There is already a user having this email address.';
		}
	}
	if(count($errors) == 0){
		$password = substr(md5(microtime()), 0, 10);
		mysql_query("insert into user set firstName = '".mysql_real_escape_string($_POST['firstName'])."', lastName = '".mysql_real_escape_string($_POST['lastName'])."', email = '".mysql_real_escape_string($_POST['email'])."', password = '".mysql_real_escape_string(crypt($password))."', registered = '".time()."', enabled = '1'") or die(mysql_error());
		$message = createMessage('New user successfully created. An email containing the credentials has been sent to the user.', 'confirm');
		unset($_POST);
	}
	else{
		$message = createMessage(implode('<br />', $errors));
	}
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
			<input type="<?=(($field['isPassword']) ? 'password' : 'text')?>" id="setting_<?=$key?>" name="<?=$key?>" value="<?=((isset($_POST[$key])) ? $_POST[$key] : $config[$key])?>" />
		<?php } else { ?>
			<textarea id="setting_<?=$key?>" name="<?=$key?>"><?=((isset($_POST[$key])) ? $_POST[$key] : $config[$key])?></textarea>
		<?php } ?>
	</div>
	<?php
}
 ?>
 <div class="row">
  <input class="submit" type="submit" name="submit" value="Create user" />
 </div>
</form>