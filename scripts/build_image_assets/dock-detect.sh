
inotifywait -m ~/dockdisk.log -e modify | while read e
do
	#check if the relevant device is now connected, based on 
	#idVendor and idProduct codes
    echo $e
done