#!/usr/bin/env python3
"""
Compare a draft script against one or more reference texts (transcripts of
competitor videos covering the same topic/facts) to catch sentences or
phrase runs that ended up too close to the reference, even after paraphrasing.

Usage:
    python3 -E check_uniqueness.py draft.txt ref1.txt [ref2.txt ...] \
        [--ngram 6] [--sentence-threshold 0.75] [--out report.json]

What it checks (two independent signals, both matter):
1. N-gram overlap: exact runs of N consecutive words shared between draft
   and any reference. Catches copied/near-copied phrasing even inside an
   otherwise different sentence.
2. Sentence-level similarity: each draft sentence vs every reference
   sentence via difflib SequenceMatcher ratio. Catches paraphrases that
   kept the same structure/order of ideas (same facts, same sequence).

This is a structural/lexical check, not a legal plagiarism verdict. A high
score means "rewrite this part, you're following the source's wording or
beat order too closely" - not "you will get a copyright strike". Facts
themselves (the disease's real clinical stages, etc.) are never flagged
alone; only matching phrasing/structure is.
"""
import argparse
import difflib
import json
import re
import sys
from pathlib import Path


def normalize_words(text: str) -> list[str]:
    text = text.lower()
    text = re.sub(r"[^\w\sáéíóúñü]", " ", text, flags=re.UNICODE)
    return [w for w in text.split() if w]


def split_sentences(text: str) -> list[str]:
    # Simple sentence splitter good enough for Spanish/Russian/English scripts.
    parts = re.split(r"(?<=[.!?¿¡])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def ngrams(words: list[str], n: int) -> set[tuple[str, ...]]:
    return {tuple(words[i : i + n]) for i in range(len(words) - n + 1)}


def find_ngram_overlaps(draft_text: str, ref_text: str, n: int) -> list[str]:
    draft_words = normalize_words(draft_text)
    ref_words = normalize_words(ref_text)
    draft_grams = ngrams(draft_words, n)
    ref_grams = ngrams(ref_words, n)
    shared = draft_grams & ref_grams
    return [" ".join(g) for g in shared]


def find_sentence_matches(
    draft_sentences: list[str], ref_sentences: list[str], threshold: float
) -> list[dict]:
    matches = []
    for d in draft_sentences:
        d_norm = " ".join(normalize_words(d))
        if not d_norm:
            continue
        best_ratio = 0.0
        best_ref = ""
        for r in ref_sentences:
            r_norm = " ".join(normalize_words(r))
            if not r_norm:
                continue
            ratio = difflib.SequenceMatcher(None, d_norm, r_norm).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_ref = r
        if best_ratio >= threshold:
            matches.append({"draft": d, "closest_reference": best_ref, "similarity": round(best_ratio, 3)})
    return matches


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("draft", type=Path)
    ap.add_argument("references", type=Path, nargs="+")
    ap.add_argument("--ngram", type=int, default=6, help="N-gram size for exact-overlap check (default 6)")
    ap.add_argument("--sentence-threshold", type=float, default=0.75, help="Similarity ratio 0..1 to flag a sentence (default 0.75)")
    ap.add_argument("--out", type=Path, default=None, help="Write JSON report here too")
    args = ap.parse_args()

    draft_text = args.draft.read_text(encoding="utf-8")
    draft_sentences = split_sentences(draft_text)

    report = {"draft": str(args.draft), "ngram_size": args.ngram, "sentence_threshold": args.sentence_threshold, "references": []}

    total_ngram_hits = 0
    total_sentence_hits = 0

    for ref_path in args.references:
        ref_text = ref_path.read_text(encoding="utf-8")
        ref_sentences = split_sentences(ref_text)

        ngram_overlaps = find_ngram_overlaps(draft_text, ref_text, args.ngram)
        sentence_matches = find_sentence_matches(draft_sentences, ref_sentences, args.sentence_threshold)

        total_ngram_hits += len(ngram_overlaps)
        total_sentence_hits += len(sentence_matches)

        report["references"].append(
            {
                "reference": str(ref_path),
                "ngram_overlaps": sorted(ngram_overlaps),
                "sentence_matches": sentence_matches,
            }
        )

    report["verdict"] = (
        "REVISAR" if (total_ngram_hits > 0 or total_sentence_hits > 0) else "OK"
    )

    print(f"\n=== Uniqueness check: {args.draft.name} ===")
    print(f"N-gram size: {args.ngram} words | Sentence similarity threshold: {args.sentence_threshold}\n")

    for ref_entry in report["references"]:
        name = Path(ref_entry["reference"]).name
        n_over = ref_entry["ngram_overlaps"]
        s_match = ref_entry["sentence_matches"]
        print(f"--- vs {name} ---")
        if n_over:
            print(f"  [{len(n_over)}] coincidencias de {args.ngram} palabras seguidas (reescribir estas frases):")
            for g in n_over[:20]:
                print(f"    - \"{g}\"")
            if len(n_over) > 20:
                print(f"    ... y {len(n_over) - 20} más")
        else:
            print("  Sin coincidencias exactas de frases.")
        if s_match:
            print(f"  [{len(s_match)}] oraciones demasiado parecidas en estructura:")
            for m in s_match:
                print(f"    draft: {m['draft']}")
                print(f"    ref:   {m['closest_reference']}  (sim={m['similarity']})")
        else:
            print("  Sin oraciones estructuralmente calcadas.")
        print()

    print(f"VEREDICTO: {report['verdict']}")
    if report["verdict"] == "REVISAR":
        print("Hay frases o estructuras demasiado cercanas a una referencia. Reescribe esas partes antes de grabar la voz.")
    else:
        print("El guion es lo bastante distinto de las referencias en léxico y estructura de frases.")

    if args.out:
        args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\nReporte guardado en {args.out}")

    return 1 if report["verdict"] == "REVISAR" else 0


if __name__ == "__main__":
    sys.exit(main())
