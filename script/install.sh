#!/bin/bash
#
# Bootstrap installer for the Engine software
#

set -e # Exit immediately if a command exits with a non-zero status.

echo "--- Starting Engine Bootstrap Installation ---"

# 1. Install dependencies required to run the main build script
echo "--> Installing Node.js, npm, git, and zx..."
apt-get update -y
apt-get install -y npm git curl
npm install -g n zx
echo "--> Setting Node.js version for zx execution..."
n 22.20.0

# 2. Get the main application code
echo "--> Cloning repository..."
# Clean up previous attempts if they exist
rm -rf /tmp/engine-install
git clone https://github.com/koenswings/engine.git /tmp/engine-install

# 3. Run the main provisioning script in Local Mode
echo "--> Executing main build script in Local Mode..."
cd /tmp/engine-install
zx ./script/build-image.ts

echo "--- Bootstrap Installation Complete ---"
