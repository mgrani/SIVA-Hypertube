<?php
$project = mysql_fetch_assoc(mysql_query("select * from project where id = '".mysql_real_escape_string($_GET['id'])."'"));
if($project['id'] == '' or $project['isPublic'] == '0'):
	include(dirname(__FILE__).'/error400.php');
else:
	$site['title'] = 'Report "'.$project['name'].'"';
	$message = '';
	if(isset($_POST['submit'])){
		if(trim($_POST['name']) == '' or trim($_POST['email']) == '' or trim($_POST['description']) == ''){
			$errors[] = 'Please provide your email address and a description of the issue.';
		}
		if(count($errors) == 0){
            $result = mysql_query("select email from user where role = 'admin'") or die(mysql_error());
			while($row = mysql_fetch_assoc($result)){
				mail($row['email'], $config['project_name'].': Video reported', "Video: ".$project['name']."\nhttps://".$_SERVER['HTTP_HOST'].str_replace('report.html', 'project.html', $_SERVER['REQUEST_URI'])."\n\nIssue:\n".$_POST['description'], "From: ".$_POST['name']." <".$_POST['email'].">\nReply-To: ".$_POST['name']." <".$_POST['email'].">\nContent-Type: text/plain\n");				
			}
			$message = createMessage('Your report was successfully sent.', 'confirm');
			unset($_POST);
		}
		else{
			$message = createMessage(implode('<br />', $errors));
		}
	}
	?>
	<h1><?=$site['title']?></h1>
	<?=$message?>
	<form action="" method="post">
	 <div class="row">
	  <label for="name">Your Name:</label>
	  <input type="text" id="name" name="name" value="<?=$_POST['name']?>" />
	 </div>
     <div class="row">
	  <label for="email">Your eMail Address:</label>
	  <input type="text" id="email" name="email" value="<?=$_POST['email']?>" />
	 </div>
     <div class="row">
      <label for="description">Description of Issue:</label>
      <textarea id="description" name="description"><?=$_POST['description']?></textarea>
     </div>
	 <div class="row">
	  <input type="submit" name="submit" value="Report Video"/>
	 </div>
     <a href="/project.html?id=<?=$project['id']?><?if($isExtension):?>&amp;extension<?endif;?>" class="button"">Back To Video</a>
	</form>
	<?php
endif;
?>