from pypdf import PdfReader

reader = PdfReader(r"C:\Users\Anurag patel\.gemini\antigravity-ide\brain\b8ef9df2-1775-45ee-a40a-e0d415babd47\.tempmediaStorage\22384f14f0782c24.pdf")
page = reader.pages[8]

def visitor(text, cm, tm, font_dict, font_size):
    t = text.strip()
    if t:
        print(f"{t:<35} x={tm[4]:.1f}, y={tm[5]:.1f}")

page.extract_text(visitor_text=visitor)
