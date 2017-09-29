<?php
session_start();
session_regenerate_id();
$isExtension = isset($_POST['extension']);
include($_SERVER['DOCUMENT_ROOT'] . '/includes/config.php');
include($_SERVER['DOCUMENT_ROOT'] . '/includes/functions.php');

if (isset($_SESSION['id']) && ($_SESSION['id'] != '')) {
    if (!establishDatabaseConnection()) {
        http_response_code(500);
        exit();
    }
    $userdata = mysql_fetch_assoc(mysql_query("SELECT * FROM user WHERE id=" . $_SESSION['id']));
    
    if ($userdata['role'] != 'admin') {
        $result = mysql_fetch_assoc(
            mysql_query("SELECT user FROM project WHERE id=" . $_POST['project']));
        if ($result['user'] !== $_SESSION['id']) {
            http_response_code(401);
            exit();
        }
    }
} else {
    http_response_code(401);
    exit();
}

// Create folder for projects if it doesn't exist
$projectDir = $_SERVER['DOCUMENT_ROOT'] . "/projects/";
createDirIfNotExists($projectDir);
unset($result);
$request = $_POST['request'];
switch ($request) {
    case 'addClip':
        if ($_POST['name'] == '') {
            http_response_code(400);
            echo createMessage('Request rejected. Please select a title.');
            exit();
        } elseif ($_POST['startTime'] >= $_POST['endTime']) {
            http_response_code(400);
            echo createMessage('Request rejected. Start time has to be lower than end time.');
            exit();
        } elseif ($_POST['endTime'] > $_POST['videoLength']) {
            http_response_code(400);
            echo createMessage('Request rejected. End time exceeds video length.');
            exit();
        }
        if ($_POST['clipId'] == '') {
            $result = mysql_query(
                "insert into clip set project = " . $_POST['project'] .
                    ", name = '" . mysql_real_escape_string($_POST['name']) .
                    "', videoId = '" . mysql_real_escape_string($_POST['videoId']) .
                    "', videoLength = " . $_POST['videoLength'] .
                    ", startTime = " . $_POST['startTime'] .
                    ", endTime = " . $_POST['endTime'] . ";"
            );
			if ($result === false) {
				error_log("ERROR ON: insert into clip set project = " . $_POST['project'] .
                    ", name = '" . mysql_real_escape_string($_POST['name']) .
                    "', videoId = '" . mysql_real_escape_string($_POST['videoId']) .
                    "', videoLength = " . $_POST['videoLength'] .
                    ", startTime = " . $_POST['startTime'] .
                    ", endTime = " . $_POST['endTime'] . ";"
				);
			}
        } else {
            $result = mysql_query(
                "update clip set project = " . $_POST['project'] .
					", name = '" . mysql_real_escape_string($_POST['name']) .
					"', videoId = '" . mysql_real_escape_string($_POST['videoId']) .
					"', videoLength = " . $_POST['videoLength'] .
					", startTime = " . $_POST['startTime'] .
					", endTime = " . $_POST['endTime'] .
                " where clip.id = " . $_POST['clipId'] . ";"
            );
			if ($result === false) {
				error_log("ERROR ON: update clip set project = " . $_POST['project'] .
					", name = '" . mysql_real_escape_string($_POST['name']) .
					"', videoId = '" . mysql_real_escape_string($_POST['videoId']) .
					"', videoLength = " . $_POST['videoLength'] .
					", startTime = " . $_POST['startTime'] .
					", endTime = " . $_POST['endTime'] .
					" where clip.id = " . $_POST['clipId'] . ";"
				);
			}
        }
        if ($result === false) :
            http_response_code(500);
			echo createMessage('Clip could not be added.');
            exit();
        else:
            $clipid = mysql_insert_id();
            $clipAttr = array('id' => $clipid, 'name' => $_POST['name'],
                'videoId' => $_POST['videoId'],
                'videoLength' => $_POST['videoLength'],
                'startTime' => $_POST['startTime'],
                'endTime' => $_POST['endTime']);
            echo JSON_encode($clipAttr);
        endif;
        break;
    case 'loadClip':
        $result = mysql_query(
            "select * from clip where clip.id = " . $_POST['clipId'] . ";"
        );
        if ($result === false) :
            http_response_code(500);
            echo createMessage('Clip could not be loaded. Please try again.');
            exit();
        else :
            $clipData = mysql_fetch_assoc($result);
            $clipAttr = array('id' => $clipData['id'],
                'name' => $clipData['name'],
                'videoId' => $clipData['videoId'],
                'videoLength' => $clipData['videoLength'],
                'startTime' => $clipData['startTime'],
                'endTime' => $clipData['endTime']);
            echo JSON_encode($clipAttr);
        endif;
        break;
    case 'deleteClip':
        $result = mysql_query(
            "delete from clip where clip.id = " . $_POST['clipId'] . ";"
        );
        if ($result === false) :
            http_response_code(500);
            echo createMessage('Clip could not be deleted. Please try again.');
            exit();
        else :
            echo JSON_encode(array('clipId' => $_POST['clipId']));
        endif;
        break;
    case 'exportProject' :
        $savedExport = $projectDir . getSaveFolderForProjectId($_POST['project']) . "/export.js";
        $publicExport = $projectDir . getHashForProjectId($_POST['project']) . "/export.js";
        if (!file_exists($savedExport)) {
            http_response_code(400);
            echo createMessage('Export not possible. The graph of your saved project is not valid.');
            exit();
        } else {
            if (file_exists($publicExport)) {
                @unlink($publicExport);
            }
            $copied = @copy($savedExport, $publicExport);
            if ($copied) {
                $result = mysql_query(
                    "update project set exported = NOW() where project.id = " . $_POST['project'] . ";"
                );
            }
        }
        if (empty($result)) :
            if ($copied) {
                @unlink($publicExport);
            }
            http_response_code(500);
            echo createMessage('The project could not be exported. Please try again.');
            exit();
        else :
            $result = mysql_fetch_assoc(mysql_query("select hash, exported from project where project.id = " . $_POST['project'] . ";"));
            echo json_encode(array('hash' => $result['hash'], 'exportTime' => $result['exported']));
        endif;
        break;
    case 'publishProject' :
        $result = mysql_query(
            "update project set isPublic = " . $_POST['publish'] . " where project.id = " . $_POST['project']
        );
        if ($result === false) :
            http_response_code(500);
            echo createMessage('The project status could not be changed. Please try again.');
            exit();
        else :
            echo json_encode(null);
        endif;
        break;
    case 'unpublishAllProjects' :
        $result = mysql_query(
            "update project set isPublic = " . 0
        );
        if ($result === false) :
            http_response_code(500);
            echo createMessage('The status of the projects could not be changed. Please try again.');
            exit();
        else :
            echo json_encode(null);
        endif;
        break;    
    case 'updateJSON':
        error_log("--Debug POST--:\r\n" . print_r($_POST,true));
        $projectId = $_POST['project'];
        $isTemp = $_POST['isTemp'];
        $jsonDataFileName = "/jsonData.json";
        $exportDataFileName = "/export.js";
        // Boolean is received as a string by PHP: http://stackoverflow.com/a/3654467/3992979
        if ($isTemp === "true") {
            $jsonDataFileName = "/jsonDataTemp.json";
            $exportDataFileName = "/exportTemp.js";
        }
        createDirIfNotExists($projectDir . getSaveFolderForProjectId($projectId));
        @unlink($projectDir . getSaveFolderForProjectId($projectId) . $exportDataFileName);
        if (!empty($_POST['playerData'])) {
            writeToFile($projectDir . getSaveFolderForProjectId($projectId) . $exportDataFileName, $_POST['playerData']);
        }
        writeToFile($projectDir . getSaveFolderForProjectId($projectId) . $jsonDataFileName, $_POST['graphData']);
        echo json_encode(null);
        break;
    case 'loadJSON':
        $projectId = $_POST['project'];
        $subFolder = $projectDir . getSaveFolderForProjectId($projectId);
        $jsonDataFileName = "/jsonData.json";
        $jsonDataTempFileName = "/jsonDataTemp.json";
        $jsonDataToLoad = "";
        // The '@' prevents PHP from echoing error messages
        $creationDateJsonData = @filemtime($subFolder . $jsonDataFileName);
        $creationDateJsonTempData = @filemtime(
                $subFolder . $jsonDataTempFileName);
        if ($creationDateJsonData === FALSE) {
            $jsonDataToLoad = $jsonDataTempFileName;
        } else if ($creationDateJsonTempData === FALSE) {
            $jsonDataToLoad = $jsonDataFileName;
        } else if ($creationDateJsonData > $creationDateJsonTempData) {
            $jsonDataToLoad = $jsonDataFileName;
        } else {
           $jsonDataToLoad = $jsonDataTempFileName;
        }
        $data = @file_get_contents(
                $projectDir . getSaveFolderForProjectId($projectId) .
                         $jsonDataToLoad);
        if ($data !== FALSE) {
            echo json_encode($data);
        } else {
            echo json_encode(null);
        }
        break;
    case 'removeGraph':
        $projectId = $_POST['project'];
        if (!@unlink($projectDir . getSaveFolderForProjectId($projectId) . "/jsonDataTemp.json")) {
            echo "Error while deleting the temporary graph file!";
        }
        break;
    case 'getExportJSPath':
        $projectId = $_POST['project'];
        $isTemp = $_POST['isTemp'];
        $exportDataFileName = "/export.js";
        if ($isTemp === "true") {
            $exportDataFileName = "/exportTemp.js";
        }
        // Full path
        $path = $projectDir . getSaveFolderForProjectId($projectId) . $exportDataFileName;
        $isExportDataPresent = is_readable($path);
        if ($isExportDataPresent !== FALSE) {
            echo $path;
        } else {
            echo "No export file present!";
        }
        break;
    case 'saveAs':
        $oldProject = mysql_fetch_assoc(
                mysql_query(
                        "SELECT * FROM project WHERE id = " . $_POST['project'] .
                                 ";"));
        $result = createProject($_POST['name'], $oldProject['description'],
                $oldProject['user']);
        $projectId = mysql_insert_id();
        $_SESSION['project'] = $projectId;
        $_SESSION['projectTitle'] = $_POST['name'];
        $_SESSION['projectDescription'] = $oldProject['description'];
        echo $projectId;
        break;
    case 'cloneClip':
        $projectId = $_POST['project'];
        $oldClipId = $_POST['oldClipId'];
        $oldClip = mysql_fetch_assoc(
                mysql_query("SELECT * FROM clip WHERE id = " . $oldClipId . ";"));
        $result = mysql_query("INSERT INTO clip (project, name, videoId, " .
                "videoLength, startTime, endTime) VALUES (" .
                $projectId . ", '" . $oldClip['name'] . "', '" .
                $oldClip['videoId'] . "', " . $oldClip['videoLength'] . ", " .
                $oldClip['startTime'] . ", " . $oldClip['endTime'] .");");
        echo json_encode(array("oldClipId" => $oldClipId,
                    "newClipId" => strval(mysql_insert_id())));
        break;
    case 'revertChanges':
        $projectId = $_POST['project'];
        $subFolder = $projectDir . getSaveFolderForProjectId($projectId);
        $pathExport = $subFolder . "/export.js";
        $pathJsonData = $subFolder . "/jsonData.json";
        $exportJS = @file_get_contents($subFolder. "/export.js");
        $jsonData = @file_get_contents($subFolder. "/jsonData.json");
        if (($pathExport !== FALSE) && ($exportJS !== FALSE)) {
            writeToFile($subFolder . "/exportTemp.js", $exportJS);
        }
        if (($pathJsonData !== FALSE) && ($jsonData !== FALSE)) {
            writeToFile($subFolder . "/jsonDataTemp.json", $jsonData);
        }
        if (($pathJsonData === FALSE) || ($jsonData === FALSE)) {
            echo "Error while reverting the changes!";
        } else {
            echo "Changes were successfully reverted! The temp files were " .
                    "replaced with the last saved files.";
        }
        break;
    default:
        exit('Unknown request.');
        break;
}

/**
 * Creates a directory if it doesn't exist already
 *
 * @param string $path
 *            the path of the folder to create
 */
function createDirIfNotExists($path) {
    if (!file_exists($path)) {
        mkdir($path, 0777, true);
    }
}

/**
 * Writes content to a file determined by it's path and name
 *
 * @param string $filePath
 *            the path to file including the name
 * @param string $fileContent
 *            the content to write in the file
 */
function writeToFile($filePath, $fileContent) {
    $file = fopen($filePath, "w") or die("Unable to open file!");
    fwrite($file, $fileContent);
    fclose($file);
}

?>