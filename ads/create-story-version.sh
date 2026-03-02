#!/bin/bash
cd /home/ubuntu/clawd/projects/shiputz-ai/ads

# Create a 1080x1920 story version
# Strategy: place the original image in center, add colored bars top/bottom with text

ORIG="shop-the-look-original.jpg"
OUT="shop-the-look-story.jpg"

# Resize original to 1080 wide
convert "$ORIG" -resize 1080x1080 resized.jpg

# Create gradient/solid background 1080x1920
convert -size 1080x1920 xc:'#1a2332' background.jpg

# Create top section with text
convert -size 1080x420 xc:'#1a2332' \
  -gravity center \
  -font "Helvetica-Bold" -pointsize 72 -fill white \
  -annotate +0-80 "SHOP THE LOOK" \
  -font "Helvetica" -pointsize 42 -fill '#cccccc' \
  -annotate +0+20 "אהבת משהו? קנה בלחיצה" \
  top_section.png

# Create bottom section with CTA
convert -size 1080x420 xc:'#1a2332' \
  -gravity center \
  -font "Helvetica-Bold" -pointsize 48 -fill white \
  -annotate +0-40 "שיפוץ-AI" \
  -font "Helvetica" -pointsize 36 -fill '#4CAF50' \
  -annotate +0+40 "התחילו בחינם ←" \
  bottom_section.png

# Compose everything
convert background.jpg \
  top_section.png -gravity north -composite \
  resized.jpg -gravity center -geometry +0+0 -composite \
  bottom_section.png -gravity south -composite \
  "$OUT"

# Cleanup
rm -f resized.jpg background.jpg top_section.png bottom_section.png

echo "Created $OUT"
ls -la "$OUT"
