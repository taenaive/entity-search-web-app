ARG BASE_IMAGE=node:12.2.0
FROM ${BASE_IMAGE}

ENV REFRESHED_AT=2019-07-23

LABEL Name="senzing/entity-search-web-app" \
      Maintainer="support@senzing.com" \
      Version="1.1.0"

HEALTHCHECK CMD ["/app/healthcheck.sh"]

# Run as "root" for system installation.

USER root

# Install chrome for protractor tests.

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
 && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
 && apt-get -qq update \
 && apt-get -qq install -yq \
    google-chrome-stable \
 && rm -rf /var/lib/apt/lists/*

# Set working directory.

WORKDIR /app

# Add `/app/node_modules/.bin` to $PATH

ENV PATH /app/node_modules/.bin:$PATH

# Install and cache app dependencies.

COPY package.json /app/package.json
RUN npm config set loglevel warn \
 && npm install --silent \
 && npm install --silent -g @angular/cli@7.3.9

# Copy rootfs files from repository.
COPY ./rootfs /

# Make non-root container.
USER 1001

# Copy app files from repository
COPY . /app

# Build app. build as root and switch back
USER root
RUN npm run build:docker
USER 1001

# Runtime execution.

WORKDIR /app
ENTRYPOINT [ "npm", "run" ]
CMD ["start:docker"]
