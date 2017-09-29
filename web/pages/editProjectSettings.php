<?php
if($userdata['id'] == ''):
	$_POST['redirect'] = $_SERVER['REQUEST_URI'];
	include(dirname(__FILE__).'/login.php');
elseif (empty($_SESSION['project'])):
    include(dirname(__FILE__).'/error400.html');
else:
	$site['title'] = 'Edit Project Settings';
	$project = mysql_fetch_assoc(mysql_query("select * from project where id = '".mysql_real_escape_string($_SESSION['project'])."'"));
	if($project['id'] == '' or $project['user'] != $userdata['id']){
		redirect('/error401.html'.(($isExtension) ? '?extension' : ''));
        die();
	}
	$message = '';
	if(isset($_POST['submit'])){
		if(trim($_POST['name']) == ''){
			$errors[] = 'Please provide a <i>Project Name</i>.';
		}
		if(count($errors) == 0){
			if(!mysql_query("update project set name = '".mysql_real_escape_string($_POST['name'])."', description = '".mysql_real_escape_string($_POST['description'])."' where id = '".mysql_real_escape_string($_SESSION['project'])."'")){
				$errors[] = 'The project could not be updated.';
			}
		}
		if(count($errors) == 0){
            $_SESSION['projectTitle'] = $_POST['name'];
            $_SESSION['projectDescription'] = $_POST['description'];
			$message = createMessage('Project successfully updated.', 'confirm');
		}
		else{
			$message = createMessage(implode('<br />', $errors));
		}
	}
	else{
		$_POST = $project;
	}
	?>
	<!--<h1><?/*=$site['title']*/?></h1>-->
	<?=$message?>
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
	  <input type="submit" name="submit" value="Save Changes"/>
	 </div>
     <a href="/project.html?<?if($isExtension):?>extension<?endif;?>" class="button backbutton"">Back To Project</a>
	</form>
	<?php
endif;
?>