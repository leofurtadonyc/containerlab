# Build Reproducibility

This document describes the current reproducibility posture of the platform build.

## What is now pinned

The repository now fixes several major sources of host-to-host build drift.

### Base images

All service Dockerfiles now pin their upstream base images by digest.

This means Docker resolves the exact same upstream image bytes on every host instead of accepting whatever image currently matches a mutable tag.

### Frontend dependencies

`app-web` builds with `npm ci` and the committed `package-lock.json`.

This keeps Node dependency resolution deterministic for the current source tree.

### Python dependencies

`app-api` and `gnmi-collector` now commit a `requirements.lock.txt` file containing the currently resolved runtime dependency set.

Their Dockerfiles now:

- pin `pip`
- pin `setuptools`
- install the local service package with `--no-build-isolation`
- apply the committed lock file as a constraints source

Their `pyproject.toml` runtime dependency declarations are also pinned to exact versions for the current application build.

### ODL image mutation

The ODL Dockerfile no longer performs a live `apt-get install` step during image build because the upstream base image already includes `curl`.

That removes one mutable package-manager input from the current platform image set.

## What is still external

The repository is still not a fully self-contained offline build.

The following external inputs still exist:

- Docker must still pull the pinned upstream base images unless they are already cached or mirrored locally.
- Python package downloads still come from the configured package index unless those wheels are mirrored or pre-cached.
- `app-web` still depends on the npm registry unless the packages in `package-lock.json` are mirrored or pre-cached.
- the deployment host still needs Docker and Containerlab installed and working.

## Honest portability statement

Current reality:

- the platform is now substantially more reproducible host-to-host than before
- a compatible Linux host can rebuild and deploy the stack from source with much less dependency drift than before
- the repository alone is still not sufficient for a truly offline or fully hermetic build

## What would be required for stronger reproducibility later

If a later phase wants stronger reproducibility than the current Phase 2 posture, the next likely steps would be:

- mirror or vendor the pinned base images
- mirror or vendor Python wheels for the locked dependency sets
- mirror or vendor the npm packages behind `package-lock.json`
- add a host preflight check that validates the expected Docker and Containerlab prerequisites before build and deploy

Those steps are not required for the current Phase 2 read-only product foundation, but they are the next honest path toward a more hermetic build posture.