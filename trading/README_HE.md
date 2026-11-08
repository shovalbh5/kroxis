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

## הרצה

```bash
pip install -r requirements.txt

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

## השלבים הבאים (לא בוצעו עדיין)

1. **TradingView** – הרצת הסקריפט על מניות לבחירתכם והשוואה לתוצאות כאן.
2. **MetaTrader 5 (חשבון דמו בלבד בהתחלה)** – אחת משתי דרכים:
   - התראות TradingView (Webhook, דורש מנוי בתשלום) ← שרת קטן ← MT5.
   - או: הקוד כאן מייצר אותות כל ערב ← ספריית `MetaTrader5` של Python (עובדת רק על Windows עם MT5 מותקן) שולחת פקודות עם סטופ.
3. רק אחרי 2–3 חודשים בדמו שמתנהגים כמו הבדיקה – לשקול כסף אמיתי, בסכום קטן.
