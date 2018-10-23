<?php
include('/var/power/snips/conn.php');
$data = [];
$query = "SELECT timestamp, name, value, percentage FROM uk_power WHERE timestamp > DATE_ADD(NOW(), INTERVAL -24 HOUR)";
$result= mysqli_query($connection, $query)or die(error_log('Data retrieval fail: ' .$query.' ERROR : '. mysqli_error($connection)));
while ($row = mysqli_fetch_assoc($result))
{
  array_push($data, $row);
}
echo json_encode($data, true);
?>
