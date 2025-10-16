"""
Stage 1: Attack Pruning for Simulation V3

Generates all possible attacks, tests them across all defensive profiles,
and keeps only the top 20% overall + top 10% specialists per profile.
"""

import sys
import os
import json
import time
import psutil
import multiprocessing
import gc
import heapq
import pickle
import tempfile
from datetime import datetime
from typing import List, Dict, Tuple
from collections import defaultdict
import statistics

# Add parent simulation directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'simulation_v2'))

from src.models import Character, AttackBuild
from src.build_generator import generate_valid_builds_chunked
from combat_with_buffs import BuffConfig, run_simulation_batch_with_buffs
from enhancement_report import generate_enhancement_report
from cost_analysis_report import generate_cost_analysis_report
from combat_logger import generate_top_attack_logs


# Worker function for multiprocessing (must be at module level)
def _test_attack_worker(args):
    """Worker function for parallel attack testing."""
    attack, config_dict = args

    # Reconstruct config objects in worker process
    from combat_with_buffs import BuffConfig
    from src.models import Character

    result = AttackTestResult(attack)
    attacker = Character(*config_dict['attacker_stats'])

    for profile in config_dict['defensive_profiles']:
        defender = Character(*profile['stats'])

        for buff_config_dict in config_dict['buff_configs']:
            buff_config = BuffConfig.from_dict(buff_config_dict)

            for scenario in config_dict['scenarios']:
                _, avg_turns, _, _ = run_simulation_batch_with_buffs(
                    attacker=attacker,
                    defender=defender,
                    build=attack,
                    buff_config=buff_config,
                    num_runs=config_dict['simulation_runs'],
                    num_enemies=scenario.get('num_enemies', 1),
                    enemy_hp=scenario.get('enemy_hp', 100),
                    enemy_hp_list=scenario.get('enemy_hp_list'),
                    max_turns=100
                )

                result.add_result(
                    profile['name'],
                    buff_config.name,
                    scenario['name'],
                    avg_turns
                )

    result.calculate_aggregates()
    return result


class Stage1Config:
    """Configuration for Stage 1 pruning."""

    def __init__(self, config_path: str = None):
        if config_path is None:
            config_path = os.path.join(os.path.dirname(__file__), 'config.json')

        with open(config_path, 'r') as f:
            data = json.load(f)

        self.tier = data['tier']
        self.archetype = data['archetype']
        self.points_per_attack = data['points_per_attack']

        # Stage 1 settings
        stage1 = data['stage1']
        self.simulation_runs = stage1['simulation_runs']
        self.top_percent = stage1['top_percent']
        self.specialist_percent = stage1.get('specialist_percent', 0.10)

        # Pruning strategy: "overall_only", "enhancement_based", or "hybrid"
        self.pruning_strategy = stage1.get('pruning_strategy', 'overall_only')
        self.enhancement_percent = stage1.get('enhancement_percent', 0.01)

        # Performance settings
        perf = data.get('performance', {})
        self.use_threading = perf.get('use_threading', False)
        self.num_workers = perf.get('num_workers', 0)  # 0 = auto (CPU count)
        self.chunk_size = perf.get('chunk_size', 500)

        # Character config
        self.attacker_stats = data['character_config']['attacker']

        # Defensive profiles
        self.defensive_profiles = []
        for profile in data['defensive_profiles']:
            self.defensive_profiles.append({
                'name': profile['name'],
                'stats': profile['stats'],
                'description': profile['description']
            })

        # Buff configurations
        self.buff_configs = []
        for buff in data['buff_configurations']:
            self.buff_configs.append(BuffConfig.from_dict(buff))

        # Scenarios
        self.scenarios = data['scenarios']


class AttackTestResult:
    """Results from testing a single attack across all profiles."""

    def __init__(self, build: AttackBuild):
        self.build = build
        self.results = {}  # (profile_name, buff_name, scenario_name) -> avg_turns
        self.overall_avg = 0.0
        self.profile_avgs = {}  # profile_name -> avg_turns
        self.buff_avgs = {}  # buff_name -> avg_turns
        self.scenario_avgs = {}  # scenario_name -> avg_turns
        self.specialization_variance = 0.0  # Measure of specialization

    def add_result(self, profile_name: str, buff_name: str, scenario_name: str, avg_turns: float):
        """Add a test result for a specific configuration."""
        self.results[(profile_name, buff_name, scenario_name)] = avg_turns

    def calculate_aggregates(self):
        """Calculate aggregate statistics from individual results."""
        if not self.results:
            return

        # Overall average
        all_turns = list(self.results.values())
        self.overall_avg = statistics.mean(all_turns)

        # Per-profile averages
        profile_results = defaultdict(list)
        for (profile, buff, scenario), turns in self.results.items():
            profile_results[profile].append(turns)

        for profile, turns_list in profile_results.items():
            self.profile_avgs[profile] = statistics.mean(turns_list)

        # Per-buff averages
        buff_results = defaultdict(list)
        for (profile, buff, scenario), turns in self.results.items():
            buff_results[buff].append(turns)

        for buff, turns_list in buff_results.items():
            self.buff_avgs[buff] = statistics.mean(turns_list)

        # Per-scenario averages
        scenario_results = defaultdict(list)
        for (profile, buff, scenario), turns in self.results.items():
            scenario_results[scenario].append(turns)

        for scenario, turns_list in scenario_results.items():
            self.scenario_avgs[scenario] = statistics.mean(turns_list)

        # Specialization variance (higher = more specialized)
        if len(self.profile_avgs) > 1:
            profile_avg_values = list(self.profile_avgs.values())
            self.specialization_variance = statistics.variance(profile_avg_values)
        else:
            self.specialization_variance = 0.0


def generate_all_attacks(config: Stage1Config) -> List[AttackBuild]:
    """
    Generate all valid attack builds for the configured points budget.

    Args:
        config: Stage 1 configuration

    Returns:
        List of all valid AttackBuild objects
    """
    print(f"\n=== Generating Attacks ===")
    print(f"  Points per attack: {config.points_per_attack}")

    attacks = list(generate_valid_builds_chunked(
        max_points=config.points_per_attack,
        attack_types=None,  # All attack types
        chunk_size=10000
    ))

    print(f"  Generated {len(attacks):,} valid attacks")
    return attacks


def test_attack_across_profiles(
    attack: AttackBuild,
    config: Stage1Config
) -> AttackTestResult:
    """
    Test a single attack across all defensive profiles, buff configs, and scenarios.

    Args:
        attack: AttackBuild to test
        config: Stage 1 configuration

    Returns:
        AttackTestResult with all test data
    """
    result = AttackTestResult(attack)
    attacker = Character(*config.attacker_stats)

    # Test across all combinations
    for profile in config.defensive_profiles:
        defender = Character(*profile['stats'])

        for buff_config in config.buff_configs:
            for scenario in config.scenarios:
                # Run simulation
                _, avg_turns, _, _ = run_simulation_batch_with_buffs(
                    attacker=attacker,
                    defender=defender,
                    build=attack,
                    buff_config=buff_config,
                    num_runs=config.simulation_runs,
                    num_enemies=scenario.get('num_enemies', 1),
                    enemy_hp=scenario.get('enemy_hp', 100),
                    enemy_hp_list=scenario.get('enemy_hp_list'),
                    max_turns=100
                )

                result.add_result(
                    profile['name'],
                    buff_config.name,
                    scenario['name'],
                    avg_turns
                )

    # Calculate aggregate statistics
    result.calculate_aggregates()
    return result


def test_all_attacks_parallel(
    attacks: List[AttackBuild],
    config: Stage1Config
) -> List[AttackTestResult]:
    """
    Test all attacks in parallel using multiprocessing.

    Includes garbage collection hints and improved time estimation.

    Args:
        attacks: List of AttackBuilds to test
        config: Stage 1 configuration

    Returns:
        List of AttackTestResult objects
    """
    print(f"\n=== Testing Attacks (Parallel Mode) ===")
    total_tests = len(attacks) * len(config.defensive_profiles) * len(config.buff_configs) * len(config.scenarios)
    print(f"  Total test cases: {total_tests:,}")
    print(f"  Simulation runs per test: {config.simulation_runs}")

    # Determine number of workers
    num_workers = config.num_workers if config.num_workers > 0 else multiprocessing.cpu_count()
    print(f"  Using {num_workers} worker processes")

    # Prepare config dict for workers (must be picklable)
    config_dict = {
        'attacker_stats': config.attacker_stats,
        'defensive_profiles': config.defensive_profiles,
        'buff_configs': [bc.__dict__ for bc in config.buff_configs],
        'scenarios': config.scenarios,
        'simulation_runs': config.simulation_runs,
    }

    # Prepare work items
    work_items = [(attack, config_dict) for attack in attacks]

    # Process in chunks for progress tracking
    # Use disk-based storage to avoid memory accumulation
    temp_dir = tempfile.mkdtemp(prefix='stage1_results_')
    result_files = []
    results_buffer = []
    disk_dump_interval = 20  # Write to disk every 20 chunks

    start_time = time.time()
    process = psutil.Process(os.getpid())
    chunk_times = []  # Track recent chunk processing times for better estimates

    print(f"  Using disk-based storage: {temp_dir}")
    print(f"  Memory dump interval: every {disk_dump_interval} chunks")

    with multiprocessing.Pool(processes=num_workers) as pool:
        chunk_size = config.chunk_size
        for chunk_idx, i in enumerate(range(0, len(work_items), chunk_size)):
            chunk_start = time.time()
            chunk = work_items[i:i + chunk_size]
            chunk_results = pool.map(_test_attack_worker, chunk)
            results_buffer.extend(chunk_results)

            # Free chunk memory
            del chunk_results

            # Periodically dump results to disk and free memory
            if (chunk_idx + 1) % disk_dump_interval == 0:
                # Write buffer to disk
                result_file = os.path.join(temp_dir, f'results_{chunk_idx + 1}.pkl')
                with open(result_file, 'wb') as f:
                    pickle.dump(results_buffer, f)
                result_files.append(result_file)

                # Clear buffer and force garbage collection
                results_buffer = []
                gc.collect()

            # Track chunk processing time
            chunk_time = time.time() - chunk_start
            chunk_times.append(chunk_time)
            if len(chunk_times) > 10:  # Keep last 10 chunks only
                chunk_times.pop(0)

            # Progress reporting
            attacks_done = min(i + chunk_size, len(attacks))
            elapsed = time.time() - start_time

            # Use recent chunk times for better time estimate
            if len(chunk_times) >= 3:
                # Average of recent chunks
                avg_chunk_time = sum(chunk_times) / len(chunk_times)
                remaining_chunks = (len(attacks) - attacks_done) / chunk_size
                est_remaining = avg_chunk_time * remaining_chunks
            else:
                # Fallback to overall average for first few chunks
                avg_time_per_attack = elapsed / attacks_done
                remaining_attacks = len(attacks) - attacks_done
                est_remaining = avg_time_per_attack * remaining_attacks

            # Format time
            if est_remaining < 60:
                time_str = f"~{int(est_remaining)}s remaining"
            else:
                mins = int(est_remaining / 60)
                secs = int(est_remaining % 60)
                time_str = f"~{mins}m {secs}s remaining"

            # Format elapsed time
            elapsed_mins = int(elapsed / 60)
            elapsed_secs = int(elapsed % 60)
            elapsed_str = f"{elapsed_mins}m {elapsed_secs}s"

            # Get memory usage
            mem_mb = process.memory_info().rss / 1024 / 1024

            # Get current time
            current_time = datetime.now().strftime("%H:%M:%S")

            print(f"  Tested {attacks_done}/{len(attacks)} ({attacks_done / len(attacks) * 100:.1f}%) | "
                  f"{time_str} | Elapsed: {elapsed_str} | Time: {current_time} | Memory: {mem_mb:.1f} MB")

    # Write any remaining results in buffer
    if results_buffer:
        result_file = os.path.join(temp_dir, f'results_final.pkl')
        with open(result_file, 'wb') as f:
            pickle.dump(results_buffer, f)
        result_files.append(result_file)
        results_buffer = []
        gc.collect()

    # Load all results back from disk
    print(f"\n  Loading results from disk ({len(result_files)} files)...")
    all_results = []
    for idx, result_file in enumerate(result_files, 1):
        with open(result_file, 'rb') as f:
            file_results = pickle.load(f)
            all_results.extend(file_results)

        if idx % 10 == 0:
            print(f"    Loaded {idx}/{len(result_files)} files ({len(all_results):,} results so far)")

    print(f"  Loaded {len(all_results):,} total results from disk")

    # Clean up temporary files
    print(f"  Cleaning up temporary files...")
    for result_file in result_files:
        try:
            os.remove(result_file)
        except:
            pass
    try:
        os.rmdir(temp_dir)
    except:
        pass

    return all_results


def test_all_attacks(
    attacks: List[AttackBuild],
    config: Stage1Config
) -> List[AttackTestResult]:
    """
    Test all attacks across all profiles and return results.

    Args:
        attacks: List of AttackBuilds to test
        config: Stage 1 configuration

    Returns:
        List of AttackTestResult objects
    """
    # Use parallel or sequential based on config
    if config.use_threading:
        return test_all_attacks_parallel(attacks, config)

    print(f"\n=== Testing Attacks (Sequential Mode) ===")
    total_tests = len(attacks) * len(config.defensive_profiles) * len(config.buff_configs) * len(config.scenarios)
    print(f"  Total test cases: {total_tests:,}")
    print(f"  Simulation runs per test: {config.simulation_runs}")

    results = []
    start_time = time.time()
    process = psutil.Process(os.getpid())

    for i, attack in enumerate(attacks):
        if (i + 1) % 100 == 0 or (i + 1) == len(attacks):
            # Calculate time estimates
            elapsed = time.time() - start_time
            attacks_done = i + 1

            avg_time_per_attack = elapsed / attacks_done
            remaining_attacks = len(attacks) - attacks_done
            est_remaining = avg_time_per_attack * remaining_attacks

            # Format time
            if est_remaining < 60:
                time_str = f"~{int(est_remaining)}s remaining"
            else:
                mins = int(est_remaining / 60)
                secs = int(est_remaining % 60)
                time_str = f"~{mins}m {secs}s remaining"

            # Format elapsed time
            elapsed_mins = int(elapsed / 60)
            elapsed_secs = int(elapsed % 60)
            elapsed_str = f"{elapsed_mins}m {elapsed_secs}s"

            # Get memory usage
            mem_mb = process.memory_info().rss / 1024 / 1024

            # Get current time
            current_time = datetime.now().strftime("%H:%M:%S")

            print(f"  Testing attack {i + 1}/{len(attacks)} ({(i + 1) / len(attacks) * 100:.1f}%) | "
                  f"{time_str} | Elapsed: {elapsed_str} | Time: {current_time} | Memory: {mem_mb:.1f} MB")

        result = test_attack_across_profiles(attack, config)
        results.append(result)

    return results


def prune_attacks(
    results: List[AttackTestResult],
    config: Stage1Config
) -> Tuple[List[AttackTestResult], Dict]:
    """
    Prune attacks using configured strategy: overall_only, enhancement_based, or hybrid.

    Args:
        results: List of test results
        config: Stage 1 configuration

    Returns:
        Tuple of (pruned_results, stats_dict)
    """
    from src.game_data import UPGRADES, LIMITS

    print(f"\n=== Pruning Attacks ===")
    print(f"  Pruning strategy: {config.pruning_strategy}")

    # Sort by overall average
    sorted_results = sorted(results, key=lambda r: r.overall_avg)

    keep_attacks = set()
    enhancement_stats = {}

    # Strategy 1: Keep top N% overall (always done unless enhancement_based only)
    if config.pruning_strategy in ['overall_only', 'hybrid']:
        overall_cutoff_count = max(1, int(len(sorted_results) * config.top_percent))
        overall_cutoff_value = sorted_results[overall_cutoff_count - 1].overall_avg
        keep_attacks.update(sorted_results[:overall_cutoff_count])
        print(f"  Top {config.top_percent * 100:.0f}% overall: {overall_cutoff_count} attacks (≤{overall_cutoff_value:.2f} avg turns)")

    # Strategy 2: Keep top specialists per profile (always done unless enhancement_based only)
    if config.pruning_strategy in ['overall_only', 'hybrid']:
        for profile in config.defensive_profiles:
            profile_name = profile['name']

            # Sort by performance on this profile
            profile_sorted = sorted(results, key=lambda r: r.profile_avgs.get(profile_name, float('inf')))

            # Keep top N% for this profile
            profile_cutoff_count = max(1, int(len(profile_sorted) * config.specialist_percent))
            profile_cutoff_value = profile_sorted[profile_cutoff_count - 1].profile_avgs.get(profile_name, 0)

            profile_specialists = set(profile_sorted[:profile_cutoff_count])
            keep_attacks.update(profile_specialists)

            print(f"  Top {config.specialist_percent * 100:.0f}% vs {profile_name}: {profile_cutoff_count} attacks (≤{profile_cutoff_value:.2f} avg turns)")

    # Strategy 3: Keep top N% per enhancement
    if config.pruning_strategy in ['enhancement_based', 'hybrid']:
        print(f"  Enhancement-based pruning enabled (top {config.enhancement_percent * 100:.0f}% per enhancement)")

        # Group results by enhancement
        enhancement_groups = defaultdict(list)

        for result in results:
            # Track by upgrades
            for upgrade in result.build.upgrades:
                enhancement_groups[upgrade].append(result)

            # Track by limits
            for limit in result.build.limits:
                enhancement_groups[limit].append(result)

        # Keep top N% for each enhancement
        for enhancement_name, enhancement_results in enhancement_groups.items():
            # Sort by overall performance
            enhancement_sorted = sorted(enhancement_results, key=lambda r: r.overall_avg)

            # Keep top N%
            enhancement_cutoff_count = max(1, int(len(enhancement_sorted) * config.enhancement_percent))
            enhancement_cutoff_value = enhancement_sorted[enhancement_cutoff_count - 1].overall_avg

            enhancement_top = set(enhancement_sorted[:enhancement_cutoff_count])
            keep_attacks.update(enhancement_top)

            enhancement_stats[enhancement_name] = {
                'total': len(enhancement_results),
                'kept': enhancement_cutoff_count,
                'cutoff_value': enhancement_cutoff_value
            }

        print(f"  Enhancement pruning: {len(enhancement_stats)} enhancements analyzed")
        print(f"  Total attacks kept from enhancement pruning: {sum(s['kept'] for s in enhancement_stats.values())}")

    # Convert back to list and sort by overall performance
    pruned_results = sorted(list(keep_attacks), key=lambda r: r.overall_avg)

    print(f"  Total unique attacks kept: {len(pruned_results)} ({len(pruned_results) / len(results) * 100:.1f}%)")

    # Calculate pruning statistics
    stats = {
        'total_tested': len(results),
        'total_kept': len(pruned_results),
        'percent_kept': len(pruned_results) / len(results) * 100,
        'pruning_strategy': config.pruning_strategy,
        'enhancement_stats': enhancement_stats if enhancement_stats else None
    }

    # Add overall cutoff stats if applicable
    if config.pruning_strategy in ['overall_only', 'hybrid']:
        overall_cutoff_count = max(1, int(len(sorted_results) * config.top_percent))
        overall_cutoff_value = sorted_results[overall_cutoff_count - 1].overall_avg
        stats['overall_cutoff_count'] = overall_cutoff_count
        stats['overall_cutoff_value'] = overall_cutoff_value

        # Profile cutoff stats
        stats['profile_cutoffs'] = {}
        for profile in config.defensive_profiles:
            profile_name = profile['name']
            profile_sorted = sorted(results, key=lambda r: r.profile_avgs.get(profile_name, float('inf')))
            profile_cutoff_count = max(1, int(len(profile_sorted) * config.specialist_percent))
            profile_cutoff_value = profile_sorted[profile_cutoff_count - 1].profile_avgs.get(profile_name, 0)

            stats['profile_cutoffs'][profile_name] = {
                'count': profile_cutoff_count,
                'cutoff_value': profile_cutoff_value
            }

    return pruned_results, stats


def save_pruned_attacks(
    results: List[AttackTestResult],
    output_path: str
):
    """
    Save pruned attacks to JSON file for Stage 2.

    Args:
        results: List of pruned test results
        output_path: Path to output JSON file
    """
    print(f"\n=== Saving Pruned Attacks ===")
    print(f"  Output file: {output_path}")

    data = []
    for result in results:
        build_data = {
            'attack_type': result.build.attack_type,
            'upgrades': result.build.upgrades,
            'limits': result.build.limits,
            'cost': result.build.total_cost,
            'overall_avg': result.overall_avg,
            'profile_avgs': result.profile_avgs,
            'buff_avgs': result.buff_avgs,
            'scenario_avgs': result.scenario_avgs,
            'specialization_variance': result.specialization_variance
        }
        data.append(build_data)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    print(f"  Saved {len(data)} attacks")


def generate_stage1_report(
    results: List[AttackTestResult],
    pruned_results: List[AttackTestResult],
    pruning_stats: Dict,
    config: Stage1Config,
    output_path: str
):
    """
    Generate Stage 1 markdown report.

    Args:
        results: All test results
        pruned_results: Pruned test results
        pruning_stats: Statistics from pruning
        config: Stage 1 configuration
        output_path: Path to output markdown file
    """
    print(f"\n=== Generating Stage 1 Report ===")
    print(f"  Output file: {output_path}")

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("# Simulation V3 - Stage 1: Attack Pruning Results\n\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

        # Summary
        f.write("## Summary\n\n")
        f.write(f"- **Total attacks tested**: {pruning_stats['total_tested']:,}\n")
        f.write(f"- **Attacks kept**: {pruning_stats['total_kept']:,} ({pruning_stats['percent_kept']:.1f}%)\n")
        f.write(f"- **Pruning strategy**: {pruning_stats['pruning_strategy']}\n")
        if pruning_stats.get('overall_cutoff_value'):
            f.write(f"- **Overall cutoff**: ≤{pruning_stats['overall_cutoff_value']:.2f} avg turns\n")
        f.write(f"- **Test configuration**:\n")
        f.write(f"  - Defensive profiles: {len(config.defensive_profiles)}\n")
        f.write(f"  - Buff configurations: {len(config.buff_configs)}\n")
        f.write(f"  - Scenarios: {len(config.scenarios)}\n")
        f.write(f"  - Tests per attack: {len(config.defensive_profiles) * len(config.buff_configs) * len(config.scenarios)}\n")
        f.write(f"  - Simulation runs: {config.simulation_runs}\n\n")

        # Enhancement-based pruning stats if applicable
        if pruning_stats.get('enhancement_stats'):
            f.write("### Enhancement-Based Pruning\n\n")
            f.write(f"- **Total enhancements analyzed**: {len(pruning_stats['enhancement_stats'])}\n")
            f.write(f"- **Top {config.enhancement_percent * 100:.0f}% kept per enhancement**\n\n")

            enh_stats = pruning_stats['enhancement_stats']
            f.write("**Top 10 most represented enhancements:**\n\n")
            top_enhancements = sorted(enh_stats.items(), key=lambda x: x[1]['total'], reverse=True)[:10]
            for enh_name, enh_data in top_enhancements:
                f.write(f"- `{enh_name}`: {enh_data['total']} total attacks, {enh_data['kept']} kept (cutoff: ≤{enh_data['cutoff_value']:.2f} turns)\n")
            f.write("\n")

        # Overall top performers
        f.write("## Top 50 Attacks Overall\n\n")
        f.write("| Rank | Attack | Cost | Avg Turns | vs Balanced | vs Evasive | vs Tanky | vs Elite | Specialization |\n")
        f.write("|------|--------|------|-----------|-------------|------------|----------|----------|----------------|\n")

        for i, result in enumerate(pruned_results[:50], 1):
            build = result.build
            attack_desc = build.attack_type
            if build.upgrades:
                attack_desc += " + " + ", ".join(build.upgrades[:2])
                if len(build.upgrades) > 2:
                    attack_desc += "..."
            if build.limits:
                attack_desc += f" [{build.limits[0]}]"

            f.write(f"| {i} | {attack_desc} | {build.total_cost}p | {result.overall_avg:.2f} | ")

            for profile in config.defensive_profiles:
                profile_avg = result.profile_avgs.get(profile['name'], 0)
                f.write(f"{profile_avg:.2f} | ")

            # Specialization indicator
            if result.specialization_variance < 0.5:
                spec = "Generalist"
            elif result.specialization_variance < 2.0:
                spec = "Balanced"
            else:
                spec = "Specialist"
            f.write(f"{spec} |\n")

        # Performance by defensive profile
        f.write("\n## Performance by Defensive Profile\n\n")

        for profile in config.defensive_profiles:
            profile_name = profile['name']
            f.write(f"### vs {profile_name} Enemies\n\n")
            f.write(f"*{profile['description']}*\n\n")

            # Sort by this profile's performance
            profile_sorted = sorted(pruned_results, key=lambda r: r.profile_avgs.get(profile_name, float('inf')))

            f.write("| Rank | Attack | Cost | Avg Turns | Overall Avg | Δ |\n")
            f.write("|------|--------|------|-----------|-------------|---|\n")

            for i, result in enumerate(profile_sorted[:20], 1):
                build = result.build
                attack_desc = build.attack_type
                if build.upgrades:
                    attack_desc += " + " + ", ".join(build.upgrades[:2])

                profile_avg = result.profile_avgs.get(profile_name, 0)
                delta = result.overall_avg - profile_avg

                f.write(f"| {i} | {attack_desc} | {build.total_cost}p | {profile_avg:.2f} | ")
                f.write(f"{result.overall_avg:.2f} | {delta:+.2f} |\n")

            f.write("\n")

        # Performance by buff configuration
        f.write("## Performance by Buff Configuration\n\n")

        for buff_config in config.buff_configs:
            buff_name = buff_config.name
            f.write(f"### {buff_name}\n\n")
            f.write(f"*{buff_config.description}*\n\n")

            # Calculate median for this buff config
            buff_avgs = [r.buff_avgs.get(buff_name, 0) for r in results]
            median_buff = statistics.median(buff_avgs)

            # Sort by this buff's performance
            buff_sorted = sorted(pruned_results, key=lambda r: r.buff_avgs.get(buff_name, float('inf')))

            f.write("| Rank | Attack | Cost | Avg Turns | vs Median | Overall Avg |\n")
            f.write("|------|--------|------|-----------|-----------|-------------|\n")

            for i, result in enumerate(buff_sorted[:15], 1):
                build = result.build
                attack_desc = build.attack_type
                if build.upgrades:
                    attack_desc += " + " + ", ".join(build.upgrades[:2])

                buff_avg = result.buff_avgs.get(buff_name, 0)
                vs_median = buff_avg - median_buff

                f.write(f"| {i} | {attack_desc} | {build.total_cost}p | {buff_avg:.2f} | ")
                f.write(f"{vs_median:+.2f} | {result.overall_avg:.2f} |\n")

            f.write("\n")

    print(f"  Report generated with {len(pruned_results)} pruned attacks")


def run_stage1(config_path: str = None, reports_base_dir: str = None):
    """
    Run Stage 1: Attack generation, testing, and pruning.

    Args:
        config_path: Path to configuration file (optional)
        reports_base_dir: Base directory for reports (optional, uses timestamped folder if provided)
    """
    # Load configuration
    config = Stage1Config(config_path)

    # Create output directory
    if reports_base_dir:
        output_dir = os.path.join(reports_base_dir, 'stage1')
    else:
        output_dir = os.path.join(os.path.dirname(__file__), 'reports', 'stage1')
    os.makedirs(output_dir, exist_ok=True)

    # Generate attacks
    attacks = generate_all_attacks(config)

    # Test attacks
    results = test_all_attacks(attacks, config)

    # Prune attacks
    pruned_results, pruning_stats = prune_attacks(results, config)

    # Save pruned attacks for Stage 2
    cache_path = os.path.join(os.path.dirname(__file__), 'cache', 'pruned_attacks.json')
    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    save_pruned_attacks(pruned_results, cache_path)

    # Generate report
    report_path = os.path.join(output_dir, 'stage1_pruning_report.md')
    generate_stage1_report(results, pruned_results, pruning_stats, config, report_path)

    # Generate enhancement saturation report
    enhancement_report_path = os.path.join(output_dir, 'enhancement_saturation_report.md')
    generate_enhancement_report(pruned_results, config.top_percent, enhancement_report_path)

    # Generate cost analysis report
    cost_report_path = os.path.join(output_dir, 'cost_analysis_report.md')
    generate_cost_analysis_report(pruned_results, cost_report_path)

    # Generate top 50 attack combat logs
    combat_logs_dir = os.path.join(output_dir, 'combat_logs')
    generate_top_attack_logs(
        pruned_results=pruned_results,
        attacker_stats=config.attacker_stats,
        defensive_profiles=config.defensive_profiles,
        scenarios=config.scenarios,
        output_dir=combat_logs_dir,
        top_n=50
    )

    print(f"\n=== Stage 1 Complete ===")
    print(f"  Pruned attacks saved to: {cache_path}")
    print(f"  Pruning report saved to: {report_path}")
    print(f"  Enhancement report saved to: {enhancement_report_path}")
    print(f"  Cost analysis report saved to: {cost_report_path}")
    print(f"  Combat logs saved to: {combat_logs_dir}")

    return pruned_results, pruning_stats


if __name__ == "__main__":
    import sys
    config_path = sys.argv[1] if len(sys.argv) > 1 else None
    run_stage1(config_path)
