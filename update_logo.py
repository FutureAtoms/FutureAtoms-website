
import sys
import os
import re

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

TARGET_START_LINE_STRIPPED = '<div class="flex items-center gap-3 cursor-pointer" onclick="window.location.href=\'index.html\'">'

def update_file(filepath):
    print(f"Processing {filepath}...")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        content = "".join(lines)
        
        # 1. Update CSS Link
        content = re.sub(r'href="css/main\.css(?:|[?][^"]*)"', 'href="css/main.css?v=9999"', content)

        # 2. Update Logo
        # Find start index by iterating lines
        start_idx = -1
        
        # We also need to know Where in 'content' this line starts.
        current_pos = 0
        for line in lines:
            if TARGET_START_LINE_STRIPPED in line:
                # verify it's the tag we want
                if line.strip() == TARGET_START_LINE_STRIPPED:
                    start_idx = current_pos + line.find(TARGET_START_LINE_STRIPPED) # Start of the tag
                    # Preserve indentation?
                    # line.find returns index of start.
                    start_idx = current_pos + line.find('<')
                    break
            current_pos += len(line)
            
        if start_idx != -1:
             # Find matching closing div
            search_content = content[start_idx:]
            
            nesting = 0
            end_idx = -1
            pos = 0
            
            # Use same parser logic
            while pos < len(search_content):
                if search_content[pos] == '<':
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
                content = content[:start_idx] + HEADER_LOGO_HTML + content[end_idx:]
                print(f"Updated logo in {filepath}")
            else:
                print(f"Could not find closing div in {filepath}")
        else:
            print(f"Start tag not found in {filepath}")

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

    except Exception as e:
        print(f"Error {filepath}: {e}")

if __name__ == "__main__":
    files = sys.argv[1:]
    for f in files:
        update_file(f)
