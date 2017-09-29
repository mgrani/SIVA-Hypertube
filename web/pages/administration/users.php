<?php
$site['title'] = 'User administration';
?>
<h2><?php echo $site['title'];?></h2>
<?php
if($_GET['action'] == 'delete'){
	$user = mysql_fetch_assoc(mysql_query("select * from user where id = '".mysql_real_escape_string($_GET['id'])."'"));
	if($user['id'] != '' and $user['isAdmin'] != '1'){
		mysql_query("delete from user where id = '".mysql_real_escape_string($_GET['id'])."'") or die(mysql_error());
		echo createMessage('The user was successfully deleted.', 'confirm');
	}
	else{
		echo createMessage('An error occurred.');
	}
}
else if($_GET['action'] == 'login'){
	$user = mysql_fetch_assoc(mysql_query("select * from user where id = '".mysql_real_escape_string($_GET['id'])."'"));
	if($user['id'] != ''){
		$_SESSION['id'] = $user['id'];
        if(!$phpunit['isTest']) {
            header('Location: /account.html');
        }
	}
	else{
		echo createMessage('An error occurred.');
	}
}
?>
<p>
 <a href="/administration/createUser.html">Create new user</a>
</p>
<?php
if($_GET['id'] != ''):
    ?>
    <p>
     <b>Filter for user:</b> #<?=$_GET['id']?> (<a href="/administration/users.html">show all</a>)
    </p>
    <?php
endif;
?>
<?php
$v = $_GET['v'];
if($v == '')
         $v = 0;
$amount = mysql_fetch_assoc(mysql_query("select count(id) as num from user where ".(($_GET['keywords'] != '') ? "(".get_search_cols($_GET['keywords'], array('user')).") and " : "")." 1=1 ".(($_GET['id'] != '' and $_GET['action'] != 'delete') ? " and id = '".mysql_real_escape_string($_GET['id'])."'" : "")));
$site_handler = site_handler('/administration/users.html?v={v}&amp;keywords='.urlencode($_GET['keywords']), '/administration/users.html?keywords='.urlencode($_GET['keywords']), $amount['num'], $v, '', 30);
echo $site_handler;
?> |
<form method="get" action="" class="searchForm"><b>Search:</b> <input type="text" name="keywords" value="<?=$_GET['keywords']?>" /> <input type="submit" name="search" value="search..." /></form>
<table width="100%"class="administrationTable">
 <tr>
  <td>ID</td>
  <td>Registered</td>
  <td>Firstname</td>
  <td>Lastname</td>
  <td>eMail</td>
  <td>Level</td>
  <td></td>
 </tr>
 <?php
 $result = mysql_query("select * from user where ".(($_GET['keywords'] != '') ? "(".get_search_cols($_GET['keywords'], array('user')).") and " : "")." 1=1 ".(($_GET['id'] != '' and $_GET['action'] != 'delete') ? " and id = '".mysql_real_escape_string($_GET['id'])."'" : "")." order by id desc limit ".$v.",30");
 $i = 0;
 while($row = mysql_fetch_assoc($result)){
         ?>
         <tr class="<?php echo (($row['enabled'] != '1') ? 'disabled' : (($i % 2 == 0) ? 'even' : 'odd'));?>">
          <td><b><?php echo $row['id'];?></b></td>
          <td><?php echo date("d.m.Y H:i", $row['registered']);?></td>
          <td><b><?php echo $row['firstName'];?></b></td>
          <td><b><?php echo $row['lastName'];?></b></td>
          <td><a href="mailto:<?php echo $row['email'];?>"><?php echo $row['email'];?></a></td>
		  <td><?=(($row['role'] == 'admin') ? 'Administrator' : 'User')?></td>
          <td><a href="/administration/editUser.html?id=<?php echo $row['id'];?>">edit user</a><?php if($row['isAdmin'] != '1'):?> | <a href="/administration/users.html?action=delete&amp;id=<?php echo $row['id'];?>" onclick="return confirm('Do you really want to delete this user?');">delete user</a> | <a href="/administration/users.html?action=login&amp;id=<?php echo $row['id'];?>">log in as user</a><?php endif;?></td>
         </tr>
         <?php
         $i++;
 }
 ?>
</table>
<?php echo $site_handler;?>  