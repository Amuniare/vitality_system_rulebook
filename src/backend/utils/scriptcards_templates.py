import re
from typing import Dict, Any, Optional
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class ScriptCardsTemplateManager:
    """Enhanced template manager with ScriptCards template loading"""
    
    def __init__(self, template_file=None):
        self.master_template = None
        self.master_template_size = 0
        self.scriptcards_template = None
        self.compression_stats = {
            "attempts": 0,
            "successes": 0,
            "failures": 0,
            "total_original_size": 0,
            "total_compressed_size": 0
        }
        self.summary_logged = False
        
        # Load ScriptCards template
        self._load_scriptcards_template()
    
    def _load_scriptcards_template(self):
        """Load the ScriptCards template from file"""
        try:
            template_path = Path("src/roll20ScriptcardsAndSheets/scriptcards_v6/Scriptcards_Attacks_Library_v6.1.txt")
            
            if not template_path.exists():
                logger.error(f"ScriptCards template not found at: {template_path}")
                return
            
            with open(template_path, 'r', encoding='utf-8') as f:
                self.scriptcards_template = f.read()
            
            # Validate that template contains the required {number} placeholder
            if "{number}" not in self.scriptcards_template:
                logger.error("ScriptCards template does not contain {number} placeholder - template is invalid")
                self.scriptcards_template = None
                return
            
            logger.info(f"Loaded ScriptCards template ({len(self.scriptcards_template)} characters) with {{number}} placeholder confirmed")
            
        except Exception as e:
            logger.error(f"Failed to load ScriptCards template: {e}")
            self.scriptcards_template = None
    
    def expand_compressed_ability(self, compressed_data: Dict[str, Any]) -> str:
        """Expand compressed ability back to full content using ScriptCards template"""
        try:
            if compressed_data.get("type") != "indexed":
                logger.debug(f"Ability type is '{compressed_data.get('type')}', not 'indexed' - returning original content")
                return compressed_data.get("content", "")
            
            attack_index = compressed_data.get("content")
            logger.debug(f"Raw attack index from compressed data: {attack_index} (type: {type(attack_index)})")
            
            if attack_index is None:
                logger.error("No attack index in compressed data")
                return ""
            
            if self.scriptcards_template is None:
                logger.error("No ScriptCards template available for expansion")
                return ""
            
            # Validate the attack index is a valid number
            if isinstance(attack_index, str) and not attack_index.isdigit():
                logger.error(f"Invalid attack index: '{attack_index}' is not a valid number")
                return ""
            
            # Validate that attack index is not negative
            if isinstance(attack_index, int) and attack_index < 0:
                logger.error(f"Invalid negative attack index: {attack_index}")
                return ""
            
            # Convert to string for replacement
            index_str = str(attack_index)
            logger.debug(f"Converting attack index to string: {attack_index} -> '{index_str}'")
            
            # Verify template contains {number} placeholder
            if "{number}" not in self.scriptcards_template:
                logger.error("ScriptCards template does not contain {number} placeholder")
                return ""
            
            # Replace {number} placeholder with actual attack index
            expanded = self.scriptcards_template.replace("{number}", index_str)
            
            logger.debug(f"Successfully expanded ability with index {attack_index} -> '{index_str}'")
            logger.debug(f"Expanded content preview: {expanded[:100]}...")
            return expanded
            
        except Exception as e:
            logger.error(f"Expansion failed: {e}")
            return str(compressed_data.get("content", ""))
    
    def get_scriptcards_template_with_index(self, attack_index: int) -> str:
        """Get ScriptCards template with specific attack index"""
        if self.scriptcards_template is None:
            logger.error("ScriptCards template not loaded")
            return ""
        
        # Validate attack index
        if attack_index is None:
            logger.error("Attack index is None")
            return ""
        
        # Convert to string for replacement
        index_str = str(attack_index)
        logger.debug(f"Creating template with attack index: {attack_index} -> '{index_str}'")
        
        # Verify template contains {number} placeholder
        if "{number}" not in self.scriptcards_template:
            logger.error("ScriptCards template does not contain {number} placeholder")
            return ""
        
        result = self.scriptcards_template.replace("{number}", index_str)
        logger.debug(f"Template replacement successful: {index_str} inserted into template")
        return result
    
    # Keep existing methods unchanged...
    def _create_template_from_content(self, content: str, attack_index: int) -> str:
        """Create template by replacing attack index with placeholder"""
        try:
            template = re.sub(
                r'(--Rbyindex\|.*?;repeating_attacks;)' + str(attack_index) + r'\b',
                r'\1{INDEX}',
                content
            )
            return template
        except Exception as e:
            logger.debug(f"Template creation failed: {e}")
            return content
    

    def compress_ability_content(self, ability_name: str, ability_content: str, character_name: str = "") -> Dict[str, Any]:
        """Aggressive index-based compression - but skip template sheets"""
        # Skip compression for template sheets
        if character_name in ["MacroMule", "ScriptCards_TemplateMule"]:
            logger.debug(f"Skipping compression for template sheet: {character_name}")
            return {
                "type": "full",
                "content": ability_content
            }
        

        
        self.compression_stats["attempts"] += 1
        self.compression_stats["total_original_size"] += len(ability_content)
        
        try:
            index_match = re.search(r'--Rbyindex\|.*?;repeating_attacks;(\d+)', ability_content)
            
            if not index_match:
                logger.debug(f"No attack index found in {ability_name} - skipping compression")
                logger.debug(f"Ability content preview: {ability_content[:200]}...")
                self.compression_stats["total_compressed_size"] += len(ability_content)
                return {
                    "type": "full",
                    "content": ability_content
                }
            else:
                attack_index = int(index_match.group(1))
                logger.debug(f"Extracted attack index from {ability_name}: {attack_index}")
                logger.debug(f"Full regex match: {index_match.group(0)}")
                
                # Validate that the extracted index is not 0 (unless it's genuinely the first attack)
                if attack_index < 0:
                    logger.warning(f"Invalid negative attack index {attack_index} in {ability_name}")
                    self.compression_stats["total_compressed_size"] += len(ability_content)
                    return {
                        "type": "full",
                        "content": ability_content
                    }
            
            if self.master_template is None:
                self.master_template = self._create_template_from_content(ability_content, attack_index)
                self.master_template_size = len(ability_content)
                logger.info(f"Set {ability_name} as master template (index {attack_index}, {len(ability_content)} chars)")
            
            logger.debug(f"Compressed {ability_name} to index {attack_index}")
            self.compression_stats["successes"] += 1
            self.compression_stats["total_compressed_size"] += len(str(attack_index))
            
            return {
                "type": "indexed",
                "content": attack_index,
                "is_master": self.master_template_size == len(ability_content)
            }
                
        except Exception as e:
            logger.error(f"Compression failed for {ability_name}: {e}")
            self.compression_stats["total_compressed_size"] += len(ability_content)
            
            return {
                "type": "full", 
                "content": ability_content
            }

    def get_compression_stats(self) -> Dict[str, Any]:
        """Get compression statistics"""
        stats = self.compression_stats.copy()
        
        if stats["attempts"] > 0:
            stats["success_rate"] = stats["successes"] / stats["attempts"]
        else:
            stats["success_rate"] = 0.0
        
        if stats["total_original_size"] > 0:
            stats["compression_ratio"] = stats["total_compressed_size"] / stats["total_original_size"]
            stats["space_saved"] = stats["total_original_size"] - stats["total_compressed_size"]
        else:
            stats["compression_ratio"] = 1.0
            stats["space_saved"] = 0
        
        stats["has_master_template"] = self.master_template is not None
        stats["has_scriptcards_template"] = self.scriptcards_template is not None
        
        return stats

    def log_compression_summary(self):
        """Log compression performance summary - only once"""
        if self.summary_logged:
            return
            
        self.summary_logged = True
        stats = self.get_compression_stats()
        
        logger.info("=== FINAL Compression Summary ===")
        logger.info(f"Attempts: {stats['attempts']}")
        logger.info(f"Successful compressions: {stats['successes']}")
        logger.info(f"Success rate: {stats['success_rate']:.1%}")
        logger.info(f"ScriptCards template loaded: {stats['has_scriptcards_template']}")
        
        if stats["has_master_template"]:
            logger.info(f"Master template size: {self.master_template_size:,} chars")
            logger.info(f"Original total size: {stats['total_original_size']:,} bytes")
            logger.info(f"Compressed total size: {stats['total_compressed_size']:,} bytes")
            logger.info(f"Space saved: {stats['space_saved']:,} bytes ({(1-stats['compression_ratio']):.1%} reduction)")
        
        if stats["failures"] > 0:
            logger.warning(f"Failed compressions: {stats['failures']}")


def _fix_duplicate_attack_indices(abilities_data, character_name: str):
    """Fix the issue where all attack abilities have index 0"""
    if not isinstance(abilities_data, list):
        return abilities_data
    
    # Find all indexed abilities
    indexed_abilities = []
    for i, ability in enumerate(abilities_data):
        if isinstance(ability, dict) and ability.get("type") == "indexed":
            indexed_abilities.append((i, ability))
    
    if len(indexed_abilities) < 2:
        return abilities_data  # Not enough abilities to have a duplicate issue
    
    # Check if all indexed abilities have the same index (especially 0)
    indices = [ability["content"] for _, ability in indexed_abilities]
    unique_indices = set(indices)
    
    if len(unique_indices) == 1 and 0 in unique_indices and len(indexed_abilities) > 1:
        logger.warning(f"Character '{character_name}': All {len(indexed_abilities)} attack abilities have index 0 - applying auto-correction")
        
        # Apply auto-correction: assign sequential indices
        corrected_abilities = list(abilities_data)  # Copy the list
        
        for seq_index, (ability_index, ability) in enumerate(indexed_abilities):
            corrected_abilities[ability_index] = {
                **ability,
                "content": seq_index
            }
            logger.info(f"Auto-corrected '{ability.get('name', 'unknown')}': index 0 -> {seq_index}")
        
        logger.info(f"Auto-correction complete for '{character_name}': Assigned indices 0-{len(indexed_abilities)-1}")
        return corrected_abilities
    
    # Log the current index distribution for debugging
    index_counts = {}
    for idx in indices:
        index_counts[idx] = index_counts.get(idx, 0) + 1
    
    logger.debug(f"Character '{character_name}' attack index distribution: {index_counts}")
    
    return abilities_data


def expand_character_abilities(character_data: Dict[str, Any], template_manager: ScriptCardsTemplateManager) -> Dict[str, Any]:
    """Expand compressed abilities in character data - FIXED for array format with auto-correction"""
    if "abilities" not in character_data:
        return character_data
    
    expanded_abilities = []
    
    try:
        abilities_data = character_data["abilities"]
        
        # Pre-process: Check for and fix duplicate index 0 issue
        abilities_data = _fix_duplicate_attack_indices(abilities_data, character_data.get("metadata", {}).get("name", "Unknown"))
        
        if isinstance(abilities_data, dict):
            # Old format: convert dict to array
            for ability_name, ability_data in abilities_data.items():
                try:
                    if isinstance(ability_data, dict) and ability_data.get("type") == "indexed":
                        expanded_content = template_manager.expand_compressed_ability(ability_data)
                        expanded_abilities.append({
                            "name": ability_name,
                            "content": expanded_content,
                            "showInMacroBar": ability_data.get("showInMacroBar", False),
                            "isTokenAction": ability_data.get("isTokenAction", False)
                        })
                    else:
                        expanded_abilities.append({
                            "name": ability_name,
                            "content": ability_data.get("content", ""),
                            "showInMacroBar": ability_data.get("showInMacroBar", False),
                            "isTokenAction": ability_data.get("isTokenAction", False)
                        })
                        
                except Exception as e:
                    logger.error(f"Failed to expand ability {ability_name}: {e}")
                    expanded_abilities.append({
                        "name": ability_name,
                        "content": ability_data.get("content", ""),
                        "showInMacroBar": ability_data.get("showInMacroBar", False),
                        "isTokenAction": ability_data.get("isTokenAction", False)
                    })
                    
        elif isinstance(abilities_data, list):
            # New format: already an array
            for ability_data in abilities_data:
                try:
                    if isinstance(ability_data, dict) and ability_data.get("type") == "indexed":
                        expanded_content = template_manager.expand_compressed_ability(ability_data)
                        expanded_abilities.append({
                            "name": ability_data.get("name", ""),
                            "content": expanded_content,
                            "showInMacroBar": ability_data.get("showInMacroBar", False),
                            "isTokenAction": ability_data.get("isTokenAction", False)
                        })
                    else:
                        expanded_abilities.append({
                            "name": ability_data.get("name", ""),
                            "content": ability_data.get("content", ""),
                            "showInMacroBar": ability_data.get("showInMacroBar", False),
                            "isTokenAction": ability_data.get("isTokenAction", False)
                        })
                        
                except Exception as e:
                    logger.error(f"Failed to expand ability {ability_data.get('name', 'unknown')}: {e}")
                    expanded_abilities.append(ability_data)
        
        character_data["abilities"] = expanded_abilities
        return character_data
        
    except Exception as e:
        logger.error(f"Character ability expansion failed: {e}")
        return character_data