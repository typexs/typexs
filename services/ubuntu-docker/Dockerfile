FROM ubuntu:22.04


ENV NVM_DIR "/root/.nvm"

RUN apt update -yy && \
    apt-get install -yy \
      ca-certificates \
      curl \
      gnupg \
      lsb-release \
      bash && \
    mkdir -p /etc/apt/keyrings &&\
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg &&\
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" |  tee /etc/apt/sources.list.d/docker.list &&\
    apt update -yy && \
    apt install  -yy \
      docker-ce  \
      docker-ce-cli  \
      containerd.io  \
      docker-compose-plugin

RUN curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash &&\
    \. "$NVM_DIR/nvm.sh" && \
    \. "$NVM_DIR/bash_completion" &&\
    nvm install 16 &&\
    nvm use 16 &&\
    nvm alias default 16 &&\
    npm install -g npm@latest
