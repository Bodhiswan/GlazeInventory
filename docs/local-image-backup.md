# Local image backup

This is a snapshot of the library's images and supporting records on this computer.
It does not change which image URLs the website serves and does not automatically back up future uploads.

## Verified snapshot: 5 September 2026

11,627 distinct local image files passed image decoding and SHA-256 checks (3.17 GB including existing files). All 457 uploaded image objects and 21,531 records across 12 database tables are saved locally. There were no file or checksum failures.

| Current library references | Exact source copies | Alternate references | Missing originals |
| --- | ---: | ---: | ---: |
| Glaze primary images | 3,031 | 19 | 10 |
| Firing images | 4,286 | 0 | 0 |
| Combination result images | 4,730 | 0 | 0 |
| Combination layer images | 9,695 | 0 | 0 |

Counts are references, so the same image can occur more than once. The combination count includes two original vendor placeholders. Source-copy counts also include existing generated Spectrum tiles.

The ten unrecoverable Potterycrafts originals return HTTP 404, and their original product pages are also unavailable:

- P2006 Low Sol Tin Opaque Powder Glaze
- P2091 Rockingham Mid-Temperature Powder Glaze
- P2145 Maelstrom Speckled Powder Glaze
- P2704 Oiled Bronze Effect Powder Glaze
- P2707 Turquoise Green Powder Glaze
- P2708 Verdegris Effect Powder Glaze
- P4470 Purple Leadfree Liquid On-Glaze
- P2559 Basic Chun Stoneware Powder Glaze
- P2587 Nordic Sea Foam Blue Powder Glaze
- P4167 Dusky Orange Liquid Underglaze

## Locations

- `data/image-archive/`: downloaded catalogue images, deduplicated by SHA-256.
- `data/vendor-images/` and `public/vendor-images/`: existing local images reused by the backup.
- `data/vendors/library-image-archive.json`: source URL to local file mapping, checksums, image dimensions, and download status.
- `data/vendors/library-image-recoveries.json`: corrected source URLs and explicitly labelled alternate glaze references.
- `data/vendors/library-image-archive-verification.json`: final coverage, file verification, and unavailable-source report.
- `data/private-image-archive/`: all uploaded image objects and a snapshot of the glaze, firing-image, combination, layer, and imported-example records. Its manifests preserve bucket paths and record relationships.

The two new bulk archive directories are ignored by Git. The private archive includes member uploads and private imported examples: keep it private. Copy these directories as well as the repository when moving or backing up this project; a Git clone alone will not contain them.

## Refresh the snapshot manually

Use the configured Supabase service-role connection from `.env.local` for hosted reads. No hosted writes are performed.

```powershell
node scripts/archive_uploaded_images.mjs
node scripts/archive_library_records.mjs
npx tsx scripts/audit_library_image_storage.ts
python scripts/archive_library_images.py --workers 18
python scripts/verify_library_image_archive.py
```

The Python downloader requires Pillow and curl. It reuses and validates existing files, saves checkpoints, and records every completed download in `output/image-storage/download-journal.jsonl`. Use `--retry-failed` to retry previously unavailable sources. The upload script also reuses unchanged files after checking their checksum.

The private `records/image-archive.json` maps additional historical database image URLs captured during the initial backup. It is separate from the current catalogue and should be re-audited when refreshing the database snapshot.

## Interpreting coverage

`verified` means the local file exists, is a readable image, and has a recorded checksum. It does not imply that every source originally supplied a photograph: existing generated Spectrum tiles and the two Mayco “image coming soon” records remain placeholders.

Nineteen Laguna source photos were on an unavailable supplier domain. Matching glaze reference images were saved from Laguna/Axner and the manufacturer's older site, with provenance and an explicit `alternate-product-reference` label. They are not claimed to be exact copies of the lost supplier photographs.

Thirty-eight deleted Spectrum URLs in the older vendor archive are mapped to the existing local reference for the same glaze code. They are labelled `existing-current-catalogue-reference`; historical database records use the same distinction where an older image is unavailable.

Unavailable originals are retained as failures in the verification report. No substitute is silently presented as an original, and no catalogue record is deleted to make the coverage count look complete.
