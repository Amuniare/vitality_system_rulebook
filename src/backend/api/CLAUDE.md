# `src/backend/api` - The Browser Layer

## 1. Core Purpose

This directory is the **bridge between the Python application and the live Roll20 browser session**. It is the **only** part of the Python codebase that should directly use the `playwright` library.

## 2. Component Responsibilities

*   `connection.py`: Manages starting and connecting to the remote-debugging Chrome instance.
*   `chat_interface.py`: Provides high-level methods for interacting with the Roll20 chat UI (e.g., `send_command`, `wait_for_response`). It abstracts away the specific Playwright selectors and actions.
*   `commands.py`: A helper module for constructing the text strings for API commands.

## 3. Golden Rules

1.  All browser interactions must be funneled through the classes in this directory.
2.  Do not add Roll20-specific business logic here. This layer's job is simply to send and receive messages.
3.  Any new method that involves typing in chat or reading from chat belongs in `chat_interface.py`.