#!/usr/bin/expect --

set timeout -1
proc slurp {file} {
    set fh [open $file r]
    set ret [read $fh]
    close $fh
    return $ret
}

set imageName [lindex $argv 1]
set 64bit "true"
puts "64bit"

if {[string trimleft $imageName] eq ""} {
  puts "No Image file provided"
  exit
}

set cwd [file normalize [file dirname $argv0]]
set imagePath [file join $cwd $imageName]
puts $imageName
puts $imagePath\n

spawn docker run --name dockerpi -it --rm -v $imagePath:/sdcard/filesystem.img lukechilds/dockerpi:vm pi3

expect "raspberrypi login: "
send "pi\n"
expect "Password: "
send "raspberry\n"
#send $env(PASSWORD)
send "\n"

expect "$ "
send "sudo apt-get update\n"
expect "$ "
send "sudo apt-get -y install dnsmasq\n"
expect "$ "
send "sudo apt-get clean\n"
expect "$ "
send "sudo su -\n"

set file [slurp "etc/dnsmasq.d/usb0"]
expect "# "
send "cat <<EOF >> /etc/dnsmasq.d/usb0\n"
send "$file\n"
send "EOF\n"

set file [slurp "etc/network/interfaces.d/usb0"]
expect "# "
send "cat <<EOF >> /etc/network/interfaces.d/usb0\n"
send "$file\n"
send "EOF\n"

set file [slurp "usr/local/sbin/usb-gadget.sh"]
expect "# "
send "cat <<EOF >> /usr/local/sbin/usb-gadget.sh\n"
send "$file\n"
send "EOF\n"
expect "# "
send "chmod +x /usr/local/sbin/usb-gadget.sh\n"

set file [slurp "lib/systemd/system/usbgadget.service"]
expect "# "
send "cat <<EOF >> /lib/systemd/system/usbgadget.service\n"
send "$file\n"
send "EOF\n"
expect "# "
send "systemctl enable usbgadget.service\n"

expect "# "
send "echo dtoverlay=dwc2 >> /boot/config.txt\n"

expect "# "
send "sed -i 's/$/ modules-load=dwc2/' /boot/cmdline.txt \n"

expect "# "
send "touch /boot/ssh\n"

expect "# "
send "echo libcomposite >> /etc/modules\n"

expect "# "
send "echo denyinterfaces usb0 >> /etc/dhcpcd.conf\n"

expect "# "
send "sudo systemctl enable getty@ttyGS0.service\n"

expect "# "
send "poweroff\n"

expect "Reboot failed -- System halted"
exec docker stop dockerpi
exit
