"""Create verified, resumable local copies of the catalogue's image references.

Usage: python scripts/archive_library_images.py --audit output/image-storage/audit.json
Existing files are reused. Website URLs and source catalogue records are unchanged.
"""
from __future__ import annotations

import argparse
from collections import defaultdict, deque
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
from io import BytesIO
import json
from pathlib import Path
import threading
import subprocess
import shutil
import time
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/vendors/library-image-archive.json"
OBJECTS = ROOT / "data/image-archive"
HOST_LOCKS: dict[str, threading.Semaphore] = {}
HOST_LOCK = threading.Lock()
JOURNAL = ROOT / "output/image-storage/download-journal.jsonl"
JOURNAL_LOCK = threading.Lock()


def inspect_image(content: bytes) -> dict:
    if content.lstrip().startswith((b"<svg", b"<?xml")):
        tree = ET.fromstring(content)
        if not tree.tag.endswith("svg"):
            raise ValueError("Not an SVG image")
        for element in tree.iter():
            for key, value in element.attrib.items():
                if key.endswith("href") and value.startswith(("http:", "https:", "//")):
                    raise ValueError("SVG has an external dependency")
        return {"extension": "svg", "format": "SVG"}
    with Image.open(BytesIO(content)) as image:
        info = {"extension": {"JPEG": "jpg", "TIFF": "tif"}.get(image.format, image.format.lower()),
                "format": image.format, "width": image.width, "height": image.height}
        image.verify()
    return info


def verify_file(relative: str) -> dict:
    content = (ROOT / relative).read_bytes()
    info = inspect_image(content)
    return {"path": relative, "sha256": hashlib.sha256(content).hexdigest(),
            "bytes": len(content), **info}


def download(url: str) -> dict:
    host = urlparse(url).netloc
    with HOST_LOCK:
        limit = HOST_LOCKS.setdefault(host, threading.Semaphore(6))
    error = ""
    with limit:
        for attempt in range(2):
            try:
                # curl imposes a total transfer deadline, including slow/trickling hosts.
                curl = shutil.which("curl.exe") or shutil.which("curl")
                if not curl:
                    raise RuntimeError("curl is required for bounded image downloads")
                response = subprocess.run([curl, "--fail", "--location", "--silent", "--show-error",
                    "--max-redirs", "5", "--connect-timeout", "8", "--max-time", "40",
                    "--user-agent", "GlazeLibraryImageArchive/1.0 (+https://glazeinventory.com)", url],
                    capture_output=True, timeout=45)
                if response.returncode:
                    raise RuntimeError(response.stderr.decode("utf-8", errors="replace").strip())
                content = response.stdout
                info = inspect_image(content)
                digest = hashlib.sha256(content).hexdigest()
                local = OBJECTS / digest[:2] / f"{digest}.{info['extension']}"
                local.parent.mkdir(parents=True, exist_ok=True)
                if not local.exists():
                    # Each worker writes its own temp file; identical photos share a final file.
                    temp = local.with_suffix(f".{threading.get_ident()}.part")
                    temp.write_bytes(content)
                    temp.replace(local)
                return {"status": "verified", "sourceUrl": url,
                        "path": local.relative_to(ROOT).as_posix(), "sha256": digest,
                        "bytes": len(content), **info}
            except Exception as exc:
                error = str(exc)
                if any(f"error: {code}" in error for code in (400, 401, 403, 404, 410)):
                    break
                if attempt == 0:
                    time.sleep(1)
    return {"status": "failed", "sourceUrl": url, "error": error}


def save(entries: dict[str, dict], references: int) -> None:
    payload = {"updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
               "referenceCount": references, "uniqueSourceCount": len(entries),
               "verifiedCount": sum(e.get("status") == "verified" for e in entries.values()),
               "failedCount": sum(e.get("status") == "failed" for e in entries.values()),
               "entries": entries}
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    temp = MANIFEST.with_suffix(".tmp")
    temp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    for attempt in range(10):
        try:
            temp.replace(MANIFEST)
            break
        except PermissionError:
            if attempt == 9:
                raise
            time.sleep(0.2)


def download_recorded(url: str) -> dict:
    result = download(url)
    # Persist each result before its future completes, even if a checkpoint fails.
    with JOURNAL_LOCK:
        with JOURNAL.open("a", encoding="utf-8") as journal:
            journal.write(json.dumps(result, ensure_ascii=False) + "\n")
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--audit", default="output/image-storage/audit.json")
    parser.add_argument("--workers", type=int, default=18)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--retry-failed", action="store_true")
    args = parser.parse_args()
    rows = json.loads((ROOT / args.audit).read_text(encoding="utf-8"))["results"]
    existing = json.loads(MANIFEST.read_text(encoding="utf-8"))["entries"] if MANIFEST.exists() else {}
    if JOURNAL.exists():
        for line in JOURNAL.read_text(encoding="utf-8").splitlines():
            try:
                record = json.loads(line)
                existing[record["sourceUrl"]] = record
            except json.JSONDecodeError:
                continue
    recovery_path = ROOT / "data/vendors/library-image-recoveries.json"
    if recovery_path.exists():
        for url, recovery in json.loads(recovery_path.read_text(encoding="utf-8")).items():
            if recovery.get("status") == "verified":
                existing[url] = recovery
    sources: dict[str, set[str]] = {}
    for row in rows:
        sources.setdefault(row["url"], set()).update(row["localCopies"])
    entries: dict[str, dict] = {}
    pending = []
    verified_files: dict[str, dict] = {}
    for url, copies in sources.items():
        old = existing.get(url, {})
        if old.get("path"):
            copies.add(old["path"])
        for relative in sorted(copies):
            try:
                if relative not in verified_files:
                    verified_files[relative] = verify_file(relative)
                entries[url] = {**old, **verified_files[relative], "sourceUrl": old.get("sourceUrl", url), "status": "verified"}
                break
            except Exception:
                continue
        else:
            if not url.startswith(("https://", "http://")):
                entries[url] = {"sourceUrl": url, "status": "failed", "error": "Referenced local file is missing"}
            elif old.get("status") == "failed" and not args.retry_failed:
                entries[url] = old
            else:
                pending.append(url)
                entries[url] = {"sourceUrl": url, "status": "pending"}
    save(entries, len(rows))
    by_host = defaultdict(deque)
    for url in pending:
        by_host[urlparse(url).netloc].append(url)
    interleaved = []
    while by_host:
        for host in list(by_host):
            interleaved.append(by_host[host].popleft())
            if not by_host[host]:
                del by_host[host]
    work = interleaved[:args.limit] if args.limit else interleaved
    print(f"Reused {sum(e['status']=='verified' for e in entries.values())} verified sources; downloading {len(work)} of {len(pending)} missing sources", flush=True)
    start = time.monotonic()
    JOURNAL.parent.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(download_recorded, url): url for url in work}
        for count, future in enumerate(as_completed(futures), 1):
            entries[futures[future]] = future.result()
            if count % 10 == 0 or count == len(work):
                save(entries, len(rows))
                print(f"{count}/{len(work)} finished; verified={sum(e['status']=='verified' for e in entries.values())}; failed={sum(e['status']=='failed' for e in entries.values())}; elapsed={round(time.monotonic()-start)}s", flush=True)
    save(entries, len(rows))


if __name__ == "__main__":
    main()
