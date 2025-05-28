"""
File handling utilities
"""
import logging
from pathlib import Path
from typing import Dict, Any, List
import json
import csv

logger = logging.getLogger(__name__)

def sanitize_filename(filename: str) -> str:
    """Create a safe filename from character name"""
    # Replace problematic characters
    safe_name = filename.replace(" ", "_").replace("/", "_").replace("*", "_")
    safe_name = safe_name.replace("\\", "_").replace(":", "_").replace("?", "_")
    safe_name = safe_name.replace("<", "_").replace(">", "_").replace("|", "_")
    safe_name = safe_name.replace('"', "_")
    
    # Keep only alphanumeric and safe punctuation
    safe_name = "".join(c for c in safe_name if c.isalnum() or c in "._-")
    
    # Limit length
    return safe_name[:100]

def export_to_csv(character_data: Dict[str, Any], output_file: Path):
    """Export character data to CSV format"""
    try:
        # Flatten the character data for CSV export
        flattened_data = []
        
        for char_name, char_info in character_data.items():
            row = {"character_name": char_name}
            
            # Add basic info
            if "basic" in char_info:
                row.update({f"basic_{k}": v for k, v in char_info["basic"].items()})
            
            # Add core stats
            if "coreStats" in char_info:
                core_stats = char_info["coreStats"]
                
                # Attributes
                if "attributes" in core_stats:
                    row.update({f"attr_{k}": v for k, v in core_stats["attributes"].items()})
                
                # Defenses
                if "defenses" in core_stats:
                    for defense_name, defense_data in core_stats["defenses"].items():
                        row[f"defense_{defense_name}_display"] = defense_data.get("display", 0)
                        row[f"defense_{defense_name}_mod"] = defense_data.get("mod", 0)
                        row[f"defense_{defense_name}_primary"] = defense_data.get("primaryAction", False)
                
                # Combat stats
                if "combatStats" in core_stats:
                    for stat_name, stat_data in core_stats["combatStats"].items():
                        if stat_name == "hitPoints":
                            row["hp_current"] = stat_data.get("current", 0)
                            row["hp_max"] = stat_data.get("max", 0)
                        else:
                            row[f"combat_{stat_name}_display"] = stat_data.get("display", 0)
                            row[f"combat_{stat_name}_mod"] = stat_data.get("mod", 0)
                            if "primaryAction" in stat_data:
                                row[f"combat_{stat_name}_primary"] = stat_data.get("primaryAction", False)
            
            # Count repeating sections
            if "repeating" in char_info:
                repeating = char_info["repeating"]
                row["traits_count"] = len(repeating.get("traits", []))
                row["attacks_count"] = len(repeating.get("attacks", []))
                row["features_count"] = len(repeating.get("features", []))
                row["unique_abilities_count"] = len(repeating.get("uniqueAbilities", []))
            
            flattened_data.append(row)
        
        # Write to CSV
        if flattened_data:
            fieldnames = flattened_data[0].keys()
            with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(flattened_data)
            
            logger.info(f"Exported character data to CSV: {output_file}")
        
    except Exception as e:
        logger.error(f"Failed to export to CSV: {e}")

def create_summary_report(character_data: Dict[str, Any], output_file: Path):
    """Create a summary report of extracted characters"""
    try:
        report = {
            "extraction_summary": {
                "total_characters": len(character_data),
                "extraction_timestamp": str(Path().cwd()),  # You might want to add actual timestamp
                "characters": []
            }
        }
        
        for char_name, char_info in character_data.items():
            char_summary = {
                "name": char_name,
                "tier": char_info.get("basic", {}).get("tier", "Unknown"),
                "has_bio": bool(char_info.get("editSection", {}).get("bio", "")),
                "has_gm_notes": bool(char_info.get("editSection", {}).get("gmNotes", "")),
                "abilities_count": len(char_info.get("abilities", {})),
            }
            
            # Count repeating sections
            if "repeating" in char_info:
                repeating = char_info["repeating"]
                char_summary.update({
                    "traits_count": len(repeating.get("traits", [])),
                    "attacks_count": len(repeating.get("attacks", [])),
                    "features_count": len(repeating.get("features", [])),
                    "unique_abilities_count": len(repeating.get("uniqueAbilities", []))
                })
            
            report["extraction_summary"]["characters"].append(char_summary)
        
        # Save report
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Created summary report: {output_file}")
        
    except Exception as e:
        logger.error(f"Failed to create summary report: {e}")