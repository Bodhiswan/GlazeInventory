"""
Splits mayco-combinations.json into batched SQL and applies via supabase db execute.
Reads the JSON (not the large SQL migration) and inserts in chunks.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

BATCH_SIZE = 1000
JSON_PATH = Path("data/vendors/mayco-combinations.json")


def normalize_code(code: str | None) -> str | None:
    if code is None:
        return None
    return re.sub(r"[^A-Z0-9]", "", code.upper()) or None


def escape(value: str | None) -> str:
    if value is None:
        return "null"
    return "'" + value.replace("'", "''") + "'"


def run_sql(sql: str, label: str) -> None:
    with tempfile.NamedTemporaryFile(mode="w", suffix=".sql", delete=False, encoding="utf-8") as f:
        f.write(sql)
        tmp_path = f.name

    try:
        print(f"  Running: {label} ...", end="", flush=True)
        result = subprocess.run(
            ["npx", "supabase", "db", "query", "--linked", "--file", tmp_path],
            capture_output=True,
            text=True,
            shell=True,
        )
        if result.returncode != 0:
            print(f" FAILED\n{result.stderr}")
            sys.exit(1)
        print(" OK")
    finally:
        os.unlink(tmp_path)


def chunks(lst: list, n: int):
    for i in range(0, len(lst), n):
        yield lst[i : i + n]


def main() -> None:
    print("Loading combination data...")
    data: list[dict] = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    print(f"  {len(data)} combinations loaded")

    # Step 1: fetch glaze ID map from DB
    print("Fetching Mayco glaze codes from DB...")
    glaze_sql = """
\\copy (
  select regexp_replace(upper(coalesce(code, '')), '[^A-Z0-9]', '', 'g') as norm_code, id::text
  from glazes
  where brand = 'Mayco' and created_by_user_id is null
) to stdout with csv;
"""
    # We'll build the glaze map inline via a separate lookup table in SQL instead.
    # Simpler: just use the same subquery pattern from the original migration.

    # Step 2: delete existing (layers cascade automatically)
    print("Deleting existing Mayco glaze-combinations data...")
    run_sql(
        "delete from public.vendor_combination_examples where source_vendor = 'Mayco' and source_collection = 'glaze-combinations';",
        "DELETE examples (layers cascade)",
    )

    # Step 3: insert examples in batches
    print(f"Inserting {len(data)} examples in batches of {BATCH_SIZE}...")
    for i, batch in enumerate(chunks(data, BATCH_SIZE)):
        values = ",\n  ".join(
            f"({escape(ex['id'])}, {escape(ex['sourceVendor'])}, {escape(ex['sourceCollection'])}, "
            f"{escape(ex['sourceKey'])}, {escape(ex['sourceUrl'])}, {escape(ex['title'])}, "
            f"{escape(ex.get('imageUrl'))}, {escape(ex.get('cone'))}, {escape(ex.get('atmosphere'))}, "
            f"{escape(ex.get('clayBody'))}, {escape(ex.get('applicationNotes'))}, {escape(ex.get('firingNotes'))})"
            for ex in batch
        )
        sql = f"""insert into public.vendor_combination_examples (
  id, source_vendor, source_collection, source_key, source_url, title,
  image_url, cone, atmosphere, clay_body, application_notes, firing_notes
) values
  {values}
on conflict (id) do nothing;"""
        run_sql(sql, f"examples batch {i + 1}/{-(-len(data) // BATCH_SIZE)}")

    # Step 4: insert layers in batches
    all_layers = []
    for ex in data:
        for layer in ex.get("layers", []):
            all_layers.append((ex["id"], layer))

    print(f"Inserting {len(all_layers)} layers in batches of {BATCH_SIZE}...")
    for i, batch in enumerate(chunks(all_layers, BATCH_SIZE)):
        def layer_row(ex_id: str, layer: dict) -> str:
            norm = normalize_code(layer.get("glazeCode"))
            if norm is None:
                glaze_id_expr = "null"
            else:
                glaze_id_expr = (
                    f"(select id from public.glazes where brand = 'Mayco' "
                    f"and created_by_user_id is null "
                    f"and regexp_replace(upper(coalesce(code, '')), '[^A-Z0-9]', '', 'g') = {escape(norm)} limit 1)"
                )
            return (
                f"({escape(layer['id'])}, {escape(ex_id)}, {glaze_id_expr}, "
                f"{escape(layer.get('glazeCode'))}, {escape(layer.get('glazeName'))}, "
                f"{layer['layerOrder']}, {escape(layer.get('connectorToNext'))}, {escape(layer.get('sourceImageUrl'))})"
            )

        values = ",\n  ".join(layer_row(ex_id, layer) for ex_id, layer in batch)
        sql = f"""insert into public.vendor_combination_example_layers (
  id, example_id, glaze_id, glaze_code, glaze_name, layer_order, connector_to_next, source_image_url
) values
  {values}
on conflict (id) do nothing;"""
        run_sql(sql, f"layers batch {i + 1}/{-(-len(all_layers) // BATCH_SIZE)}")

    print("\nDone!")


if __name__ == "__main__":
    main()
