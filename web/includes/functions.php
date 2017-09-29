<?php
class DatabaseException extends Exception{}

function createMessage($text, $cssClass = 'error'){
	$msg = '<div class="'.$cssClass.'Message">'.(($cssClass == 'error') ? '<b>Error:</b> ' : '').$text.'</div>';
	return $msg;
}
function throwMessage($text){
	throw new DatabaseException($text);
}
function establishDatabaseConnection($test = false){
	global $config;
	$connection = mysql_connect($config['db_host'], $config['db_user'], $config['db_pass']) or $test or throwMessage('Could not establish database connection. Please check the database settings.');
	if($connection){
		$result = mysql_select_db($config['db_name']) or $test or throwMessage('Could not establish database connection. Please check the database name.');;
		return (boolean)$result;
	}
	return false;
}
function installDatabase(){
	$script = array_merge(explode(';', file_get_contents(dirname(__FILE__).'/schema/drop.sql')), explode(';', file_get_contents(dirname(__FILE__).'/schema/create.sql')));
	foreach($script as $query){
		if(trim($query) != ''){
			if(!mysql_query($query)){
				return false;
			}
		}
	}
	return true;
}
function redirect($target){
	header('Location: '.$target);
	die();
}

function getHashForProjectId($projectId) {
    $result =
        mysql_fetch_assoc(mysql_query("SELECT hash FROM project WHERE id = " . $projectId. ";"));
    return $result['hash'];
}

function getSaveFolderForProjectId($projectId) {
    $result =
        mysql_fetch_assoc(mysql_query("SELECT hash, saveFolder FROM project WHERE id = " . $projectId. ";"));
    return $result['hash'] . "/" . $result['saveFolder'];
}

function createProject($name, $description, $user) {
    $hash = sha1(rand(1, 66666666) + $user);
    $saveFolder = sha1(rand(1, 66666666));
    return mysql_query("insert into project set name = '" . mysql_real_escape_string($name)
        . "', description = '" . mysql_real_escape_string($description)
        . "', user = '" . $user
        . "', hash = '" . $hash
        . "', saveFolder = '" . $saveFolder . "';");
}

function get_search_cols($keywords, $tables, $exactMatch = true){
         $search = str_replace('*', '%', $keywords);
         if($keywords != $search)
                 $sign = " like ";
         else
                 $sign = " = ";
         if(@preg_match('§^(-)?([0-9]+),([0-9]+)$§i', $search))
                 $search = str_replace(',', '.', $search);

         $parts = array();
         foreach($tables as $table){
                 $result = mysql_query("show columns from ".$table) or die(mysql_error());
                 while($row = mysql_fetch_assoc($result)){
                         $part = '('.((count($tables) > 1) ? $table."." : "").$row['Field'].$sign.((!is_numeric($search)) ? "'" : "").mysql_real_escape_string($search).((!is_numeric($search)) ? "'" : "");
                         if(@preg_match('§(int|float)§i', $row['Type']) and !is_numeric($search))
                                 $part .= " and ".((count($tables) > 1) ? $table."." : "").$row['Field']." != '0'";
                         $part .= ')';
                         $parts[] = $part;
                         if(!$exactMatch){
                             $part = '('.((count($tables) > 1) ? $table."." : "").$row['Field']." like ".((!is_numeric($search)) ? "'%" : "").mysql_real_escape_string($search).((!is_numeric($search)) ? "%'" : "");
                             if(@preg_match('§(int|float)§i', $row['Type']) and !is_numeric($search))
                                 $part .= " and ".((count($tables) > 1) ? $table."." : "").$row['Field']." != '0'";
                             $part .= ')';
                             $parts[] = $part;
                             $part = '('.((count($tables) > 1) ? $table."." : "").$row['Field']." like ".((!is_numeric($search)) ? "'%" : "").mysql_real_escape_string($search).((!is_numeric($search)) ? "'" : "");
                             if(@preg_match('§(int|float)§i', $row['Type']) and !is_numeric($search))
                                 $part .= " and ".((count($tables) > 1) ? $table."." : "").$row['Field']." != '0'";
                             $part .= ')';
                             $parts[] = $part;
                             $part = '('.((count($tables) > 1) ? $table."." : "").$row['Field']." like ".((!is_numeric($search)) ? "'" : "").mysql_real_escape_string($search).((!is_numeric($search)) ? "%'" : "");
                             if(@preg_match('§(int|float)§i', $row['Type']) and !is_numeric($search))
                                 $part .= " and ".((count($tables) > 1) ? $table."." : "").$row['Field']." != '0'";
                             $part .= ')';
                             $parts[] = $part;
                         }
                 }
         }
         return implode(' or ', $parts);
}
function site_handler($url, $url_first_site, $amount, $v, $order, $limit){
         $handler = '<span>Page</span> ';
         if($amount > $limit){
                 $seite = 1;
                 $seiten = 0;
                 $aktuelle = ($v / $limit) + 1;
                 while($amount > $seiten){
                         if($seite == $aktuelle)
                                 $handler .= '<span>'.$seite.'</span> | ';
                         else
                                 $handler .= "<a href=\"".str_replace(array('{v}', '{order}'), array($seiten, $order), (($seiten > 0) ? $url : $url_first_site))."\">".$seite."</a> | ";
                         $seite = $seite + 1;
                         $seiten = $seiten + $limit;
                 }
        }
        else
                 $handler .= '<span>1</span>';
        return $handler;
}

function deleteDir($dir) {
    if (is_dir($dir)) {
        $files = glob($dir . '/*');
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
        rmdir($dir);
    }
}
?>