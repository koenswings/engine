# Engine

Engine is a system for managing and synchronizing distributed applications across a network of devices, such as Raspberry Pis. It uses a CRDT-based approach for state synchronization and provides tools for provisioning devices, deploying applications, and managing their lifecycle.

## Features

- **Distributed Application Management:** Deploy and manage Dockerized applications across multiple devices.
- **Automatic Peer Discovery:** Engines automatically discover each other on the local network using mDNS.
- **CRDT-Based Synchronization:** State is automatically synchronized between all peers using Automerge, ensuring eventual consistency.
- **Flexible Provisioning:** Supports multiple methods for setting up new engine devices, including a remote provisioning script and a user-friendly local bootstrap script.
- **Command-Line Interface:** Provides a CLI for inspecting the state of the network and sending commands to engines.

## Installation

There are two primary methods for installing the engine software onto a new Raspberry Pi device.

### Method 1: Local Bootstrap (Recommended)

This is the easiest method for setting up a new device. It involves running a single command on the new Pi.

1.  **Flash OS:** Flash a standard **Raspberry Pi OS Lite (64-bit)** image to an SD card.
2.  **Boot & Connect:** Boot the Pi while connected to your network via Ethernet. Log in via SSH (`ssh pi@raspberrypi.local`).
3.  **Run Installer:** Execute the following command. It will download and run the installer, which sets up all dependencies and the engine software, and then reboots the device.

    ```sh
    curl -sSL https://raw.githubusercontent.com/koenswings/engine/main/script/install.sh | sudo bash
    ```

### Method 2: Remote Provisioning (For Developers)

This method allows you to provision a new Pi from your development machine.

1.  **Flash & Boot:** Complete steps 1 and 2 from the method above.
2.  **Clone Repo:** Ensure you have this repository cloned on your development machine.
3.  **Run Provisioner:** From the repository root on your dev machine, run the `build-image.ts` script, targeting the new Pi's IP address or `.local` address.

    ```sh
    ./script/build-image.ts --machine raspberrypi.local
    ```

## Usage

Once an engine is running, you can interact with it using the command-line client.

```sh
# Start the client to connect to a specific engine
./script/client.ts --engine <engine-ip-or-hostname>
```

Once in the client, you can issue commands:

```sh
# List all engines in the network
ls engines

# Create a new application instance on a specific engine
send <target-engine-id> createInstance my-app-1 ...
```

## Development

This project is built with TypeScript and runs on Node.js.

- **Key Technologies:** TypeScript, Node.js, Docker, Automerge, zx.
- **Install Dependencies:** `pnpm install`
- **Run in Dev Mode:** `pnpm dev`
- **Build:** `pnpm build`
- **Run Tests:** `pnpm test`