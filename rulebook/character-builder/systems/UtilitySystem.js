// UtilitySystem.js - Utility abilities, expertise, features, and senses
import { GameConstants } from '../core/GameConstants.js';

export class UtilitySystem {
    // Get expertise categories and options
    static getExpertiseCategories() {
        return {
            awareness: {
                name: 'Awareness',
                description: 'Perception and alertness skills',
                activities: [
                    'Alertness', 'Investigation', 'Perception', 'Search', 'Surveillance',
                    'Tracking', 'Notice Details', 'Spot Hidden', 'Detect Lies', 'Read Body Language'
                ],
                situational: [
                    'Urban Areas', 'Wilderness', 'Chaotic Scenes', 'Low Visibility',
                    'Vertical Environments', 'Confined Spaces', 'Treacherous Terrain'
                ]
            },
            communication: {
                name: 'Communication',
                description: 'Social interaction and expression',
                activities: [
                    'Diplomacy', 'Intimidation', 'Leadership', 'Persuasion', 'Deception',
                    'Performance', 'Etiquette', 'Negotiation', 'Public Speaking', 'Animal Handling'
                ],
                situational: [
                    'Formal Settings', 'Underground Culture', 'Diplomatic Zones', 'Public Forums',
                    'High-Speed Environments', 'Workshops & Labs', 'Disaster Zones'
                ]
            },
            intelligence: {
                name: 'Intelligence',
                description: 'Reasoning and knowledge',
                activities: [
                    'Research', 'Academics', 'Technology', 'Medicine', 'Science',
                    'Strategy', 'Tactics', 'History', 'Languages', 'Engineering'
                ],
                situational: [
                    'Academic Environments', 'Time-Critical Situations', 'Hostile Information', 'Collaborative Projects',
                    'Extreme Weather', 'Long Operations', 'Close Quarters Combat', 'Heavy Industry'
                ]
            },
            focus: {
                name: 'Focus',
                description: 'Mental concentration and precision',
                activities: [
                    'Meditation', 'Mental Resistance', 'Concentration', 'Willpower', 'Composure',
                    'Accuracy Training', 'Precision Work', 'Aim', 'Marksmanship', 'Mental Clarity'
                ],
                situational: [
                    'High-Speed Environments', 'Workshops & Labs', 'Disaster Zones',
                    'Vertical Environments', 'Confined Spaces', 'Treacherous Terrain'
                ]
            },
            mobility: {
                name: 'Mobility',
                description: 'Movement and physical agility',
                activities: [
                    'Acrobatics', 'Athletics', 'Climbing', 'Swimming', 'Running',
                    'Parkour', 'Dancing', 'Gymnastics', 'Balance', 'Stealth Movement'
                ],
                situational: [
                    'Vertical Environments', 'Confined Spaces', 'Treacherous Terrain',
                    'Urban Areas', 'Wilderness', 'Chaotic Scenes'
                ]
            },
            endurance: {
                name: 'Endurance',
                description: 'Stamina and resilience',
                activities: [
                    'Marathon Running', 'Heavy Lifting', 'Pain Tolerance', 'Survival', 'Stamina',
                    'Physical Training', 'Resilience', 'Recovery', 'Toughness', 'Persistence'
                ],
                situational: [
                    'Extreme Weather', 'Long Operations', 'Close Quarters Combat', 'Heavy Industry',
                    'Vertical Environments', 'Confined Spaces', 'Treacherous Terrain'
                ]
            },
            power: {
                name: 'Power',
                description: 'Physical and mental force',
                activities: [
                    'Weightlifting', 'Martial Arts', 'Combat Training', 'Weapon Mastery', 'Striking',
                    'Grappling', 'Breaking Things', 'Physical Force', 'Combat Techniques', 'Fighting Styles'
                ],
                situational: [
                    'Close Quarters Combat', 'Heavy Industry', 'Extreme Weather', 'Long Operations',
                    'Urban Areas', 'Chaotic Scenes'
                ]
            }
        };
    }
    
    // Get available features by cost tier
    static getAvailableFeatures() {
        return {
            tier1: { // 1 point
                cost: 1,
                features: [
                    {
                        id: 'materialSense',
                        name: 'Material Sense',
                        description: 'Make Awareness checks to identify composition, age, and origin of objects by touch'
                    },
                    {
                        id: 'perfectSenses',
                        name: 'Perfect Senses',
                        description: 'Supernatural precision for sounds, time, location, and musical notes'
                    },
                    {
                        id: 'eideticMemory',
                        name: 'Eidetic Memory',
                        description: 'Make Intelligence checks to recall any previously encountered information perfectly'
                    },
                    {
                        id: 'naturalCommunication',
                        name: 'Natural Communication',
                        description: 'Make Communication checks to converse with animals and sense plant health'
                    },
                    {
                        id: 'weatherPrediction',
                        name: 'Weather Prediction',
                        description: 'Make Intelligence checks to predict weather patterns up to 24 hours'
                    },
                    {
                        id: 'multiLimbed',
                        name: 'Multi-limbed',
                        description: 'Additional limbs for enhanced manipulation'
                    },
                    {
                        id: 'personalVehicle',
                        name: 'Personal Vehicle',
                        description: 'Own a vehicle for quick travel'
                    },
                    {
                        id: 'stableHousing',
                        name: 'Stable Housing',
                        description: 'Access to home supporting more than yourself'
                    },
                    {
                        id: 'lock',
                        name: 'Lock',
                        description: 'Place protective barriers with 3×Intelligence resistance'
                    },
                    {
                        id: 'objectEncryption',
                        name: 'Object Encryption',
                        description: 'Seal items in protective field to prevent tampering'
                    },
                    {
                        id: 'debt',
                        name: 'Debt',
                        description: 'Someone owes you something significant'
                    },
                    {
                        id: 'theProphesiedOne',
                        name: 'The Prophesied One',
                        description: 'Prophecy involves you, believers assist'
                    }
                ]
            },
            tier3: { // 3 points
                cost: 3,
                features: [
                    {
                        id: 'telepathy',
                        name: 'Telepathy',
                        description: 'Make Communication checks for two-way mental communication regardless of distance'
                    },
                    {
                        id: 'psychometry',
                        name: 'Psychometry',
                        description: 'Make Intelligence checks to perceive recent history and emotional imprints of objects'
                    },
                    {
                        id: 'dreamWalking',
                        name: 'Dream Walking',
                        description: 'Make Communication checks to enter and interact with dreams of sleeping individuals'
                    },
                    {
                        id: 'spiritCommunication',
                        name: 'Spirit Communication',
                        description: 'Make Communication checks to speak with spirits of recently deceased'
                    },
                    {
                        id: 'technopathy',
                        name: 'Technopathy',
                        description: 'Make Intelligence checks to interface directly with electronic devices'
                    },
                    {
                        id: 'psychicLink',
                        name: 'Psychic Link',
                        description: 'Share memories or form temporary psychic connections'
                    },
                    {
                        id: 'mysticGuardian',
                        name: 'Mystic Guardian',
                        description: 'Create temporary magical guardians for simple tasks'
                    },
                    {
                        id: 'spiritualBind',
                        name: 'Spiritual Bind',
                        description: 'Temporarily bind to objects or locations for influence'
                    },
                    {
                        id: 'auraticSway',
                        name: 'Auratic Sway',
                        description: 'Emit aura affecting emotions, make checks to alter moods'
                    },
                    {
                        id: 'supernaturalIntuition',
                        name: 'Supernatural Intuition',
                        description: 'Sense presence of supernatural beings and forces'
                    },
                    {
                        id: 'temporalEcho',
                        name: 'Temporal Echo',
                        description: 'Temporarily replay past events to uncover secrets'
                    },
                    {
                        id: 'forbiddance',
                        name: 'Forbiddance',
                        description: 'Create protective ward over 100×100 area once per rest'
                    },
                    {
                        id: 'glyphOfWarding',
                        name: 'Glyph of Warding',
                        description: 'Set traps that release your special attacks'
                    },
                    {
                        id: 'quantumPocket',
                        name: 'Quantum Pocket',
                        description: 'Store and retrieve objects in subspace storage'
                    },
                    {
                        id: 'alchemist',
                        name: 'Alchemist',
                        description: 'Create experimental tinctures and tonics for specific goals'
                    },
                    {
                        id: 'ritualist',
                        name: 'Ritualist',
                        description: 'Create magical rituals taking one hour to accomplish specific goals'
                    },
                    {
                        id: 'inventor',
                        name: 'Inventor',
                        description: 'Create technological inventions for specific goals'
                    },
                    {
                        id: 'sponsor',
                        name: 'Sponsor',
                        description: 'Someone invested heavily in you, provides resources but expects returns'
                    },
                    {
                        id: 'streetwiseNetwork',
                        name: 'Streetwise Network',
                        description: 'Connections throughout society providing valuable information'
                    },
                    {
                        id: 'underworldConnection',
                        name: 'Underworld Connection',
                        description: 'Reliable criminal contact for communication and contraband'
                    },
                    {
                        id: 'wellConnected',
                        name: 'Well Connected',
                        description: 'Once per session, "I Know a Guy" to create helpful NPC'
                    },
                    {
                        id: 'socialNetwork',
                        name: 'Social Network',
                        description: 'Extensive connections with influential individuals'
                    },
                    {
                        id: 'ancestralKnowledge',
                        name: 'Ancestral Knowledge',
                        description: 'Communicate with ancestral spirits for guidance'
                    },
                    {
                        id: 'dreamwalker',
                        name: 'Dreamwalker',
                        description: 'Enter and interact with dreams'
                    },
                    {
                        id: 'divineInsight',
                        name: 'Divine Insight',
                        description: 'Glimpse alternate dimensions and supernatural realms'
                    },
                    {
                        id: 'prodigy',
                        name: 'Prodigy',
                        description: 'After 1 hour study, gain Tier bonus to specific topic until rest'
                    },
                    {
                        id: 'futureSight',
                        name: 'Future Sight',
                        description: 'Receive visions of possible futures, force with d100 roll'
                    },
                    {
                        id: 'perceptionFilter',
                        name: 'Perception Filter',
                        description: 'Temporarily render objects or areas unnoticed'
                    },
                    {
                        id: 'knowItAll',
                        name: 'Know It All',
                        description: 'Spend 1 minute explaining to give +Intelligence to others\' checks'
                    },
                    {
                        id: 'bard',
                        name: 'Bard',
                        description: 'Sing to give +4 bonus to checks, Communication times per day'
                    }
                ]
            },
            tier5: { // 5 points
                cost: 5,
                features: [
                    {
                        id: 'mindReading',
                        name: 'Mind-Reading',
                        description: 'Make Communication checks to read surface thoughts within line of sight'
                    },
                    {
                        id: 'memoryManipulation',
                        name: 'Memory Manipulation',
                        description: 'Make Communication checks to view, modify, or implant memories'
                    },
                    {
                        id: 'consciousnessTransfer',
                        name: 'Consciousness Transfer',
                        description: 'Make Communication checks to temporarily swap consciousness'
                    },
                    {
                        id: 'quantumTunneling',
                        name: 'Quantum Tunneling',
                        description: 'Make Mobility checks to teleport through solid barriers'
                    },
                    {
                        id: 'probabilityControl',
                        name: 'Probability Control',
                        description: 'Make Intelligence checks to influence probability of events'
                    },
                    {
                        id: 'realityAnchoring',
                        name: 'Reality Anchoring',
                        description: 'Make Intelligence checks to stabilize local reality'
                    },
                    {
                        id: 'hexer',
                        name: 'Hexer',
                        description: 'Inflict complex, lasting curses under specific conditions'
                    },
                    {
                        id: 'matterManipulation',
                        name: 'Matter Manipulation',
                        description: 'Make Intelligence checks to temporarily convert materials'
                    },
                    {
                        id: 'molecularControl',
                        name: 'Molecular Control',
                        description: 'Make Intelligence checks to rearrange molecular structures'
                    },
                    {
                        id: 'dimensionalStorage',
                        name: 'Dimensional Storage',
                        description: 'Make Intelligence checks to create pocket dimensions for storage'
                    },
                    {
                        id: 'hiddenTrap',
                        name: 'Hidden Trap',
                        description: 'Advanced trap setting with special attacks, Awareness×2 to detect'
                    },
                    {
                        id: 'bleedingEdge',
                        name: 'Bleeding Edge',
                        description: 'Most advanced technology, hard to repair/maintain'
                    },
                    {
                        id: 'timePerception',
                        name: 'Time Perception',
                        description: 'Make Awareness checks to perceive time flow differently'
                    },
                    {
                        id: 'dimensionalSight',
                        name: 'Dimensional Sight',
                        description: 'Make Awareness checks to see into parallel dimensions'
                    },
                    {
                        id: 'perfectSanctuary',
                        name: 'Perfect Sanctuary',
                        description: 'Create impenetrable zone around you and allies'
                    },
                    {
                        id: 'corruption',
                        name: 'Corruption',
                        description: 'Trigger condition grants power but risks permanent corruption'
                    },
                    {
                        id: 'simultaneousProcessing',
                        name: 'Simultaneous Processing',
                        description: 'Perform hundreds of simple mental tasks simultaneously'
                    }
                ]
            },
            tier10: { // 10 points
                cost: 10,
                features: [
                    {
                        id: 'truePrecognition',
                        name: 'True Precognition',
                        description: 'Make Intelligence checks to perceive detailed future events days in advance'
                    },
                    {
                        id: 'consciousnessNetwork',
                        name: 'Consciousness Network',
                        description: 'Make Communication checks to link multiple minds into collective'
                    },
                    {
                        id: 'quantumConsciousness',
                        name: 'Quantum Consciousness',
                        description: 'Make Awareness checks to exist in multiple probable states'
                    },
                    {
                        id: 'realityRevision',
                        name: 'Reality Revision',
                        description: 'Make Intelligence checks to alter recent events within last hour'
                    },
                    {
                        id: 'timeManipulation',
                        name: 'Time Manipulation',
                        description: 'Make Intelligence checks to slow, accelerate, or pause time locally'
                    },
                    {
                        id: 'causalManipulation',
                        name: 'Causal Manipulation',
                        description: 'Make Intelligence checks to alter cause-and-effect relationships'
                    },
                    {
                        id: 'immortality',
                        name: 'Immortality',
                        description: 'Return to life after 24 hours, with limitations'
                    },
                    {
                        id: 'selfSacrifice',
                        name: 'Self-Sacrifice',
                        description: 'Increase Tier by 4 for 6 rounds, then die'
                    },
                    {
                        id: 'matterCreation',
                        name: 'Matter Creation',
                        description: 'Make Intelligence checks to create matter from quantum foam'
                    },
                    {
                        id: 'universalTranslation',
                        name: 'Universal Translation',
                        description: 'Make Communication checks to understand any language'
                    },
                    {
                        id: 'dimensionalTravel',
                        name: 'Dimensional Travel',
                        description: 'Make Mobility checks to open portals to alternate realities'
                    },
                    {
                        id: 'realityProgramming',
                        name: 'Reality Programming',
                        description: 'Make Intelligence checks to alter fundamental laws of physics'
                    }
                ]
            }
        };
    }
    
    // Get available senses
    static getAvailableSenses() {
        return {
            tier1: { // 1 point
                cost: 1,
                senses: [
                    {
                        id: 'infraredVision',
                        name: 'Infrared Vision',
                        description: 'See heat signatures through barriers up to 10cm thick'
                    },
                    {
                        id: 'darkvision',
                        name: 'Darkvision',
                        description: 'Make Awareness checks to see clearly in complete darkness'
                    },
                    {
                        id: 'enhancedHearing',
                        name: 'Enhanced Hearing',
                        description: 'Make Awareness checks to hear beyond normal frequency/distance'
                    },
                    {
                        id: 'scentEnhancement',
                        name: 'Scent Enhancement',
                        description: 'Make Awareness checks to identify individuals/substances by smell'
                    },
                    {
                        id: 'tactileSensitivity',
                        name: 'Tactile Sensitivity',
                        description: 'Make Awareness checks to detect minute textures/vibrations/temperature'
                    },
                    {
                        id: 'magneticSense',
                        name: 'Magnetic Sense',
                        description: 'Make Awareness checks to determine directions and detect metal'
                    },
                    {
                        id: 'lieDetection',
                        name: 'Lie Detection',
                        description: 'Make Awareness checks to detect deliberate lies'
                    },
                    {
                        id: 'scentTracking',
                        name: 'Scent Tracking',
                        description: 'Make Awareness checks to follow trails by scent'
                    }
                ]
            },
            tier3: { // 3 points
                cost: 3,
                senses: [
                    {
                        id: 'echolocation',
                        name: 'Echolocation',
                        description: 'Make Awareness checks to navigate in darkness using sound, range Tier×10 Sp'
                    },
                    {
                        id: 'thermalVision',
                        name: 'Thermal Vision',
                        description: 'Make Awareness checks to see heat signatures through walls'
                    },
                    {
                        id: 'microscopicVision',
                        name: 'Microscopic Vision',
                        description: 'Make Awareness checks to see cellular-level detail'
                    },
                    {
                        id: 'tremorSense',
                        name: 'Tremor Sense',
                        description: 'Make Awareness checks to detect movement through vibrations, range Tier×5 Sp'
                    },
                    {
                        id: 'auraSight',
                        name: 'Aura Sight',
                        description: 'Make Awareness checks to perceive emotional states and supernatural auras'
                    },
                    {
                        id: 'timeSense',
                        name: 'Time Sense',
                        description: 'Make Awareness checks to perceive temporal distortions'
                    },
                    {
                        id: 'precognitiveFlashes',
                        name: 'Precognitive Flashes',
                        description: 'Make Awareness checks to glimpse potential outcomes of immediate actions'
                    }
                ]
            },
            tier5: { // 5 points
                cost: 5,
                senses: [
                    {
                        id: 'xrayVision',
                        name: 'X-Ray Vision',
                        description: 'Make Awareness checks to see through solid objects up to Tier×2 Sp thick'
                    },
                    {
                        id: 'psychicResonance',
                        name: 'Psychic Resonance',
                        description: 'Make Awareness checks to detect psychic activity and mental powers'
                    },
                    {
                        id: 'dimensionalSight',
                        name: 'Dimensional Sight',
                        description: 'Make Awareness checks to see into adjacent dimensions'
                    },
                    {
                        id: 'lifeDetection',
                        name: 'Life Detection',
                        description: 'Make Awareness checks to sense all living creatures within Tier×100 Sp'
                    },
                    {
                        id: 'energySight',
                        name: 'Energy Sight',
                        description: 'Make Awareness checks to see all forms of energy as visible spectrums'
                    }
                ]
            },
            tier10: { // 10 points
                cost: 10,
                senses: [
                    {
                        id: 'omniscientSight',
                        name: 'Omniscient Sight',
                        description: 'Make Awareness checks to perceive events anywhere on Earth you can visualize'
                    },
                    {
                        id: 'temporalVision',
                        name: 'Temporal Vision',
                        description: 'Make Awareness checks to see past or future states with perfect clarity'
                    },
                    {
                        id: 'quantumPerception',
                        name: 'Quantum Perception',
                        description: 'Make Awareness checks to perceive probability clouds and quantum states'
                    },
                    {
                        id: 'universalDetection',
                        name: 'Universal Detection',
                        description: 'Make Awareness checks to sense any phenomenon within city-sized area'
                    }
                ]
            },
            unique: { // Variable cost
                cost: 'variable',
                senses: [
                    {
                        id: 'uniqueSense',
                        name: 'Unique Sense',
                        description: 'Supernatural sense for specific phenomenon, cost based on scope',
                        customizable: true
                    }
                ]
            }
        };
    }
    
    // Get movement features
    static getMovementFeatures() {
        return {
            tier5: { // 5 points
                cost: 5,
                features: [
                    {
                        id: 'wallWalking',
                        name: 'Wall Walking',
                        description: 'Move on walls and ceilings at normal speed, defying gravity'
                    },
                    {
                        id: 'burrowing',
                        name: 'Burrowing',
                        description: 'Move through earth/sand/rock at half speed, create temporary tunnels'
                    }
                ]
            },
            tier10: { // 10 points
                cost: 10,
                features: [
                    {
                        id: 'flight',
                        name: 'Flight',
                        description: 'Move in any direction at full speed with perfect maneuverability'
                    },
                    {
                        id: 'phasing',
                        name: 'Phasing',
                        description: 'Selectively phase through solid barriers at normal speed'
                    },
                    {
                        id: 'shortRangeTeleportation',
                        name: 'Short-Range Teleportation',
                        description: 'Instantly teleport to visible location within movement range'
                    },
                    {
                        id: 'portalCreation',
                        name: 'Portal Creation',
                        description: 'Create two linked portals as part of movement action'
                    }
                ]
            }
        };
    }
    
    // Get descriptors
    static getDescriptors() {
        return {
            tier5: { // 5 points
                cost: 5,
                descriptors: [
                    {
                        id: 'fire',
                        name: 'Fire',
                        description: 'Elemental mastery of flame and heat',
                        applications: ['forging', 'temperature_control', 'heat_detection', 'crafting', 'immunity']
                    },
                    {
                        id: 'water',
                        name: 'Water',
                        description: 'Elemental mastery of water and ice',
                        applications: ['purification', 'fog_creation', 'moisture_detection', 'life_support', 'immunity']
                    },
                    {
                        id: 'earth',
                        name: 'Earth',
                        description: 'Elemental mastery of stone and soil',
                        applications: ['mineral_location', 'construction', 'vibration_detection', 'shaping', 'immunity']
                    },
                    {
                        id: 'air',
                        name: 'Air',
                        description: 'Elemental mastery of wind and atmosphere',
                        applications: ['weather_control', 'sound_manipulation', 'scent_tracking', 'navigation', 'immunity']
                    },
                    {
                        id: 'lightning',
                        name: 'Lightning',
                        description: 'Elemental mastery of electricity',
                        applications: ['power_devices', 'electromagnetic_fields', 'electrical_detection', 'communication', 'immunity']
                    },
                    {
                        id: 'ice',
                        name: 'Ice',
                        description: 'Elemental mastery of cold and freezing',
                        applications: ['preservation', 'construction', 'temperature_detection', 'barriers', 'immunity']
                    },
                    {
                        id: 'kinetic',
                        name: 'Kinetic',
                        description: 'Energy mastery of motion and force',
                        applications: ['enhanced_projectiles', 'momentum_maintenance', 'impact_absorption', 'gravity_defiance', 'immunity']
                    },
                    {
                        id: 'plasma',
                        name: 'Plasma',
                        description: 'Energy mastery of superheated matter',
                        applications: ['luminous_aura', 'plasma_detection', 'material_manipulation', 'energy_generation', 'immunity']
                    },
                    {
                        id: 'biological',
                        name: 'Biological',
                        description: 'Mastery of living systems',
                        applications: ['regeneration', 'toxin_mastery', 'animal_connection', 'plant_revival', 'immunity']
                    },
                    {
                        id: 'technology',
                        name: 'Technology',
                        description: 'Mastery of mechanical and electronic systems',
                        applications: ['machine_communication', 'decryption', 'remote_control', 'system_override', 'immunity']
                    },
                    {
                        id: 'mental',
                        name: 'Mental',
                        description: 'Mastery of psychic and cognitive forces',
                        applications: ['memory_sharing', 'emotion_amplification', 'psychic_defense', 'memory_recovery', 'immunity']
                    },
                    {
                        id: 'arcane',
                        name: 'Arcane',
                        description: 'Mastery of magical forces',
                        applications: ['magic_detection', 'glyph_mastery', 'magical_marking', 'artifact_sense', 'immunity']
                    }
                ]
            },
            tier10: { // 10 points
                cost: 10,
                descriptors: [
                    {
                        id: 'time',
                        name: 'Time',
                        description: 'Reality mastery of temporal forces',
                        applications: ['temporal_perception', 'chronological_analysis', 'temporal_crafting', 'historical_investigation', 'advanced_time_manipulation']
                    },
                    {
                        id: 'space',
                        name: 'Space',
                        description: 'Reality mastery of spatial dimensions',
                        applications: ['dimensional_analysis', 'spatial_navigation', 'geometric_construction', 'distance_manipulation', 'advanced_teleportation']
                    },
                    {
                        id: 'probability',
                        name: 'Probability',
                        description: 'Reality mastery of chance and outcomes',
                        applications: ['outcome_analysis', 'pattern_recognition', 'luck_adjustment', 'chaos_detection', 'advanced_probability_alteration']
                    },
                    {
                        id: 'atomic',
                        name: 'Atomic',
                        description: 'Reality mastery of fundamental matter',
                        applications: ['atomic_perception', 'density_alteration', 'atomic_manipulation', 'environmental_immunity', 'advanced_matter_control']
                    },
                    {
                        id: 'cosmic',
                        name: 'Cosmic',
                        description: 'Reality mastery of universal forces',
                        applications: ['universal_knowledge', 'cosmic_presence', 'environmental_immunity', 'energy_mastery', 'advanced_cosmic_infusion']
                    }
                ]
            }
        };
    }
    
    // Calculate utility pool points
    static calculateUtilityPool(character) {
        const tier = character.tier;
        const archetype = character.archetypes.utility;
        
        let basePool;
        switch(archetype) {
            case 'specialized':
            case 'jackOfAllTrades':
                basePool = Math.max(0, GameConstants.UTILITY_POOL_MULTIPLIER * (tier - GameConstants.UTILITY_POOL_SPECIALIZED_BASE));
                break;
            case 'practical':
            default:
                basePool = Math.max(0, GameConstants.UTILITY_POOL_MULTIPLIER * (tier - GameConstants.UTILITY_POOL_PRACTICAL_BASE));
                break;
        }
        
        // Add bonuses from boons
        const boonEffects = character.mainPoolPurchases.boons.find(b => b.boonId === 'utilitarian');
        const boonBonus = boonEffects ? 10 : 0;
        
        return basePool + boonBonus;
    }
    
    // Calculate points spent on utility
    static calculateUtilityPointsSpent(character) {
        let spent = 0;
        
        // Expertise costs
        Object.values(character.utilityPurchases.expertise).forEach(category => {
            spent += category.basic.length * GameConstants.EXPERTISE_ACTIVITY_BASIC;
            spent += category.mastered.length * GameConstants.EXPERTISE_ACTIVITY_MASTERED;
        });
        
        // Feature costs
        character.utilityPurchases.features.forEach(feature => {
            const featureDef = this.findFeatureById(feature.id);
            spent += featureDef ? featureDef.cost : 0;
        });
        
        // Sense costs
        character.utilityPurchases.senses.forEach(sense => {
            const senseDef = this.findSenseById(sense.id);
            spent += senseDef ? senseDef.cost : 0;
        });
        
        // Movement costs
        character.utilityPurchases.movement.forEach(movement => {
            const movementDef = this.findMovementById(movement.id);
            spent += movementDef ? movementDef.cost : 0;
        });
        
        // Descriptor costs
        character.utilityPurchases.descriptors.forEach(descriptor => {
            const descriptorDef = this.findDescriptorById(descriptor.id);
            spent += descriptorDef ? descriptorDef.cost : 0;
        });
        
        return spent;
    }
    
    // Find feature by ID across all tiers
    static findFeatureById(featureId) {
        const allFeatures = this.getAvailableFeatures();
        for (const tier of Object.values(allFeatures)) {
            const feature = tier.features.find(f => f.id === featureId);
            if (feature) return { ...feature, cost: tier.cost };
        }
        return null;
    }
    
    // Find sense by ID across all tiers
    static findSenseById(senseId) {
        const allSenses = this.getAvailableSenses();
        for (const tier of Object.values(allSenses)) {
            if (tier.senses) {
                const sense = tier.senses.find(s => s.id === senseId);
                if (sense) return { ...sense, cost: tier.cost };
            }
        }
        return null;
    }
    
    // Find movement by ID
    static findMovementById(movementId) {
        const allMovement = this.getMovementFeatures();
        for (const tier of Object.values(allMovement)) {
            const movement = tier.features.find(m => m.id === movementId);
            if (movement) return { ...movement, cost: tier.cost };
        }
        return null;
    }
    
    // Find descriptor by ID
    static findDescriptorById(descriptorId) {
        const allDescriptors = this.getDescriptors();
        for (const tier of Object.values(allDescriptors)) {
            const descriptor = tier.descriptors.find(d => d.id === descriptorId);
            if (descriptor) return { ...descriptor, cost: tier.cost };
        }
        return null;
    }
    
    // Validate utility purchase
    static validateUtilityPurchase(character, category, itemId, level = 'basic') {
        const errors = [];
        const warnings = [];
        
        // Check if can afford
        const available = this.calculateUtilityPool(character);
        const spent = this.calculateUtilityPointsSpent(character);
        
        let cost = 0;
        switch(category) {
            case 'expertise':
                cost = level === 'basic' ? 
                    GameConstants.EXPERTISE_ACTIVITY_BASIC : 
                    GameConstants.EXPERTISE_ACTIVITY_MASTERED;
                break;
            case 'features':
                const feature = this.findFeatureById(itemId);
                cost = feature ? feature.cost : 0;
                if (!feature) errors.push('Invalid feature');
                break;
            case 'senses':
                const sense = this.findSenseById(itemId);
                cost = sense ? sense.cost : 0;
                if (!sense) errors.push('Invalid sense');
                break;
            case 'movement':
                const movement = this.findMovementById(itemId);
                cost = movement ? movement.cost : 0;
                if (!movement) errors.push('Invalid movement');
                break;
            case 'descriptors':
                const descriptor = this.findDescriptorById(itemId);
                cost = descriptor ? descriptor.cost : 0;
                if (!descriptor) errors.push('Invalid descriptor');
                break;
        }
        
        if (spent + cost > available) {
            errors.push(`Insufficient utility points (need ${cost}, have ${available - spent})`);
        }
        
        // Check archetype restrictions
        const archetype = character.archetypes.utility;
        if (archetype === 'specialized' && category === 'expertise') {
            warnings.push('Specialized archetype has restrictions on additional expertise');
        }
        
        if (archetype === 'jackOfAllTrades' && category === 'expertise' && level === 'mastered') {
            errors.push('Jack of All Trades cannot purchase specialized expertise');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            cost
        };
    }
    
    // Purchase utility item
    static purchaseUtilityItem(character, category, itemId, level = 'basic') {
        const validation = this.validateUtilityPurchase(character, category, itemId, level);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        switch(category) {
            case 'expertise':
                if (!character.utilityPurchases.expertise[itemId]) {
                    character.utilityPurchases.expertise[itemId] = { basic: [], mastered: [] };
                }
                character.utilityPurchases.expertise[itemId][level].push(itemId);
                break;
            case 'features':
                character.utilityPurchases.features.push({ id: itemId, purchased: new Date().toISOString() });
                break;
            case 'senses':
                character.utilityPurchases.senses.push({ id: itemId, purchased: new Date().toISOString() });
                break;
            case 'movement':
                character.utilityPurchases.movement.push({ id: itemId, purchased: new Date().toISOString() });
                break;
            case 'descriptors':
                character.utilityPurchases.descriptors.push({ id: itemId, purchased: new Date().toISOString() });
                break;
        }
        
        return character;
    }
    
    // Get utility summary
    static getUtilitySummary(character) {
        const available = this.calculateUtilityPool(character);
        const spent = this.calculateUtilityPointsSpent(character);
        
        return {
            pointPool: {
                available,
                spent,
                remaining: available - spent
            },
            expertise: {
                categories: Object.keys(character.utilityPurchases.expertise).length,
                totalItems: Object.values(character.utilityPurchases.expertise).reduce((total, cat) => 
                    total + cat.basic.length + cat.mastered.length, 0)
            },
            features: character.utilityPurchases.features.length,
            senses: character.utilityPurchases.senses.length,
            movement: character.utilityPurchases.movement.length,
            descriptors: character.utilityPurchases.descriptors.length
        };
    }
}