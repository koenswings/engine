# Technical Architecture

Based on the source code and documentation, here is a technical architecture summary of the Powerberries project.

### **1. Core Concept: Physical Web App Management**
The project implements a distributed "Physical Web App Management" system. Instead of installing software on a central server, web applications are contained on portable physical drives (**App Disks**). When these disks are docked into a Raspberry Pi-based appliance (**Appdocker** or "Engine"), the system automatically detects, mounts, and executes the apps contained within them.

*   **Appdocker (Engine):** A Raspberry Pi device running the custom "Engine" software.
*   **App Disk:** An SSD or USB stick formatted with `ext4` containing Docker Compose definitions and data for web apps.
*   **Clients:** Devices on the same network that access the apps via a web browser.

---

### **2. Software Architecture: The "Engine"**
The core software is a Node.js application called the **Engine**, managed by `pm2` for persistence and auto-restart. The architecture relies on a local-first, distributed state model using **Automerge** to synchronize data between devices without a central server.

#### **A. State Management (Automerge Repo)**
The project moved away from Yjs/Valtio (referenced in brainstorming notes) to **Automerge** for conflict-free data synchronization.

*   **The Store:** The central data structure is a "Store" document containing maps for Engines, Disks, Apps, and Instances.
*   **Initialization (The "Golden Template"):** To solve the "offline-first" initialization problem (where two offline nodes create diverging documents), the code implements a specific pattern found in `repo.ts` and `Store.ts`.
    *   The system uses a binary template file (`store-template.json`) containing an empty document with a pre-defined UUID.
    *   On startup, the Engine attempts to load the main document from local storage. If it does not exist (first boot), it imports this binary template. This ensures all nodes start with the same document ID, allowing them to merge seamlessly when they eventually connect.
*   **Storage:** Data is persisted to the local filesystem using `NodeFSStorageAdapter`.

#### **B. Data Flow: Monitors & The Repo**
The application uses a "Monitor" pattern. Monitors listen for system events (USB insertion, network changes, time) and update the Automerge Repo. The Repo then syncs these changes to other peers.

*   **USB Device Monitor (`usbDeviceMonitor.ts`):**
    *   Watches the `/dev/engine` directory for new storage devices.
    *   When a disk is inserted, it mounts the drive, reads its `META.yaml` identity, and scans for App instances.
    *   It updates the `Disk` and `Instance` objects in the Automerge Store.
    *   It triggers the execution of apps (via Docker).

*   **mDNS Monitor (`mdnsMonitor.ts`):**
    *   Uses the `ciao` library to advertise the local Engine's presence on the network.
    *   Uses `node-dns-sd` to discover other Engines on the LAN.
    *   When a peer is discovered, it initiates a WebSocket connection to sync the Automerge document.

*   **Time Monitor (`timeMonitor.ts`):**
    *   Periodically updates the `lastRun` timestamp in the Engine object within the Store. This acts as a heartbeat, allowing the UI to detect if an Engine has gone offline.

*   **Store Monitor (`storeMonitor.ts`):**
    *   Listens for changes *coming from* the Automerge Repo (updates from remote peers or local monitors).
    *   It reacts to these data changes to trigger side effects, such as executing commands sent from a client.

#### **C. Communication Topology**
*   **Sync Protocol:** Engines connect via WebSockets. The `repo.ts` file sets up a `WebSocketServer`.
*   **Discovery:** Engines automatically find each other using mDNS (Multicast DNS).
*   **Network Mode:** The system creates a mesh where every Engine acts as a peer. A client (Console) connects to one Engine via WebSocket and receives the synchronized state of the entire network.

---

### **3. Implementation of Brainstorming Decisions**

| Brainstorming Concept | Implemented Decision (Source Code) |
| :--- | :--- |
| **Data Sync:** Use Yjs with Valtio | **Switched to Automerge:** The code explicitly uses `@automerge/automerge-repo` and implements `startAutomergeServer` in `repo.ts`. |
| **Object Identity:** Objects need unique IDs | **Implemented:** The `Meta.ts` and `CommonTypes.ts` define strongly typed IDs (`EngineID`, `DiskID`) derived from hardware UUIDs or generated UUIDs stored in `META.yaml` files. |
| **Initialization:** Preventing data overwrite on boot | **Implemented:** `start.ts` checks for a `STORE_URL_PATH` or `STORE_TEMPLATE_PATH`. `Store.ts` implements `initialiseServerStore` which imports a binary template to ensure consistent document IDs across offline nodes. |
| **App Execution:** Docker Containers | **Implemented:** `Instance.ts` uses `node-docker-api` and `zx` shell scripts to manage Docker containers. Apps are defined by `compose.yaml` files found on the disk. |
| **Remote Commands:** Shell scripts via SSH | **Refined:** While SSH/rsync keys are generated, the primary command interface is now data-driven. `Commands.ts` defines commands that are processed by the `storeMonitor`, allowing remote UIs to trigger actions by writing to the shared Automerge document. |

### **4. Summary of Data Flow**
1.  **Event:** A user inserts a USB drive containing a "Kolibri" app.
2.  **Detection:** `usbDeviceMonitor` detects the hardware event.
3.  **Local Update:** The monitor updates the Automerge `Store` document, adding a new `Disk` object and an `Instance` object for "Kolibri".
4.  **Sync:** The Automerge Repo detects the change and pushes the update via WebSockets to all connected peers (other Engines and Client Consoles).
5.  **Execution:** The local Engine reads the Docker Compose definition from the disk and starts the container.
6.  **Visualization:** The Client Console (observing the Automerge document) updates its UI to show "Kolibri" as "Running".