# ----------------
# base environment
# ----------------

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

# ----------------
# dev environment
# ----------------

FROM base as dev

# Install the node project
# ADD ./app /app
WORKDIR /app

# Add any npm packages that are needed 
# - Install ts-node globally so our scripts can run globally
ENV SHELL bash
ENV PNPM_HOME /pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN pnpm setup && pnpm add -g ts-node    

# Run the node project on the start of the container
# ENV NODE_ENV production
# CMD npm start

# Expose ports
EXPOSE 22 8123

# Replace sh by bash so that the terminal window in Docker Desktop starts with bash
RUN ln -sf /bin/bash /bin/sh

# ----------------
# prod environment
# ----------------

FROM prod as base


