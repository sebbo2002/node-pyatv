FROM ubuntu:latest

ARG PYATV_VERSION=0.16.0
ARG NODE_VERSION=22

# ensure local python is preferred over distribution python
ENV PATH=/usr/local/bin:$PATH

RUN apt-get update && \
    apt-get install -y build-essential libssl-dev libffi-dev python3-dev pipx curl sudo && \
    pipx install pyatv~=${PYATV_VERSION} && \
    curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash - && \
    sudo apt-get install -y nodejs

COPY package*.json "/app/"
COPY check.sh "/app/"
WORKDIR "/app"
RUN npm ci

COPY . "/app/"
CMD ["npm", "run", "test"]
