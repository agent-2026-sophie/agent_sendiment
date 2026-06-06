---
title: 模型压测
date: 2026-05-21
author: Sophie
tags: [Evaluation]
excerpt: 压测是指在可控条件下持续向服务施加负载，观察服务在不同并发、请求量和请求参数下的表现。
---
# 模型压测说明

## 1. 什么是压测

压测，指的是在可控条件下持续向服务施加负载，观察服务在不同并发、请求量和请求参数下的表现。对于大模型服务，压测的目的是回答下面几个问题：

- 这个模型服务最多能承受多大并发。
- 在业务可接受的延迟目标下，系统的稳定吞吐是多少。
- 服务在长输出、长上下文、流式或非流式模式下表现是否稳定。
- 当流量升高时，失败主要来自限流、超时，还是后端推理能力不足。

## 2. 压测常见指标

- `并发数`：同一时刻同时发出的请求数量。
- `总请求数`：本轮测试发送的请求总量。
- `成功率`：成功请求数 / 总请求数。
- `RPS`：每秒完成的请求数。
- `P50 / P90 / P95 / P99`：不同分位的延迟，常用来衡量尾延迟。
- `TTFT`：首 token 时间，流式场景尤其重要。
- `输出 token 速率`：生成速度，通常可表示为 tokens/s。
- `错误码分布`：例如 `429`、`5xx`、超时等。

## 3. 如何判断压测结果是否健康

- `成功率` 高：一般至少要达到业务要求，常见目标是 `99%+`。
- `P95 / P99` 可接受：平均延迟不重要时，尾延迟尤其关键。
- `RPS` 稳定：随着并发上升，吞吐应先上升，达到平台瓶颈后趋于平稳。
- `错误分布` 明确：如果大量出现 `429`，更像是限流；如果大量超时，往往是排队或推理侧扛不住。

## 4. 对模型进行压测的标准流程

建议按三步走，不要一开始就打高并发。

### 4.1 冒烟验证

先用 1 个请求验证：

- `AK` 是否可用。
- `Endpoint` 是否正确。
- 请求体格式是否匹配当前模型服务。
- 返回结构里是否带有内容和 usage 信息。

### 4.2 阶梯压测

逐档提升并发，例如：

- `1`
- `2`
- `5`
- `10`
- `20`

每一档至少跑几十到几百个请求，记录：

- 成功率
- P95 / P99
- 实际 RPS
- 错误码分布

### 4.3 稳定性压测

找到一个成功率和 P95 都可接受的并发值后，保持该并发持续运行更长时间，例如 `10~30 分钟`，重点观察：

- 指标是否抖动
- 是否出现间歇性超时
- 是否开始出现 `429` 或 `5xx`

## 5. 这次实现方式

仓库中提供了 `.env` 文件，包含：

- `endpoint`：Ark 模型 Endpoint ID
- `ak`：Ark API Key

脚本默认按火山方舟 OpenAI 兼容接口调用：

- `base_url`：`https://ark.cn-beijing.volces.com/api/v3`
- `path`：`/chat/completions`
- `model`：使用 `.env` 中的 `endpoint`
- 认证头：`Authorization: Bearer <ak>`

说明：

- `.env` 里的 `endpoint` 并不是完整 URL，而是模型 Endpoint ID。
- 真实请求 URL 由 `base_url + /chat/completions` 组成。
- 当前脚本默认使用非流式请求，便于先做基础吞吐和延迟统计。

参考资料：

- [火山方舟产品文档](https://www.volcengine.com/docs/82379/1330200)

## 6. 脚本功能

`benchmark_ark_model.py` 提供以下能力：

- 自动读取当前目录 `.env`
- 使用标准库发送 HTTP 请求，无需额外安装依赖
- 支持设置并发、总请求数、超时时间、`max_tokens`
- 统计成功率、RPS、平均延迟、P50/P90/P95/P99
- 统计状态码和错误原因
- 将完整结果保存到 `benchmark_results/` 目录

## 7. 使用方式

在项目根目录执行：

```bash
python3 benchmark_ark_model.py
```

常用参数示例：

```bash
python3 benchmark_ark_model.py --concurrency 5 --requests 20 --max-tokens 128
```

如果要改 prompt：

```bash
python3 benchmark_ark_model.py --prompt "请用三句话解释什么是压测。"
```

如果要给更长的单次请求超时：

```bash
python3 benchmark_ark_model.py --timeout 180
```

## 8. 建议的压测策略

建议依次执行：

1. `并发 1，请求 5`，确认接口联通和返回正常。
2. `并发 2，请求 20`，看成功率是否仍然稳定。
3. `并发 5，请求 50`，观察 P95 和吞吐变化。
4. `并发 10+`，确认是否开始出现明显的 `429`、超时或尾延迟恶化。

## 9. 如何解读结果

如果结果里出现：

- `429`：通常表示网关或模型服务已触发限流。
- `timeout`：通常表示处理时间过长、排队严重，或网络层等待超时。
- `5xx`：一般表示后端服务异常。

当你看到：

- 成功率下降
- P95 / P99 急剧升高
- RPS 不再增长甚至下降

说明服务已经接近或超过当前容量上限，应降低并发，或者从服务端增加副本、提高配额、优化模型推理参数。

## 10. 注意事项

- 压测会产生真实调用费用，建议先从低请求量开始。
- 不同 prompt、输入长度、输出长度会显著影响结果。
- 若要测流式体验、TTFT 或 tokens/s，需要在当前脚本基础上扩展流式统计逻辑。
- 若要更贴近线上流量，建议使用多组 prompt，而不是单一固定问题。

```python
#!/usr/bin/env python3
import argparse
import json
import math
import os
import statistics
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path


DEFAULT_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"
DEFAULT_PATH = "/chat/completions"


def load_dotenv(dotenv_path: Path) -> dict:
    values = {}
    if not dotenv_path.exists():
        return values

    for raw_line in dotenv_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def percentile(values: list[float], ratio: float) -> float:
    if not values:
        return 0.0
    if len(values) == 1:
        return values[0]

    ordered = sorted(values)
    position = (len(ordered) - 1) * ratio
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return ordered[lower]

    lower_value = ordered[lower]
    upper_value = ordered[upper]
    return lower_value + (upper_value - lower_value) * (position - lower)


def build_request_payload(args: argparse.Namespace, endpoint: str) -> dict:
    return {
        "model": endpoint,
        "messages": [{"role": "user", "content": args.prompt}],
        "temperature": args.temperature,
        "max_tokens": args.max_tokens,
        "stream": False,
    }


def make_request(url: str, api_key: str, payload: dict, timeout: int) -> dict:
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url=url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )

    start = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            status_code = response.status
            response_text = response.read().decode("utf-8", errors="replace")
        latency = time.perf_counter() - start
        parsed = json.loads(response_text)
        usage = parsed.get("usage") or {}
        return {
            "ok": 200 <= status_code < 300,
            "status_code": status_code,
            "latency_seconds": latency,
            "error": None,
            "response_preview": response_text[:300],
            "usage": usage,
        }
    except urllib.error.HTTPError as exc:
        latency = time.perf_counter() - start
        error_body = exc.read().decode("utf-8", errors="replace")
        return {
            "ok": False,
            "status_code": exc.code,
            "latency_seconds": latency,
            "error": f"HTTP {exc.code}: {error_body[:300]}",
            "response_preview": error_body[:300],
            "usage": {},
        }
    except Exception as exc:  # noqa: BLE001
        latency = time.perf_counter() - start
        return {
            "ok": False,
            "status_code": None,
            "latency_seconds": latency,
            "error": f"{type(exc).__name__}: {exc}",
            "response_preview": "",
            "usage": {},
        }


def summarize(results: list[dict], total_wall_time: float) -> dict:
    latencies = [item["latency_seconds"] for item in results]
    successes = [item for item in results if item["ok"]]
    failures = [item for item in results if not item["ok"]]

    total_prompt_tokens = sum((item.get("usage") or {}).get("prompt_tokens", 0) for item in results)
    total_completion_tokens = sum((item.get("usage") or {}).get("completion_tokens", 0) for item in results)
    total_tokens = sum((item.get("usage") or {}).get("total_tokens", 0) for item in results)

    status_counts = {}
    error_counts = {}
    for item in results:
        status_key = str(item["status_code"]) if item["status_code"] is not None else "NO_STATUS"
        status_counts[status_key] = status_counts.get(status_key, 0) + 1
        if item["error"]:
            error_counts[item["error"]] = error_counts.get(item["error"], 0) + 1

    summary = {
        "total_requests": len(results),
        "success_requests": len(successes),
        "failed_requests": len(failures),
        "success_rate": (len(successes) / len(results)) if results else 0.0,
        "wall_time_seconds": total_wall_time,
        "rps": (len(results) / total_wall_time) if total_wall_time > 0 else 0.0,
        "latency_seconds": {
            "avg": statistics.mean(latencies) if latencies else 0.0,
            "p50": percentile(latencies, 0.50),
            "p90": percentile(latencies, 0.90),
            "p95": percentile(latencies, 0.95),
            "p99": percentile(latencies, 0.99),
            "max": max(latencies) if latencies else 0.0,
        },
        "tokens": {
            "prompt_tokens": total_prompt_tokens,
            "completion_tokens": total_completion_tokens,
            "total_tokens": total_tokens,
        },
        "status_counts": status_counts,
        "error_counts": error_counts,
    }
    return summary


def print_summary(summary: dict) -> None:
    latency = summary["latency_seconds"]
    print("\n=== 压测结果 ===")
    print(f"总请求数      : {summary['total_requests']}")
    print(f"成功 / 失败   : {summary['success_requests']} / {summary['failed_requests']}")
    print(f"成功率        : {summary['success_rate']:.2%}")
    print(f"总耗时(秒)    : {summary['wall_time_seconds']:.2f}")
    print(f"实际 RPS      : {summary['rps']:.2f}")
    print(
        "延迟(秒)      : "
        f"AVG={latency['avg']:.3f}, "
        f"P50={latency['p50']:.3f}, "
        f"P90={latency['p90']:.3f}, "
        f"P95={latency['p95']:.3f}, "
        f"P99={latency['p99']:.3f}, "
        f"MAX={latency['max']:.3f}"
    )
    print(
        "Token 统计    : "
        f"prompt={summary['tokens']['prompt_tokens']}, "
        f"completion={summary['tokens']['completion_tokens']}, "
        f"total={summary['tokens']['total_tokens']}"
    )
    print(f"状态码分布    : {json.dumps(summary['status_counts'], ensure_ascii=False)}")
    if summary["error_counts"]:
        print(f"错误分布 Top  : {json.dumps(summary['error_counts'], ensure_ascii=False)}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ark 模型压测脚本")
    parser.add_argument("--requests", type=int, default=10, help="总请求数")
    parser.add_argument("--concurrency", type=int, default=2, help="并发数")
    parser.add_argument("--timeout", type=int, default=120, help="单请求超时秒数")
    parser.add_argument("--max-tokens", type=int, default=128, help="输出 token 上限")
    parser.add_argument("--temperature", type=float, default=0.2, help="采样温度")
    parser.add_argument(
        "--prompt",
        type=str,
        default="请用三句话解释什么是模型压测，并给出一个简单例子。",
        help="用于压测的 prompt",
    )
    parser.add_argument("--base-url", type=str, default=DEFAULT_BASE_URL, help="Ark API base URL")
    parser.add_argument("--path", type=str, default=DEFAULT_PATH, help="API path")
    parser.add_argument("--output-dir", type=str, default="benchmark_results", help="结果输出目录")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.requests <= 0 or args.concurrency <= 0:
        raise SystemExit("--requests 和 --concurrency 必须大于 0")

    project_root = Path(__file__).resolve().parent
    env_values = load_dotenv(project_root / ".env")

    endpoint = os.getenv("ARK_ENDPOINT") or env_values.get("endpoint")
    api_key = os.getenv("ARK_API_KEY") or env_values.get("ak")
    if not endpoint or not api_key:
        raise SystemExit("未找到 endpoint 或 ak，请检查 `.env` 或环境变量 `ARK_ENDPOINT` / `ARK_API_KEY`。")

    url = f"{args.base_url.rstrip('/')}/{args.path.lstrip('/')}"
    payload = build_request_payload(args, endpoint)

    output_dir = project_root / args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    results = []
    lock = threading.Lock()

    def task(_: int) -> dict:
        item = make_request(url=url, api_key=api_key, payload=payload, timeout=args.timeout)
        with lock:
            results.append(item)
        return item

    start = time.perf_counter()
    with ThreadPoolExecutor(max_workers=args.concurrency) as executor:
        futures = [executor.submit(task, i) for i in range(args.requests)]
        for future in as_completed(futures):
            future.result()
    total_wall_time = time.perf_counter() - start

    summary = summarize(results, total_wall_time)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    result_path = output_dir / f"benchmark_result_{timestamp}.json"
    result_path.write_text(
        json.dumps(
            {
                "config": {
                    "requests": args.requests,
                    "concurrency": args.concurrency,
                    "timeout": args.timeout,
                    "max_tokens": args.max_tokens,
                    "temperature": args.temperature,
                    "prompt": args.prompt,
                    "base_url": args.base_url,
                    "path": args.path,
                    "endpoint": endpoint,
                },
                "summary": summary,
                "results": results,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"请求 URL      : {url}")
    print(f"Endpoint      : {endpoint}")
    print_summary(summary)
    print(f"结果文件      : {result_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

```

