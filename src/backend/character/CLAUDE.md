# `src/backend/character` - The Business Logic Layer

## 1. Core Purpose

This directory contains the core business logic for handling character data. Code here is responsible for **processing, transforming, and managing character JSON objects**. This layer should be completely **browser-agnostic**. It should not know or care how the data is sent to or received from Roll20.

## 2. Component Responsibilities

*   `updater.py`: The main orchestrator for the character upload/sync process. It uses other components to perform a full update.
*   `api_extractor.py`: The legacy system for extracting characters *from* Roll20.
*   `differ.py`: A utility for deep-comparing two character JSON objects to find specific changes. (Currently maintenance-only).
*   `mapper.py`: Handles the transformation of character data from one format to another (e.g., web builder format to Roll20 flat format).

## 3. Golden Rules

1.  **No Playwright:** Never import or use `playwright` in this directory.
2.  **Data In, Data Out:** Functions and methods in this layer should take character data as input and return modified character data as output. They do not perform I/O or API calls.
3.  The `updater.py` is the primary entry point for any character synchronization task.