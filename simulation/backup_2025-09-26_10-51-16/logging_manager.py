#!/usr/bin/env python3
"""
Combat Logging Manager
Handles selective and distributed logging for combat simulations
"""

import os
from typing import Dict, List, TextIO, Optional, Any


class LoggingManager:
    """Manages multiple log files and selective logging based on configuration"""

    def __init__(self, config: Any, reports_dir: str = "reports"):
        self.config = config
        self.reports_dir = reports_dir
        # Handle both dict and SimulationConfig object
        if hasattr(config, '__dict__'):
            config_dict = config.__dict__
        else:
            config_dict = config
        self.logging_config = config_dict.get('logging', {})
        self.log_files: Dict[str, TextIO] = {}
        self.build_counter = 0
        self.top_builds_data = []  # Store top builds for later detailed logging

        # Create reports directory if it doesn't exist
        os.makedirs(self.reports_dir, exist_ok=True)
        if self.logging_config.get('generate_individual_build_logs', False):
            os.makedirs(f'{self.reports_dir}/individual_builds', exist_ok=True)

    def __enter__(self):
        self._open_log_files()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self._close_log_files()

    def _open_log_files(self):
        """Open all required log files based on configuration"""
        if self.logging_config.get('separate_files', True):
            # Summary log - always generated
            self.log_files['summary'] = open(f'{self.reports_dir}/summary_combat_log.txt', 'w', encoding='utf-8')
            self._write_header(self.log_files['summary'], "SUMMARY COMBAT LOG")

            # Top builds detailed log
            if self.logging_config.get('log_top_builds_only', True):
                self.log_files['top_builds'] = open(f'{self.reports_dir}/top_builds_combat_log.txt', 'w', encoding='utf-8')
                self._write_header(self.log_files['top_builds'], "TOP BUILDS DETAILED COMBAT LOG")

            # Diagnostic log for mechanics verification
            self.log_files['diagnostic'] = open(f'{self.reports_dir}/diagnostic_combat_log.txt', 'w', encoding='utf-8')
            self._write_header(self.log_files['diagnostic'], "DIAGNOSTIC COMBAT LOG")
        else:
            # Single file mode (legacy)
            self.log_files['main'] = open(f'{self.reports_dir}/combat_log.txt', 'w', encoding='utf-8')
            self._write_header(self.log_files['main'], "VITALITY SYSTEM - COMBAT SIMULATION LOG")

    def _close_log_files(self):
        """Close all open log files"""
        for log_file in self.log_files.values():
            log_file.close()
        self.log_files.clear()

    def _write_header(self, log_file: TextIO, title: str):
        """Write header to log file"""
        log_file.write(f"{title}\n")
        log_file.write("="*80 + "\n\n")

    def should_log_build(self, build_index: int, is_top_build: bool = False) -> bool:
        """Determine if a build should be logged based on configuration"""
        sample_rate = self.logging_config.get('sample_rate', 1)

        # Always log if it's a top build and we're doing top builds logging
        if is_top_build and self.logging_config.get('log_top_builds_only', True):
            return True

        # Check sample rate
        if sample_rate > 1 and (build_index % sample_rate) != 0:
            return False

        return True

    def should_log_scenario(self, scenario_name: str) -> bool:
        """Check if scenario should be logged"""
        scenarios_to_log = self.logging_config.get('scenarios_to_log', ["1x100", "2x50", "4x25"])

        # Extract scenario identifier from name
        for scenario_id in scenarios_to_log:
            if scenario_id in scenario_name:
                return True
        return False

    def log_build_start(self, build_index: int, build: Any, log_type: str = 'summary'):
        """Log the start of a build test"""
        if log_type not in self.log_files:
            return

        log_file = self.log_files[log_type]
        log_file.write(f"\n{'='*60}\n")
        log_file.write(f"Testing Build {build_index + 1}: {build}\n")
        log_file.write(f"{'='*60}\n")

    def log_test_case(self, case_name: str, log_type: str = 'summary'):
        """Log test case header"""
        if log_type not in self.log_files:
            return

        log_file = self.log_files[log_type]
        log_file.write(f"\n--- Test Case: {case_name} ---\n")

    def log_scenario(self, scenario_name: str, scenario_results: Dict[str, Any],
                    log_type: str = 'summary', detailed: bool = False):
        """Log scenario results"""
        if log_type not in self.log_files:
            return

        if not self.should_log_scenario(scenario_name):
            return

        log_file = self.log_files[log_type]
        log_file.write(f"\n  {scenario_name}:\n")

        if detailed and 'verbose_output' in scenario_results:
            log_file.write(scenario_results['verbose_output'])

        if 'batch_results' in scenario_results:
            log_file.write(f"    Batch results: {scenario_results['batch_results']}\n")

        if 'avg_turns' in scenario_results and 'dpt' in scenario_results:
            log_file.write(f"    Average turns: {scenario_results['avg_turns']:.1f}, "
                         f"DPT: {scenario_results['dpt']:.1f}\n")

    def log_case_summary(self, case_avg_dpt: float, log_type: str = 'summary'):
        """Log test case summary"""
        if log_type not in self.log_files:
            return

        log_file = self.log_files[log_type]
        log_file.write(f"\n  Case Average DPT: {case_avg_dpt:.1f}\n")

    def store_build_for_detailed_logging(self, build: Any, avg_dpt: float):
        """Store build data for later detailed logging"""
        self.top_builds_data.append((build, avg_dpt))

    def process_top_builds(self, build_results: List, config: Dict[str, Any]):
        """Process and log top builds with detailed information"""
        if not self.logging_config.get('log_top_builds_only', True):
            return

        if 'top_builds' not in self.log_files:
            return

        top_count = self.logging_config.get('top_builds_for_detailed_log', 50)
        top_builds = build_results[:top_count]

        log_file = self.log_files['top_builds']
        log_file.write(f"\nDetailed logging for top {len(top_builds)} builds:\n")
        log_file.write(f"{'='*80}\n")

        # Re-run detailed simulations for top builds only
        from simulation import simulate_combat_verbose, run_simulation_batch
        from models import Character

        # Build test cases from configuration
        test_cases = []
        for i, att_config in enumerate(config['attacker_configs']):
            for j, def_config in enumerate(config['defender_configs']):
                attacker = Character(*att_config)
                defender = Character(*def_config)
                test_cases.append((f"Att{i+1}_Def{j+1}", attacker, defender))

        for build_idx, (build, avg_dpt) in enumerate(top_builds):
            self.log_build_start(build_idx, build, 'top_builds')

            for case_name, attacker, defender in test_cases:
                self.log_test_case(case_name, 'top_builds')

                fight_scenarios = [
                    ("Fight 1: 1x100 HP Boss", 1, 100),
                    ("Fight 2: 2x50 HP Enemies", 2, 50),
                    ("Fight 3: 4x25 HP Enemies", 4, 25)
                ]

                for scenario_name, num_enemies, enemy_hp in fight_scenarios:
                    if not self.should_log_scenario(scenario_name):
                        continue

                    # Run one detailed simulation
                    verbose_output = []

                    class StringLogger:
                        def __init__(self):
                            self.content = []
                        def write(self, text):
                            self.content.append(text)
                        def flush(self):
                            pass

                    string_logger = StringLogger()
                    turns = simulate_combat_verbose(attacker, build, config['target_hp'],
                                                  string_logger, defender,
                                                  num_enemies=num_enemies, enemy_hp=enemy_hp)

                    # Run batch simulation
                    # Get simulation runs from config structure
                    sim_runs = config.get('simulation_runs', {}).get('individual_testing_runs', 5)
                    results, avg_turns, dpt = run_simulation_batch(
                        attacker, build, sim_runs,
                        config['target_hp'], defender,
                        num_enemies=num_enemies, enemy_hp=enemy_hp)

                    scenario_results = {
                        'verbose_output': ''.join(string_logger.content),
                        'batch_results': results,
                        'avg_turns': avg_turns,
                        'dpt': dpt
                    }

                    self.log_scenario(scenario_name, scenario_results, 'top_builds', detailed=True)

    def log_final_summary(self, build_results: List, config: Dict[str, Any]):
        """Log final summary to all relevant files"""
        summary_count = min(config.get('top_builds_count', 50), len(build_results))

        for log_type, log_file in self.log_files.items():
            log_file.write(f"\n\n{'='*80}\n")
            log_file.write(f"TOP {summary_count} PERFORMING BUILDS\n")
            log_file.write(f"{'='*80}\n")

            for i, (build, avg_dpt) in enumerate(build_results[:summary_count], 1):
                log_file.write(f"{i:2d}. {build} | DPT: {avg_dpt:.1f}\n")

    def generate_individual_build_log(self, build: Any, build_index: int,
                                    build_results: Dict[str, Any]):
        """Generate individual build log file if enabled"""
        if not self.logging_config.get('generate_individual_build_logs', False):
            return

        filename = f"{self.reports_dir}/individual_builds/build_{build_index:04d}.txt"
        with open(filename, 'w', encoding='utf-8') as log_file:
            log_file.write(f"INDIVIDUAL BUILD ANALYSIS\n")
            log_file.write(f"{'='*50}\n\n")
            log_file.write(f"Build: {build}\n")
            log_file.write(f"Average DPT: {build_results.get('avg_dpt', 0):.1f}\n\n")

            # Write detailed results
            for case_name, case_data in build_results.get('cases', {}).items():
                log_file.write(f"Test Case: {case_name}\n")
                log_file.write(f"-" * 30 + "\n")

                for scenario_name, scenario_data in case_data.get('scenarios', {}).items():
                    log_file.write(f"  {scenario_name}:\n")
                    log_file.write(f"    DPT: {scenario_data.get('dpt', 0):.1f}\n")
                    log_file.write(f"    Avg Turns: {scenario_data.get('avg_turns', 0):.1f}\n")

                log_file.write(f"  Case Average DPT: {case_data.get('avg_dpt', 0):.1f}\n\n")