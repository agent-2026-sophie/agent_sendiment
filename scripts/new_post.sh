#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "Usage: ./scripts/new_post.sh <llm|agent|evals> <slug> [img]"
  echo "Example: ./scripts/new_post.sh evals benchmark-notes img"
  echo "  (Adding 'img' at the end will create a dedicated image folder for the post)"
}

if [ "$#" -lt 2 ]; then
  usage
  exit 1
fi

category="$1"
raw_slug="$2"
with_img="${3:-}"
slug="${raw_slug%.md}"
slug="$(printf '%s' "$slug" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9_-]/-/g; s/--*/-/g; s/^-//; s/-$//')"

if [ -z "$slug" ]; then
  echo "Error: slug is empty after normalization."
  exit 1
fi

case "$category" in
  llm)
    base_dir="_llm_posts"
    post_category="LLM"
    ;;
  agent)
    base_dir="_agent_posts"
    post_category="Agent"
    ;;
  evals)
    base_dir="_evals_posts"
    post_category="Evaluation"
    ;;
  *)
    echo "Error: category must be one of: llm, agent, evals"
    usage
    exit 1
    ;;
esac

year="$(date +%Y)"
month="$(date +%m)"
today="$(date +%F)"
target_dir="${base_dir}/${year}/${month}"
filename="${today}-${slug}"
target_file="${target_dir}/${filename}.md"

mkdir -p "$target_dir"

if [ -e "$target_file" ]; then
  echo "Error: file already exists: $target_file"
  exit 1
fi

# Handle image directory if requested
img_section=""
if [ "$with_img" = "img" ]; then
  img_dir="${target_dir}/${filename}-img"
  mkdir -p "$img_dir"
  echo "Created image directory: $img_dir"
  img_section="
## 图片示例

![图片描述]({{ \"/${img_dir}/example.png\" | relative_url }})
"
fi

cat > "$target_file" <<EOF
---
title: TODO
date: ${today}
author: Sophie
tags: [${post_category}]
excerpt: TODO
---

## 背景

TODO

## 正文

TODO
${img_section}
## 总结

TODO
EOF

echo "Created post: $target_file"
