<?php
if($userdata['id'] == ''):
	$_POST['redirect'] = $_SERVER['REQUEST_URI'];
	include(dirname(__FILE__).'/login.php');
else:

	$site['title'] = 'My Account';

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
			if(trim($_POST[$field]) == '' and !preg_match('!password!', $field)){
				$errors[] = 'Please provide the <i>'.$description.'</i>.';
			}
		}
		if($_POST['password'] != $_POST['password2']){
			$errors[] = 'The passwords do not match.';
		}
		if(count($errors) == 0){
			$email = mysql_fetch_assoc(mysqL_query("select id from user where email = '".mysql_real_escape_string($_POST['email'])."' and id != '".$userdata['id']."'"));
			if($email['id'] != ''){
				$errors[] = 'This email address is already used by another account. Please provide a different email address.';
			}
		}
		if(count($errors) == 0){
			if(!mysql_query("update user set email = '".mysql_real_escape_string($_POST['email'])."', firstName = '".mysql_real_escape_string($_POST['firstName'])."', lastName = '".mysql_real_escape_string($_POST['lastName'])."'".(($_POST['password'] != '') ? ", password = '".mysql_real_escape_string(crypt($_POST['password']))."'" : "")." where id = '".$userdata['id']."'")){
				$errors[] = 'The changes could not be saved.';
			}
		}
		if(count($errors) == 0){
			$userdata = mysql_fetch_assoc(mysql_query("select * from user where id = '".$userdata['id']."'"));
			$message = createMessage('Changes successfully saved.', 'confirm');
		}
		else{
			$message = createMessage(implode('<br />', $errors));
		}
	}
	?>
	<?=$message?>
	<form action="" method="post">
	 <?foreach($fields as $field => $description):?>
	  <div class="row">
	   <label for="<?=$field?>"><?=$description?>:</label>
	   <input type="<?=((preg_match('!password!', $field)) ? 'password' : 'text')?>" id="<?=$field?>" name="<?=$field?>" value="<?=((preg_match('!password!', $field)) ? '' : ((isset($_POST[$field])) ? $_POST[$field] : $userdata[$field]))?>" />
	  </div>
	 <?endforeach;?>
	 <div class="row">
	  <input type="submit" name="submit" value="Save" />
	 </div>
	</form>
	<?php
endif;
?>