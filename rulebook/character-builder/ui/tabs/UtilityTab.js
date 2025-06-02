// UtilityTab.js - Utility purchases interface
export class UtilityTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.character = characterBuilder.character;
        this.activeCategory = 'expertise';
    }

    render() {
        const tabContent = document.getElementById('tab-utility');
        if (!tabContent) return;

        tabContent.innerHTML = `
            <div class="utility-section">
                <h2>Utility Abilities</h2>
                <p class="section-description">
                    Purchase expertise, features, senses, movement, and descriptors using your utility pool points.
                </p>
                
                ${this.renderPointDisplay()}
                
                <div class="utility-categories">
                    ${this.renderCategoryTabs()}
                    <div class="category-content">
                        ${this.renderCategoryContent()}
                    </div>
                </div>
                
                <div class="purchased-utilities">
                    <h3>Purchased Utilities</h3>
                    ${this.renderPurchasedUtilities()}
                </div>
                
                <div class="next-step">
                    <button id="continue-to-summary" class="btn-primary">Continue to Summary →</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    renderPointDisplay() {
        const pools = this.builder.calculatePointPools();
        const utilityPool = pools.utilityPool || { available: 0, spent: 0, remaining: 0 };
        
        return `
            <div class="pool-status ${utilityPool.remaining < 0 ? 'over-budget' : utilityPool.remaining === 0 ? 'fully-used' : ''}">
                <h3>Utility Pool</h3>
                <div class="pool-breakdown">
                    <span>Available: ${utilityPool.available}</span>
                    <span>Spent: ${utilityPool.spent}</span>
                    <span>Remaining: ${utilityPool.remaining}</span>
                </div>
            </div>
        `;
    }

    renderCategoryTabs() {
        const categories = [
            { id: 'expertise', name: 'Expertise', description: 'Specialized skills and training' },
            { id: 'features', name: 'Features', description: 'Supernatural abilities' },
            { id: 'senses', name: 'Senses', description: 'Enhanced perception' },
            { id: 'movement', name: 'Movement', description: 'Enhanced locomotion' },
            { id: 'descriptors', name: 'Descriptors', description: 'Reality manipulation' }
        ];

        return `
            <div class="category-tabs">
                ${categories.map(cat => `
                    <button class="category-tab ${this.activeCategory === cat.id ? 'active' : ''}" 
                            data-category="${cat.id}">
                        ${cat.name}
                        <small>${cat.description}</small>
                    </button>
                `).join('')}
            </div>
        `;
    }

    renderCategoryContent() {
        switch(this.activeCategory) {
            case 'expertise':
                return this.renderExpertiseContent();
            case 'features':
                return this.renderFeaturesContent();
            case 'senses':
                return this.renderSensesContent();
            case 'movement':
                return this.renderMovementContent();
            case 'descriptors':
                return this.renderDescriptorsContent();
            default:
                return '<p>Select a category above</p>';
        }
    }

    renderExpertiseContent() {
        const attributes = ['awareness', 'communication', 'intelligence', 'focus', 'mobility', 'endurance', 'power'];
        
        return `
            <div class="expertise-section">
                <h3>Expertise Selection</h3>
                <p>Choose specialized knowledge and training for each attribute.</p>
                
                <div class="expertise-grid">
                    ${attributes.map(attr => this.renderAttributeExpertise(attr)).join('')}
                </div>
            </div>
        `;
    }

    renderAttributeExpertise(attribute) {
        const attributeData = this.getAttributeExpertiseData(attribute);
        const current = this.character.utilityPurchases.expertise[attribute];
        
        return `
            <div class="expertise-attribute">
                <h4>${this.capitalizeFirst(attribute)}</h4>
                
                <div class="expertise-type">
                    <h5>Activity-Based (2p Basic / 6p Mastered)</h5>
                    <div class="expertise-options">
                        ${attributeData.activity.map(expertise => `
                            <div class="expertise-option">
                                <label>
                                    <input type="checkbox" 
                                           data-expertise-type="activity"
                                           data-expertise-level="basic"
                                           data-expertise-id="${expertise.id}"
                                           data-attribute="${attribute}"
                                           ${current.basic.includes(expertise.id) ? 'checked' : ''}>
                                    ${expertise.name} (2p)
                                </label>
                                <small>${expertise.description}</small>
                                
                                ${current.basic.includes(expertise.id) ? `
                                    <div class="mastery-option">
                                        <label>
                                            <input type="checkbox"
                                                   data-expertise-type="activity"
                                                   data-expertise-level="mastered"
                                                   data-expertise-id="${expertise.id}"
                                                   data-attribute="${attribute}"
                                                   ${current.mastered.includes(expertise.id) ? 'checked' : ''}>
                                            Master ${expertise.name} (+4p)
                                        </label>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="expertise-type">
                    <h5>Situational (1p Basic / 3p Mastered)</h5>
                    <div class="expertise-options">
                        ${attributeData.situational.map(expertise => `
                            <div class="expertise-option">
                                <label>
                                    <input type="checkbox" 
                                           data-expertise-type="situational"
                                           data-expertise-level="basic"
                                           data-expertise-id="${expertise.id}"
                                           data-attribute="${attribute}"
                                           ${current.basic.includes(expertise.id) ? 'checked' : ''}>
                                    ${expertise.name} (1p)
                                </label>
                                <small>${expertise.description}</small>
                                
                                ${current.basic.includes(expertise.id) ? `
                                    <div class="mastery-option">
                                        <label>
                                            <input type="checkbox"
                                                   data-expertise-type="situational"
                                                   data-expertise-level="mastered"
                                                   data-expertise-id="${expertise.id}"
                                                   data-attribute="${attribute}"
                                                   ${current.mastered.includes(expertise.id) ? 'checked' : ''}>
                                            Master ${expertise.name} (+2p)
                                        </label>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderFeaturesContent() {
        const featureCategories = this.getFeatureData();
        
        return `
            <div class="features-section">
                <h3>Features</h3>
                <p>Supernatural abilities that enable new types of actions and checks.</p>
                
                ${Object.entries(featureCategories).map(([category, features]) => `
                    <div class="feature-category">
                        <h4>${category}</h4>
                        <div class="feature-grid">
                            ${features.map(feature => this.renderFeatureOption(feature)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderFeatureOption(feature) {
        const isSelected = this.character.utilityPurchases.features.some(f => f.id === feature.id);
        
        return `
            <div class="feature-option ${isSelected ? 'selected' : ''}">
                <div class="feature-header">
                    <label>
                        <input type="checkbox" 
                               data-feature-id="${feature.id}"
                               data-feature-cost="${feature.cost}"
                               ${isSelected ? 'checked' : ''}>
                        <strong>${feature.name}</strong> (${feature.cost}p)
                    </label>
                </div>
                <div class="feature-description">
                    ${feature.description}
                </div>
                ${feature.upgrades ? `
                    <div class="feature-upgrades">
                        <small><strong>Upgrades:</strong> ${feature.upgrades}</small>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderSensesContent() {
        const sensesByTier = this.getSenseData();
        
        return `
            <div class="senses-section">
                <h3>Senses</h3>
                <p>Enhanced perceptual capabilities for detecting what normal senses cannot.</p>
                
                ${Object.entries(sensesByTier).map(([tier, senses]) => `
                    <div class="sense-tier">
                        <h4>${tier} Point Senses</h4>
                        <div class="sense-grid">
                            ${senses.map(sense => this.renderSenseOption(sense)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderSenseOption(sense) {
        const isSelected = this.character.utilityPurchases.senses.some(s => s.id === sense.id);
        
        return `
            <div class="sense-option ${isSelected ? 'selected' : ''}">
                <div class="sense-header">
                    <label>
                        <input type="checkbox" 
                               data-sense-id="${sense.id}"
                               data-sense-cost="${sense.cost}"
                               ${isSelected ? 'checked' : ''}>
                        <strong>${sense.name}</strong> (${sense.cost}p)
                    </label>
                </div>
                <div class="sense-description">
                    ${sense.description}
                </div>
            </div>
        `;
    }

    renderMovementContent() {
        const movementOptions = this.getMovementData();
        
        return `
            <div class="movement-section">
                <h3>Movement Abilities</h3>
                <p>Enhanced locomotion capabilities for combat and exploration.</p>
                
                <div class="movement-grid">
                    ${movementOptions.map(movement => this.renderMovementOption(movement)).join('')}
                </div>
            </div>
        `;
    }

    renderMovementOption(movement) {
        const isSelected = this.character.utilityPurchases.movement.some(m => m.id === movement.id);
        
        return `
            <div class="movement-option ${isSelected ? 'selected' : ''}">
                <div class="movement-header">
                    <label>
                        <input type="checkbox" 
                               data-movement-id="${movement.id}"
                               data-movement-cost="${movement.cost}"
                               ${isSelected ? 'checked' : ''}>
                        <strong>${movement.name}</strong> (${movement.cost}p)
                    </label>
                </div>
                <div class="movement-description">
                    ${movement.description}
                </div>
            </div>
        `;
    }

    renderDescriptorsContent() {
        const descriptorCategories = this.getDescriptorData();
        
        return `
            <div class="descriptors-section">
                <h3>Descriptors</h3>
                <p>Reality manipulation abilities tied to specific concepts or elements.</p>
                
                ${Object.entries(descriptorCategories).map(([category, descriptors]) => `
                    <div class="descriptor-category">
                        <h4>${category} (${descriptors[0]?.cost || 5}p each)</h4>
                        <div class="descriptor-grid">
                            ${descriptors.map(descriptor => this.renderDescriptorOption(descriptor)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderDescriptorOption(descriptor) {
        const isSelected = this.character.utilityPurchases.descriptors.some(d => d.id === descriptor.id);
        
        return `
            <div class="descriptor-option ${isSelected ? 'selected' : ''}">
                <div class="descriptor-header">
                    <label>
                        <input type="checkbox" 
                               data-descriptor-id="${descriptor.id}"
                               data-descriptor-cost="${descriptor.cost}"
                               ${isSelected ? 'checked' : ''}>
                        <strong>${descriptor.name}</strong> (${descriptor.cost}p)
                    </label>
                </div>
                <div class="descriptor-description">
                    ${descriptor.description}
                </div>
                <div class="descriptor-applications">
                    <small><strong>Applications:</strong> ${descriptor.applications.join(', ')}</small>
                </div>
            </div>
        `;
    }

    renderPurchasedUtilities() {
        const purchases = this.character.utilityPurchases;
        let html = '<div class="purchased-list">';
        
        // Expertise
        Object.entries(purchases.expertise).forEach(([attr, expertises]) => {
            if (expertises.basic.length > 0 || expertises.mastered.length > 0) {
                html += `<div class="purchased-category">
                    <h4>${this.capitalizeFirst(attr)} Expertise</h4>
                    ${expertises.basic.map(id => `<span class="purchased-item">Basic ${id} (2p)</span>`).join('')}
                    ${expertises.mastered.map(id => `<span class="purchased-item">Master ${id} (6p)</span>`).join('')}
                </div>`;
            }
        });
        
        // Features
        if (purchases.features.length > 0) {
            html += `<div class="purchased-category">
                <h4>Features</h4>
                ${purchases.features.map(f => `<span class="purchased-item">${f.name} (${f.cost}p)</span>`).join('')}
            </div>`;
        }
        
        // Senses
        if (purchases.senses.length > 0) {
            html += `<div class="purchased-category">
                <h4>Senses</h4>
                ${purchases.senses.map(s => `<span class="purchased-item">${s.name} (${s.cost}p)</span>`).join('')}
            </div>`;
        }
        
        // Movement
        if (purchases.movement.length > 0) {
            html += `<div class="purchased-category">
                <h4>Movement</h4>
                ${purchases.movement.map(m => `<span class="purchased-item">${m.name} (${m.cost}p)</span>`).join('')}
            </div>`;
        }
        
        // Descriptors
        if (purchases.descriptors.length > 0) {
            html += `<div class="purchased-category">
                <h4>Descriptors</h4>
                ${purchases.descriptors.map(d => `<span class="purchased-item">${d.name} (${d.cost}p)</span>`).join('')}
            </div>`;
        }
        
        if (html === '<div class="purchased-list">') {
            html += '<p class="empty-state">No utilities purchased yet</p>';
        }
        
        html += '</div>';
        return html;
    }

    setupEventListeners() {
        // Category tab switching
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.activeCategory = e.target.dataset.category;
                this.render();
            });
        });

        // Expertise selection
        document.querySelectorAll('input[data-expertise-id]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleExpertiseChange(e);
            });
        });

        // Feature selection
        document.querySelectorAll('input[data-feature-id]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleFeatureChange(e);
            });
        });

        // Sense selection
        document.querySelectorAll('input[data-sense-id]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleSenseChange(e);
            });
        });

        // Movement selection
        document.querySelectorAll('input[data-movement-id]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleMovementChange(e);
            });
        });

        // Descriptor selection
        document.querySelectorAll('input[data-descriptor-id]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleDescriptorChange(e);
            });
        });

        // Continue button
        const continueBtn = document.getElementById('continue-to-summary');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.builder.switchTab('summary');
            });
        }
    }

    handleExpertiseChange(e) {
        const { expertiseId, attribute, expertiseLevel } = e.target.dataset;
        const isChecked = e.target.checked;
        const expertise = this.character.utilityPurchases.expertise[attribute];
        
        if (expertiseLevel === 'basic') {
            if (isChecked) {
                if (!expertise.basic.includes(expertiseId)) {
                    expertise.basic.push(expertiseId);
                }
            } else {
                expertise.basic = expertise.basic.filter(id => id !== expertiseId);
                // Also remove mastery if basic is unchecked
                expertise.mastered = expertise.mastered.filter(id => id !== expertiseId);
            }
        } else if (expertiseLevel === 'mastered') {
            if (isChecked) {
                if (!expertise.mastered.includes(expertiseId)) {
                    expertise.mastered.push(expertiseId);
                }
            } else {
                expertise.mastered = expertise.mastered.filter(id => id !== expertiseId);
            }
        }
        
        this.character.touch();
        this.builder.updateValidation();
        this.render();
    }

    handleFeatureChange(e) {
        const featureId = e.target.dataset.featureId;
        const featureCost = parseInt(e.target.dataset.featureCost);
        const isChecked = e.target.checked;
        
        if (isChecked) {
            const feature = this.findFeatureById(featureId);
            if (feature && !this.character.utilityPurchases.features.some(f => f.id === featureId)) {
                this.character.utilityPurchases.features.push({
                    id: featureId,
                    name: feature.name,
                    cost: featureCost
                });
            }
        } else {
            this.character.utilityPurchases.features = 
                this.character.utilityPurchases.features.filter(f => f.id !== featureId);
        }
        
        this.character.touch();
        this.builder.updateValidation();
        this.render();
    }

    handleSenseChange(e) {
        const senseId = e.target.dataset.senseId;
        const senseCost = parseInt(e.target.dataset.senseCost);
        const isChecked = e.target.checked;
        
        if (isChecked) {
            const sense = this.findSenseById(senseId);
            if (sense && !this.character.utilityPurchases.senses.some(s => s.id === senseId)) {
                this.character.utilityPurchases.senses.push({
                    id: senseId,
                    name: sense.name,
                    cost: senseCost
                });
            }
        } else {
            this.character.utilityPurchases.senses = 
                this.character.utilityPurchases.senses.filter(s => s.id !== senseId);
        }
        
        this.character.touch();
        this.builder.updateValidation();
        this.render();
    }

    handleMovementChange(e) {
        const movementId = e.target.dataset.movementId;
        const movementCost = parseInt(e.target.dataset.movementCost);
        const isChecked = e.target.checked;
        
        if (isChecked) {
            const movement = this.findMovementById(movementId);
            if (movement && !this.character.utilityPurchases.movement.some(m => m.id === movementId)) {
                this.character.utilityPurchases.movement.push({
                    id: movementId,
                    name: movement.name,
                    cost: movementCost
                });
            }
        } else {
            this.character.utilityPurchases.movement = 
                this.character.utilityPurchases.movement.filter(m => m.id !== movementId);
        }
        
        this.character.touch();
        this.builder.updateValidation();
        this.render();
    }

    handleDescriptorChange(e) {
        const descriptorId = e.target.dataset.descriptorId;
        const descriptorCost = parseInt(e.target.dataset.descriptorCost);
        const isChecked = e.target.checked;
        
        if (isChecked) {
            const descriptor = this.findDescriptorById(descriptorId);
            if (descriptor && !this.character.utilityPurchases.descriptors.some(d => d.id === descriptorId)) {
                this.character.utilityPurchases.descriptors.push({
                    id: descriptorId,
                    name: descriptor.name,
                    cost: descriptorCost
                });
            }
        } else {
            this.character.utilityPurchases.descriptors = 
                this.character.utilityPurchases.descriptors.filter(d => d.id !== descriptorId);
        }
        
        this.character.touch();
        this.builder.updateValidation();
        this.render();
    }

    // Data methods
    getAttributeExpertiseData(attribute) {
        const expertiseData = {
            awareness: {
                activity: [
                    { id: 'tracking', name: 'Tracking', description: 'Following trails, signs, or behavioral patterns' },
                    { id: 'searching', name: 'Searching', description: 'Scanning for hidden, lost, or obscured details' },
                    { id: 'perception', name: 'Perception', description: 'Noticing changes, cues, or threats in real time' },
                    { id: 'senseMotives', name: 'Sense Motives', description: 'Reading intent, emotion, or deception in others' }
                ],
                situational: [
                    { id: 'urbanAreas', name: 'Urban Areas', description: 'Streets, alleys, rooftops, and social rhythms of cities' },
                    { id: 'wilderness', name: 'Wilderness', description: 'Forests, deserts, mountains, and natural landscapes' },
                    { id: 'chaoticScenes', name: 'Chaotic Scenes', description: 'Riots, protests, crowds, or high-distraction areas' },
                    { id: 'lowVisibility', name: 'Low Visibility', description: 'Darkness, fog, smoke, or sight-limiting conditions' }
                ]
            },
            communication: {
                activity: [
                    { id: 'persuasion', name: 'Persuasion', description: 'Convincing others with logic, charm, or appeal' },
                    { id: 'deception', name: 'Deception', description: 'Misleading through lies, trickery, or half-truths' },
                    { id: 'intimidation', name: 'Intimidation', description: 'Coercing through fear, threat, or force of presence' },
                    { id: 'disguise', name: 'Disguise', description: 'Altering appearance or identity convincingly' },
                    { id: 'understand', name: 'Understand', description: 'Interpreting tone, language, and hidden meaning' }
                ],
                situational: [
                    { id: 'formalSettings', name: 'Formal Settings', description: 'Boardrooms, courtrooms, or ceremonial environments' },
                    { id: 'undergroundCulture', name: 'Underground Culture', description: 'Black markets, street deals, or hidden social networks' },
                    { id: 'diplomaticZones', name: 'Diplomatic Zones', description: 'Neutral ground, political meetings, or cultural exchanges' },
                    { id: 'publicForums', name: 'Public Forums', description: 'Rallies, stages, broadcasts, or press interactions' }
                ]
            },
            intelligence: {
                activity: [
                    { id: 'strategy', name: 'Strategy', description: 'Tactical decision-making and multi-step planning' },
                    { id: 'innovate', name: 'Innovate', description: 'Developing new methods, systems, or breakthroughs' },
                    { id: 'decoding', name: 'Decoding', description: 'Interpreting codes, puzzles, or unfamiliar systems' },
                    { id: 'research', name: 'Research', description: 'Investigating topics, gathering data, or studying deeply' },
                    { id: 'problemSolving', name: 'Problem Solving', description: 'Applying logic and creativity to overcome challenges' }
                ],
                situational: [
                    { id: 'academicEnvironments', name: 'Academic Environments', description: 'Libraries, universities, conferences, or scholarly debates' },
                    { id: 'timeCritical', name: 'Time-Critical Situations', description: 'Puzzles under pressure, quick analysis, or rapid decision-making' },
                    { id: 'hostileInformation', name: 'Hostile Information', description: 'Contested data, propaganda, misinformation, or adversarial intelligence' },
                    { id: 'collaborative', name: 'Collaborative Projects', description: 'Team research, group problem-solving, or multi-expert consultation' }
                ]
            },
            focus: {
                activity: [
                    { id: 'vehicles', name: 'Vehicles', description: 'Operating and maneuvering mechanical transports' },
                    { id: 'crafting', name: 'Crafting', description: 'Building, repairing, and shaping physical tools or items' },
                    { id: 'sleightOfHand', name: 'Sleight of Hand', description: 'Subtle, dexterous manipulation or concealment' }
                ],
                situational: [
                    { id: 'highSpeed', name: 'High-Speed Environments', description: 'Vehicles, races, or fast-paced operations' },
                    { id: 'workshopsLabs', name: 'Workshops & Labs', description: 'Precision workspaces with tools, components, and procedures' },
                    { id: 'disasterZones', name: 'Disaster Zones', description: 'Fires, crashes, malfunctions, or other chaotic settings' }
                ]
            },
            mobility: {
                activity: [
                    { id: 'climbing', name: 'Climbing', description: 'Navigating vertical terrain with speed and control' },
                    { id: 'acrobatics', name: 'Acrobatics', description: 'Tumbling, flipping, and maintaining balance in motion' },
                    { id: 'stealth', name: 'Stealth', description: 'Moving silently and remaining unseen' }
                ],
                situational: [
                    { id: 'verticalEnvironments', name: 'Vertical Environments', description: 'Comfortable in areas with ladders, walls, cliffs, or scaffolding' },
                    { id: 'confinedSpaces', name: 'Confined Spaces', description: 'Familiar with cramped hallways, vents, crawlspaces, or tight tunnels' },
                    { id: 'treacherousTerrain', name: 'Treacherous Terrain', description: 'Adept in swamps, rubble, slick surfaces, or loose ground' }
                ]
            },
            endurance: {
                activity: [
                    { id: 'exertion', name: 'Exertion', description: 'Sustained effort under physical stress' },
                    { id: 'resistance', name: 'Resistance', description: 'Withstanding pain, illness, toxins, or conditions' }
                ],
                situational: [
                    { id: 'extremeWeather', name: 'Extreme Weather', description: 'Cold, heat, storms, or other harsh conditions' },
                    { id: 'longOperations', name: 'Long Operations', description: 'Familiarity with extended missions, watches, or survival situations' }
                ]
            },
            power: {
                activity: [
                    { id: 'force', name: 'Force', description: 'Breaking, lifting, shoving, and overpowering obstacles' },
                    { id: 'leaping', name: 'Leaping', description: 'Explosive jumps and extended aerial movement' },
                    { id: 'grappling', name: 'Grappling', description: 'Holding, pinning, or throwing in close combat' }
                ],
                situational: [
                    { id: 'closeQuarters', name: 'Close Quarters Combat', description: 'Environments where space is limited and brute force rules' },
                    { id: 'heavyIndustry', name: 'Heavy Industry', description: 'Warehouses, loading zones, construction sites, or factories' }
                ]
            }
        };
        
        return expertiseData[attribute] || { activity: [], situational: [] };
    }

    getFeatureData() {
        return {
            'Mental/Psychic Powers': [
                {
                    id: 'materialSense',
                    name: 'Material Sense',
                    cost: 1,
                    description: 'Make Awareness checks to identify the composition, age, and origin of objects by touch.'
                },
                {
                    id: 'perfectSenses',
                    name: 'Perfect Senses',
                    cost: 1,
                    description: 'Make Awareness checks to identify sounds, voices, or musical notes with supernatural precision. Make Intelligence checks to know exact time, date, or location.'
                },
                {
                    id: 'telepathy',
                    name: 'Telepathy',
                    cost: 3,
                    description: 'Make Communication checks to establish two-way mental communication with any intelligent being regardless of distance or barriers.'
                },
                {
                    id: 'mindReading',
                    name: 'Mind-Reading',
                    cost: 5,
                    description: 'Make Communication checks to read surface thoughts of conscious beings within line of sight.'
                },
                {
                    id: 'truePrecognition',
                    name: 'True Precognition',
                    cost: 10,
                    description: 'Make Intelligence checks to perceive detailed future events up to days in advance, with accuracy based on roll success.'
                }
            ],
            'Physical Enhancements': [
                {
                    id: 'multiLimbed',
                    name: 'Multi-limbed',
                    cost: 1,
                    description: 'You have additional limbs. Each purchase grants one extra limb.'
                },
                {
                    id: 'mysticGuardian',
                    name: 'Mystic Guardian',
                    cost: 3,
                    description: 'Create temporary magical guardians or constructs for simple tasks like watchmen, couriers, or assistants.'
                },
                {
                    id: 'quantumTunneling',
                    name: 'Quantum Tunneling',
                    cost: 5,
                    description: 'Make Mobility checks to teleport through solid barriers by exploiting quantum mechanics (short range).'
                },
                {
                    id: 'realityRevision',
                    name: 'Reality Revision',
                    cost: 10,
                    description: 'Make Intelligence checks to make minor alterations to recent events (within the last hour), changing their outcomes.'
                }
            ],
            'Crafting/Creation Abilities': [
                {
                    id: 'lock',
                    name: 'Lock',
                    cost: 1,
                    description: 'Place a protective barrier around a container or room. Your resistance bonus is 3 × Intelligence.'
                },
                {
                    id: 'forbiddance',
                    name: 'Forbiddance',
                    cost: 3,
                    description: 'Create a ward protecting up to a 100×100 space area from observation, teleportation, and communication.'
                },
                {
                    id: 'matterManipulation',
                    name: 'Matter Manipulation',
                    cost: 5,
                    description: 'Make Intelligence checks to temporarily convert one mundane material into another with similar weight and density.'
                },
                {
                    id: 'matterCreation',
                    name: 'Matter Creation',
                    cost: 10,
                    description: 'Make Intelligence checks to create small amounts of any non-living matter from quantum foam.'
                }
            ],
            'Social/Network Features': [
                {
                    id: 'debt',
                    name: 'Debt',
                    cost: 1,
                    description: 'Someone owes you something. Work with GM to determine the nature and benefits of this debt.'
                },
                {
                    id: 'sponsor',
                    name: 'Sponsor',
                    cost: 3,
                    description: 'Someone has invested greatly in you, providing access to resources and protection, but you are beholden to them.'
                }
            ],
            'Unique/Specialized Features': [
                {
                    id: 'prophesiedOne',
                    name: 'The Prophesied One',
                    cost: 1,
                    description: 'A prophecy involves you. Believers will go to great lengths to assist you.'
                },
                {
                    id: 'ancestralKnowledge',
                    name: 'Ancestral Knowledge',
                    cost: 3,
                    description: 'You can communicate with ancestral spirits for guidance.'
                },
                {
                    id: 'timePerception',
                    name: 'Time Perception',
                    cost: 5,
                    description: 'Make Awareness checks to perceive the flow of time differently, seeing events in slow motion or accelerated time.'
                },
                {
                    id: 'dimensionalTravel',
                    name: 'Dimensional Travel',
                    cost: 10,
                    description: 'Make Mobility checks to open portals to alternate dimensions, parallel Earths, or entirely different realities.'
                }
            ]
        };
    }

    getSenseData() {
        return {
            '1': [
                {
                    id: 'infraredVision',
                    name: 'Infrared Vision',
                    cost: 1,
                    description: 'See heat signatures through barriers up to 10cm thick. Each additional purchase increases penetration by 10x.'
                },
                {
                    id: 'darkvision',
                    name: 'Darkvision',
                    cost: 1,
                    description: 'Make Awareness checks to see clearly in complete darkness as if it were dim light.'
                },
                {
                    id: 'enhancedHearing',
                    name: 'Enhanced Hearing',
                    cost: 1,
                    description: 'Make Awareness checks to hear sounds at frequencies beyond normal human range or at greater distances.'
                },
                {
                    id: 'lieDetection',
                    name: 'Lie Detection',
                    cost: 1,
                    description: 'Make Awareness checks to detect when someone is deliberately lying or withholding truth.'
                }
            ],
            '3': [
                {
                    id: 'echolocation',
                    name: 'Echolocation',
                    cost: 3,
                    description: 'Make Awareness checks to navigate and identify objects in complete darkness using sound reflection. Range: Tier × 10 Sp.'
                },
                {
                    id: 'thermalVision',
                    name: 'Thermal Vision',
                    cost: 3,
                    description: 'Make Awareness checks to see heat signatures through walls and detect living creatures by body temperature.'
                },
                {
                    id: 'auraSight',
                    name: 'Aura Sight',
                    cost: 3,
                    description: 'Make Awareness checks to perceive emotional states, health conditions, and supernatural auras around living beings.'
                }
            ],
            '5': [
                {
                    id: 'xrayVision',
                    name: 'X-Ray Vision',
                    cost: 5,
                    description: 'Make Awareness checks to see through solid objects up to Tier × 2 Sp thick, revealing hidden structures.'
                },
                {
                    id: 'psychicResonance',
                    name: 'Psychic Resonance',
                    cost: 5,
                    description: 'Make Awareness checks to detect psychic activity, mental powers in use, or lingering psychic imprints.'
                },
                {
                    id: 'lifeDetection',
                    name: 'Life Detection',
                    cost: 5,
                    description: 'Make Awareness checks to sense all living creatures within Tier × 100 Sp, regardless of concealment.'
                }
            ],
            '10': [
                {
                    id: 'omniscientSight',
                    name: 'Omniscient Sight',
                    cost: 10,
                    description: 'Make Awareness checks to perceive events occurring anywhere on Earth that you can clearly visualize.'
                },
                {
                    id: 'temporalVision',
                    name: 'Temporal Vision',
                    cost: 10,
                    description: 'Make Awareness checks to see past or future states of objects and locations with perfect clarity.'
                },
                {
                    id: 'quantumPerception',
                    name: 'Quantum Perception',
                    cost: 10,
                    description: 'Make Awareness checks to perceive probability clouds, quantum states, and potential realities simultaneously.'
                }
            ]
        };
    }

    getMovementData() {
        return [
            {
                id: 'wallWalking',
                name: 'Wall Walking',
                cost: 5,
                description: 'Move on walls and ceilings at normal speed, defying gravity on solid surfaces. Change orientation as part of movement.'
            },
            {
                id: 'burrowing',
                name: 'Burrowing',
                cost: 5,
                description: 'Move through earth, sand, or loose rock at half speed. Create temporary tunnels that collapse after you pass.'
            },
            {
                id: 'flight',
                name: 'Flight',
                cost: 10,
                description: 'Move in any direction at full speed with perfect maneuverability. Hover in place and ignore ground obstacles.'
            },
            {
                id: 'phasing',
                name: 'Phasing',
                cost: 10,
                description: 'Selectively phase through solid barriers. Move through walls, floors, and objects at normal speed.'
            },
            {
                id: 'shortTeleportation',
                name: 'Short-Range Teleportation',
                cost: 10,
                description: 'Instantly teleport to any visible location within movement range. Ignores obstacles and opportunity attacks.'
            },
            {
                id: 'portalCreation',
                name: 'Portal Creation',
                cost: 10,
                description: 'Create two linked portals as part of movement. Any creature can move through portals. Persist until next turn.'
            }
        ];
    }

    getDescriptorData() {
        return {
            'Elemental Descriptors': [
                {
                    id: 'fire',
                    name: 'Fire',
                    cost: 5,
                    description: 'Mastery over flame and heat, enabling forging, temperature control, and thermal detection.',
                    applications: ['Forge materials without tools', 'Melt locks', 'Create emergency lighting', 'Heat immunity']
                },
                {
                    id: 'water',
                    name: 'Water',
                    cost: 5,
                    description: 'Control over water in all its forms, from purification to weather manipulation.',
                    applications: ['Purify contaminated water', 'Create ice tools', 'Navigate underwater', 'Drowning immunity']
                },
                {
                    id: 'earth',
                    name: 'Earth',
                    cost: 5,
                    description: 'Influence over stone, soil, and geological forces.',
                    applications: ['Locate mineral deposits', 'Create stone tools', 'Navigate underground', 'Crushing immunity']
                },
                {
                    id: 'air',
                    name: 'Air',
                    cost: 5,
                    description: 'Command over wind, weather, and atmospheric phenomena.',
                    applications: ['Create updrafts', 'Carry messages via wind', 'Clear toxic gases', 'Suffocation immunity']
                },
                {
                    id: 'lightning',
                    name: 'Lightning',
                    cost: 5,
                    description: 'Mastery over electrical forces and electromagnetic fields.',
                    applications: ['Power electronic devices', 'Generate electromagnetic fields', 'Electrical immunity']
                },
                {
                    id: 'ice',
                    name: 'Ice',
                    cost: 5,
                    description: 'Control over cold and frozen matter.',
                    applications: ['Preserve materials indefinitely', 'Create ice constructs', 'Generate sub-zero environments', 'Cold immunity']
                }
            ],
            'Energy Descriptors': [
                {
                    id: 'kinetic',
                    name: 'Kinetic',
                    cost: 5,
                    description: 'Manipulation of motion and force vectors.',
                    applications: ['Enhance projectile force', 'Ignore movement impediments', 'Absorb kinetic energy', 'Impact immunity']
                },
                {
                    id: 'plasma',
                    name: 'Plasma',
                    cost: 5,
                    description: 'Control over high-energy plasma states.',
                    applications: ['Generate plasma fields', 'Detect energy sources', 'Manipulate plasma materials', 'Radiation immunity']
                }
            ],
            'Specialized Descriptors': [
                {
                    id: 'biological',
                    name: 'Biological',
                    cost: 5,
                    description: 'Mastery over living systems and biological processes.',
                    applications: ['Accelerated healing', 'Toxin mastery', 'Animal connection', 'Disease immunity']
                },
                {
                    id: 'technology',
                    name: 'Technology',
                    cost: 5,
                    description: 'Interface with and control technological systems.',
                    applications: ['Machine communication', 'System override', 'Remote control', 'Surveillance immunity']
                },
                {
                    id: 'mental',
                    name: 'Mental',
                    cost: 5,
                    description: 'Influence over thoughts, emotions, and consciousness.',
                    applications: ['Memory sharing', 'Emotion amplification', 'Psychic defense', 'Mental immunity']
                },
                {
                    id: 'arcane',
                    name: 'Arcane',
                    cost: 5,
                    description: 'Understanding and manipulation of magical forces.',
                    applications: ['Magic detection', 'Glyph mastery', 'Artifact sense', 'Magic immunity']
                }
            ],
            'Reality Descriptors': [
                {
                    id: 'time',
                    name: 'Time',
                    cost: 10,
                    description: 'Manipulation of temporal flow and chronological events.',
                    applications: ['Temporal perception', 'Historical investigation', 'Time acceleration/reversal']
                },
                {
                    id: 'space',
                    name: 'Space',
                    cost: 10,
                    description: 'Control over spatial dimensions and geometric relationships.',
                    applications: ['Dimensional analysis', 'Distance manipulation', 'Geometric construction']
                },
                {
                    id: 'probability',
                    name: 'Probability',
                    cost: 10,
                    description: 'Influence over chance, luck, and statistical outcomes.',
                    applications: ['Outcome analysis', 'Luck adjustment', 'Chaos detection']
                },
                {
                    id: 'atomic',
                    name: 'Atomic',
                    cost: 10,
                    description: 'Manipulation of matter at the subatomic level.',
                    applications: ['Atomic perception', 'Density alteration', 'Environmental immunity']
                },
                {
                    id: 'cosmic',
                    name: 'Cosmic',
                    cost: 10,
                    description: 'Connection to universal forces and cosmic phenomena.',
                    applications: ['Universal knowledge', 'Cosmic presence', 'Energy mastery']
                }
            ]
        };
    }

    // Helper methods for finding data
    findFeatureById(id) {
        const categories = this.getFeatureData();
        for (const features of Object.values(categories)) {
            const feature = features.find(f => f.id === id);
            if (feature) return feature;
        }
        return null;
    }

    findSenseById(id) {
        const tiers = this.getSenseData();
        for (const senses of Object.values(tiers)) {
            const sense = senses.find(s => s.id === id);
            if (sense) return sense;
        }
        return null;
    }

    findMovementById(id) {
        const movements = this.getMovementData();
        return movements.find(m => m.id === id);
    }

    findDescriptorById(id) {
        const categories = this.getDescriptorData();
        for (const descriptors of Object.values(categories)) {
            const descriptor = descriptors.find(d => d.id === id);
            if (descriptor) return descriptor;
        }
        return null;
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}