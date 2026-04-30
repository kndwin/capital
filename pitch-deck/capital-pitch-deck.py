#!/usr/bin/env python3
"""Capital pitch deck — January Capital x Lyra hackathon, VC/Finance track.

Six slides, mapped to the rubric:
  1. Cover                        - Pitch Clarity (hook)
  2. Problem                      - Problem Clarity
  3. Product + workflow           - Demo Reliability
  4. Technical depth              - Technical Depth
  5. Real-world viability         - Real-world Viability
  6. Closing                      - Pitch Clarity (ask)
"""

import os
from importlib.machinery import SourceFileLoader

_template = os.path.join(
    os.path.dirname(__file__), "assets", "templates", "slides-en.py"
)
k = SourceFileLoader("kami_slides_en", _template).load_module()


def main():
    prs = k.Presentation()
    prs.slide_width = k.SLIDE_W
    prs.slide_height = k.SLIDE_H

    # 01 — Cover
    k.cover_slide(
        prs,
        title="Capital",
        subtitle="An AI analyst that diligences deals at the speed of read.",
        author="Kevin Sucasa  ·  January Capital x Lyra Hackathon",
        date="2026.05",
    )

    # 02 — Problem (Problem Clarity)
    k.content_slide(
        prs,
        eyebrow="01  ·  Problem",
        title="Diligence is where deal flow goes to die.",
        body=(
            "An associate triaging a deal opens a deck, a data room, three news "
            "tabs and an Excel model. Notes scatter, claims lose their sources, "
            "and risks live in someone's head until the IC meeting. Funds "
            "screen 10,000+ deals a year — the bottleneck is not sourcing, it "
            "is the hours per deal turning a pile of documents into a memo "
            "anyone can defend."
        ),
        page_num=2,
    )

    # 03 — Solution + workflow (Demo Reliability)
    k.pipeline_slide(
        prs,
        eyebrow="02  ·  Product",
        title="Drop in a deck. Get a cited memo. Four steps, minutes not days.",
        steps=[
            (
                "Ingest",
                "PDFs, data-room URLs, founder notes, or chat prompts. Parsed, "
                "hashed, deduped.",
            ),
            (
                "Extract",
                "GPT pulls excerpts, metrics, and claims — each insight pinned "
                "to its source line.",
            ),
            (
                "Score",
                "A library of diligence checks runs every cycle. Verdict: "
                "pass, concern, or fail.",
            ),
            (
                "Memo",
                "Thesis, upside, risks, recommendation — rendered live from "
                "the scored state.",
            ),
        ],
        page_num=3,
    )

    # 04 — Technical depth (Technical Depth)
    k.comparison_slide(
        prs,
        eyebrow="03  ·  Technical depth",
        left_title="Stack",
        left_items=[
            "OpenAI Responses + web search + file ingest",
            "Effect-TS workflows, durable retries on every step",
            "Postgres + Drizzle, content-hashed source store",
            "Per-check engine versioning, deterministic re-runs",
        ],
        right_title="Why it holds up",
        right_items=[
            "Every claim cites the exact source line",
            "Re-running on the same inputs yields the same memo",
            "Overrides and rationales survive engine upgrades",
            "Adding a check is a definition file, not a model retrain",
        ],
        page_num=4,
    )

    # 05 — Real-world viability (Real-world Viability)
    k.metrics_slide(
        prs,
        title="Built for funds that screen thousands of deals a year.",
        metrics=[
            ("10,000+", "Deals screened / fund / year"),
            ("60%", "Associate time on repetitive diligence"),
            ("4 hrs", "Deck-to-memo on Capital"),
            ("100%", "Verdicts traceable to source"),
        ],
    )

    # 06 — Closing (Pitch Clarity, ask)
    k.ending_slide(
        prs,
        message="Better diligence. Fewer tabs. Defensible memos.",
        contact="kevin@skiploans.com.au  ·  Live demo next",
    )

    out = os.path.join(os.path.dirname(__file__), "capital-pitch-deck.pptx")
    prs.save(out)
    print(f"OK: Saved {out}")


if __name__ == "__main__":
    main()
