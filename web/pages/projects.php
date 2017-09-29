<?php
if($userdata['id'] == ''):
	$_POST['redirect'] = $_SERVER['REQUEST_URI'];
	include(dirname(__FILE__).'/login.php');
elseif (($_SESSION['project'] != '') && isset($_GET['delete']) && ($_SESSION['project'] == $_GET['delete'])):
    $saveFolder = $_SERVER['DOCUMENT_ROOT'] . "/projects/" . getSaveFolderForProjectId($_SESSION['project']);
    deleteDir($saveFolder);
    $projectDir = $_SERVER['DOCUMENT_ROOT'] . "/projects/" . getHashForProjectId($_SESSION['project']);
    deleteDir($projectDir);

    $result = mysql_query(
        "delete from project where project.id = " . $_SESSION['project']
    );

    $_SESSION['project'] = null;
    $_SESSION['projectTitle'] = null;
    $_SESSION['projectDescription'] = null;
    redirect($_SERVER['REQUEST_URI']);
else:
    $site['title'] = 'Projects';
	?>
<?if($isExtension):?>
<p>
 <a href="/createProject.html<?if($isExtension):?>?extension<?endif;?>" id="createProjectButton" class="button">Create New Project</a>
</p>
<?endif;?>
<div class="projectGrid">
 <?php
 $i = 0;
 $result = mysql_query("select id, name from project where user = '".$userdata['id']."' order by id desc");
 while($row = mysql_fetch_assoc($result)){
	 ?>
	 <a href="/project.html?id=<?=$row['id']?><?if($isExtension):?>&amp;extension<?endif;?>"><?=$row['name']?></a>
	 <?php
	 $i++;
 }
 if($i == 0){
	 ?>
	 No videos could be found.
	 <?php
 }
 ?>
</div>
	<?php
endif;
?>