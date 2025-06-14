# `src/roll20_api` - The Server-Side JavaScript Layer

## 1. Core Purpose

This directory contains the **JavaScript code that runs inside the Roll20 API Sandbox**. This is server-side code executed by Roll20's environment.

## 2. Component Responsibilities

*   `CharacterExtractor.js`: The all-in-one custom API script. It listens for commands sent via the chat (`on('chat:message')`) and uses the official Roll20 API object model (`findObjs`, `createObj`, `getObj`, etc.) to manipulate character sheets.

## 3. Golden Rules

1.  **This is JavaScript, not Python.** All code must be valid JS for the Roll20 sandbox environment.
2.  **The Chat is the API:** All communication with the Python backend is done by sending formatted messages to the chat via `sendChat` and receiving commands via the `on('chat:message', ...)` handler.
3.  This is the **only** place where the official Roll20 API functions should be called.
4.  Be mindful of asynchronous operations (e.g., `handout.get('notes', function(notes) { ... })`).