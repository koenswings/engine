#!/bin/bash
# /usr/local/bin/boot.sh

echo "Starting boot.sh" > /home/pi/boot.out

FLAG="/boot/MASTER"
if [[ -f $FLAG ]]; then
  echo "**********************" >> /home/pi/boot.out
  echo "Personalising the disk" >> /home/pi/boot.out
  echo "**********************" >> /home/pi/boot.out


  # Regenerating ssh identity
  echo "Regenerating ssh identity" >> /home/pi/boot.out
  # systemctl stop ssh
  # /bin/rm -v /etc/ssh/ssh_host_*
  # dpkg-reconfigure openssh-server
  # systemctl start ssh
  systemctl stop ssh >> /home/pi/boot.out 2>&1
  /bin/rm -v /etc/ssh/ssh_host_* >> /home/pi/boot.out 2>&1
  sudo DEBIAN_FRONTEND=noninteractive dpkg-reconfigure openssh-server >> /home/pi/boot.out 2>&1
  systemctl start ssh >> /home/pi/boot.out 2>&1

  # Regenerating salt id
  # echo "Regenerating salt id" >> /home/pi/boot.out
  # systemctl stop salt-minion
  #rm -v /etc/salt/pki/minion/minion.pem
  #rm -v /etc/salt/pki/minion/minion.pub
  # cat /dev/null > /etc/salt/minion_id
  # systemctl start salt-minion

  # Regenerating Zerotier id
  # echo "Regenerating Zerotier id" >> /home/pi/boot.out
  # stop the service
  # systemctl stop zerotier-one >> /home/pi/boot.out 2>&1
  # rm keys
  # rm -v /var/lib/zerotier-one/identity.public >> /home/pi/boot.out 2>&1
  # rm -v /var/lib/zerotier-one/identity.secret >> /home/pi/boot.out 2>&1
  # restart the service
  # systemctl start zerotier-one >> /home/pi/boot.out 2>&1
  
  # Preventing from running again
  echo "Preventing from running again" >> /home/pi/boot.out
  /bin/rm -v "$FLAG"
fi

echo "******************************" >> /home/pi/boot.out
echo "Growing and resizing partition" >> /home/pi/boot.out
echo "******************************" >> /home/pi/boot.out
sudo growpart /dev/sda 2 >> /home/pi/boot.out 2>&1    # Updates the partition table (fast)
sudo resize2fs /dev/sda2 >> /home/pi/boot.out 2>&1    # Resizes the file system (slow)

# Obslete
# echo "**********************" >> /home/pi/boot.out
# echo "Handling a wlan switch" >> /home/pi/boot.out
# echo "**********************" >> /home/pi/boot.out
# echo "Adapting hostapd.conf" >> /home/pi/boot.out
# #if ifconfig | grep -q "wlan1"; then
# if cat /sys/class/net/wlan1/operstate; then
#   # If hostapd was configured previously for wlan0, change it to wlan1
#   echo "Replacing wlan0 with wlan1" >> /home/pi/boot.out
#   sed -i.bak 's|\(\s*\)interface\(\s*\)=\(\s*\)wlan0|\1interface\2=\3wlan1|g' /etc/hostapd/hostapd.conf >> /home/pi/boot.out 2>&1
#   sed -i.bak 's|\(\s*\)WifiInterface\(\s*\)=\(\s*\)wlan0|\1WifiInterface\2=\3wlan1|g' /etc/raspap/hostapd.ini >> /home/pi/boot.out 2>&1  # Update RaspAP UI state
#   sed -i.bak 's|\(\s*\)WifiManaged\(\s*\)=\(\s*\)wlan0|\1WifiManaged\2=\3wlan1|g' /etc/raspap/hostapd.ini >> /home/pi/boot.out 2>&1      # Update RaspAP UI state
# else  # No wlan1
#   # If hostapd was configured previously for wlan1, change it to wlan0
#   echo "Replacing wlan1 with wlan0" >> /home/pi/boot.out
#   sed -i.bak 's|\(\s*\)interface\(\s*\)=\(\s*\)wlan1|\1interface\2=\3wlan0|g' /etc/hostapd/hostapd.conf >> /home/pi/boot.out 2>&1
#   sed -i.bak 's|\(\s*\)WifiInterface\(\s*\)=\(\s*\)wlan1|\1WifiInterface\2=\3wlan0|g' /etc/raspap/hostapd.ini >> /home/pi/boot.out 2>&1  # Update RaspAP UI state
#   sed -i.bak 's|\(\s*\)WifiManaged\(\s*\)=\(\s*\)wlan1|\1WifiManaged\2=\3wlan0|g' /etc/raspap/hostapd.ini >> /home/pi/boot.out 2>&1      # Update RaspAP UI state
# fi 
# echo "Restarting hostapd" >> /home/pi/boot.out
# systemctl restart hostapd >> /home/pi/boot.out 2>&1
# echo "DONE" >> /home/pi/boot.out

# Obsolete - Has no effect
# echo "**********************" >> /home/pi/boot.out
# echo "Cutting off HDMI power" >> /home/pi/boot.out
# echo "**********************" >> /home/pi/boot.out

# vcgencmd display_power 0

# echo "Starting the engine" >> /home/pi/boot.out
# cd /home/pi/engine
# chmod +x startdev.sh && ./startdev.sh

echo "DONE" >> /home/pi/boot.out



