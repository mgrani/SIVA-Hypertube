<?php
$site['title'] = 'Login';

$message = '';
if(isset($_POST['submit'])){
	$errors = array();
	if($_POST['email'] == ''){
		$errors[] = 'Please enter your email address.';
	}
	if($_POST['password'] == ''){
		$errors[] = 'Please enter your password.';
	}
	$user = array();
	if(count($errors) == 0){
		$user = mysql_fetch_assoc(mysql_query("select id, password from user where email = '".mysql_real_escape_string($_POST['email'])."'"));
		if($user['id'] == '' or $user['password'] != crypt($_POST['password'], $user['password'])){
			$errors[] = 'There is no user having these credentials.';
		}
	}
	if(count($errors) == 0){
		$_SESSION['id'] = $user['id'];
        redirect($_SERVER['REQUEST_URI']);
        die();
	}
	else{
		$message = createMessage(implode('<br />', $errors));
	}
}
?>
<h1><?=$site['title']?></h1>
<?=$message?>
<p>
 <a href="/registration.html<?if($isExtension):?>?extension<?endif;?>" class="button">Not registered yet?</a>
</p>
<form action="" method="post">
 <div class="row">
   <label for="email">Email Address:</label>
   <input type="text" id="email" name="email" value="<?=$_POST['email']?>" />
 </div>
 <div class="row">
   <label for="password">Password:</label>
   <input type="password" id="password" name="password" value="" />
 </div>
 <div class="row">
  <input type="submit" name="submit" value="Log in" />
 </div>
</form>