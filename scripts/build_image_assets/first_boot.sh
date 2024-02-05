#!/bin/bash
# /usr/local/bin/first_boot.sh

echo "Starting first_boot.sh" > /home/pi/first_boot.out

FLAG="/boot/MASTER"
if [[ -f $FLAG ]]; then
  echo "**********************" >> /home/pi/first_boot.out
  echo "Personalising the disk" >> /home/pi/first_boot.out
  echo "**********************" >> /home/pi/first_boot.out


  # Regenerating ssh identity
  echo "Regenerating ssh identity" >> /home/pi/first_boot.out
  # systemctl stop ssh
  # /bin/rm -v /etc/ssh/ssh_host_*
  # dpkg-reconfigure openssh-server
  # systemctl start ssh
  systemctl stop ssh >> /home/pi/first_boot.out 2>&1
  /bin/rm -v /etc/ssh/ssh_host_* >> /home/pi/first_boot.out 2>&1
  sudo DEBIAN_FRONTEND=noninteractive dpkg-reconfigure openssh-server >> /home/pi/first_boot.out 2>&1
  systemctl start ssh >> /home/pi/first_boot.out 2>&1

  # Regenerating salt id
  # echo "Regenerating salt id" >> /home/pi/first_boot.out
  # systemctl stop salt-minion
  #rm -v /etc/salt/pki/minion/minion.pem
  #rm -v /etc/salt/pki/minion/minion.pub
  # cat /dev/null > /etc/salt/minion_id
  # systemctl start salt-minion

  # Regenerating Zerotier id
  # echo "Regenerating Zerotier id" >> /home/pi/first_boot.out
  # stop the service
  # systemctl stop zerotier-one >> /home/pi/first_boot.out 2>&1
  # rm keys
  # rm -v /var/lib/zerotier-one/identity.public >> /home/pi/first_boot.out 2>&1
  # rm -v /var/lib/zerotier-one/identity.secret >> /home/pi/first_boot.out 2>&1
  # restart the service
  # systemctl start zerotier-one >> /home/pi/first_boot.out 2>&1
  
  # Preventing from running again
  echo "Preventing from running again" >> /home/pi/first_boot.out
  /bin/rm -v "$FLAG"
fi

echo "******************************" >> /home/pi/first_boot.out
echo "Growing and resizing partition" >> /home/pi/first_boot.out
echo "******************************" >> /home/pi/first_boot.out
sudo growpart /dev/sda 2 >> /home/pi/first_boot.out 2>&1    # Updates the partition table (fast)
sudo resize2fs /dev/sda2 >> /home/pi/first_boot.out 2>&1    # Resizes the file system (slow)

echo "**********************" >> /home/pi/first_boot.out
echo "Handling a wlan switch" >> /home/pi/first_boot.out
echo "**********************" >> /home/pi/first_boot.out
echo "Adapting hostapd.conf" >> /home/pi/first_boot.out
#if ifconfig | grep -q "wlan1"; then
if cat /sys/class/net/wlan1/operstate; then
  # If hostapd was configured previously for wlan0, change it to wlan1
  echo "Replacing wlan0 with wlan1" >> /home/pi/first_boot.out
  sed -i.bak 's|\(\s*\)interface\(\s*\)=\(\s*\)wlan0|\1interface\2=\3wlan1|g' /etc/hostapd/hostapd.conf >> /home/pi/first_boot.out 2>&1
  sed -i.bak 's|\(\s*\)WifiInterface\(\s*\)=\(\s*\)wlan0|\1WifiInterface\2=\3wlan1|g' /etc/raspap/hostapd.ini >> /home/pi/first_boot.out 2>&1  # Update RaspAP UI state
  sed -i.bak 's|\(\s*\)WifiManaged\(\s*\)=\(\s*\)wlan0|\1WifiManaged\2=\3wlan1|g' /etc/raspap/hostapd.ini >> /home/pi/first_boot.out 2>&1      # Update RaspAP UI state
else  # No wlan1
  # If hostapd was configured previously for wlan1, change it to wlan0
  echo "Replacing wlan1 with wlan0" >> /home/pi/first_boot.out
  sed -i.bak 's|\(\s*\)interface\(\s*\)=\(\s*\)wlan1|\1interface\2=\3wlan0|g' /etc/hostapd/hostapd.conf >> /home/pi/first_boot.out 2>&1
  sed -i.bak 's|\(\s*\)WifiInterface\(\s*\)=\(\s*\)wlan1|\1WifiInterface\2=\3wlan0|g' /etc/raspap/hostapd.ini >> /home/pi/first_boot.out 2>&1  # Update RaspAP UI state
  sed -i.bak 's|\(\s*\)WifiManaged\(\s*\)=\(\s*\)wlan1|\1WifiManaged\2=\3wlan0|g' /etc/raspap/hostapd.ini >> /home/pi/first_boot.out 2>&1      # Update RaspAP UI state
fi 
echo "Restarting hostapd" >> /home/pi/first_boot.out
systemctl restart hostapd >> /home/pi/first_boot.out 2>&1
echo "DONE" >> /home/pi/first_boot.out

echo "**********************" >> /home/pi/first_boot.out
echo "Cutting off HDMI power" >> /home/pi/first_boot.out
echo "**********************" >> /home/pi/first_boot.out

vcgencmd display_power 0



