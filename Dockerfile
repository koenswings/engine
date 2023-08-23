# -----------------------------------------------------------------------------
# base
# Use this target in compose-dev.yaml to run the repo using Docker Dev Environments
# - Docker will automatically add the full repo content 
# - After starting the dev environment, you still need to do an pnpm install
# ------------------------------------------------------------------------------

FROM ubuntu as base
RUN apt-get update 

# Add ssh
# RUN apt-get install -y openssh-server && systemctl ssh start && systemctl ssh enable   
#A1 RUN apt-get install -y openssh-server && service ssh start 
RUN apt-get install -y openssh-server openssh-client && service ssh start 

# Install rsync
# no need to install it as it is part of the base os

# Install Docker for DIND
RUN curl -sSL https://get.docker.com/ | sh

# Install npm, pnpm and node
ENV SHELL bash
RUN apt-get install -y npm && npm install -g -y n pnpm && n 19.6.0

# Add any global npm packages  
# - Install ts-node globally so the engine scripts can run globally
RUN pnpm add -g ts-node  

# Expose ports
EXPOSE 22 8123

# Replace sh by bash so that the terminal window in Docker Desktop starts with bash
RUN ln -sf /bin/bash /bin/sh


# ------------------------------------------------------------------------------
# dev_image
# Use this target to build a dev image from the source code
# This target can also be used for automated builds on Docker Hub
# ------------------------------------------------------------------------------

FROM base as dev_image

# Initialise pnpm
ENV SHELL bash
ENV PNPM_HOME /pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN pnpm setup 

# Add the source code
ADD ./app /app
WORKDIR /app

# Run the node project on the start of the container
CMD npm run dev

# ------------------------------------------------------------------------------
# build_image
# ------------------------------------------------------------------------------

FROM base as build_image

# Initialise pnpm
ENV SHELL bash
ENV PNPM_HOME /pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN pnpm setup 

# Add the source code
ADD ./app /app
WORKDIR /app

# Run the node project on the start of the container
RUN npm run build

# ------------------------------------------------------------------------------
# prod_image
# TODO - Copy build output
# ------------------------------------------------------------------------------

FROM base as prod_image

# Initialise pnpm
ENV SHELL bash
ENV PNPM_HOME /pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN pnpm setup 

# COPY 
# TODO Copy the build output from build_image
WORKDIR /app

# Run the node project on the start of the container
RUN npm run prod


