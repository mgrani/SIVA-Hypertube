<?php
$site['title'] = 'Logout...';
unset($_SESSION);
session_destroy();
echo createMessage('Logout successful. Please wait, you will be redirected...', 'confirm');
?>
<script type="text/javascript">
 $(document).ready(function(){
	window.location.href = '/index.php<?if($isExtension):?>?extension<?endif;?>';
 });
</script>