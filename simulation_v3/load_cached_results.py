"""
Load cached Stage 2 results from temp directory and generate reports.

This script processes existing result files from a previous Stage 2 run
without re-running the simulations.
"""

import os
import sys
import json
import pickle
import gc
import psutil
from glob import glob

# Add parent simulation directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'simulation_v2'))

from stage2_pairing import Stage2Config


def load_results_streaming(result_dir, top_n=5000):
    """
    Load results from cached pickle files using streaming to minimize memory.

    Args:
        result_dir: Directory containing result pickle files
        top_n: Number of top results to keep

    Returns:
        List of top N results sorted by overall_avg
    """
    print(f"\n=== Loading Cached Results ===")
    print(f"  Result directory: {result_dir}")

    # Find all result files
    result_files = sorted(glob(os.path.join(result_dir, 'results_*.pkl')))
    print(f"  Found {len(result_files)} result files")

    if not result_files:
        raise ValueError(f"No result files found in {result_dir}")

    print(f"  Using streaming mode - keeping only top {top_n} results")

    top_results = []
    total_processed = 0
    process_mem = psutil.Process(os.getpid())

    for idx, result_file in enumerate(result_files, 1):
        # Load file
        mem_before = process_mem.memory_info().rss / 1024 / 1024

        with open(result_file, 'rb') as f:
            file_results = pickle.load(f)

        mem_after = process_mem.memory_info().rss / 1024 / 1024
        file_count = len(file_results)

        # Process each result
        for result in file_results:
            total_processed += 1
            result_avg = result['overall_avg']

            if len(top_results) < top_n:
                # Still building up initial top-N
                top_results.append(result)
                if len(top_results) == top_n:
                    # Sort when we reach top_n for the first time
                    top_results.sort(key=lambda r: r['overall_avg'])
            else:
                # Check if this result is better than worst in top-N
                if result_avg < top_results[-1]['overall_avg']:
                    # Replace worst result
                    top_results[-1] = result
                    # Re-sort
                    top_results.sort(key=lambda r: r['overall_avg'])

        # Aggressively free memory
        del file_results
        gc.collect()

        mem_after_gc = process_mem.memory_info().rss / 1024 / 1024

        print(f"    File {idx}/{len(result_files)}: Processed {file_count:,} results | "
              f"Loaded +{mem_after - mem_before:.0f}MB, freed -{mem_after - mem_after_gc:.0f}MB | "
              f"Total: {total_processed:,} processed, {len(top_results):,} kept | "
              f"Memory: {mem_after_gc:.0f}MB")

    final_mem = process_mem.memory_info().rss / 1024 / 1024
    print(f"\n  [OK] Processed {total_processed:,} total results")
    print(f"  [OK] Kept top {len(top_results):,} results")
    print(f"  [OK] Final memory usage: {final_mem:.0f}MB")

    return top_results


def generate_reports(results, config, output_dir):
    """Generate all Stage 2 reports."""
    print(f"\n=== Generating Stage 2 Reports ===")
    os.makedirs(output_dir, exist_ok=True)

    # Import report generators
    from stage2_pairing import generate_stage2_report
    from enhancement_ranking_report import generate_enhancement_ranking_reports
    from enhancement_saturation_report import generate_enhancement_saturation_reports
    from top_1000_pairs_report import generate_top_1000_pairs_report
    from pair_cost_analysis_report import generate_pair_cost_analysis_report
    from synergy_analysis_report import generate_synergy_analysis_report

    # Main pairing report (top 50 pairs with details)
    report_path = os.path.join(output_dir, 'stage2_pairing_report.md')
    generate_stage2_report(results, config, report_path)

    # Enhancement ranking reports (5 tiers)
    generate_enhancement_ranking_reports(results, config, output_dir)

    # Enhancement saturation reports (5 tiers)
    generate_enhancement_saturation_reports(results, config, output_dir)

    # Top 1000 pairs list
    top_1000_path = os.path.join(output_dir, 'top_1000_pairs.md')
    generate_top_1000_pairs_report(results, top_1000_path)

    # Cost analysis
    cost_analysis_path = os.path.join(output_dir, 'pair_cost_analysis.md')
    generate_pair_cost_analysis_report(results, cost_analysis_path)

    # Synergy analysis
    synergy_path = os.path.join(output_dir, 'synergy_analysis.md')
    generate_synergy_analysis_report(results, config, synergy_path)

    print(f"\n=== Reports Complete ===")
    print(f"  All reports saved to: {output_dir}")
    print(f"  Main report: {report_path}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Load cached Stage 2 results and generate reports')
    parser.add_argument('--result-dir', required=True, help='Directory containing cached result files')
    parser.add_argument('--config', default='config.json', help='Config file path')
    parser.add_argument('--output-dir', default=None, help='Output directory for reports')
    args = parser.parse_args()

    # Load configuration
    config = Stage2Config(args.config)

    # Load results
    results = load_results_streaming(args.result_dir, top_n=5000)

    # Set output directory
    if args.output_dir:
        output_dir = args.output_dir
    else:
        output_dir = os.path.join(os.path.dirname(__file__), 'reports', 'stage2')

    # Generate reports
    generate_reports(results, config, output_dir)

    print(f"\n[COMPLETE] Reports available at: {output_dir}")
