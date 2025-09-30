# Engine

Engine is a system for creating a robust, offline-first web application environment. It is designed as a modular, plug-and-play solution that is intuitive for non-technical users and requires little maintenance. By standardizing on cost-efficient hardware and leveraging physical interactions for management tasks, it provides a tangible and affordable way to deploy and maintain web applications on a local network.

## Core Concepts

### Physical-First Management

The system employs a physical metaphor for carrying out IT management operations. For example, a Web App is started by physically docking a disk into a docking station instead of operating an admin application. The idea behind this is that these operations are more intuitive and tangible than using a traditional admin console.

- An App is physically represented by the SSD or USB drive it is contained on (an **App Disk**).
- The collection of running Apps is determined by the collection of App Disks that are plugged in.
- Backups are triggered by docking a **Backup Disk**.
- Network file systems are created when a **Files Disk** is docked.
- Custom upgrade operations are auto-triggered when an **Upgrade Disk** is docked.
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

### Scalability & Performance

The system is designed to scale horizontally. Performance can be optimized by simply adding more Appdocker devices to the network and redistributing the App Disks among them.

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

This installation method is intended for developers who have set up a development environment to provision a target Raspberry Pi (the Runtime System).

1.  **Set up Development System:** Follow the instructions in the [Environment Setup](#environment-setup) section to create your Development System. This process will clone the repository for you.
2.  **Flash & Boot Pi:** Flash a standard **Raspberry Pi OS Lite (64-bit)** image to an SD card and boot the new Pi while it is connected to your network.
3.  **Run Provisioner:** From the terminal of your Development System, run the `build-image.ts` script, targeting the new Pi's IP address or `.local` address.

    ```sh
    ./script/build-image.ts --machine raspberrypi.local
    ```

## Usage & Management

Once an Engine is installed and running, there are three primary ways to interact with and manage the system, each suited for different tasks and users.

### 1. Physical Management (for End-Users & Admins)

The primary and most intuitive way to interact with the system is through direct, physical actions.

-   **Starting/Stopping Apps:** Simply dock (plug in) or undock (unplug) an **App Disk**. The Engine will automatically start or stop the corresponding applications.
-   **Backups & Upgrades:** Docking a **Backup Disk** or **Upgrade Disk** will automatically trigger those specific system actions.

### 2. Command-Line Interface (CLI) (for Admins)

For more advanced, interactive tasks, an Engine Admin can use the Command-Line Interface (CLI). The CLI is ideal for inspecting the state of the network in real-time and performing specific actions that go beyond simple physical management.

-   **Purpose:** Inspecting network state, creating new application instances on disks, stopping specific apps remotely.
-   **How to Use:** The CLI is accessed via the `client.ts` script.
    ```sh
    # Connect to a running engine to enter the interactive CLI
    ./script/client.ts --engine <engine-ip-or-hostname>
    ```
-   **Further Reading:** For a full list of available commands, see the [Command Reference](COMMANDS.md).

### 3. Provisioning Scripts (for Admins)

For complex orchestration and administrative tasks, the system provides a suite of powerful provisioning scripts. These are typically used for initial setup of Engine devices, or for advanced tasks like creating new App Disks and building reusable service components.

-   **Key Scripts:** `install.sh`, `build-image.ts`, `build-app-instance.ts`, `build-service.ts`.
-   **Further Reading:** For a detailed description of each script and its options, see the [Provisioning Scripts Reference](SCRIPTS.md).

## Development

This project uses a two-part environment for development: a containerized **Development System** for writing code, and a physical **Runtime System** (a Raspberry Pi) for testing.

### Environment Setup

The **Development System** provides a containerized environment for code editing, compilation, and testing of non-system-dependent features. It is a limited environment that excludes capabilities requiring deep OS integration, such as detecting new disks (`udev`) or discovering other engines on the network (mDNS). It has been primarily tested on macOS hosts.

For evaluating the full functionality, including hardware and network interactions, the **Runtime System** (a physical Raspberry Pi) is required.

The development system is managed using [Docker Dev Environments](https://docs.docker.com/desktop/dev-environments/).

**Host Machine Prerequisites:**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Visual Studio Code](https://code.visualstudio.com/)
- The [Portainer extension](https://www.portainer.io/solutions/docker-desktop-extension) for Docker Desktop (optional but recommended).

**Creating the Environment:**
1.  Open Docker Desktop.
2.  Go to the "Dev Environments" tab.
3.  Create a new environment using this repository's Git URL. Docker will clone the repository and set up the containerized environment for you.
4.  Once created, you can connect to the environment directly from VS Code using the Docker extension.

The runtime system is a dedicated Raspberry Pi provisioned with the Engine software. It can be created using any of the methods described in the [Installation](#installation) section.

Once both systems are set up, you can sync code changes from your Development System to the Runtime System using the provided script:

```sh
./script/sync-engine --machine <runtime-pi-address>
```

### System Requirements

The Engine is developed and tested on **Debian-based Linux distributions** (such as Raspberry Pi OS and Ubuntu). All automated provisioning scripts (`build-image.ts`, `install.sh`) are written using the `apt` package manager and are intended for this family of operating systems.

However, the core Engine software does not have a hard dependency on Debian itself. It relies on standard, modern Linux technologies that are common across most distributions:

-   **`systemd`**: For service management and hostname control.
-   **`udev`**: For detecting hardware events, such as disk insertions.
-   **mDNS/Avahi**: For peer-to-peer network discovery.
-   **Docker**: For application containerization.

Therefore, running the Engine on a non-Debian distribution (like Fedora, Arch Linux, or CentOS) is theoretically possible, but it would require adapting the installation scripts to use the appropriate native package manager (e.g., `dnf` instead of `apt`).

### Common Commands

- **Key Technologies:** TypeScript, Node.js, Docker, Automerge, zx.
- **Install Dependencies:** `pnpm install`
- **Run in Dev Mode:** `pnpm dev`
- **Build:** `pnpm build`
- **Run Tests:** `pnpm test`
