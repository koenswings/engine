


export type URL = string

export type Version = string // Can be major.minor or a commit hash

export type UUID = string

export type Command = string

// References to top-level YMaps and YArrays in the Yjs document
export type YMapRef = string
export type YArrayRef = string

export interface DockerMetrics {
  cpu: string;
  memory: string;
  network: string;
  disk: string;
}

export interface DockerLogs {
  logs: string[]; // Assuming logs are strings, but this could be more complex
}

export interface DockerEvents {
  events: string[]; // Similarly, assuming simple string descriptions
}

// interface DockerConfiguration {
//   // Define the structure according to the Docker configuration specifics
//   [key: string]: any; // Placeholder, adjust as needed
// }
