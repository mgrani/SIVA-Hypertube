<?php
$site['title'] = 'Hypertube';
?>
<h1>Welcome to Hypertube!</h1>
<p>As part of the scientific project mirKUL, Hypertube is a prototypic platform for publishing interactive, non-linear, annotated videos - so called hypervideos.<br />
To get more information on hypervideos please visit the <a class="hyperlink" href="https://mirkul.uni-passau.de">project's website</a>.<br /><br />
To start creating your own hypervideos right away :
</p>

<li>Download and install the <a class="hyperlink" href="https://www.google.de/chrome/browser/desktop/">Chrome</a> browser.</li>
<li>Download the <a class="hyperlink" href="https://chrome.google.com/webstore/detail/siva-web-producer/iekikdlghfmiomfaboebdmlahnhcjfkc">SIVA Web Producer</a> from the Chrome Web Store.</li>
<li>Start Chrome, visit a Youtube video page and open the SIVA Web Producer by clicking its icon in the Chrome extension bar.</li> 
<br />
<p>You might also want to watch our short <a class="hyperlink" href="https://vimeo.com/167556235/df8bba958e">demo video</a> giving an overview of the workflow.

<form method="get" action="" class="projectSearch"><input type="text" name="keywords" placeholder="Search for videos..." value="<?=$_GET['keywords']?>" /> <input type="submit" name="search" value="search..." /></form>
<div class="projectGrid">
 <?php
 $i = 0;
 $result = mysql_query("select id, name, hash from project where ".(($_GET['keywords'] != '') ? "(".get_search_cols($_GET['keywords'], array('project'), false).") and " : "")." isPublic = '1' order by id desc") or die(mysql_error());
 while($row = mysql_fetch_assoc($result)){
	 ?>
	 <a href="/project.html?watch=<?=$row['hash']?><?if($isExtension):?>&amp;extension<?endif;?>"><?=$row['name']?></a>
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