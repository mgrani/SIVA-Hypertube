<?php
$site['title'] = 'Administration';
?>
<h2><?php echo $site['title'];?></h2>
<table>
   <tr>
    <td><a href="/administration/users.html" class="button">Manage Users</a></td>
	<td><a href="/administration/settings.html" class="button">Edit Settings</a></td>
    <td><a href="" class="button" id="unpublishAllProjectsButton">Unpublish All</a></td>
   </tr>
</table>
<script type="text/javascript" src="/js/administration.js"></script>