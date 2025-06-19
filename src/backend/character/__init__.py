# Only import modules without heavy dependencies for testing
from .mapper import CharacterMapper

# Heavy dependency imports only when needed
def get_character_extractor():
    from .api_extractor import CharacterExtractor
    return CharacterExtractor

def get_character_updater():
    from .updater import CharacterUpdater
    return CharacterUpdater

def get_character_differ():
    from .differ import CharacterDiffer
    return CharacterDiffer