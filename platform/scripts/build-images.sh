#!/bin/sh
set -eu

CONTAINER_CLI="${CONTAINER_CLI:-docker}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PLATFORM_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

build_image() {
  image_tag=$1
  context_dir=$2

  echo "Building ${image_tag} from ${context_dir}"
  "$CONTAINER_CLI" build -t "$image_tag" "$PLATFORM_DIR/$context_dir"
}

build_image platform-app-api:0.1.0 app-api
build_image platform-gnmi-collector:0.1.0 gnmi-collector
build_image platform-app-web:0.1.0 app-web
build_image platform-odl:0.1.0 odl