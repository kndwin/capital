#!/usr/bin/env python3
"""Capital pitch deck - January Capital x Lyra hackathon finale.

Seven slides aimed at the panel including January Capital partners.
Deck is the bookend around a live demo, not a product walkthrough.
The only numbers on the deck are January Capital's own published figures.
"""

import os
from importlib.machinery import SourceFileLoader

_template = os.path.join(
    os.path.dirname(__file__), "assets", "templates", "slides-en.py"
)
k = SourceFileLoader("kami_slides_en", _template).load_module()


def screenshot_slide(prs, eyebrow, title, caption, image_path, page_num=None):
    """Slide 3 helper: title + product screenshot + one-line caption."""
    s = k.blank_slide(prs)
    k.add_text(
        s, eyebrow.upper(),
        k.Inches(1.2), k.Inches(0.6), k.Inches(10), k.Inches(0.4),
        font=k.SANS, size=11, color=k.STONE,
    )
    k.add_text(
        s, title,
        k.Inches(1.2), k.Inches(1.1), k.Inches(11), k.Inches(0.9),
        font=k.SERIF, size=28, color=k.NEAR_BLACK,
    )
    k.add_line(s, k.Inches(1.2), k.Inches(2.15), k.Inches(11), weight_pt=0.5)

    if image_path and os.path.exists(image_path):
        s.shapes.add_picture(
            image_path,
            k.Inches(2.2), k.Inches(2.5),
            width=k.Inches(9),
        )
    else:
        ph = s.shapes.add_shape(
            3,  # MSO_SHAPE.ROUNDED_RECTANGLE
            k.Inches(2.2), k.Inches(2.5),
            k.Inches(9), k.Inches(3.6),
        )
        ph.fill.solid()
        ph.fill.fore_color.rgb = k.IVORY
        ph.line.color.rgb = k.BORDER
        ph.shadow.inherit = False
        k.add_text(
            s, "[ memo screenshot — drop file at assets/screenshots/memo.png ]",
            k.Inches(2.2), k.Inches(4.1), k.Inches(9), k.Inches(0.4),
            font=k.SANS, size=12, color=k.STONE,
            align=k.PP_ALIGN.CENTER,
        )

    k.add_text(
        s, caption,
        k.Inches(1.2), k.Inches(6.4), k.Inches(11), k.Inches(0.4),
        font=k.SANS, size=14, color=k.OLIVE,
        align=k.PP_ALIGN.CENTER,
    )
    if page_num is not None:
        k.add_text(
            s, f" - {page_num:02d}",
            k.Inches(11.5), k.Inches(6.9), k.Inches(1.5), k.Inches(0.3),
            font=k.SANS, size=11, color=k.STONE,
            align=k.PP_ALIGN.RIGHT,
        )
    return s


def main():
    prs = k.Presentation()
    prs.slide_width = k.SLIDE_W
    prs.slide_height = k.SLIDE_H

    # 01 - Cover
    k.cover_slide(
        prs,
        title="Capital",
        subtitle="The deal-flow operating system for January Capital.",
        author="Kevin Sucasa  ·  January Capital x Lyra Hackathon",
        date="2026.05",
    )

    # 02 - The math (only January Capital's own numbers)
    k.metrics_slide(
        prs,
        title="The bottleneck isn't sourcing.",
        metrics=[
            ("10,000+", "Deals screened per year"),
            ("25", "Full-time staff"),
            ("60+", "Portfolio companies"),
        ],
    )

    # 03 - Product, one sentence + memo screenshot
    screenshot_slide(
        prs,
        eyebrow="02  ·  Product",
        title="Three front doors. One cited memo.",
        caption="A URL, a founder invite, or a watch target — all converge on the same scored state.",
        image_path=os.path.join(
            os.path.dirname(__file__), "assets", "screenshots", "memo.png"
        ),
        page_num=3,
    )

    # 04 - Live demo handoff
    k.pipeline_slide(
        prs,
        eyebrow="03  ·  Watch this",
        title="One loop. Four steps. Live, on a real deal.",
        steps=[
            ("Add", "URL alone, or send a token-gated /apply link. Either way, market + founder research lanes spin up automatically."),
            ("Watch", "Cron scans HN Launch, ProductHunt, TechCrunch, BusinessWire — plus pinned web pages and X profiles per deal."),
            ("Score", "Your diligence library runs on every signal. Pass / concern / fail, each cited to source."),
            ("Memo", "Narrative + executive summary, 1-3 pages, versioned. Re-renders the moment state changes."),
        ],
        page_num=4,
    )

    # 05 - Technical depth
    k.comparison_slide(
        prs,
        eyebrow="04  ·  Technical depth",
        left_title="Stack",
        left_items=[
            "Effect-TS durable execution + cron, Postgres-backed",
            "OpenAI Responses + web search + file ingest",
            "Drizzle + content-hashed source store",
            "Railway deploy, fronted by Cloudflare",
        ],
        right_title="Why it holds up on real money",
        right_items=[
            "Every claim cites the exact source line",
            "Deterministic re-runs; engine-versioned checks",
            "Apply invites are token-hashed, single-use, expiring",
            "Adding a check is a definition file, not a retrain",
        ],
        page_num=5,
    )

    # 06 - Monday-morning deployment
    k.content_slide(
        prs,
        eyebrow="05  ·  Deployment",
        title="Replaces three tools with one loop.",
        body=(
            "Founder intake form, market intelligence subscription, IC memo "
            "template — Capital collapses all three into a single state machine "
            "your team already knows how to read. Runs at prod volumes today. "
            "Your check library imports in a day, your /apply page is brandable, "
            "watch targets are configurable per deal — pin a customer page, "
            "an X account, anything that signals truth."
        ),
        page_num=6,
    )

    # 07 - Ask
    k.ending_slide(
        prs,
        message="Pilot Capital on 10 live deals from your pipeline.",
        contact="We'll match every memo against the IC outcome.  ·  kevin@skiploans.com.au",
    )

    out = os.path.join(os.path.dirname(__file__), "capital-pitch-deck.pptx")
    prs.save(out)
    print(f"OK: Saved {out}")


if __name__ == "__main__":
    main()
