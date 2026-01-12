
path = "public/index.html"
with open(path, 'rb') as f:
    content = f.read(100)
    print(f"First 100 bytes repr: {content!r}")
