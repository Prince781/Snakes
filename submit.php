<?php
//submit.php - useful for submitting user data to the servers
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
if (isset($_POST["username"]) && isset($_POST["score"]) && isset($_POST["level"])) {
	$username = $_POST["username"];
	$score = $_POST["score"];
	$level = $_POST["level"];
} elseif (!$_SERVER['SERVER_ADDR'] == $_SERVER['REMOTE_ADDR'])
	exit("Hmm....so you thought you could hack using this method?");
  else exit("There's nothing to see here...");
//otherwise, perform
if (preg_match("/\s/",$username.$score.$level) || preg_match("/\W/i",$username.$score.$level))
	exit("Improper values given.");
$db_pass = "";
$xml_data = simplexml_load_file("../../../server_info/server.conf.xml");
foreach ($xml_data->children() as $user) //get users from userlist
	if ($user['name']=='bumbuuco_sendata')
		foreach ($user->children() as $user_attr)
			if ($user_attr->getName()=='password') {
				$db_pass = $user_attr;
				break;
			}
$con = mysql_connect("localhost", "bumbuuco_sendata", $db_pass);
mysql_select_db("bumbuuco_miscInfo", $con) or die("Unable to select bumbuuco_miscInfo");
mysql_query("INSERT INTO Snakes_Game (Username, Score, Level) VALUES ('$username', '$score', '$level')") or die(mysql_error());
mysql_close($con);
exit("Successfully updated information.");
?>
