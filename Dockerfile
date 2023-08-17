FROM ubuntu:latest

ARG PYATV_VERSION=0.10.3
ARG NODE_VERSION=16

# ensure local python is preferred over distribution python
ENV PATH /usr/local/bin:$PATH

RUN apt-get update && \
    apt-get install -y python3-dev python3-pip curl sudo && \
    pip3 install pyatv~=${PYATV_VERSION} && \
    curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash - && \
    sudo apt-get install -y nodejs

COPY package*.json "/app/"
WORKDIR "/app"
RUN npm ci

COPY . "/app/"
CMD ["npm", "run", "test"]
