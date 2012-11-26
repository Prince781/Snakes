<?php
//submit.php - useful for submitting user data to the servers
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
if (isset($_POST["username"]) && isset($_POST["score"]) && isset($_POST["level"])) {
	$username = $_POST["username"];
	$score = $_POST["score"];
	$level = $_POST["level"];
} else exit("There's nothing to see here...");
//otherwise, perform
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
mysql_query("INSERT INTO Snakes_Game (Username, Score, Level) VALUES ($username, $score, $level)") or die(mysql_error());
mysql_close($con);
exit("Successfully updated information.");
?>
