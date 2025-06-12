#!/usr/bin/env python3
"""
Vitality Combat Simulator - Main entry point for single combat simulations

This script provides a command-line interface for running individual combat
simulations between player characters and scenario-defined enemies.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional

# Add the project root to the path so we can import our modules
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from simulation.engine.core.character_loader import CharacterLoader, SimulationCharacter
from simulation.engine.core.combat_state_fixed import CombatStateMachine
from simulation.engine.ai.opponent_ai import OpponentAI, AIPersonality, create_ai_for_character_type


class CombatSimulator:
    """
    Main combat simulator that orchestrates battles between characters and scenarios.
    """
    
    def __init__(self, verbose: bool = False):
        """
        Initialize the combat simulator.
        
        Args:
            verbose: Whether to provide detailed logging output
        """
        self.verbose = verbose
        self.character_loader = CharacterLoader()
        self.simulation_results = []
    
    def run_simulation(self, character_file: str, scenario_file: str) -> Dict[str, Any]:
        """
        Run a complete combat simulation.
        
        Args:
            character_file: Path to character JSON file
            scenario_file: Path to scenario JSON file
            
        Returns:
            Dictionary containing simulation results
        """
        try:
            # Load player character
            if self.verbose:
                print(f"Loading character from: {character_file}")
            
            player_character = self.character_loader.load_character(character_file)
            
            if self.verbose:
                print(f"Loaded: {player_character.name} (Tier {player_character.tier})")
            
            # Load scenario
            if self.verbose:
                print(f"Loading scenario from: {scenario_file}")
            
            scenario = self._load_scenario(scenario_file)
            
            if self.verbose:
                print(f"Scenario: {scenario['name']} ({scenario.get('difficulty', 'unknown')} difficulty)")
            
            # Create enemy characters from scenario
            enemy_characters = self._create_enemies_from_scenario(scenario)
            
            if self.verbose:
                enemy_names = [enemy.name for enemy in enemy_characters]
                print(f"Enemies: {', '.join(enemy_names)}")
            
            # Run combat simulation
            if self.verbose:
                print("\nStarting combat simulation...")
            
            combat = CombatStateMachine([player_character], enemy_characters)
            results = combat.run_combat()
            
            # Add metadata to results
            results['character_file'] = character_file
            results['scenario_file'] = scenario_file
            results['scenario_name'] = scenario['name']
            results['character_name'] = player_character.name
            results['character_tier'] = player_character.tier
            
            if self.verbose:
                self._print_results_summary(results)
            
            return results
            
        except Exception as e:
            error_result = {
                'error': str(e),
                'character_file': character_file,
                'scenario_file': scenario_file,
                'victory_result': 'error'
            }
            
            if self.verbose:
                import traceback
                print(f"Error during simulation: {e}")
                traceback.print_exc()
            
            return error_result
    
    def _load_scenario(self, scenario_file: str) -> Dict[str, Any]:
        """Load and validate scenario data."""
        if not os.path.exists(scenario_file):
            raise FileNotFoundError(f"Scenario file not found: {scenario_file}")
        
        try:
            with open(scenario_file, 'r', encoding='utf-8') as f:
                scenario = json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in scenario file: {e}")
        
        # Validate required fields
        required_fields = ['name', 'enemies']
        for field in required_fields:
            if field not in scenario:
                raise ValueError(f"Scenario missing required field: {field}")
        
        return scenario
    
    def _create_enemies_from_scenario(self, scenario: Dict[str, Any]) -> List[SimulationCharacter]:
        """Create enemy characters from scenario definition."""
        enemies = []
        
        for enemy_data in scenario['enemies']:
            # Create enemy character
            enemy = self.character_loader.create_enemy_character(
                name=enemy_data['name'],
                tier=enemy_data.get('tier', 1),
                archetype=enemy_data.get('archetype', 'balanced')
            )
            
            # Override stats if specified
            if 'stats' in enemy_data:
                stats = enemy_data['stats']
                enemy.accuracy = stats.get('accuracy', enemy.accuracy)
                enemy.damage = stats.get('damage', enemy.damage)
                enemy.defense = stats.get('defense', enemy.defense)
            
            # Set HP if specified
            if 'hp' in enemy_data:
                enemy.max_hp = enemy_data['hp']
                enemy.current_hp = enemy_data['hp']
            
            # Add special attacks if specified
            if 'special_attacks' in enemy_data:
                enemy.special_attacks = enemy_data['special_attacks']
            
            # Set AI personality
            ai_personality = enemy_data.get('ai_personality', 'balanced')
            enemy.ai_personality = ai_personality
            
            enemies.append(enemy)
        
        return enemies
    
    def _print_results_summary(self, results: Dict[str, Any]):
        """Print a formatted summary of simulation results."""
        print("\n" + "="*60)
        print("COMBAT SIMULATION RESULTS")
        print("="*60)
        
        print(f"Character: {results.get('character_name', 'Unknown')}")
        print(f"Scenario: {results.get('scenario_name', 'Unknown')}")
        print(f"Victory: {results.get('victory_result', 'Unknown')}")
        print(f"Rounds: {results.get('rounds_completed', 0)}")
        print(f"Total Damage Dealt: {results.get('total_damage_dealt', 0)}")
        print(f"Total Damage Taken: {results.get('total_damage_taken', 0)}")
        
        # Character final states
        character_states = results.get('character_states', {})
        print("\nFinal Character States:")
        for name, state in character_states.items():
            status = "Alive" if state['is_alive'] else "Defeated"
            hp_info = f"{state['final_hp']}/{state['max_hp']} HP"
            print(f"  {name}: {status} ({hp_info})")
        
        # Combat log summary
        combat_log = results.get('combat_log', [])
        attack_count = len([event for event in combat_log if event['action'].startswith('ATTACK:')])
        print(f"\nCombat Events: {len(combat_log)} total, {attack_count} attacks")
        
        if self.verbose:
            print("\nDetailed Combat Log:")
            for event in combat_log:
                if event['action'].startswith('ATTACK:'):
                    hit_status = "HIT" if event['hit'] else "MISS"
                    print(f"  Round {event['round']}: {event['actor']} -> {event['target']} [{hit_status}] {event['result']}")
    
    def save_results(self, results: Dict[str, Any], output_file: str):
        """Save simulation results to a JSON file."""
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2)
            
            if self.verbose:
                print(f"\nResults saved to: {output_file}")
                
        except Exception as e:
            if self.verbose:
                print(f"Error saving results: {e}")
            raise


def main():
    """Main entry point for the combat simulator."""
    parser = argparse.ArgumentParser(
        description="Vitality Combat Simulator - Run character vs scenario simulations",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python simulation/engine/main.py --character characters/gen/char_001.json --scenario simulation/scenarios/duel.json
  python simulation/engine/main.py -c char.json -s scenario.json --verbose --output results.json
  python simulation/engine/main.py --help
        """
    )
    
    parser.add_argument(
        '--character', '-c',
        required=True,
        help='Path to character JSON file'
    )
    
    parser.add_argument(
        '--scenario', '-s', 
        required=True,
        help='Path to scenario JSON file'
    )
    
    parser.add_argument(
        '--output', '-o',
        help='Output file for simulation results (JSON format)'
    )
    
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose output and detailed logging'
    )
    
    parser.add_argument(
        '--validate-only',
        action='store_true',
        help='Only validate inputs without running simulation'
    )
    
    args = parser.parse_args()
    
    try:
        # Initialize simulator
        simulator = CombatSimulator(verbose=args.verbose)
        
        if args.validate_only:
            # Just validate inputs
            print("Validating character file...")
            character = simulator.character_loader.load_character(args.character)
            print(f"✓ Character: {character.name} (Tier {character.tier})")
            
            print("Validating scenario file...")
            scenario = simulator._load_scenario(args.scenario)
            print(f"✓ Scenario: {scenario['name']} ({len(scenario['enemies'])} enemies)")
            
            print("✓ All inputs valid")
            return
        
        # Run simulation
        results = simulator.run_simulation(args.character, args.scenario)
        
        # Save results if output file specified
        if args.output:
            simulator.save_results(results, args.output)
        
        # Exit with appropriate code
        if results.get('victory_result') == 'error':
            sys.exit(1)
        elif results.get('victory_result') == 'player_victory':
            sys.exit(0)
        else:
            sys.exit(2)  # Enemy victory or draw
            
    except KeyboardInterrupt:
        print("\nSimulation interrupted by user")
        sys.exit(130)
        
    except Exception as e:
        print(f"Error: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()