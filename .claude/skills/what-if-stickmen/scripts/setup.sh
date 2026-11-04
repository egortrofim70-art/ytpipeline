#!/usr/bin/env bash
# macOS / Linux bootstrap: makes sure Node 18+ exists (private copy in ~/.what-if-node if
# not — no sudo needed), then runs setup.mjs for the project folder.
#   bash <skill>/scripts/setup.sh "<folder>"
set -euo pipefail
PROJECT="${1:-$PWD}"
HERE="$(cd "$(dirname "$0")" && pwd)"
major() { node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/' || echo 0; }
if [ "$(major)" = "" ] || [ "$(major)" -lt 18 ] 2>/dev/null; then
	VER=v22.11.0
	OS=$(uname -s | tr '[:upper:]' '[:lower:]')
	case "$(uname -m)" in arm64|aarch64) ARCH=arm64 ;; *) ARCH=x64 ;; esac
	DIR="$HOME/.what-if-node/node-$VER-$OS-$ARCH"
	if [ ! -x "$DIR/bin/node" ]; then
		mkdir -p "$HOME/.what-if-node"
		echo "installing Node $VER…"
		curl -fsSL "https://nodejs.org/dist/$VER/node-$VER-$OS-$ARCH.tar.gz" | tar -xz -C "$HOME/.what-if-node"
	fi
	export PATH="$DIR/bin:$PATH"
	for rc in "$HOME/.zprofile" "$HOME/.bash_profile"; do
		grep -qs "$DIR/bin" "$rc" || echo "export PATH=\"$DIR/bin:\$PATH\"" >> "$rc"
	done
	echo "Node installed: $DIR"
fi
exec node "$HERE/setup.mjs" "$PROJECT"
