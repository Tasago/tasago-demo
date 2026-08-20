from pathlib import Path
from shutil import copy2

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "TasaGo_Informe_Express_Ejemplo.pdf"
PUBLIC_COPY = ROOT / "public" / "ejemplo-informe-express.pdf"
LOGO = ROOT / "public" / "tasago-logo-final.png"

W, H = A4
NAVY = colors.HexColor("#0D2444")
NAVY_2 = colors.HexColor("#132F5A")
GREEN = colors.HexColor("#1E8A3A")
BRIGHT = colors.HexColor("#4CB05A")
ICE = colors.HexColor("#F2F4F7")
MID = colors.HexColor("#6B7280")
LINE = colors.HexColor("#D8DEE5")
PALE_GREEN = colors.HexColor("#E8F4EA")
WHITE = colors.white


def register_fonts():
    regular = Path("C:/Windows/Fonts/arial.ttf")
    bold = Path("C:/Windows/Fonts/arialbd.ttf")
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("TG-Regular", str(regular)))
        pdfmetrics.registerFont(TTFont("TG-Bold", str(bold)))
        return "TG-Regular", "TG-Bold"
    return "Helvetica", "Helvetica-Bold"


REGULAR, BOLD = register_fonts()


def text(c, value, x, y, size=9, color=NAVY, font=REGULAR):
    c.setFillColor(color)
    c.setFont(font, size)
    c.drawString(x, y, value)


def right(c, value, x, y, size=9, color=NAVY, font=REGULAR):
    c.setFillColor(color)
    c.setFont(font, size)
    c.drawRightString(x, y, value)


def paragraph(c, value, x, y, width, style=None):
    if style is None:
        style = ParagraphStyle(
            "body", fontName=REGULAR, fontSize=9, leading=13,
            textColor=NAVY, spaceAfter=0
        )
    p = Paragraph(value, style)
    _, h = p.wrap(width, H)
    p.drawOn(c, x, y - h)
    return h


def header(c, page, section):
    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.drawImage(str(LOGO), 20 * mm, H - 31 * mm, width=62 * mm, height=21 * mm, preserveAspectRatio=True, mask="auto")
    right(c, section.upper(), W - 20 * mm, H - 18 * mm, 7, GREEN, BOLD)
    right(c, "FOLIO TG-EXP-2026-001", W - 20 * mm, H - 24 * mm, 7, MID, REGULAR)
    c.setStrokeColor(GREEN)
    c.setLineWidth(1.2)
    c.line(20 * mm, H - 34 * mm, W - 20 * mm, H - 34 * mm)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.5)
    c.line(20 * mm, 17 * mm, W - 20 * mm, 17 * mm)
    text(c, "TasaGo | Inteligencia Territorial | Ejemplo demostrativo", 20 * mm, 10 * mm, 6.8, MID)
    right(c, f"Página {page} de 6", W - 20 * mm, 10 * mm, 6.8, MID)


def title(c, kicker, heading, subtitle=None):
    y = H - 49 * mm
    text(c, kicker.upper(), 20 * mm, y, 7.5, GREEN, BOLD)
    text(c, heading, 20 * mm, y - 10 * mm, 22, NAVY, BOLD)
    if subtitle:
        paragraph(c, subtitle, 20 * mm, y - 17 * mm, W - 40 * mm,
                  ParagraphStyle("lead", fontName=REGULAR, fontSize=9.5, leading=14, textColor=MID))


def label_value(c, x, y, label, value, width=50 * mm):
    text(c, label.upper(), x, y, 6.5, MID, BOLD)
    paragraph(c, value, x, y - 3 * mm, width,
              ParagraphStyle("value", fontName=BOLD, fontSize=9.5, leading=12, textColor=NAVY))


def draw_cover(c):
    c.setFillColor(WHITE)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.rect(0, H - 116 * mm, W, 116 * mm, fill=1, stroke=0)
    c.drawImage(str(LOGO), 20 * mm, H - 42 * mm, width=72 * mm, height=25 * mm, preserveAspectRatio=True, mask="auto")
    c.setFillColor(BRIGHT)
    c.rect(20 * mm, H - 55 * mm, 16 * mm, 1.2 * mm, fill=1, stroke=0)
    text(c, "INFORME DE TASACIÓN", 20 * mm, H - 72 * mm, 10, colors.HexColor("#BFD2E2"), BOLD)
    text(c, "EXPRESS", 20 * mm, H - 91 * mm, 31, WHITE, BOLD)
    text(c, "Departamento | Ñuñoa, Región Metropolitana", 20 * mm, H - 103 * mm, 11, WHITE, REGULAR)
    c.setFillColor(GREEN)
    c.roundRect(20 * mm, H - 134 * mm, W - 40 * mm, 30 * mm, 4 * mm, fill=1, stroke=0)
    text(c, "VALOR COMERCIAL ESTIMADO", 27 * mm, H - 116 * mm, 7.5, colors.HexColor("#D8F0DC"), BOLD)
    text(c, "$142.000.000", 27 * mm, H - 128 * mm, 24, WHITE, BOLD)
    right(c, "Rango sugerido", W - 27 * mm, H - 116 * mm, 7.5, colors.HexColor("#D8F0DC"), BOLD)
    right(c, "$136.000.000 - $148.000.000", W - 27 * mm, H - 127 * mm, 11, WHITE, BOLD)
    y = H - 156 * mm
    label_value(c, 20 * mm, y, "Cliente", "Vivenda Unifamiliar")
    label_value(c, 78 * mm, y, "Dirección", "Av. Irarrázaval 0000, Ñuñoa", 65 * mm)
    label_value(c, 153 * mm, y, "Finalidad", "Venta", 35 * mm)
    y -= 27 * mm
    label_value(c, 20 * mm, y, "Folio", "TG-EXP-2026-001")
    label_value(c, 78 * mm, y, "Fecha de emisión", "19 de agosto de 2026", 65 * mm)
    label_value(c, 153 * mm, y, "Vigencia", "90 días", 35 * mm)
    c.setFillColor(ICE)
    c.roundRect(20 * mm, 33 * mm, W - 40 * mm, 35 * mm, 3 * mm, fill=1, stroke=0)
    text(c, "EJEMPLO DEMOSTRATIVO - NO VÁLIDO PARA FINES BANCARIOS", 27 * mm, 56 * mm, 7, GREEN, BOLD)
    paragraph(c, "Este documento muestra la estructura de entrega del plan Express. Los datos, comparables y valores son ficticios y se presentan exclusivamente para revisar el formato TasaGo.", 27 * mm, 51 * mm, W - 54 * mm,
              ParagraphStyle("note", fontName=REGULAR, fontSize=8.2, leading=12, textColor=MID))
    text(c, "TasaGo | Inteligencia Territorial", 20 * mm, 15 * mm, 7, MID)
    right(c, "tasaciones inteligentes con respaldo profesional", W - 20 * mm, 15 * mm, 7, GREEN, BOLD)


def draw_summary(c):
    header(c, 2, "Resumen ejecutivo")
    title(c, "01", "Resultado de la tasación", "Una conclusión clara, acompañada por un rango y los factores que más influyen en el valor.")
    y = H - 83 * mm
    c.setFillColor(ICE)
    c.roundRect(20 * mm, y - 39 * mm, W - 40 * mm, 39 * mm, 3 * mm, fill=1, stroke=0)
    text(c, "VALOR COMERCIAL ESTIMADO", 27 * mm, y - 11 * mm, 7, MID, BOLD)
    text(c, "$142.000.000", 27 * mm, y - 27 * mm, 24, GREEN, BOLD)
    right(c, "$2.420.000 / m2", W - 27 * mm, y - 17 * mm, 12, NAVY, BOLD)
    right(c, "Superficie util analizada: 58,7 m2", W - 27 * mm, y - 26 * mm, 7.5, MID)
    y -= 53 * mm
    text(c, "LECTURA PROFESIONAL", 20 * mm, y, 7, GREEN, BOLD)
    paragraph(c, "El inmueble se posiciona en el tramo medio-alto de su microzona por su conectividad, distribución funcional y estado de conservación. La ausencia de estacionamiento limita parcialmente el precio unitario frente a comparables equivalentes.", 20 * mm, y - 6 * mm, W - 40 * mm,
              ParagraphStyle("analysis", fontName=REGULAR, fontSize=10, leading=15, textColor=NAVY))
    y -= 42 * mm
    data = [
        ["Indicador", "Resultado", "Lectura"],
        ["Rango de mercado", "$136,0 MM - $148,0 MM", "Escenario razonable de oferta"],
        ["Precio unitario", "$2.420.000 / m2", "Dentro del rango observado"],
        ["Confianza", "Media-alta", "4 comparables consistentes"],
        ["Plazo de exposición", "45 - 75 días", "Supuesto de precio de salida alineado"],
    ]
    table = Table(data, colWidths=[43 * mm, 53 * mm, 74 * mm], rowHeights=[9 * mm] + [12 * mm] * 4)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), BOLD), ("FONTNAME", (0, 1), (-1, -1), REGULAR),
        ("FONTSIZE", (0, 0), (-1, -1), 8), ("TEXTCOLOR", (0, 1), (-1, -1), NAVY),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE), ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ]))
    table.wrapOn(c, W, H)
    table.drawOn(c, 20 * mm, y - 57 * mm)


def draw_property(c):
    header(c, 3, "Inmueble y antecedentes")
    title(c, "02", "Identificación del inmueble", "La información utilizada queda trazable dentro del expediente.")
    y = H - 84 * mm
    fields = [
        ("Tipo", "Departamento"), ("Comuna", "Ñuñoa"), ("Año estimado", "2012"),
        ("Superficie util", "58,7 m2"), ("Terraza", "4,8 m2"), ("Superficie total", "63,5 m2"),
        ("Dormitorios", "2"), ("Baños", "2"), ("Estacionamiento", "No informado"),
    ]
    box_w = (W - 44 * mm) / 3
    for i, (label, value) in enumerate(fields):
        col, row = i % 3, i // 3
        x = 20 * mm + col * (box_w + 2 * mm)
        yy = y - row * 27 * mm
        c.setFillColor(WHITE)
        c.setStrokeColor(LINE)
        c.roundRect(x, yy - 20 * mm, box_w, 20 * mm, 2 * mm, fill=1, stroke=1)
        label_value(c, x + 5 * mm, yy - 6 * mm, label, value, box_w - 10 * mm)
    y -= 93 * mm
    text(c, "ANTECEDENTES REVISADOS", 20 * mm, y, 7, GREEN, BOLD)
    items = [
        ("01", "Ficha entregada por el cliente", "Dirección, programa y superficies declaradas."),
        ("02", "Registro fotográfico", "Imágenes interiores, fachada y entorno inmediato."),
        ("03", "Información de mercado", "Ofertas comparables publicadas y verificadas para el ejemplo."),
    ]
    for idx, name, detail in items:
        y -= 19 * mm
        c.setFillColor(PALE_GREEN)
        c.circle(25 * mm, y + 5 * mm, 5 * mm, fill=1, stroke=0)
        text(c, idx, 21.5 * mm, y + 3.2 * mm, 7, GREEN, BOLD)
        text(c, name, 37 * mm, y + 7 * mm, 9, NAVY, BOLD)
        text(c, detail, 37 * mm, y + 1 * mm, 8, MID)


def draw_method(c):
    header(c, 4, "Metodologia")
    title(c, "03", "Cómo se obtuvo el valor", "El plan Express utiliza comparables de mercado y ajustes esenciales para una orientación profesional.")
    y = H - 83 * mm
    steps = [
        ("1", "Definir la microzona", "Se delimita el entorno competitivo considerando conectividad, equipamiento y tipología."),
        ("2", "Seleccionar comparables", "Se filtran inmuebles semejantes por superficie, programa, antigüedad y ubicación."),
        ("3", "Homologar diferencias", "Se aplican ajustes por estacionamiento, estado, piso, orientación y calidad del dato."),
        ("4", "Concluir un rango", "Se ponderan los resultados y se informa un valor central junto con su rango razonable."),
    ]
    for idx, name, detail in steps:
        c.setFillColor(WHITE)
        c.setStrokeColor(LINE)
        c.roundRect(20 * mm, y - 28 * mm, W - 40 * mm, 24 * mm, 2 * mm, fill=1, stroke=1)
        c.setFillColor(GREEN)
        c.rect(20 * mm, y - 28 * mm, 3 * mm, 24 * mm, fill=1, stroke=0)
        c.setFillColor(PALE_GREEN)
        c.circle(33 * mm, y - 16 * mm, 6 * mm, fill=1, stroke=0)
        text(c, idx, 30.8 * mm, y - 18 * mm, 9, GREEN, BOLD)
        text(c, name, 45 * mm, y - 12 * mm, 10, NAVY, BOLD)
        paragraph(c, detail, 45 * mm, y - 16 * mm, W - 72 * mm,
                  ParagraphStyle("step", fontName=REGULAR, fontSize=8.3, leading=11, textColor=MID))
        y -= 31 * mm
    y -= 2 * mm
    c.setFillColor(ICE)
    c.roundRect(20 * mm, y - 32 * mm, W - 40 * mm, 32 * mm, 3 * mm, fill=1, stroke=0)
    text(c, "ALCANCE EXPRESS", 27 * mm, y - 10 * mm, 7, GREEN, BOLD)
    paragraph(c, "Orientación de valor para decisiones de venta, compra o patrimonio. No reemplaza una tasación bancaria, judicial o expropiatoria, ni incluye inspección técnica presencial salvo contratación adicional.", 27 * mm, y - 15 * mm, W - 54 * mm,
              ParagraphStyle("scope", fontName=REGULAR, fontSize=8.3, leading=12, textColor=NAVY))


def draw_comparables(c):
    header(c, 5, "Comparables")
    title(c, "04", "Evidencia de mercado", "Muestra resumida de referencias utilizadas para construir el rango de valor.")
    y = H - 84 * mm
    data = [
        ["Referencia", "Sup.", "Programa", "Precio oferta", "$/m2", "Ajuste"],
        ["Sector Plaza Ñuñoa", "60 m2", "2D / 2B", "$148.000.000", "$2.466.667", "-3%"],
        ["Sector Chile Espana", "57 m2", "2D / 2B", "$139.000.000", "$2.438.596", "+1%"],
        ["Sector Irarrazaval", "62 m2", "2D / 2B", "$151.000.000", "$2.435.484", "-2%"],
        ["Sector Villa Frei", "56 m2", "2D / 1B", "$132.000.000", "$2.357.143", "+4%"],
    ]
    table = Table(data, colWidths=[47 * mm, 18 * mm, 25 * mm, 31 * mm, 29 * mm, 20 * mm], rowHeights=[10 * mm] + [13 * mm] * 4)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), BOLD), ("FONTNAME", (0, 1), (-1, -1), REGULAR),
        ("FONTSIZE", (0, 0), (-1, -1), 7.4), ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE), ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    table.wrapOn(c, W, H)
    table.drawOn(c, 20 * mm, y - 62 * mm)
    y -= 78 * mm
    text(c, "PRECIO UNITARIO OBSERVADO", 20 * mm, y, 7, GREEN, BOLD)
    values = [("Villa Frei", 2357143), ("Irarrázaval", 2435484), ("Chile España", 2438596), ("Plaza Ñuñoa", 2466667)]
    max_v = 2550000
    for i, (name, val) in enumerate(values):
        yy = y - 16 * mm - i * 17 * mm
        text(c, name, 20 * mm, yy + 2 * mm, 8, NAVY, BOLD)
        c.setFillColor(ICE)
        c.roundRect(57 * mm, yy, 95 * mm, 6 * mm, 2 * mm, fill=1, stroke=0)
        c.setFillColor(GREEN if i > 0 else NAVY_2)
        c.roundRect(57 * mm, yy, 95 * mm * val / max_v, 6 * mm, 2 * mm, fill=1, stroke=0)
        right(c, f"${val:,.0f}".replace(",", "."), W - 20 * mm, yy + 1.5 * mm, 8, NAVY, BOLD)
    y -= 87 * mm
    c.setFillColor(PALE_GREEN)
    c.roundRect(20 * mm, y - 24 * mm, W - 40 * mm, 24 * mm, 3 * mm, fill=1, stroke=0)
    text(c, "PRECIO UNITARIO HOMOLOGADO", 27 * mm, y - 9 * mm, 7, GREEN, BOLD)
    text(c, "$2.420.000 / m2", 27 * mm, y - 18 * mm, 15, NAVY, BOLD)
    right(c, "Ponderación según similitud y calidad del dato", W - 27 * mm, y - 16 * mm, 7.5, MID)


def draw_conclusion(c):
    header(c, 6, "Conclusión y firma")
    title(c, "05", "Conclusión profesional", "El resultado final debe ser fácil de usar y dejar explícitos sus límites.")
    y = H - 84 * mm
    c.setFillColor(NAVY)
    c.roundRect(20 * mm, y - 38 * mm, W - 40 * mm, 38 * mm, 3 * mm, fill=1, stroke=0)
    text(c, "VALOR COMERCIAL ESTIMADO", 27 * mm, y - 12 * mm, 7, colors.HexColor("#BFD2E2"), BOLD)
    text(c, "$142.000.000", 27 * mm, y - 28 * mm, 23, WHITE, BOLD)
    right(c, "Rango: $136.000.000 - $148.000.000", W - 27 * mm, y - 23 * mm, 10, colors.HexColor("#D9E5ED"), BOLD)
    y -= 52 * mm
    text(c, "DECISION RECOMENDADA", 20 * mm, y, 7, GREEN, BOLD)
    paragraph(c, "Para una salida a mercado equilibrada, se recomienda publicar dentro del tercio superior del rango y revisar la respuesta durante los primeros 21 días. Una estrategia sobre $148.000.000 podría extender el plazo de exposición.", 20 * mm, y - 6 * mm, W - 40 * mm,
              ParagraphStyle("recommend", fontName=REGULAR, fontSize=9.5, leading=14, textColor=NAVY))
    y -= 43 * mm
    text(c, "RIESGOS Y SUPUESTOS", 20 * mm, y, 7, GREEN, BOLD)
    risks = [
        "Superficies y programa declarados por el cliente; deben contrastarse con antecedentes legales.",
        "Valores comparables corresponden a ofertas y pueden diferir del precio final de cierre.",
        "No se incorporaron patologias constructivas ni restricciones legales no informadas.",
        "El valor puede cambiar por condiciones de mercado posteriores a la fecha del informe.",
    ]
    for risk in risks:
        y -= 11 * mm
        c.setFillColor(GREEN)
        c.circle(23 * mm, y + 3 * mm, 1.5 * mm, fill=1, stroke=0)
        paragraph(c, risk, 29 * mm, y + 6 * mm, W - 49 * mm,
                  ParagraphStyle("risk", fontName=REGULAR, fontSize=8.2, leading=11, textColor=MID))
    y -= 18 * mm
    c.setStrokeColor(NAVY)
    c.setLineWidth(0.8)
    c.line(118 * mm, y, 188 * mm, y)
    text(c, "Javier Castro Riquelme", 118 * mm, y - 7 * mm, 9, NAVY, BOLD)
    text(c, "Arquitecto - Perito Tasador", 118 * mm, y - 13 * mm, 8, MID)
    text(c, "Firma simple | TasaGo", 118 * mm, y - 19 * mm, 7, GREEN, BOLD)


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
    c.setTitle("TasaGo - Informe de Tasacion Express - Ejemplo")
    c.setAuthor("TasaGo | Inteligencia Territorial")
    draw_cover(c)
    c.showPage()
    draw_summary(c)
    c.showPage()
    draw_property(c)
    c.showPage()
    draw_method(c)
    c.showPage()
    draw_comparables(c)
    c.showPage()
    draw_conclusion(c)
    c.save()
    copy2(OUTPUT, PUBLIC_COPY)
    print(OUTPUT)


if __name__ == "__main__":
    build()
