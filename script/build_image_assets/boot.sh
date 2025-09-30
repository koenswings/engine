#!/bin/bash
# /usr/local/bin/boot.sh

echo "Starting boot.sh" > /home/pi/boot.out

FLAG="/boot/MASTER"
if [[ -f $FLAG ]]; then
  echo "*********************************" >> /home/pi/boot.out
  echo "Performing First-Boot Personalization" >> /home/pi/boot.out
  echo "*********************************" >> /home/pi/boot.out

  # 1. Regenerate machine-id
  echo "--> Regenerating machine-id" >> /home/pi/boot.out
  rm -f /etc/machine-id
  systemd-machine-id-setup
  
  # 2. Regenerate SSH host keys
  echo "--> Regenerating SSH host keys" >> /home/pi/boot.out
  rm -f /etc/ssh/ssh_host_*
  dpkg-reconfigure -f noninteractive openssh-server >> /home/pi/boot.out 2>&1

  # 3. Set hostname and META.yaml by calling the zx script
  echo "--> Setting hostname and META.yaml via zx script" >> /home/pi/boot.out
  zx /home/pi/engine/script/build-image.ts --personalize >> /home/pi/boot.out 2>&1

  # 4. Preventing from running again
  echo "--> Personalization complete. Removing flag file." >> /home/pi/boot.out
  rm -f "$FLAG"

  # 5. Reboot to apply all changes
  echo "--> Rebooting to apply changes." >> /home/pi/boot.out
  reboot
fi

# This part runs on every boot
echo "******************************" >> /home/pi/boot.out
echo "Growing and resizing partition" >> /home/pi/boot.out
echo "******************************" >> /home/pi/boot.out
# Try to expand the partition and filesystem. Errors are ignored if it's already expanded.
sudo growpart /dev/sda 2 >> /home/pi/boot.out 2>&1 || true
sudo resize2fs /dev/sda2 >> /home/pi/boot.out 2>&1 || true

echo "DONE" >> /home/pi/boot.out
