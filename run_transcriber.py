#!/usr/bin/env python3
import subprocess
import sys
from pathlib import Path

# Run the transcriber from tools directory
tools_script = Path("rulebook") / Path("tools") / "transcriber.py"

if tools_script.exists():
    print("🚀 Running transcriber from tools/")
    subprocess.run([sys.executable, str(tools_script)] + sys.argv[1:])
else:
    print("❌ Transcriber not found at tools/transcriber.py")
    input("Press Enter to close...")