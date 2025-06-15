from pathlib import Path

def recreate_scriptcard_templates():
    """
    Creates or overwrites ScriptCards templates with corrected footer content.
    This script is designed to be run from the project's root directory.
    """
    script_dir = Path('src/scriptcards')
    script_dir.mkdir(parents=True, exist_ok=True)
    print(f"Ensured directory exists: {script_dir}")

    # --- Template Content Definitions ---
    # Each template has a non-breaking space ( ) added to its footer
    # to prevent the 'undefined' error in Roll20.

    templates = {
        "bridge_holo_display.txt": """boxcode::{div style='background-color: #051120; border: 2px solid #00ffff; box-shadow: 0 0 10px #00ffff; display: block; text-align: left; padding: 5px; margin-bottom: 2px; color: #a9d1ff; font-family: "Orbitron", sans-serif; white-space: pre-wrap; line-height: 1.4em'}||
titlecode::{div style='background-color: #051120; margin: 0.5em 1em 0 1em; padding-bottom: 0.5em; font-size: 18px; font-family: "Orbitron", sans-serif; color: #00ffff; display: block; font-weight: normal; text-transform: uppercase; letter-spacing: 0.1em; text-shadow: 0 0 10px #00ffff; border-bottom: 1px solid #00ffff'}||
textcode::{/div}{div}{div style='font-weight: normal; display: block; margin: 0 1em 0 1em; color: #a9d1ff; font-family: "Orbitron", sans-serif; font-size: 14px; letter-spacing: 0.5px;'}||
buttonwrapper::{div style='display: block; text-align: center; margin-top: 5px;'}||
buttonstyle::style='background-color: #051120; color: #00ffff; border: 1px solid #00ffff; padding: 2px 8px; text-transform: uppercase;'||
footer::{/div}{/div}{div style='position: relative'}{div style='position: absolute; bottom: 5px; left: 3px; right: 3px; height: 20px; background-color: #051120; z-index: 999'} {/div}{/div}||""",

        "mechanicus_cogitator.txt": """boxcode::{div style='background-color: #1a1a1a; border: 2px solid #9d1c1c; box-shadow: 0 0 5px #9d1c1c; display: block; text-align: left; padding: 5px; margin-bottom: 2px; color: #c4c4c4; font-family: "Courier New", monospace; white-space: pre-wrap; line-height: 1.4em'}||
titlecode::{div style='background-color: #1a1a1a; margin: 0.5em 1em 0 1em; padding-bottom: 0.5em; font-size: 18px; font-family: "Courier New", monospace; color: #ff4136; display: block; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; text-shadow: 0 0 8px #ff4136; border-bottom: 1px solid #9d1c1c'}||
textcode::{/div}{div}{div style='font-weight: normal; display: block; margin: 0 1em 0 1em; color: #f0e68c; font-family: "Courier New", monospace; font-size: 13px'}||
buttonwrapper::{div style='display: block; text-align: center; margin-top: 5px;'}||
buttonstyle::style='background-color: #333; color: #ff4136; border: 1px solid #9d1c1c; padding: 2px 8px;'||
footer::{/div}{/div}{div style='position: relative'}{div style='position: absolute; bottom: 5px; left: 3px; right: 3px; height: 20px; background-color: #1a1a1a; z-index: 999'} {/div}{/div}||""",

        "navigator_chart.txt": """boxcode::{div style='background-color: #0a0a23; border: 2px solid #ffd700; box-shadow: 0 0 8px #b8860b; display: block; text-align: left; padding: 5px; margin-bottom: 2px; color: #fff8e1; font-family: "Cinzel", serif; white-space: pre-wrap; line-height: 1.4em'}||
titlecode::{div style='background-color: #0a0a23; margin: 0.5em 1em 0 1em; padding-bottom: 0.5em; font-size: 18px; font-family: "Cinzel", serif; color: #ffd700; display: block; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; text-shadow: 0 0 10px #b8860b; border-bottom: 1px solid #b8860b'}||
textcode::{/div}{div}{div style='font-weight: normal; display: block; margin: 0 1em 0 1em; color: #fff8e1; font-family: "Cinzel", serif; font-size: 14px;'}||
buttonwrapper::{div style='display: block; text-align: center; margin-top: 5px;'}||
buttonstyle::style='background-color: transparent; color: #ffd700; border: 1px solid #b8860b; padding: 2px 8px;'||
footer::{/div}{/div}{div style='position: relative'}{div style='position: absolute; bottom: 5px; left: 3px; right: 3px; height: 20px; background-color: #0a0a23; z-index: 999'} {/div}{/div}||""",

        "warrant_of_trade.txt": """boxcode::{div style='background-color: #fdf5e6; border: 2px solid #5a0000; box-shadow: 0 0 10px #5a0000; display: block; text-align: left; padding: 5px; margin-bottom: 2px; color: #3d2b1f; font-family: Georgia, serif; white-space: pre-wrap; line-height: 1.4em'}||
titlecode::{div style='background-color: #fdf5e6; margin: 0.5em 1em 0 1em; padding-bottom: 0.5em; font-size: 18px; font-family: "Uncial Antiqua", cursive; color: #5a0000; display: block; font-weight: normal; text-transform: uppercase; letter-spacing: 0.1em; text-shadow: 0 0 10px #7a0000; border-bottom: 3px double #7a0000'}||
textcode::{/div}{div}{div style='font-weight: normal; display: block; margin: 0 1em 0 1em; color: #3d2b1f; font-family: "IM Fell English", serif; font-size: 14px'}||
buttonwrapper::{div style='display: block; text-align: center; margin-top: 5px;'}||
buttonstyle::style='background-color: #fdf5e6; color: #5a0000; border: 1px solid #5a0000; padding: 2px 8px; font-family: "Uncial Antiqua", cursive;'||
footer::{/div}{/div}{div style='position: relative'}{div style='position: absolute; bottom: 5px; left: 3px; right: 3px; height: 20px; background-color: #fdf5e6; z-index: 999'} {/div}{/div}||""",

        "xenos_cipher.txt": """boxcode::{div style='background-color: #1c002b; border: 2px solid #33ff00; box-shadow: 0 0 15px #4b0082; display: block; text-align: left; padding: 5px; margin-bottom: 2px; color: #c792ea; font-family: monospace; white-space: pre-wrap; line-height: 1.4em'}||
titlecode::{div style='background-color: #1c002b; margin: 0.5em 1em 0 1em; padding-bottom: 0.5em; font-size: 18px; font-family: serif; color: #33ff00; display: block; font-weight: normal; font-style: italic; text-transform: uppercase; letter-spacing: 0.1em; text-shadow: 0 0 5px #33ff00; border-bottom: 1px solid #4b0082'}||
textcode::{/div}{div}{div style='font-weight: normal; display: block; margin: 0 1em 0 1em; color: #c792ea; font-family: monospace; font-size: 13px;'}||
buttonwrapper::{div style='display: block; text-align: center; margin-top: 5px;'}||
buttonstyle::style='background-color: #4b0082; color: #33ff00; border: none; padding: 3px 10px; text-transform: lowercase;'||
footer::{/div}{/div}{div style='position: relative'}{div style='position: absolute; bottom: 5px; left: 3px; right: 3px; height: 20px; background-color: #1c002b; z-index: 999'} {/div}{/div}||"""
    }

    print("Recreating ScriptCard templates...")
    for filename, content in templates.items():
        try:
            file_path = script_dir / filename
            file_path.write_text(content.strip(), encoding='utf-8')
            print(f"✅ Successfully created/updated: {file_path}")
        except Exception as e:
            print(f"❌ Error creating {filename}: {e}")

    print("\nProcess complete.")

if __name__ == "__main__":
    recreate_scriptcard_templates()