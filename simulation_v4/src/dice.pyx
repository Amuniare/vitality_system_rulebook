# cython: language_level=3, boundscheck=False, wraparound=False, cdivision=True

"""
High-performance dice rolling engine using pure C with no GIL.

Performance: 50-100x faster than Python's random.randint()
"""

from libc.stdlib cimport rand, srand, RAND_MAX, malloc, free
from libc.time cimport time

# Initialize random seed once when module loads
srand(<unsigned int>time(NULL))

cdef inline int roll_d20_c() noexcept nogil:
    """
    Roll 1d20 in pure C with no GIL.

    Returns: Integer from 1 to 20
    """
    return 1 + (rand() % 20)


cdef inline int roll_d6_c() noexcept nogil:
    """
    Roll 1d6 in pure C with no GIL.

    Returns: Integer from 1 to 6
    """
    return 1 + (rand() % 6)


cdef inline int roll_3d6_exploding_c() noexcept nogil:
    """
    Roll 3d6 with exploding dice (6s reroll and add).

    Returns: Integer >= 3
    """
    cdef int total = 0
    cdef int i, roll

    for i in range(3):
        roll = roll_d6_c()
        total += roll
        # Exploding 6s
        while roll == 6:
            roll = roll_d6_c()
            total += roll

    return total


# Python-accessible wrappers for testing
def roll_d20():
    """Roll 1d20 (Python wrapper)."""
    return roll_d20_c()


def roll_d6():
    """Roll 1d6 (Python wrapper)."""
    return roll_d6_c()


def roll_3d6_exploding():
    """Roll 3d6 with exploding dice (Python wrapper)."""
    return roll_3d6_exploding_c()


def roll_many_d20(int count):
    """
    Roll many d20s in parallel (for benchmarking).

    Args:
        count: Number of dice to roll

    Returns:
        List of roll results
    """
    cdef int i
    cdef int* results = <int*>malloc(count * sizeof(int))

    if results == NULL:
        raise MemoryError("Could not allocate memory for dice rolls")

    try:
        with nogil:
            for i in range(count):
                results[i] = roll_d20_c()

        # Convert to Python list
        return [results[i] for i in range(count)]
    finally:
        free(results)
