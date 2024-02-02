#!/bin/bash

# if [[ $# -eq 0 ]]; then
#   echo "You must pass a image file"
#   exit
# fi

# if [[ $# -eq 2 ]]; then
#   64BIT=1
# fi

#OFFSET=$(fdisk -l $1 | grep W95 | awk '/^[^ ]*1/{ print $2*512 }')
OFFSET=$(fdisk -l $1 | awk '/^[^ ]*1/{ print $2*512 }')
echo $OFFSET

mkdir boot
#mount -o loop,offset=$OFFSET $1 boot
mount -t msdos -o loop,offset=$OFFSET $1 boot


read -rsp "Please enter password for pi user: " PASSWORD
echo
PASS=$(echo $PASSWORD |  openssl passwd -6 -stdin)
echo "pi:$PASS" > userconf.txt

cp userconf.txt boot/userconf.txt
sync

sudo umount boot
rmdir boot
export PASSWORD

echo "Creating 64bit image"
./create-image -64 $1