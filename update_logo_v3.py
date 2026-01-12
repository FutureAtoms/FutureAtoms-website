
import sys
import os

HEADER_LOGO_HTML = """        <div class="flex items-center gap-3 cursor-pointer" onclick="window.location.href='index.html'">
            <div class="w-10 h-10 flex items-center justify-center">
                <img src="images/futureatoms-icon.png" alt="FutureAtoms Icon"
                    class="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">
            </div>
            <div>
                <h1 class="font-['Orbitron'] text-2xl md:text-3xl font-bold tracking-wider text-white">
                    FUTURE<span class="text-cyan-400">ATOMS</span>
                </h1>
                <p class="text-[10px] md:text-xs tracking-[0.3em] text-cyan-200 opacity-70 uppercase">Evolving
                    Intelligence</p>
            </div>
        </div>"""

START_TAG_VARIANTS = [
    '<div class="flex items-center gap-3 cursor-pointer" onclick="window.location.href=\'index.html\'">',
    '        <div class="flex items-center gap-3 cursor-pointer" onclick="window.location.href=\'index.html\'">',
    '    <div class="flex items-center gap-3 cursor-pointer" onclick="window.location.href=\'index.html\'">'
]

def update_file(filepath):
    print(f"Processing {filepath}...")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        start_idx = -1
        found_variant = ""
        for variant in START_TAG_VARIANTS:
            idx = content.find(variant)
            if idx != -1:
                start_idx = idx
                found_variant = variant
                # We want to replace from the start of the variant.
                # If variant has indentation, we replace it with our indented block.
                # If variant has NO indentation, we might want to check if line has indentation.
                # But let's just use the index found.
                break
        
        if start_idx == -1:
            print(f"  [SKIP] Start tag not found in {filepath}")
            return

        print(f"  [FOUND] Tag at index {start_idx}")

        # Brace counting to find end
        search_content = content[start_idx:]
        nesting = 0
        end_idx = -1
        pos = 0
        
        while pos < len(search_content):
            if search_content[pos] == '<':
                # Check for comment
                if search_content.startswith('<!--', pos):
                    end_comment = search_content.find('-->', pos)
                    if end_comment != -1:
                        pos = end_comment + 3
                        continue
                
                if pos+1 < len(search_content) and search_content[pos+1] == '/':
                    tag_type = 'close'
                    tag_start = pos + 2
                else:
                    tag_type = 'open'
                    tag_start = pos + 1
                
                p2 = tag_start
                while p2 < len(search_content) and (search_content[p2].isalnum() or search_content[p2] == '-'):
                    p2 += 1
                tag_name = search_content[tag_start:p2]
                
                if tag_name == 'div':
                    if tag_type == 'open':
                        nesting += 1
                    elif tag_type == 'close':
                        nesting -= 1
                        if nesting == 0:
                            end_of_tag = search_content.find('>', p2)
                            if end_of_tag != -1:
                                end_idx = start_idx + end_of_tag + 1
                                break
            pos += 1

        if end_idx != -1:
            # We found the block. Replace it.
            # We want to keep indentation if possible, but our HEADER_LOGO_HTML already keeps 8 spaces.
            # If the found variant had different indentation, we might introduce messiness, but it's acceptable.
            content = content[:start_idx] + HEADER_LOGO_HTML + content[end_idx:]
            print(f"  [SUCCESS] Logo updated")
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
        else:
            print(f"  [FAIL] Could not find closing div")

    except Exception as e:
        print(f"  [ERROR] {e}")

if __name__ == "__main__":
    files = sys.argv[1:]
    for f in files:
        update_file(f)
