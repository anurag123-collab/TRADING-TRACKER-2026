import os
import io
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas

input_pdf_path = r"C:\Users\Anurag patel\.gemini\antigravity-ide\brain\b8ef9df2-1775-45ee-a40a-e0d415babd47\.tempmediaStorage\22384f14f0782c24.pdf"
output_pdf_path = r"d:\TRADING TRAKER 2026\TradingView_Signed_License_Agreement_Anurag_Patel.pdf"

reader = PdfReader(input_pdf_path)
writer = PdfWriter()

total_pages = len(reader.pages)
page_9 = reader.pages[8]
width = float(page_9.mediabox.width)
height = float(page_9.mediabox.height)

packet = io.BytesIO()
can = canvas.Canvas(packet, pagesize=(width, height))

# Formal Deep Black Ink for Corporate Legal Agreements
can.setFillColorRGB(0.05, 0.05, 0.05)

# 1. Company Information
can.setFont("Helvetica-Bold", 9.5)
can.drawString(370, 719.6, "Trading Tracker 2026")

# 2. Company Address (Clean 2-line official address)
can.setFont("Helvetica", 8.2)
can.drawString(380, 708.1, "VILL-DABAUL, PO-KAPASIAWAN, PS-HILSA,")
can.drawString(282.1, 695.5, "DIST-NALANDA, BIHAR - 801302, INDIA")

# 3. Website & Notices Email (Matching TradingView's email to support@thetradingtracker.com)
can.setFont("Helvetica", 9)
can.drawString(335, 673.6, "https://thetradingtracker.com")
can.drawString(355, 662.1, "support@thetradingtracker.com")

# 4. Digital Signature in Formal Black Pen Ink on the line
can.setFont("Helvetica-BoldOblique", 15.5)
can.setFillColorRGB(0.02, 0.02, 0.02) # Real Black Pen Ink
can.drawString(290, 600.0, "Anurag Patel")

# 5. Signatory Details below the line
can.setFillColorRGB(0.05, 0.05, 0.05)
can.setFont("Helvetica-Bold", 9)
can.drawString(322, 570.6, "Anurag Patel")

can.setFont("Helvetica", 8.8)
can.drawString(312, 559.1, "Founder & Lead Developer")

can.drawString(380, 547.6, "08/21/2026")

can.save()
packet.seek(0)

overlay_reader = PdfReader(packet)
overlay_page = overlay_reader.pages[0]

for i in range(total_pages):
    page = reader.pages[i]
    if i == 8:
        page.merge_page(overlay_page)
    writer.add_page(page)

with open(output_pdf_path, "wb") as f_out:
    writer.write(f_out)

print("Updated with support@thetradingtracker.com as Notices Email!")
