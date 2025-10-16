# cython: language_level=3

"""
Cython header file for dice module.
Exports C functions for use by other modules.
"""

# Declare C functions that can be imported by other .pyx files
# noexcept means these functions never raise Python exceptions
cdef int roll_d20_c() noexcept nogil
cdef int roll_d6_c() noexcept nogil
cdef int roll_3d6_exploding_c() noexcept nogil
