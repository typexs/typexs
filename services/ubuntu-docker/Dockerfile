FROM ubuntu:22.04


ENV NVM_DIR "/root/.nvm"

RUN apt update -yy && \
    apt-get install -yy \
      ca-certificates \
      curl \
      gnupg \
      sudo \
      gcc \
      g++ \
      make \
      libpq-dev \
      lsb-release \
      netcat \
      net-tools \
      bash && \
    mkdir -p /etc/apt/keyrings &&\
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg &&\
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" |  tee /etc/apt/sources.list.d/docker.list &&\
    apt update -yy && \
    apt install  -yy \
      docker-ce  \
      docker-ce-cli  \
      containerd.io  \
      docker-compose-plugin &&\
    curl -sL https://deb.nodesource.com/setup_16.x | bash - &&\
    apt update -yy &&\
    apt -y install nodejs &&\
    npm install -g npm@latest

USER root
