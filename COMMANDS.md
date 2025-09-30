# Engine Command Reference

This document provides a reference for all commands available in the Engine's command-line interface.

---

## Inspection Commands

These commands are used to view the current state of the system. They can be run from any context.

### `ls`
- **Description:** A raw dump of all data in the shared store.
- **Usage:** `ls`
- **Scope:** `any`

### `engines`
- **Description:** Lists all engines discovered on the network.
- **Usage:** `engines`
- **Scope:** `any`

### `disks`
- **Description:** Lists all disks known to the network.
- **Usage:** `disks`
- **Scope:** `any`

### `apps`
- **Description:** Lists all applications known to the network.
- **Usage:** `apps`
- **Scope:** `any`

### `instances`
- **Description:** Lists all application instances known to the network.
- **Usage:** `instances`
- **Scope:** `any`

---

## Action Commands

These commands perform actions on the system. Some are restricted to an `engine` context, meaning they must either be run on an engine device directly or sent to an engine using the `send` command.

### `send`
- **Description:** Sends a command to be executed on a specific remote engine. This is the primary way to manage engines from a client.
- **Usage:** `send <engineId> <command> [args...]`
- **Scope:** `any`

### `createInstance`
- **Description:** Builds a new application instance on an engine from a git repository. This involves cloning the code, setting up the instance directory, and preparing service images.
- **Usage:** `createInstance <instanceName> <appName> <gitAccount> <gitTag> <diskName>`
- **Scope:** `engine`

### `startInstance`
- **Description:** Starts a previously created application instance. This involves preloading services and creating and running the Docker containers.
- **Usage:** `startInstance <instanceName> <diskName>`
- **Scope:** `engine`

### `runInstance`
- **Description:** A shortcut for running an already-created instance's containers. Assumes `startInstance` has been run at least once.
- **Usage:** `runInstance <instanceName> <diskName>`
- **Scope:** `engine`

### `stopInstance`
- **Description:** Stops a running application instance and its associated Docker containers.
- **Usage:** `stopInstance <instanceName> <diskName>`
- **Scope:** `engine`
