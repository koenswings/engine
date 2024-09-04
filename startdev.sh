#!/bin/bash
npm config set prefer-offline=true
pnpm install_packages
pnpm dev
