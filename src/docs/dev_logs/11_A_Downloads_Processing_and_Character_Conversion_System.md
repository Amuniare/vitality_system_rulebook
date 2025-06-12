# Phase 11-A: Downloads Processing and Character Conversion System

## Objective
To create an automated system that can process character data downloaded from the Roll20 campaign (likely in a raw HTML or unstructured format) and convert it into the standardized, clean JSON format defined in characters/schema/. This system acts as the critical bridge between the external data source and the local character builder.

## System Components
-   **Extractor:** A module responsible for parsing the raw downloaded files and extracting key-value pairs of character attributes and abilities.
-   **Mapper:** A module that maps the extracted raw attribute names (e.g., 'strength_total') to the standardized names used in the application's JSON schema (e.g., 'attributes.power').
-   **Converter/Updater:** A component that takes the mapped data and creates or updates a VitalityCharacter object, saving it as a clean .json file.

## Outcome
-   Successfully implemented a Python-based pipeline in src/character/.
-   The system can now reliably process downloaded character data, handle format discrepancies, and convert it into the structured format required by the web character builder and other tools.
-   **Result:** The foundation for a two-way synchronization system with Roll20 is now in place.
