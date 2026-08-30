#!/usr/bin/env python3
"""校验外部演示分支的数据最小化和敏感资源清理状态。"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

COUNT_RULES = {
    "policies.json": ("policies", 4),
    "tasks.json": ("tasks", 12),
    "projects.json": ("projects", 10),
    "scenes.json": ("items", 8),
    "experts.json": ("members", 6),
    "news.json": ("items", 6),
    "monitoring.json": ("months", 3),
}

BANNED_TEXT = [
    "oss://",
    "zj-ai-map-128",
    "项目清单/重大项目清单",
    "平台清单/重大平台清单",
    "王坚",
    "宇树科技",
    "国家人工智能XLC",
]

BANNED_PATHS = [
    ROOT / "data" / "map.svg",
    ROOT / "data" / "浙江省人工智能地市布局图_优势领域连线总图.svg",
    ROOT / "js" / "_legacy" / "render.js",
    ROOT / "tools" / "deploy.sh",
]


def fail(message: str) -> None:
    print(f"[FAIL] {message}")
    raise SystemExit(1)


for filename, (key, expected) in COUNT_RULES.items():
    payload = json.loads((ROOT / "data" / filename).read_text(encoding="utf-8"))
    actual = len(payload.get(key, []))
    if actual < expected:
        fail(f"{filename} 的 {key} 数量为 {actual}，低于测试覆盖要求 {expected}")

monitoring = json.loads((ROOT / "data" / "monitoring.json").read_text(encoding="utf-8"))
month = monitoring["months"][0]
if len(month.get("cities", [])) < 3 or len(month.get("sectors", [])) < 2:
    fail("monitoring.json 必须至少保留3个地市和2个示例领域")

for path in BANNED_PATHS:
    if path.exists():
        fail(f"敏感路径仍存在：{path.relative_to(ROOT)}")

scan_paths = [ROOT / "data", ROOT / "js", ROOT / "pages", ROOT / "index.html", ROOT / "README.md"]
for base in scan_paths:
    paths = [base] if base.is_file() else [p for p in base.rglob("*") if p.suffix in {".js", ".json", ".html", ".md", ".py", ".svg"}]
    for path in paths:
        text = path.read_text(encoding="utf-8", errors="ignore")
        for token in BANNED_TEXT:
            if token in text:
                fail(f"{path.relative_to(ROOT)} 中发现禁用内容：{token}")

print("[OK] 外部演示数据数量、敏感词和静态资源校验通过。")
sys.exit(0)
