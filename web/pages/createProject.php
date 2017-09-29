<?php
if($userdata['id'] == ''):
	$_POST['redirect'] = $_SERVER['REQUEST_URI'];
	include(dirname(__FILE__).'/login.php');
else:

	$site['title'] = 'Create New Project';

	$message = '';
	if(isset($_POST['submit'])){
		if(trim($_POST['name']) == ''){
			$errors[] = 'Please provide the <i>Project Name</i>.';
		}
		if(count($errors) == 0){
		    if(!createProject($_POST['name'], $_POST['description'], $userdata['id'])) {
                $errors[] = 'The project could not be created.';
            }
		}
		if(count($errors) == 0){
			$newId = mysql_insert_id();
			$ok = true;
			$message = createMessage('Project successfully created. Please wait, you will be redirected...', 'confirm');
			echo '<meta http-equiv="refresh" content="3; URL=/project.html?id='.$newId.(($isExtension) ? '&amp;extension' : '').'">';
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
		 <div class="row">
		  <label for="name">Project Name:</label>
		  <input type="text" id="name" name="name" maxlength="40" value="<?=$_POST['name']?>" />
		 </div>
		 <div class="row">
		  <label for="description">Description:</label>
		  <textarea id="description" name="description"><?=$_POST['description']?></textarea>
		 </div>
		 <div class="row">
		  <input type="submit" name="submit" value="Create Project" />
		 </div>
		</form>
	<?endif;?>
	<?php
endif;
?>