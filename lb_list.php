<?php
//lb_list.hp - list current members on the leaderboards in a dynamic xml file
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Content-type: text/xml");
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
$query = mysql_query("SELECT * FROM Snakes_Game") or die(mysql_error());
echo "<?xml version=\"1.0\" encoding=\"ISO-8859-1\"?>\n";
echo "<playerlist>\n";
while ($row = mysql_fetch_array($query)) {
	echo "\t<player>\n";
	echo "\t\t<username>".$row["Username"]."</username>\n";
	echo "\t\t<score>".$row["Score"]."</score>\n";
	echo "\t\t<level>".$row["Level"]."</level>\n";
	echo "\t</player>\n";
}
echo "</playerlist>\n";
mysql_close($con);
?>
