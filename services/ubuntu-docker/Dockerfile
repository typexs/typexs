FROM ubuntu:22.04


ENV NVM_DIR "/root/.nvm"
# Set the locale
ENV LANG 'de_DE.UTF-8'
ENV LANGUAGE 'de_DE:de'
ENV LC_ALL 'de_DE.UTF-8'
ENV TZ 'Europe/Berlin'

RUN apt update -yy &&\
    ln -fs /usr/share/zoneinfo/Europe/Berlin /etc/localtime &&\
    DEBIAN_FRONTEND=noninteractive apt -yy install tzdata &&\
    apt install -yy  --no-install-recommends \
      ca-certificates \
      locales \
      git \
      mercurial \
      curl \
      gnupg \
      sudo \
      wget \
      gcc \
      g++ \
      make \
      libpq-dev \
      lsb-release \
      locales \
      locales-all \
      netcat \
      net-tools \
      bash && \
    sed -i '/de_DE.UTF-8/s/^# //g' /etc/locale.gen && \
    locale-gen && \
    mkdir -p /etc/apt/keyrings &&\
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg &&\
    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - &&\
    echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list &&\
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" |  tee /etc/apt/sources.list.d/docker.list &&\
    apt update -yy && \
    apt install  -yy \
      docker-ce  \
      docker-ce-cli  \
      containerd.io  \
      docker-compose-plugin \
      google-chrome-stable &&\
    curl -sL https://deb.nodesource.com/setup_16.x | bash - &&\
    apt update -yy &&\
    apt -y install nodejs &&\
    npm install -g npm@latest

COPY ./docker-entrypoint.sh /


USER root
