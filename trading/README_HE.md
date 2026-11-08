# Kroxis Trader – מערכת בדיקה למסחר לפי הספרים של אוניל ומינרביני

המערכת בודקת על נתוני עבר שני ספרים:

1. **ויליאם אוניל – How to Make Money in Stocks** (שיטת CAN SLIM)
2. **מארק מינרביני – Trade Like a Stock Market Wizard** (שיטת SEPA: Trend Template + פריצת VCP)

התוצאות המלאות בעברית: [`reports/REPORT_HE.md`](reports/REPORT_HE.md)

> ⚠️ זה כלי מחקר, לא ייעוץ השקעות. תוצאות עבר לא מבטיחות תוצאות עתידיות.
> אין לחבר כסף אמיתי למסחר אוטומטי לפני תקופת ניסיון בחשבון דמו.

## מבנה

| קובץ | מה יש בו |
|---|---|
| `kroxis_trader/strategies.py` | חוקי הכניסה מהספרים, כתובים כקוד |
| `kroxis_trader/engine.py` | סימולציה: קנייה בפתיחה של היום הבא, סטופ, יעד רווח, חוק 8 השבועות, ניהול תיק |
| `kroxis_trader/indicators.py` | ממוצעים נעים, ATR, דירוג RS, ימי הפצה (distribution days) |
| `kroxis_trader/metrics.py` | אחוז הצלחה + טווח ביטחון 95%, Profit Factor, תשואה שנתית, ירידה מקסימלית |
| `scripts/run_all.py` | מריץ את כל הבדיקות על מאגר נתונים אחד |
| `scripts/summarize.py` | מדפיס טבלאות מהתוצאות |
| `pine/kroxis_book_strategies.pine` | אותה אסטרטגיה ל-TradingView |
| `tests/test_engine.py` | בדיקות שהקנייה והמכירה מבוצעות במחיר הנכון |
| `kroxis_trader/scanner.py` | הסריקה היומית (20+ מניות) |
| `kroxis_trader/paper.py` | חשבון הדמו (כסף וירטואלי, מחירים אמיתיים) |
| `kroxis_trader/presets.py` | הגדרות האסטרטגיות (לפי הספר / עם סטופ 3×ATR) |
| `scripts/daily_run.py` | ההרצה היומית: סריקה + עדכון חשבונות הדמו |
| `scripts/train_model.py` | בדיקת מודל הניבוי |

## הרצה

```bash
# נתונים 2019–2026 (S&P 500/400/600)
git clone --depth 1 --filter=blob:none --sparse https://github.com/fja05680/brownbear.git
(cd brownbear && git sparse-checkout set symbol-cache universe)
python scripts/build_cache.py --src brownbear

python scripts/run_all.py --panel data/panel.parquet --name sp1500_2020_2026 \
    --split 2023-01-01 --stocks-with-sector
python scripts/summarize.py reports/sp1500_2020_2026
python tests/test_engine.py
```

המאגר השני (2005–2017, כ-5,800 מניות) נבנה מ-"Huge Stock Market Dataset" (Kaggle)
עם `load_panel_kaggle` ב-`kroxis_trader/data.py`.

## איך הבדיקה עובדת (בלי "לרמות")

- האות נקבע לפי נתוני סגירה של יום t, והקנייה בפתיחה של יום t+1 – אין שימוש במידע מהעתיד.
- סטופ מתבצע במחיר הסטופ, ואם המניה נפתחה בפער מתחתיו – במחיר הפתיחה.
- עמלה + החלקה: 0.1% בכל צד.
- **קבוצת ביקורת:** אותם חוקי יציאה בדיוק על כניסות אקראיות. אם הספר לא מנצח את הכניסות האקראיות – אין לו יתרון אמיתי בנתונים האלה.

## TradingView

1. TradingView ← Pine Editor ← להדביק את `pine/kroxis_book_strategies.pine` ← Add to chart.
2. גרף יומי של מניה אמריקאית. בהגדרות בוחרים Method: Minervini או O'Neil.
3. ב-Strategy Tester רואים את העסקאות על המניה הזו.
4. בהתראות (Alerts) כל קנייה/מכירה שולחת הודעת JSON – זה הבסיס לחיבור ל-MetaTrader בהמשך.

הסקריפט לא נבדק בתוך TradingView מכאן. אם מופיעה שגיאת קומפילציה – שלחו לי אותה ואתקן.

## הרצה יומית: סריקה + חשבון דמו

```bash
pip install -r requirements.txt
python scripts/daily_run.py
```

הסקריפט מוריד מחירים עדכניים (Yahoo Finance, חינם, בלי חשבון) ל-1,495 מניות S&P 1500, ואז:

1. **סריקה** – `reports/scan/latest.md`: לפחות 20 מניות. אותות קנייה מהיום, מניות שמחכות לפריצה (עם מחיר קנייה וסטופ), וסיכוי היסטורי לכל אחת.
2. **שני חשבונות דמו** של $100,000 (מינרביני, אוניל) – `reports/paper/latest.md`. קונים בפתיחה לפי אותות האתמול, מוכרים לפי סטופ, יעד וממוצע 50, בדיוק כמו בבדיקה. מצב החשבונות נשמר ב-`paper/*.json`.

בדיקה שהדמו זהה לבדיקת העבר: `python tests/check_paper_vs_backtest.py`. החשבון רץ יום אחרי יום על 2025–2026, שומר וטוען את המצב כל יום, ויוצא זהה לבדיקת העבר עד הסנט.

אפשר לחזות מראש איזו עסקה תרוויח? לא. פירוט ב-[`reports/model/MODEL_HE.md`](reports/model/MODEL_HE.md).

## השלבים הבאים

1. **דמו** – להריץ את `daily_run.py` כל יום מסחר במשך 2–3 חודשים ולהשוות לבדיקת העבר.
2. **TradingView** – הסקריפט ב-`pine/` מציג את אותם אותות על הגרפים.
3. **MetaTrader 5** – רק אחרי הדמו: חיבור לחשבון דמו ב-MT5 (צריך מחשב Windows עם MT5 פתוח).
