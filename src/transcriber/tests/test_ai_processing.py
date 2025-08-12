"""
Test Suite for AI Processing Pipeline
Tests the AI-enhanced session processing components
"""

import unittest
import json
import tempfile
import os
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from ..ai.ai_pipeline import (
    AIProcessor, CleanupProcessor, TimelineProcessor, 
    NotesProcessor, SummaryProcessor, AIPipeline
)


class TestAIProcessor(unittest.TestCase):
    """Test the base AIProcessor class"""
    
    def setUp(self):
        """Set up test environment"""
        self.test_dir = tempfile.mkdtemp()
        self.test_path = Path(self.test_dir)
        
        # Create test configuration files
        self.campaign_context = {
            "campaign_info": {
                "name": "Test Campaign",
                "setting": "Test Setting 2030"
            },
            "player_characters": {
                "active": [
                    {
                        "name": "Test Character",
                        "codename": "TestHero",
                        "powers": "Test powers"
                    }
                ]
            }
        }
        
        self.templates = {
            "cleanup_processor": {
                "system_prompt": "Test system prompt",
                "user_prompt_template": "Test template: {raw_transcript}"
            }
        }
        
        # Write test files
        with open(self.test_path / "campaign_context.json", 'w') as f:
            json.dump(self.campaign_context, f)
            
        with open(self.test_path / "processing_templates.json", 'w') as f:
            json.dump(self.templates, f)
    
    def tearDown(self):
        """Clean up test environment"""
        import shutil
        shutil.rmtree(self.test_dir)
    
    def test_load_campaign_context(self):
        """Test campaign context loading"""
        processor = AIProcessor(self.test_dir, api_key="test_key")
        self.assertEqual(processor.campaign_context["campaign_info"]["name"], "Test Campaign")
    
    def test_load_templates(self):
        """Test template loading"""
        processor = AIProcessor(self.test_dir, api_key="test_key")
        self.assertIn("cleanup_processor", processor.templates)
    
    def test_format_character_info(self):
        """Test character information formatting"""
        processor = AIProcessor(self.test_dir, api_key="test_key")
        char_info = processor._format_character_info()
        self.assertIn("Test Character", char_info)
        self.assertIn("TestHero", char_info)
    
    def test_missing_config_files(self):
        """Test behavior with missing configuration files"""
        empty_dir = tempfile.mkdtemp()
        try:
            processor = AIProcessor(empty_dir, api_key="test_key")
            self.assertEqual(processor.campaign_context, {})
            self.assertEqual(processor.templates, {})
        finally:
            import shutil
            shutil.rmtree(empty_dir)


class TestAIPipeline(unittest.TestCase):
    """Test the complete processing pipeline"""
    
    def setUp(self):
        """Set up test environment"""
        self.test_dir = tempfile.mkdtemp()
        self.test_path = Path(self.test_dir)
        
        # Create minimal test configuration
        campaign_context = {
            "campaign_info": {"name": "Test", "setting": "Test 2030"},
            "player_characters": {"active": []}
        }
        
        templates = {
            "cleanup_processor": {
                "system_prompt": "Clean this",
                "user_prompt_template": "Clean: {raw_transcript}"
            },
            "timeline_processor": {
                "system_prompt": "Timeline this", 
                "user_prompt_template": "Timeline: {cleaned_transcript}"
            },
            "notes_processor": {
                "system_prompt": "Notes this",
                "user_prompt_template": "Notes: {detailed_timeline}"
            },
            "summary_processor": {
                "system_prompt": "Summarize this",
                "user_prompt_template": "Summary: {session_notes}"
            },
            "quality_validation": {
                "minimum_timeline_items": 5,
                "maximum_timeline_items": 50,
                "required_notes_count": {"min": 2, "max": 8},
                "required_summary_paragraphs": 3
            }
        }
        
        with open(self.test_path / "campaign_context.json", 'w') as f:
            json.dump(campaign_context, f)
            
        with open(self.test_path / "processing_templates.json", 'w') as f:
            json.dump(templates, f)
    
    def tearDown(self):
        """Clean up test environment"""
        import shutil
        shutil.rmtree(self.test_dir)
    
    @patch('ai_processors.genai')
    def test_pipeline_initialization(self, mock_genai):
        """Test pipeline initialization"""
        pipeline = AIPipeline(self.test_dir)
        self.assertIsInstance(pipeline.cleanup_processor, CleanupProcessor)
        self.assertIsInstance(pipeline.timeline_processor, TimelineProcessor)
        self.assertIsInstance(pipeline.notes_processor, NotesProcessor)
        self.assertIsInstance(pipeline.summary_processor, SummaryProcessor)
    
    @patch('ai_processors.genai')
    def test_validation_results(self, mock_genai):
        """Test result validation"""
        pipeline = AIPipeline(self.test_dir)
        
        # Test valid results
        good_results = {
            'timeline': '• Event 1\n• Event 2\n• Event 3\n• Event 4\n• Event 5\n• Event 6',
            'notes': '• Note 1\n• Note 2\n• Note 3',
            'summary': 'Paragraph 1\n\nParagraph 2\n\nParagraph 3'
        }
        
        validation = pipeline.validate_results(good_results)
        self.assertTrue(validation.get('timeline', False))
        self.assertTrue(validation.get('notes', False))
        self.assertTrue(validation.get('summary', False))
        
        # Test invalid results
        bad_results = {
            'timeline': '• Event 1',  # Too few items
            'notes': '• Note 1',      # Too few notes  
            'summary': 'One paragraph'  # Too few paragraphs
        }
        
        validation = pipeline.validate_results(bad_results)
        self.assertFalse(validation.get('timeline', True))
        self.assertFalse(validation.get('notes', True))
        self.assertFalse(validation.get('summary', True))


class TestRateLimiting(unittest.TestCase):
    """Test rate limiting and retry logic"""
    
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        
    def tearDown(self):
        import shutil
        shutil.rmtree(self.test_dir)
    
    @patch('ai_processors.genai')
    @patch('time.sleep')
    def test_rate_limiting_success(self, mock_sleep, mock_genai):
        """Test successful API call with rate limiting"""
        mock_model = Mock()
        mock_response = Mock()
        mock_response.text = "Test response"
        mock_model.generate_content.return_value = mock_response
        mock_genai.GenerativeModel.return_value = mock_model
        
        processor = AIProcessor(self.test_dir, api_key="test_key")
        processor.model = mock_model
        
        result = processor._make_api_call("test prompt")
        
        self.assertEqual(result, "Test response")
        mock_sleep.assert_called_once()  # Rate limiting delay
    
    @patch('ai_processors.genai')
    @patch('time.sleep')
    def test_retry_logic(self, mock_sleep, mock_genai):
        """Test retry logic on API failures"""
        mock_model = Mock()
        mock_model.generate_content.side_effect = [
            Exception("API Error 1"),
            Exception("API Error 2"), 
            Mock(text="Success on third try")
        ]
        mock_genai.GenerativeModel.return_value = mock_model
        
        processor = AIProcessor(self.test_dir, api_key="test_key")
        processor.model = mock_model
        processor.max_retries = 3
        
        result = processor._make_api_call("test prompt")
        
        self.assertEqual(result, "Success on third try")
        self.assertEqual(mock_model.generate_content.call_count, 3)
    
    @patch('ai_processors.genai')
    @patch('time.sleep')
    def test_max_retries_exceeded(self, mock_sleep, mock_genai):
        """Test behavior when max retries exceeded"""
        mock_model = Mock()
        mock_model.generate_content.side_effect = Exception("Persistent error")
        mock_genai.GenerativeModel.return_value = mock_model
        
        processor = AIProcessor(self.test_dir, api_key="test_key")
        processor.model = mock_model
        processor.max_retries = 2
        
        result = processor._make_api_call("test prompt")
        
        self.assertIsNone(result)
        self.assertEqual(mock_model.generate_content.call_count, 2)


class TestProcessorSpecifics(unittest.TestCase):
    """Test specific processor functionality"""
    
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.test_path = Path(self.test_dir)
        
        # Create test configuration
        templates = {
            "cleanup_processor": {
                "system_prompt": "Clean up RPG transcript",
                "user_prompt_template": "Session {session_number}: {raw_transcript}"
            }
        }
        
        campaign_context = {
            "campaign_info": {"setting": "Test Setting"},
            "player_characters": {"active": []}
        }
        
        with open(self.test_path / "processing_templates.json", 'w') as f:
            json.dump(templates, f)
            
        with open(self.test_path / "campaign_context.json", 'w') as f:
            json.dump(campaign_context, f)
    
    def tearDown(self):
        import shutil
        shutil.rmtree(self.test_dir)
    
    @patch('ai_processors.genai')
    def test_cleanup_processor_prompt_formatting(self, mock_genai):
        """Test cleanup processor prompt formatting"""
        mock_model = Mock()
        mock_response = Mock()
        mock_response.text = "Cleaned transcript"
        mock_model.generate_content.return_value = mock_response
        mock_genai.GenerativeModel.return_value = mock_model
        
        processor = CleanupProcessor(self.test_dir, api_key="test_key")
        processor.model = mock_model
        
        result = processor.process("Raw transcript text", session_number=5)
        
        self.assertEqual(result, "Cleaned transcript")
        # Verify the prompt was formatted correctly
        call_args = mock_model.generate_content.call_args[0][0]
        self.assertIn("Session 5", call_args)
        self.assertIn("Raw transcript text", call_args)


class TestErrorHandling(unittest.TestCase):
    """Test error handling scenarios"""
    
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
    
    def tearDown(self):
        import shutil
        shutil.rmtree(self.test_dir)
    
    def test_missing_api_key(self):
        """Test behavior with missing API key"""
        with patch.dict(os.environ, {}, clear=True):
            processor = AIProcessor(self.test_dir)
            self.assertIsNone(processor.api_key)
            self.assertIsNone(processor.model)
    
    def test_malformed_json_config(self):
        """Test handling of malformed JSON configuration"""
        test_path = Path(self.test_dir)
        
        # Write malformed JSON
        with open(test_path / "campaign_context.json", 'w') as f:
            f.write("{ malformed json")
        
        processor = AIProcessor(self.test_dir, api_key="test_key")
        self.assertEqual(processor.campaign_context, {})
    
    @patch('ai_processors.genai')
    def test_empty_api_response(self, mock_genai):
        """Test handling of empty API responses"""
        mock_model = Mock()
        mock_response = Mock()
        mock_response.text = None
        mock_model.generate_content.return_value = mock_response
        mock_genai.GenerativeModel.return_value = mock_model
        
        processor = AIProcessor(self.test_dir, api_key="test_key")
        processor.model = mock_model
        
        result = processor._make_api_call("test prompt")
        self.assertIsNone(result)


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2)