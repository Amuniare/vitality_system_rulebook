"""
GPU-accelerated combat simulation using PyTorch with DirectML.

This module provides GPU acceleration for the most computationally expensive parts:
- Batch dice rolling (d20 and 3d6 exploding)
- Batch damage calculations
- Parallel simulation runs

Falls back to CPU if GPU is unavailable.
"""

import torch
from typing import List, Tuple, Optional
import warnings

# Global GPU state
_gpu_available = False
_device = None


def initialize_gpu() -> bool:
    """
    Initialize GPU acceleration with DirectML.

    Returns:
        True if GPU is available and initialized, False otherwise
    """
    global _gpu_available, _device

    try:
        # Try to import torch_directml for AMD/Intel GPU support on Windows
        import torch_directml
        _device = torch_directml.device()
        _gpu_available = True
        print(f"GPU acceleration enabled: DirectML device detected")
        return True
    except ImportError:
        # Fall back to CUDA if available (NVIDIA)
        if torch.cuda.is_available():
            _device = torch.device('cuda')
            _gpu_available = True
            print(f"GPU acceleration enabled: CUDA device detected ({torch.cuda.get_device_name(0)})")
            return True
        else:
            _device = torch.device('cpu')
            _gpu_available = False
            warnings.warn("GPU acceleration unavailable - install torch-directml for AMD/Intel or CUDA for NVIDIA")
            return False
    except Exception as e:
        _device = torch.device('cpu')
        _gpu_available = False
        warnings.warn(f"GPU initialization failed: {e}")
        return False


def is_gpu_available() -> bool:
    """Check if GPU acceleration is available."""
    return _gpu_available


def get_device() -> torch.device:
    """Get the current compute device (GPU or CPU)."""
    if _device is None:
        initialize_gpu()
    return _device


def generate_d20_rolls_gpu(num_rolls: int) -> torch.Tensor:
    """
    Generate random d20 rolls on GPU.

    Args:
        num_rolls: Number of d20 rolls to generate

    Returns:
        Tensor of shape (num_rolls,) with values 1-20
    """
    device = get_device()
    # Generate uniform random values [0, 1) and scale to [1, 21), then floor to get [1, 20]
    rolls = torch.floor(torch.rand(num_rolls, device=device) * 20) + 1
    return rolls.long()


def generate_d6_rolls_gpu(num_rolls: int) -> torch.Tensor:
    """
    Generate random d6 rolls on GPU.

    Args:
        num_rolls: Number of d6 rolls to generate

    Returns:
        Tensor of shape (num_rolls,) with values 1-6
    """
    device = get_device()
    rolls = torch.floor(torch.rand(num_rolls, device=device) * 6) + 1
    return rolls.long()


def roll_3d6_exploding_gpu(batch_size: int, max_explosions: int = 10) -> Tuple[torch.Tensor, int]:
    """
    Roll 3d6 with exploding 6s in batches on GPU.

    This is a simplified vectorized version that handles explosions differently:
    Instead of simulating each die individually, we:
    1. Roll 3d6 for the batch
    2. Count how many 6s were rolled
    3. Roll additional dice for explosions (up to max_explosions)
    4. Sum everything together

    Args:
        batch_size: Number of 3d6 rolls to generate
        max_explosions: Maximum number of explosion rounds (prevents infinite loops)

    Returns:
        Tuple of (total_rolls, num_exploded) where:
            - total_rolls: Tensor of shape (batch_size,) with damage values
            - num_exploded: Total number of explosions that occurred
    """
    device = get_device()

    # Initial 3d6 rolls
    rolls = torch.zeros(batch_size, device=device, dtype=torch.long)

    # Roll initial 3 dice per batch
    initial_dice = generate_d6_rolls_gpu(batch_size * 3).reshape(batch_size, 3)
    rolls += initial_dice.sum(dim=1)

    # Track which dice need to explode (value == 6)
    sixes_mask = (initial_dice == 6)
    num_sixes = sixes_mask.sum(dim=1)  # How many 6s per roll

    total_explosions = 0

    # Explode up to max_explosions times
    for explosion_round in range(max_explosions):
        if num_sixes.sum() == 0:
            break  # No more explosions

        # Roll additional dice for each 6
        total_sixes_this_round = num_sixes.sum().item()
        if total_sixes_this_round == 0:
            break

        total_explosions += total_sixes_this_round

        # Roll new dice for explosions
        explosion_dice = generate_d6_rolls_gpu(total_sixes_this_round)

        # Add explosion results back to original rolls
        # This is a simplified approach: we distribute explosion dice across rolls
        explosion_idx = 0
        for i in range(batch_size):
            for _ in range(num_sixes[i].item()):
                if explosion_idx < len(explosion_dice):
                    rolls[i] += explosion_dice[explosion_idx]
                    explosion_idx += 1

        # Check for new 6s in explosion dice
        new_sixes_mask = (explosion_dice == 6)

        # Count new 6s per original roll (simplified)
        num_sixes = torch.zeros(batch_size, device=device, dtype=torch.long)
        explosion_idx = 0
        for i in range(batch_size):
            for _ in range(sixes_mask[i].sum().item()):
                if explosion_idx < len(new_sixes_mask):
                    if new_sixes_mask[explosion_idx]:
                        num_sixes[i] += 1
                    explosion_idx += 1

    return rolls, total_explosions


def roll_3d6_exploding_5_6_gpu(batch_size: int, max_explosions: int = 10) -> Tuple[torch.Tensor, int]:
    """
    Roll 3d6 with exploding 5s and 6s in batches on GPU.

    Similar to roll_3d6_exploding_gpu but explosions trigger on 5 or 6.

    Args:
        batch_size: Number of 3d6 rolls to generate
        max_explosions: Maximum number of explosion rounds

    Returns:
        Tuple of (total_rolls, num_exploded)
    """
    device = get_device()

    rolls = torch.zeros(batch_size, device=device, dtype=torch.long)

    # Initial 3d6 rolls
    initial_dice = generate_d6_rolls_gpu(batch_size * 3).reshape(batch_size, 3)
    rolls += initial_dice.sum(dim=1)

    # Track which dice need to explode (value >= 5)
    explode_mask = (initial_dice >= 5)
    num_exploded = explode_mask.sum(dim=1)

    total_explosions = 0

    for explosion_round in range(max_explosions):
        if num_exploded.sum() == 0:
            break

        total_exploded_this_round = num_exploded.sum().item()
        if total_exploded_this_round == 0:
            break

        total_explosions += total_exploded_this_round

        # Roll new dice for explosions
        explosion_dice = generate_d6_rolls_gpu(total_exploded_this_round)

        # Add explosion results
        explosion_idx = 0
        for i in range(batch_size):
            for _ in range(num_exploded[i].item()):
                if explosion_idx < len(explosion_dice):
                    rolls[i] += explosion_dice[explosion_idx]
                    explosion_idx += 1

        # Check for new explosions (5 or 6)
        new_explode_mask = (explosion_dice >= 5)

        # Count new explosions per roll
        num_exploded = torch.zeros(batch_size, device=device, dtype=torch.long)
        explosion_idx = 0
        for i in range(batch_size):
            for _ in range(explode_mask[i].sum().item()):
                if explosion_idx < len(new_explode_mask):
                    if new_explode_mask[explosion_idx]:
                        num_exploded[i] += 1
                    explosion_idx += 1

    return rolls, total_explosions


def calculate_damage_batch_gpu(
    dice_rolls: torch.Tensor,
    flat_bonuses: torch.Tensor,
    durability: int,
    use_brutal: bool = False,
    brutal_threshold: int = 20
) -> torch.Tensor:
    """
    Calculate damage for a batch of attacks on GPU.

    Args:
        dice_rolls: Tensor of shape (batch_size,) with damage dice values
        flat_bonuses: Tensor of shape (batch_size,) with flat damage bonuses
        durability: Enemy durability value to subtract
        use_brutal: Whether to apply brutal mechanic
        brutal_threshold: Threshold for brutal bonus (damage - durability - threshold) * 0.5
                         Should be set to 5 × attacker tier (e.g., 20 for tier 4)

    Returns:
        Tensor of shape (batch_size,) with final damage values
    """
    device = get_device()

    # Total damage before durability
    total_damage = dice_rolls + flat_bonuses

    # Apply durability reduction
    damage_after_durability = torch.clamp(total_damage - durability, min=0)

    # Apply brutal if enabled
    if use_brutal:
        brutal_bonus = torch.clamp(
            ((total_damage - durability - brutal_threshold) * 0.5).long(),
            min=0
        )
        damage_after_durability += brutal_bonus

    return damage_after_durability


def generate_dice_cache_gpu(cache_size: int = 100000) -> Tuple[List[int], List[int]]:
    """
    Generate large dice caches on GPU and transfer to CPU for use in combat module.

    This is much faster than generating dice on CPU, especially for large caches.

    Args:
        cache_size: Number of dice rolls to pre-generate

    Returns:
        Tuple of (d20_cache, d6_cache) as Python lists
    """
    if not is_gpu_available():
        # Fall back to CPU generation
        import random
        d20_cache = [random.randint(1, 20) for _ in range(cache_size)]
        d6_cache = [random.randint(1, 6) for _ in range(cache_size)]
        return d20_cache, d6_cache

    # Generate on GPU
    d20_rolls = generate_d20_rolls_gpu(cache_size)
    d6_rolls = generate_d6_rolls_gpu(cache_size)

    # Transfer to CPU and convert to Python lists
    d20_cache = d20_rolls.cpu().tolist()
    d6_cache = d6_rolls.cpu().tolist()

    return d20_cache, d6_cache


def simulate_combat_batch_gpu(
    attacker_stats: List[int],
    defender_stats: List[int],
    build_params: dict,
    num_runs: int,
    enemy_hp: int = 100,
    max_turns: int = 100,
    num_enemies: int = 1,
    enemy_hp_list: List[int] = None
) -> Tuple[torch.Tensor, dict]:
    """
    Run multiple combat simulations in parallel on GPU.

    Now supports multi-enemy scenarios using padded tensors!

    This is a simplified GPU-accelerated combat simulation that runs multiple
    independent combats in parallel. It makes simplifying assumptions to enable
    GPU vectorization:

    - Fixed number of turns per simulation (max_turns)
    - Simplified combat mechanics (no complex conditionals)
    - Basic hit/damage calculation only
    - No bleed, charges, or complex limit tracking
    - Multi-enemy support via padded tensors (NEW!)

    For full-featured combat, use CPU simulation. This GPU version is optimized
    for rapid build testing where approximate results are sufficient.

    Args:
        attacker_stats: [focus, power, mobility, endurance, tier]
        defender_stats: [focus, power, mobility, endurance, tier]
        build_params: Dict with 'accuracy_mod', 'damage_mod', 'damage_penalty', etc.
        num_runs: Number of simulations to run in parallel
        enemy_hp: Enemy starting HP (for homogeneous groups)
        max_turns: Maximum turns before timeout
        num_enemies: Number of enemies (for homogeneous groups)
        enemy_hp_list: List of enemy HP values (for heterogeneous groups)

    Returns:
        Tuple of (turns_to_kill, outcome_stats) where:
            - turns_to_kill: Tensor of shape (num_runs,) with turns taken
            - outcome_stats: Dict with win/loss/timeout counts
    """
    device = get_device()

    # Parse attacker stats
    focus, power, mobility, endurance, tier = attacker_stats
    base_accuracy = tier + focus
    base_damage_bonus = tier + power
    avoidance = tier + defender_stats[2]  # defender mobility
    durability = tier + defender_stats[3]  # defender endurance

    # Extract build parameters
    accuracy_mod = build_params.get('accuracy_mod', 0) * tier
    damage_mod = build_params.get('damage_mod', 0) * tier
    damage_penalty = build_params.get('damage_penalty', 0) * tier
    is_direct = build_params.get('is_direct', False)
    is_aoe = build_params.get('is_aoe', False)

    # Determine enemy configuration
    if enemy_hp_list is not None:
        # Heterogeneous enemy group (different HP values)
        actual_num_enemies = len(enemy_hp_list)
        enemy_hp_values = enemy_hp_list
    else:
        # Homogeneous enemy group (all same HP)
        actual_num_enemies = num_enemies
        enemy_hp_values = [enemy_hp] * num_enemies

    # Create padded tensor for all enemies across all runs
    # Shape: (num_runs, max_enemies) where max_enemies = actual_num_enemies
    max_enemies = actual_num_enemies
    enemy_hp_tensor = torch.zeros((num_runs, max_enemies), device=device, dtype=torch.long)

    # Initialize each run with the same enemy HP configuration
    for run_idx in range(num_runs):
        for enemy_idx, hp in enumerate(enemy_hp_values):
            enemy_hp_tensor[run_idx, enemy_idx] = hp

    # Track which enemies are alive
    enemies_alive = enemy_hp_tensor > 0  # Shape: (num_runs, max_enemies)

    turns_taken = torch.zeros(num_runs, device=device, dtype=torch.long)
    combat_active = torch.ones(num_runs, device=device, dtype=torch.bool)

    # Run combat turns
    for turn in range(1, max_turns + 1):
        if not combat_active.any():
            break  # All combats finished

        num_active_combats = combat_active.sum().item()
        if num_active_combats == 0:
            break

        if is_aoe:
            # AOE attack - hit all alive enemies in each combat
            for run_idx in torch.where(combat_active)[0]:
                alive_mask = enemies_alive[run_idx]
                num_alive = alive_mask.sum().item()

                if num_alive == 0:
                    combat_active[run_idx] = False
                    continue

                # Roll damage once for AOE (shared across all targets)
                if not is_direct:
                    accuracy_roll = generate_d20_rolls_gpu(1)[0]
                    total_accuracy = accuracy_roll + base_accuracy + accuracy_mod
                    hit = total_accuracy >= avoidance
                else:
                    hit = True

                if hit:
                    damage_roll, _ = roll_3d6_exploding_gpu(1)
                    flat_bonus = base_damage_bonus + damage_mod - damage_penalty
                    total_damage = damage_roll[0] + flat_bonus
                    final_damage = max(0, total_damage - durability)

                    # Apply same damage to all alive enemies
                    enemy_hp_tensor[run_idx, alive_mask] -= final_damage
                    enemies_alive[run_idx] = enemy_hp_tensor[run_idx] > 0

                turns_taken[run_idx] = turn

        else:
            # Single-target attack - target first alive enemy
            for run_idx in torch.where(combat_active)[0]:
                alive_mask = enemies_alive[run_idx]
                num_alive = alive_mask.sum().item()

                if num_alive == 0:
                    combat_active[run_idx] = False
                    continue

                # Find first alive enemy
                target_idx = torch.where(alive_mask)[0][0]

                # Roll attack
                if not is_direct:
                    accuracy_roll = generate_d20_rolls_gpu(1)[0]
                    total_accuracy = accuracy_roll + base_accuracy + accuracy_mod
                    hit = total_accuracy >= avoidance
                else:
                    hit = True

                if hit:
                    damage_roll, _ = roll_3d6_exploding_gpu(1)
                    flat_bonus = base_damage_bonus + damage_mod - damage_penalty
                    total_damage = damage_roll[0] + flat_bonus
                    final_damage = max(0, total_damage - durability)

                    # Apply damage to target
                    enemy_hp_tensor[run_idx, target_idx] -= final_damage
                    enemies_alive[run_idx, target_idx] = enemy_hp_tensor[run_idx, target_idx] > 0

                turns_taken[run_idx] = turn

        # Update combat active status (combat ends when all enemies dead)
        combat_active = enemies_alive.any(dim=1)

    # Calculate outcome statistics
    wins = (~enemies_alive.any(dim=1)).sum().item()  # All enemies dead
    timeouts = enemies_alive.any(dim=1).sum().item()  # Some enemies still alive

    outcome_stats = {
        "wins": wins,
        "losses": 0,  # Simplified version doesn't track attacker death
        "timeouts": timeouts,
        "win_rate": (wins / num_runs * 100) if num_runs > 0 else 0
    }

    return turns_taken, outcome_stats


def run_simulation_batch_gpu(
    attacker,
    build,
    num_runs: int,
    target_hp: int = 100,
    defender = None,
    num_enemies: int = 1,
    enemy_hp: int = None,
    enemy_hp_list: List[int] = None,
    archetype: str = None
) -> Tuple[List[int], float, float, dict]:
    """
    GPU-accelerated version of run_simulation_batch.

    Simplified combat simulation that runs on GPU for speed. Makes some
    simplifying assumptions:
    - ✅ Multi-enemy support (NEW!)
    - ✅ AOE and single-target attacks
    - ❌ No bleed, charges, or complex limits
    - ❌ Basic hit/damage only

    For full combat features, use CPU version.

    Args:
        attacker: Character object
        build: AttackBuild object
        num_runs: Number of simulation runs
        target_hp: Target enemy HP (default 100)
        defender: Defender Character object
        num_enemies: Number of enemies
        enemy_hp: Enemy HP (overrides target_hp)
        enemy_hp_list: List of enemy HP values for mixed groups

    Returns:
        Tuple of (individual_results, average_turns, damage_per_turn, outcome_stats)
    """
    if not is_gpu_available():
        # Fall back to CPU version
        from src.simulation import run_simulation_batch
        return run_simulation_batch(
            attacker, build, num_runs, target_hp, defender,
            num_enemies=num_enemies, enemy_hp=enemy_hp,
            max_turns=100, enemy_hp_list=enemy_hp_list, archetype=archetype
        )

    # Check if build is MultiAttackBuild - GPU doesn't support this yet
    from src.models import MultiAttackBuild
    if isinstance(build, MultiAttackBuild):
        # Fall back to CPU version for MultiAttackBuild
        from src.simulation import run_simulation_batch
        return run_simulation_batch(
            attacker, build, num_runs, target_hp, defender,
            num_enemies=num_enemies, enemy_hp=enemy_hp,
            max_turns=100, enemy_hp_list=enemy_hp_list, archetype=archetype
        )

    # GPU now supports multi-enemy scenarios!
    # (Removed restriction - all scenarios can use GPU)

    # Use provided defender or create default
    if defender is None:
        from src.models import Character
        defender = Character(focus=0, power=0, mobility=3, endurance=0, tier=attacker.tier)

    # Use enemy_hp if provided, otherwise target_hp
    actual_enemy_hp = enemy_hp if enemy_hp is not None else target_hp

    # Extract build parameters for GPU
    from src.game_data import ATTACK_TYPES
    attack_type = ATTACK_TYPES[build.attack_type]

    build_params = {
        'accuracy_mod': attack_type.accuracy_mod,
        'damage_mod': attack_type.damage_mod,
        'damage_penalty': 0,
        'is_direct': attack_type.is_direct,
        'is_aoe': build.attack_type in ['area', 'direct_area_damage']
    }

    # Add upgrade modifiers
    from src.game_data import UPGRADES
    for upgrade_name in build.upgrades:
        upgrade = UPGRADES[upgrade_name]
        build_params['accuracy_mod'] += upgrade.accuracy_mod
        build_params['damage_mod'] += upgrade.damage_mod
        build_params['damage_penalty'] += upgrade.damage_penalty

    # Add limit bonuses
    from src.game_data import LIMITS
    for limit_name in build.limits:
        limit = LIMITS[limit_name]
        build_params['damage_mod'] += limit.damage_bonus

    # Run GPU batch simulation
    attacker_stats = [attacker.focus, attacker.power, attacker.mobility, attacker.endurance, attacker.tier]
    defender_stats = [defender.focus, defender.power, defender.mobility, defender.endurance, defender.tier]

    # Calculate total HP for DPT
    if enemy_hp_list:
        total_hp = sum(enemy_hp_list)
    else:
        total_hp = actual_enemy_hp * num_enemies

    turns_tensor, outcome_stats = simulate_combat_batch_gpu(
        attacker_stats,
        defender_stats,
        build_params,
        num_runs,
        actual_enemy_hp,
        max_turns=100,
        num_enemies=num_enemies,
        enemy_hp_list=enemy_hp_list
    )

    # Convert results to CPU and return in expected format
    results = turns_tensor.cpu().tolist()
    avg_turns = sum(results) / num_runs if num_runs > 0 else 0
    dpt = total_hp / avg_turns if avg_turns > 0 else 0

    return results, avg_turns, dpt, outcome_stats


# Initialize GPU on module import
initialize_gpu()
