"""
Cython build configuration for Simulation V4.

Usage:
    # Development build (fast)
    python setup.py build_ext --inplace

    # With profiling
    python setup.py build_ext --inplace --define CYTHON_TRACE

    # Production build (optimized)
    python setup.py build_ext --inplace --force

    # Clean build artifacts
    python setup.py clean --all
"""

from setuptools import setup, Extension
from Cython.Build import cythonize
import numpy as np
import sys
import os

# Compiler-specific flags
if sys.platform == "win32":
    # Windows with MSVC
    extra_compile_args = ["/O2", "/openmp", "/fp:fast"]
    extra_link_args = ["/openmp"]
elif sys.platform == "darwin":
    # macOS with Clang (OpenMP requires libomp)
    extra_compile_args = ["-O3", "-Xpreprocessor", "-fopenmp", "-march=native"]
    extra_link_args = ["-lomp"]
else:
    # Linux with GCC
    extra_compile_args = ["-O3", "-fopenmp", "-march=native", "-ffast-math"]
    extra_link_args = ["-fopenmp"]

# Define Cython extensions
extensions = [
    Extension(
        name="src.dice",
        sources=["src/dice.pyx"],
        include_dirs=[np.get_include()],
        extra_compile_args=extra_compile_args,
        extra_link_args=extra_link_args,
        language="c",
    ),
    Extension(
        name="src.models",
        sources=["src/models.pyx"],
        include_dirs=[np.get_include()],
        extra_compile_args=extra_compile_args,
        extra_link_args=extra_link_args,
        language="c",
    ),
    Extension(
        name="src.combat_core",
        sources=["src/combat_core.pyx"],
        include_dirs=[np.get_include()],
        extra_compile_args=extra_compile_args,
        extra_link_args=extra_link_args,
        language="c",
    ),
    Extension(
        name="src.scoring",
        sources=["src/scoring.pyx"],
        include_dirs=[np.get_include()],
        extra_compile_args=extra_compile_args,
        extra_link_args=extra_link_args,
        language="c",
    ),
    Extension(
        name="src.simulation",
        sources=["src/simulation.pyx"],
        include_dirs=[np.get_include()],
        extra_compile_args=extra_compile_args,
        extra_link_args=extra_link_args,
        language="c",
    ),
]

# Cythonize with optimization
setup(
    name="simulation_v4",
    version="4.0.0",
    description="High-performance combat simulation with Cython",
    ext_modules=cythonize(
        extensions,
        compiler_directives={
            "language_level": "3",           # Python 3
            "boundscheck": False,            # Disable array bounds checking (FAST)
            "wraparound": False,             # Disable negative indexing (FAST)
            "initializedcheck": False,       # Disable memoryview init checking (FAST)
            "nonecheck": False,              # Disable None checking (FAST)
            "cdivision": True,               # Use C division (FAST)
            "embedsignature": True,          # Embed function signatures in docstrings
            "profile": False,                # Disable profiling (FAST)
            "linetrace": False,              # Disable line tracing (FAST)
            "annotation_typing": True,       # Use annotations for typing
        },
        annotate=True,  # Generate .html files for profiling
    ),
    zip_safe=False,
)

print("\n" + "="*80)
print("BUILD SUCCESSFUL!")
print("="*80)
print("\nTo test the build:")
print("  python -c \"from src.dice import roll_d20; print(f'Roll: {roll_d20()}')\"")
print("\nTo view profiling reports:")
print("  Open the generated .html files in a browser")
print("  Yellow lines = Python overhead (should optimize)")
print("  White lines = Pure C (optimal)")
print("="*80 + "\n")
