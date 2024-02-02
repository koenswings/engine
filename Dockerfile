# -----------------------------------------------------------------------------
# base
# Use this target in compose-dev.yaml to run the repo using Docker Dev Environments
# ------------------------------------------------------------------------------

FROM ubuntu as base
RUN apt-get update --fix-missing

# Add ssh
# RUN apt-get install -y openssh-server && systemctl ssh start && systemctl ssh enable   
#A1 RUN apt-get install -y openssh-server && service ssh start 
RUN apt-get install -y openssh-server openssh-client && service ssh start 

# Install rsync
RUN apt install rsync -y

# Install Docker for DIND
RUN apt-get install -y curl && curl -sSL https://get.docker.com/ | sh

# Install npm, pnpm and node
RUN apt-get install -y npm && npm install -g -y n pnpm && n 19.6.0

# Initialise pnpm 
# All packages will be added to /pnpm, outside the /app folder
ENV SHELL bash
ENV PNPM_HOME /pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN pnpm setup 

# Add any global npm packages  
# - Install ts-node globally so the engine scripts can run globally
RUN pnpm add -g ts-node  

# Install expect
RUN DEBIAN_FRONTEND="noninteractive" TZ="Europe/Brussels" apt-get install -y expect

# Expose ports
EXPOSE 22

# Replace sh by bash so that the terminal window in Docker Desktop starts with bash
RUN ln -sf /bin/bash /bin/sh

# ------------------------------------------------------------------------------
# base_with_source
# This is the base image for the dev_image and prod_image targets
# Do not use this image as a target
# ------------------------------------------------------------------------------

FROM base as base_with_source

# Add the source code
COPY . /app
WORKDIR /app


# ------------------------------------------------------------------------------
# dev_image
# Use this target to build a dev image from the source code
# This target can also be used for automated builds on Docker Hub
# ------------------------------------------------------------------------------

FROM base_with_source as dev_image

# Install dev dependencies
ENV NODE_ENV development
RUN pnpm install

# Build the code
RUN npm run dev_build

# Run the node project on the start of the container
CMD npm run dev

# ------------------------------------------------------------------------------
# prod_image
# Use this target to build a prod image from the source code
# This target can also be used for automated builds on Docker Hub
# ------------------------------------------------------------------------------

FROM base_with_source as prod_image

# Install prod dependencies
ENV NODE_ENV production
RUN pnpm install

# Build the code
RUN npm run prod_build

# Run the node project on the start of the container
CMD npm run prod


