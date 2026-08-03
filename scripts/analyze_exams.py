"""行政書士本試験PDFの抽出品質を監査する再現可能な前処理スクリプト。"""
import json
import re
from pathlib import Path
from pypdf import PdfReader

SOURCE_DIR = Path.home() / "Downloads"
OUTPUT = Path(__file__).parents[1] / "src" / "analysis.generated.json"

def readable_ratio(text: str) -> float:
    if not text:
        return 0
    japanese = len(re.findall(r"[ぁ-んァ-ヶ一-龠]", text))
    suspicious = len(re.findall(r"[ʣɻɹøùúûüýþÿĀ]", text))
    return max(0, min(1, (japanese + 1) / (japanese + suspicious + 1)))

def analyze(year: int) -> dict:
    path = SOURCE_DIR / f"r{year}_mondai.pdf"
    reader = PdfReader(path)
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    ratio = readable_ratio(text)
    return {
        "year": f"R{year}", "pages": len(reader.pages), "questions": 60,
        "characters": len(text), "readableRatio": round(ratio, 3),
        "mode": "full-text" if ratio > .75 else "structure-assisted",
    }

if __name__ == "__main__":
    result = {"methodVersion": "1.0", "sources": [analyze(y) for y in range(2, 8)]}
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT}")
