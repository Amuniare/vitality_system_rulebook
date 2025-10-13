"""Build combination testing for Simulation V2."""

import gc
import psutil
import os
from dataclasses import dataclass
from datetime import datetime
from typing import List, Tuple
from src.game_data import UPGRADES, LIMITS
from src.models import Character, AttackBuild, MultiAttackBuild
from src.simulation import run_simulation_batch
from src.build_generator import generate_archetype_builds_chunked
from core.config import SimConfigV2


@dataclass
class BuildResult:
    """Result from testing a build combination."""
    build: AttackBuild | MultiAttackBuild
    avg_turns: float
    cost: int
    enhancements: List[str]


class BuildTester:
    """Tests build combinations."""

    def __init__(self, config: SimConfigV2, archetype: str):
        self.config = config
        self.archetype = archetype
        self.attacker = Character(*config.attacker_stats)
        self.defender = Character(*config.defender_stats)
        self.max_points = config.max_points_per_attack(archetype)

    def test_all_builds(self) -> List[Tuple[AttackBuild | MultiAttackBuild, float, float]]:
        """
        Test all valid build combinations.

        Returns list of (build, avg_dpt, avg_turns) tuples for compatibility
        with existing reporting code.
        """
        print(f"\n=== Testing Build Combinations ({self.archetype}) ===")

        # Generate all valid builds
        print(f"  Generating builds (max {self.max_points} points)...")
        builds = list(generate_archetype_builds_chunked(
            self.archetype,
            self.config.tier,
            max_points_per_attack=self.max_points,
            config=self.config
        ))

        print(f"  Found {len(builds)} valid builds")
        print(f"  Testing builds across {len(self.config.scenarios)} scenarios...")

        # Check for GPU batch simulation support
        if self.config.use_gpu:
            try:
                from src.combat_gpu import is_gpu_available
                if is_gpu_available():
                    print(f"  GPU batch simulation: enabled (ALL {len(self.config.scenarios)} scenarios supported)")
            except ImportError:
                pass

        results = []

        # Use progressive elimination if enabled
        if self.config.progressive_elimination.enabled:
            results = self._test_builds_with_progressive_elimination(builds)
        elif self.config.use_threading:
            results = self._test_builds_parallel(builds)
        else:
            results = self._test_builds_sequential(builds)

        print(f"  Completed testing {len(results)} builds")

        return results

    def _test_builds_sequential(self, builds: List) -> List[Tuple]:
        """Test builds sequentially (slower but simpler)."""
        import time

        results = []
        process = psutil.Process(os.getpid())
        start_time = time.time()

        for i, build in enumerate(builds):
            if (i + 1) % 1000 == 0:
                # Calculate time estimates
                elapsed = time.time() - start_time
                builds_done = i + 1

                avg_time_per_build = elapsed / builds_done
                remaining_builds = len(builds) - builds_done
                est_remaining = avg_time_per_build * remaining_builds

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

                # Get current time
                current_time = datetime.now().strftime("%H:%M:%S")

                # Get memory usage
                mem_mb = process.memory_info().rss / 1024 / 1024
                print(f"    Progress: {i + 1}/{len(builds)} builds tested ({time_str}) | Elapsed: {elapsed_str} | Time: {current_time} | Memory: {mem_mb:.1f} MB")

                # Trigger garbage collection every 1000 builds to prevent memory buildup
                gc.collect()

                # Check for excessive memory usage
                if mem_mb > 2048:  # Warn if over 2GB
                    print(f"    WARNING: High memory usage detected ({mem_mb:.1f} MB)")

            avg_turns, avg_dpt = self._test_single_build(build)
            results.append((build, avg_dpt, avg_turns))

        # Final garbage collection
        gc.collect()

        return results

    def _test_builds_parallel(self, builds: List) -> List[Tuple]:
        """Test builds using multiprocessing."""
        from multiprocessing import Pool, cpu_count
        import itertools
        import time
        import pickle
        import tempfile

        # Chunk builds for progress reporting
        chunk_size = self.config.build_chunk_size
        build_chunks = [builds[i:i + chunk_size] for i in range(0, len(builds), chunk_size)]

        print(f"  Using {cpu_count()} CPU cores")
        print(f"  Processing {len(build_chunks)} chunks of {chunk_size} builds")

        # Create temporary file to stream results to disk
        temp_file = tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.pkl')
        temp_path = temp_file.name
        temp_file.close()

        start_time = time.time()
        process = psutil.Process(os.getpid())

        try:
            with Pool(processes=cpu_count()) as pool:
                # Open file in append mode for streaming results
                with open(temp_path, 'wb') as f:
                    for chunk_idx, chunk in enumerate(build_chunks):
                        # Calculate time estimates
                        elapsed = time.time() - start_time
                        chunks_done = chunk_idx

                        if chunks_done > 0:
                            avg_time_per_chunk = elapsed / chunks_done
                            remaining_chunks = len(build_chunks) - chunks_done
                            est_remaining = avg_time_per_chunk * remaining_chunks

                            # Get memory usage
                            mem_mb = process.memory_info().rss / 1024 / 1024

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

                            # Get current time
                            current_time = datetime.now().strftime("%H:%M:%S")

                            print(f"    Processing chunk {chunk_idx + 1}/{len(build_chunks)}... ({time_str}) | Elapsed: {elapsed_str} | Time: {current_time} | Memory: {mem_mb:.1f} MB")

                            # Warn if memory is high
                            if mem_mb > 2048:
                                print(f"    WARNING: High memory usage detected ({mem_mb:.1f} MB)")
                        else:
                            mem_mb = process.memory_info().rss / 1024 / 1024
                            current_time = datetime.now().strftime("%H:%M:%S")
                            print(f"    Processing chunk {chunk_idx + 1}/{len(build_chunks)}... | Time: {current_time} | Memory: {mem_mb:.1f} MB")

                        # Create arguments for parallel processing
                        test_args = [(build, self.attacker, self.defender, self.config) for build in chunk]

                        # Process chunk in parallel
                        chunk_results = pool.starmap(test_single_build_worker, test_args)

                        # Immediately serialize chunk to disk
                        pickle.dump(chunk_results, f)

                        # Clear chunk results from memory
                        del chunk_results
                        del test_args

                        # Trigger garbage collection after each chunk to prevent memory buildup
                        gc.collect()

            # Load all results from disk
            print(f"  Loading results from disk...")
            all_results = []
            with open(temp_path, 'rb') as f:
                try:
                    while True:
                        chunk = pickle.load(f)
                        all_results.extend(chunk)
                except EOFError:
                    pass  # End of file reached

            # Clean up temporary file
            os.unlink(temp_path)

        except Exception as e:
            # Clean up on error
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            raise e

        # Final garbage collection
        gc.collect()

        return all_results

    def _test_builds_with_progressive_elimination(self, builds: List) -> List[Tuple]:
        """
        Test builds using progressive elimination strategy.

        Runs multiple rounds with increasing simulation counts, eliminating
        bottom performers after each round until final testing.
        """
        import time

        current_builds = builds
        process = psutil.Process(os.getpid())

        print(f"\n  Progressive Elimination enabled - {len(self.config.progressive_elimination.rounds)} rounds")

        for round_num, round_config in enumerate(self.config.progressive_elimination.rounds, 1):
            # Determine simulation runs for this round (-1 means use config.simulation_runs)
            sim_runs = (self.config.simulation_runs
                       if round_config.simulation_runs == -1
                       else round_config.simulation_runs)

            keep_percent = round_config.keep_percent
            is_final_round = (round_num == len(self.config.progressive_elimination.rounds))

            print(f"\n  Round {round_num}/{len(self.config.progressive_elimination.rounds)}: "
                  f"Testing {len(current_builds)} builds with {sim_runs} simulation runs...")

            # Test all current builds
            results = []
            start_time = time.time()

            for i, build in enumerate(current_builds):
                if (i + 1) % 500 == 0:
                    elapsed = time.time() - start_time
                    avg_time_per_build = elapsed / (i + 1)
                    remaining_builds = len(current_builds) - (i + 1)
                    est_remaining = avg_time_per_build * remaining_builds

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

                    # Get current time
                    current_time = datetime.now().strftime("%H:%M:%S")

                    mem_mb = process.memory_info().rss / 1024 / 1024
                    print(f"    Progress: {i + 1}/{len(current_builds)} ({time_str}) | Elapsed: {elapsed_str} | Time: {current_time} | Memory: {mem_mb:.1f} MB")

                    if (i + 1) % 1000 == 0:
                        gc.collect()

                avg_turns, avg_dpt = self._test_single_build(build, simulation_runs=sim_runs)
                results.append((build, avg_dpt, avg_turns))

            # Sort by avg_turns (ascending = better)
            results.sort(key=lambda x: x[2])

            if is_final_round:
                # Final round - return all results
                print(f"  Round {round_num} complete - Final results: {len(results)} builds")
                gc.collect()
                return results
            else:
                # Eliminate bottom performers
                keep_count = max(1, int(len(results) * keep_percent))
                eliminated_count = len(results) - keep_count
                eliminated_pct = (eliminated_count / len(results)) * 100

                current_builds = [r[0] for r in results[:keep_count]]

                print(f"  Round {round_num} complete - Eliminated {eliminated_count} builds "
                      f"({eliminated_pct:.1f}%) → {len(current_builds)} remaining")
                print(f"    Best avg turns: {results[0][2]:.2f}, Worst kept: {results[keep_count-1][2]:.2f}")

                # Clear old results to free memory
                del results
                gc.collect()

        # Should not reach here, but return empty if something goes wrong
        return []

    def _test_single_build(self, build, simulation_runs: int = None) -> Tuple[float, float]:
        """
        Test a single build across all scenarios.

        Args:
            build: Build to test
            simulation_runs: Number of simulation runs (None = use config.simulation_runs)

        Returns:
            Tuple of (avg_turns, avg_dpt)
        """
        if simulation_runs is None:
            simulation_runs = self.config.simulation_runs

        all_turns = []
        all_dpt = []

        # Use GPU acceleration if enabled and available
        if self.config.use_gpu:
            try:
                from src.combat_gpu import run_simulation_batch_gpu, is_gpu_available
                use_gpu_batch = is_gpu_available()
            except ImportError:
                use_gpu_batch = False
        else:
            use_gpu_batch = False

        for scenario in self.config.scenarios:
            # GPU batch simulation now works for ALL scenarios!
            if use_gpu_batch:
                # Use GPU-accelerated batch simulation
                from src.combat_gpu import run_simulation_batch_gpu
                results, avg_turns, dpt, win_rate = run_simulation_batch_gpu(
                    self.attacker,
                    build,
                    simulation_runs,
                    100,
                    self.defender,
                    num_enemies=scenario.num_enemies,
                    enemy_hp=scenario.enemy_hp,
                    enemy_hp_list=scenario.enemy_hp_list
                )
            elif scenario.enemy_hp_list:
                # Multi-enemy scenario - use CPU
                results, avg_turns, dpt, win_rate = run_simulation_batch(
                    self.attacker,
                    build,
                    simulation_runs,
                    100,
                    self.defender,
                    enemy_hp_list=scenario.enemy_hp_list
                )
            else:
                # Standard scenario - use CPU
                results, avg_turns, dpt, win_rate = run_simulation_batch(
                    self.attacker,
                    build,
                    simulation_runs,
                    100,
                    self.defender,
                    num_enemies=scenario.num_enemies,
                    enemy_hp=scenario.enemy_hp
                )

            all_turns.append(avg_turns)
            all_dpt.append(dpt)

        # Average across scenarios
        avg_turns = sum(all_turns) / len(all_turns)
        avg_dpt = sum(all_dpt) / len(all_dpt)

        return avg_turns, avg_dpt


def test_single_build_worker(build, attacker, defender, config):
    """
    Worker function for parallel build testing.
    Must be a module-level function for multiprocessing to work.
    """
    all_turns = []
    all_dpt = []

    # Check for GPU support
    if config.use_gpu:
        try:
            from src.combat_gpu import run_simulation_batch_gpu, is_gpu_available
            use_gpu_batch = is_gpu_available()
        except ImportError:
            use_gpu_batch = False
    else:
        use_gpu_batch = False

    for scenario in config.scenarios:
        # GPU now works for ALL scenarios!
        if use_gpu_batch:
            from src.combat_gpu import run_simulation_batch_gpu
            results, avg_turns, dpt, win_rate = run_simulation_batch_gpu(
                attacker,
                build,
                config.simulation_runs,
                100,
                defender,
                num_enemies=scenario.num_enemies,
                enemy_hp=scenario.enemy_hp,
                enemy_hp_list=scenario.enemy_hp_list
            )
        elif scenario.enemy_hp_list:
            results, avg_turns, dpt, win_rate = run_simulation_batch(
                attacker,
                build,
                config.simulation_runs,
                100,
                defender,
                enemy_hp_list=scenario.enemy_hp_list
            )
        else:
            results, avg_turns, dpt, win_rate = run_simulation_batch(
                attacker,
                build,
                config.simulation_runs,
                100,
                defender,
                num_enemies=scenario.num_enemies,
                enemy_hp=scenario.enemy_hp
            )

        all_turns.append(avg_turns)
        all_dpt.append(dpt)

    # Average across scenarios
    avg_turns = sum(all_turns) / len(all_turns)
    avg_dpt = sum(all_dpt) / len(all_dpt)

    return (build, avg_dpt, avg_turns)
