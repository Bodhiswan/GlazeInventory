"""Verify local archive files and report exact copies, alternate references, and gaps."""
import json
from collections import Counter
from pathlib import Path

from archive_library_images import ROOT, MANIFEST, verify_file


def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    entries = manifest["entries"]
    audit = json.loads((ROOT / "output/image-storage/audit.json").read_text(encoding="utf-8"))
    failures = []
    files = {}

    def verify(entry, label, prefix=""):
        relative = prefix + entry["path"]
        try:
            if relative not in files:
                files[relative] = verify_file(relative)
            if entry.get("sha256") != files[relative]["sha256"]:
                raise ValueError("Checksum mismatch")
        except Exception as error:
            failures.append({"source": label, "path": relative, "error": str(error)})

    for url, entry in entries.items():
        if entry["status"] == "verified":
            verify(entry, url)
    private_root = ROOT / "data/private-image-archive"
    uploads = json.loads((private_root / "manifest.json").read_text(encoding="utf-8"))["entries"]
    for key, entry in uploads.items():
        if entry["status"] == "downloaded":
            verify(entry, key, "data/private-image-archive/")
    historical = json.loads((private_root / "records/image-archive.json").read_text(encoding="utf-8"))
    for url, entry in historical.items():
        if entry["status"] in ("verified", "downloaded"):
            verify(entry, url)
    record_counts = json.loads((private_root / "records/manifest.json").read_text(encoding="utf-8"))["tables"]
    for table, expected in record_counts.items():
        rows = json.loads((private_root / "records" / f"{table}.json").read_text(encoding="utf-8"))
        if len(rows) != expected:
            failures.append({"table": table, "error": "Record count does not match snapshot manifest"})
    categories = {}
    for row in audit["results"]:
        count = categories.setdefault(row["category"], Counter())
        count["references"] += 1
        entry = entries.get(row["url"], {})
        if entry.get("status") != "verified":
            count["missing"] += 1
        elif entry.get("recoveryType") in ("alternate-product-reference", "current-product-reference", "existing-current-catalogue-reference"):
            count["alternateReference"] += 1
        else:
            count["sourceCopy"] += 1
    report = {
        "generatedAt": manifest["updatedAt"],
        "catalogueSources": len(entries),
        "catalogueStatus": dict(Counter(e["status"] for e in entries.values())),
        "categories": categories,
        "uploadedImages": dict(Counter(e["status"] for e in uploads.values())),
        "databaseRecords": sum(record_counts.values()),
        "databaseTables": len(record_counts),
        "additionalHistoricalRecordImages": dict(Counter(e["status"] for e in historical.values())),
        "verifiedDistinctFiles": len(files),
        "verifiedBytes": sum(e["bytes"] for e in files.values()),
        "verificationFailures": failures,
        "unavailableSources": [{"url": url, "error": entry.get("error")} for url, entry in entries.items() if entry["status"] != "verified"],
        "alternateReferences": [{"originalUrl": url, "sourceUrl": entry["sourceUrl"], "path": entry["path"]} for url, entry in entries.items() if entry.get("recoveryType") in ("alternate-product-reference", "current-product-reference", "existing-current-catalogue-reference")],
        "note": "A local backup snapshot, not a change to website delivery. Existing generated tiles and vendor placeholders remain placeholders. Alternate references are not verified copies of missing original photos.",
    }
    (ROOT / "data/vendors/library-image-archive-verification.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({k: v for k, v in report.items() if k not in ("unavailableSources", "alternateReferences")}, indent=2))
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
