# Engine

Engine is a system for creating a robust, offline-first web application environment. It is designed as a modular, plug-and-play solution that is intuitive for non-technical users and requires little maintenance. By standardizing on cost-efficient hardware and leveraging physical interactions for management tasks, it provides a tangible and affordable way to deploy and maintain web applications on a local network.

## Core Concepts

### Physical-First Management

The system employs a physical metaphor for carrying out IT management operations. For example, a Web App is started by physically docking a disk into a docking station instead of operating an admin application. The idea behind this is that these operations are more intuitive and tangible than using a traditional admin console.

- An App is physically represented by the SSD or USB drive it is contained on (an **App Disk**).
- The collection of running Apps is determined by the collection of App Disks that are plugged in.
- Backups are triggered by docking a **Backup Disk**.
- The person who has physical access to the disk has the rights to run or stop it, similar to using a physical security token.

### Smart & Pro-Active

Instead of a passive UI that waits for an admin, the system pro-actively analyzes its state and suggests management operations when needed.

- When a new App is docked, users are notified when it becomes available.
- The system proposes an upgrade when an App Disk with a newer version is docked.
- The system proposes an upgrade of an Engine when a peer with newer system software is detected.

### Live, Offline-First Data

The system is built around a single, shared data structure that represents the state of the entire network. Both the backend **Engines** and the user-facing **Consoles** are treated as equal peers that operate on this same data structure.

Any change made by one peer—such as a user starting an application from a Console, or an Engine detecting a newly docked disk—is automatically synchronized in real-time to all other peers. This is achieved using Conflict-Free Replicated Data Types (CRDTs), which guarantees that the data will always converge and be consistent across the network, even in offline or low-connectivity environments.

This peer-to-peer synchronization model sharply contrasts with the more common client-server approach of sending messages via a REST API. By operating on a shared, self-converging data structure, the system avoids many of the complex failure modes and race conditions typically encountered when building distributed systems with message-passing architectures.

## Overall Solution Architecture

The **Engine** software in this repository is the core backend component of a larger solution designed to create self-contained, offline web environments for rural schools in Africa.

The overall solution provides a complete "internet-in-a-box" and consists of:

- **Appdocker Devices:** Dedicated hardware running the **Engine** software. They act as servers, making web applications available on the local network.
- **Client Devices:** Hardware used by students and teachers to access the web applications.
- **The Console:** A web-based user interface that runs on Client devices, allowing users to see, run, and monitor applications.
- **A Private WiFi Network:** The system deploys its own wireless network, giving users access to all applications without needing an internet connection.
- **A Curated Set of Offline Apps:** The solution includes several key applications, such as:
    - An offline version of **Wikipedia**.
    - **Kolibri**, an educational platform for offline learning and class management.
    - **Nextcloud**, providing a private, local alternative to Google Drive for file storage and collaboration.

All hardware is standardized on cost-efficient Raspberry Pi devices to simplify setup and maintenance.

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

### Autonomous Operation

The primary function of an Engine is to operate autonomously once it is running. It requires no direct interaction for its main tasks:

-   **Auto-Discovery:** It automatically discovers and communicates with other Engines on the local network.
-   **Auto-Processing:** It automatically detects any inserted disk (e.g., an App Disk) and processes it. For an App Disk, this means mounting the disk, starting the Docker containers for all the apps on it, and announcing the presence of the new apps to all users by updating the shared network state.

### Command-Line Interface (CLI)

In addition to its autonomous operation and the primary method of physical management (inserting/ejecting disks), the Engine provides a command-line interface for occasional administrative tasks. This CLI can be used by an Engine Admin to create new Disks or manage the state of applications.

To use the CLI, connect to a running engine using the `client.ts` script:

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

For a full list of available commands and their descriptions, please see the [Command Reference](COMMANDS.md).

## Development

This project is built with TypeScript and runs on Node.js.

- **Key Technologies:** TypeScript, Node.js, Docker, Automerge, zx.
- **Install Dependencies:** `pnpm install`
- **Run in Dev Mode:** `pnpm dev`
- **Build:** `pnpm build`
- **Run Tests:** `pnpm test`
