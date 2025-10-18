import random
from collections import Counter
from statistics import mean, median, mode

def roll_d6():
    """Roll a single d6."""
    return random.randint(1, 6)

def roll_standard_3d6():
    """Roll 3d6 with no special rules."""
    return sum(roll_d6() for _ in range(3))

def roll_3d6_explode_on_6():
    """Roll 3d6, exploding on 6s (add result and roll again)."""
    total = 0
    for _ in range(3):
        die = roll_d6()
        total += die
        while die == 6:
            die = roll_d6()
            total += die
    return total

def roll_3d6_explode_on_5_or_6():
    """Roll 3d6, exploding on 5s or 6s (add result and roll again)."""
    total = 0
    for _ in range(3):
        die = roll_d6()
        total += die
        while die >= 5:
            die = roll_d6()
            total += die
    return total

def run_simulation(roll_function, iterations=10000):
    """Run a dice rolling function multiple times and return results."""
    return [roll_function() for _ in range(iterations)]

def calculate_stats(results):
    """Calculate statistics for a list of results."""
    return {
        'mean': mean(results),
        'median': median(results),
        'max': max(results),
        'min': min(results),
        'mode': mode(results)
    }

def print_results(name, results):
    """Print formatted results for a dice rolling scenario."""
    print(f"\n{'='*60}")
    print(f"{name}")
    print(f"{'='*60}")

    # Statistics
    stats = calculate_stats(results)
    print(f"\nStatistics:")
    print(f"  Mean:   {stats['mean']:.2f}")
    print(f"  Median: {stats['median']:.2f}")
    print(f"  Mode:   {stats['mode']}")
    print(f"  Min:    {stats['min']}")
    print(f"  Max:    {stats['max']}")

    # Top 10 results
    counter = Counter(results)
    top_10 = counter.most_common(10)
    print(f"\nTop 10 Most Common Results:")
    print(f"  {'Roll':<8} {'Count':<8} {'Percentage'}")
    print(f"  {'-'*35}")
    for roll_value, count in top_10:
        percentage = (count / len(results)) * 100
        print(f"  {roll_value:<8} {count:<8} {percentage:.2f}%")

def main():
    iterations = 10000000

    print(f"Running {iterations:,} iterations for each scenario...")
    print(f"\n{'*'*60}")
    print(f"DICE ROLLING COMPARISON SIMULATION")
    print(f"{'*'*60}")

    # Scenario 1: Standard 3d6
    results_standard = run_simulation(roll_standard_3d6, iterations)
    print_results("Scenario 1: Standard 3d6", results_standard)

    # Scenario 2: 3d6 exploding on 6
    results_explode_6 = run_simulation(roll_3d6_explode_on_6, iterations)
    print_results("Scenario 2: 3d6 (Explode on 6)", results_explode_6)

    # Scenario 3: 3d6 exploding on 5 or 6
    results_explode_5_6 = run_simulation(roll_3d6_explode_on_5_or_6, iterations)
    print_results("Scenario 3: 3d6 (Explode on 5 or 6)", results_explode_5_6)

    # Summary comparison
    print(f"\n{'='*60}")
    print(f"SUMMARY COMPARISON")
    print(f"{'='*60}")
    print(f"\n{'Scenario':<30} {'Mean':<10} {'Median':<10} {'Max':<10}")
    print(f"{'-'*60}")

    stats_standard = calculate_stats(results_standard)
    stats_explode_6 = calculate_stats(results_explode_6)
    stats_explode_5_6 = calculate_stats(results_explode_5_6)

    print(f"{'Standard 3d6':<30} {stats_standard['mean']:<10.2f} {stats_standard['median']:<10.2f} {stats_standard['max']:<10}")
    print(f"{'3d6 (Explode on 6)':<30} {stats_explode_6['mean']:<10.2f} {stats_explode_6['median']:<10.2f} {stats_explode_6['max']:<10}")
    print(f"{'3d6 (Explode on 5 or 6)':<30} {stats_explode_5_6['mean']:<10.2f} {stats_explode_5_6['median']:<10.2f} {stats_explode_5_6['max']:<10}")

if __name__ == "__main__":
    main()
