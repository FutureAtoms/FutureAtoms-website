
import os
import re
import sys

def normalize_whitespace(s):
    return ' '.join(s.split())

def audit_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Look for the logo block content
        # We search for the start of the block
        start_marker = 'onclick="window.location.href=\'index.html\'">'
        idx = content.find(start_marker)
        if idx == -1:
            return f"{filepath}: [SKIP] No logo header found"
            
        # Extract a chunk of text after the marker (e.g. 500 chars)
        chunk = content[idx:idx+800]
        
        # Check size
        if 'w-12 h-12' in chunk:
            size_status = "BAD (w-12)"
        elif 'w-10 h-10' in chunk:
            size_status = "OK (w-10)"
        else:
            size_status = "UNKNOWN size"
            
        # Check text
        normalized_chunk = normalize_whitespace(chunk)
        if 'Evolving Intelligence' in normalized_chunk:
            text_status = "OK (Has Text)"
        else:
            text_status = "MISSING TEXT"
            
        return f"{filepath}: {size_status}, {text_status}"
        
    except Exception as e:
        return f"{filepath}: ERROR {e}"

def main():
    public_dir = 'public'
    files = [f for f in os.listdir(public_dir) if f.endswith('.html')]
    files.sort()
    
    print("Audit Results:")
    for f in files:
        path = os.path.join(public_dir, f)
        print(audit_file(path))

if __name__ == "__main__":
    main()
