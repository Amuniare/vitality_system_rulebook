"""
Reporting module for the Vitality System combat simulator.

This package contains modules for generating various types of analysis reports
for combat simulation results.
"""

from src.reporting.config import (
    load_config,
    save_config,
    print_configuration_report,
    print_simulation_stats_receipt,
    create_timestamped_reports_directory,
)
from src.reporting.tables import TableGenerator
from src.reporting.individual import IndividualReportGenerator
from src.reporting.builds import BuildReportGenerator
from src.reporting.writers import (
    write_upgrade_performance_report,
    write_combo_performance_report,
    build_turns_table,
    write_builds_turns_table,
    write_build_summary,
    write_attack_type_enhancement_ranking_report,
    write_attack_type_limit_ranking_report,
    write_upgrade_limit_frequency_report,
)
from src.reporting.generators import (
    generate_combo_performance_report,
    generate_upgrade_performance_report,
    generate_upgrade_ranking_report,
    generate_upgrade_pairing_report,
    generate_diagnostic_base_attacks_report,
    generate_diagnostic_upgrades_report,
    generate_diagnostic_limits_report,
    generate_scenario_breakdown_report,
    generate_diagnostic_report,
    generate_individual_report,
    enhancement_comparison,
    generate_reports_by_mode,
)
from src.reporting.cost_analysis import (
    generate_individual_cost_analysis,
    generate_build_cost_analysis,
)

__all__ = [
    # Classes
    'TableGenerator',
    'IndividualReportGenerator',
    'BuildReportGenerator',
    # Config functions
    'load_config',
    'save_config',
    'print_configuration_report',
    'print_simulation_stats_receipt',
    'create_timestamped_reports_directory',
    # Writer functions
    'write_upgrade_performance_report',
    'write_combo_performance_report',
    'build_turns_table',
    'write_builds_turns_table',
    'write_build_summary',
    'write_attack_type_enhancement_ranking_report',
    'write_attack_type_limit_ranking_report',
    'write_upgrade_limit_frequency_report',
    # Generator functions
    'generate_combo_performance_report',
    'generate_upgrade_performance_report',
    'generate_upgrade_ranking_report',
    'generate_upgrade_pairing_report',
    'generate_diagnostic_base_attacks_report',
    'generate_diagnostic_upgrades_report',
    'generate_diagnostic_limits_report',
    'generate_scenario_breakdown_report',
    'generate_diagnostic_report',
    'generate_individual_report',
    'enhancement_comparison',
    'generate_reports_by_mode',
    # Cost analysis functions
    'generate_individual_cost_analysis',
    'generate_build_cost_analysis',
]