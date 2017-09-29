<?php
if($userdata['id'] == ''):
    $_POST['redirect'] = $_SERVER['REQUEST_URI'];
    include(dirname(__FILE__).'/login.php');

else:
    if (empty($_SESSION['project'])) {
        redirect('/error401.html'.(($isExtension) ? '?extension' : ''));
        die();
    }

	if(file_exists(dirname(__FILE__).'/../projects/' . getSaveFolderForProjectId($_SESSION['project']) . '/exportTemp.js')):?>
	 <div class="sivaPlayer" style="display:none;">
      <div class="sivaPlayer_configuration">
       <span class="style_primaryColor">#ffffff</span>
       <span class="style_secondaryColor">#BF0B1A</span>
	   <span class="style_height">400</span>
      </div>
     </div>
     <script src="https://www.youtube.com/iframe_api" type="text/javascript"></script>
     <script src="/projects/<?=getSaveFolderForProjectId($_SESSION['project']) . "/exportTemp.js"?>" type="text/javascript"></script>
     <script src="/js/SivaPlayer/js/initSivaPlayer.js?lang=en,de" type="text/javascript"></script>
	 <script type="text/javascript">
         $(document).ready(function() {
 		    setPlayerSize();
		    setTimeout('setPlayerSize', 1000);
		    $(self).resize(function() {
    			setPlayerSize();
	    	});
	    });

	    function setPlayerSize(){
		    var height = window.innerHeight - $('#navigation').height() - $('#footer').outerHeight() - parseInt($('#content').css('padding-top')) * 2;
		    $('.sivaPlayer').height(parseInt(height));
		    sivaPlayerArray[0].configuration.style.height = height;
	    }
	 </script>
    <?else:?>
     <div id="exportErrorText" class="errorMessage"></div>
     <script src="/js/preview.js"></script>
	<?endif;
endif;?>