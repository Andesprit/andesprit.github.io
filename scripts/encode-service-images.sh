#!/bin/sh
# Regenerates the WebP derivatives of the service-page JPEGs. Run by hand after replacing
# a source JPEG; normal builds never call it. Needs cwebp (libwebp, e.g. brew install webp).
# The JPEGs stay as the originals, native <picture> fallbacks and og:image sources.
set -eu
cd "$(dirname "$0")/../assets"
enc() { cwebp -quiet -q 85 -m 6 -sharp_yuv -metadata none "$@"; }
# Heroes are cover-scaled beyond their source width even on phones, so keep full size.
for f in agents-hero-solarpunk web-hero-solarpunk; do enc "$f.jpg" -o "$f.webp"; done
# Use-case images: 600w/800w/1200w for the srcset in the service pages.
for f in agents-document-chatbot agents-ecommerce agents-scheduling agents-document-extraction agents-integrations \
         web-ecommerce web-scheduling web-restaurants web-personal web-corporate; do
  enc "$f.jpg" -resize 600 0 -o "$f-600.webp"
  enc "$f.jpg" -resize 800 0 -o "$f-800.webp"
  enc "$f.jpg" -o "$f-1200.webp"
done
