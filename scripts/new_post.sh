#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "Usage: ./scripts/new_post.sh <llm|agent|knowledge> <slug>"
  echo "Example: ./scripts/new_post.sh llm agent-memory-design"
}

if [ "$#" -ne 2 ]; then
  usage
  exit 1
fi

category="$1"
raw_slug="$2"
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
  knowledge)
    base_dir="_knowledge_posts"
    post_category="Knowledge"
    ;;
  *)
    echo "Error: category must be one of: llm, agent, knowledge"
    usage
    exit 1
    ;;
esac

year="$(date +%Y)"
month="$(date +%m)"
today="$(date +%F)"
target_dir="${base_dir}/${year}/${month}"
target_file="${target_dir}/${today}-${slug}.md"

mkdir -p "$target_dir"

if [ -e "$target_file" ]; then
  echo "Error: file already exists: $target_file"
  exit 1
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

## 总结

TODO
EOF

echo "Created: $target_file"
