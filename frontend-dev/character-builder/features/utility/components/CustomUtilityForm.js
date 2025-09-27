import { RenderUtils } from '../../../shared/utils/RenderUtils.js';

export class CustomUtilityForm {
    constructor(builder) {
        this.builder = builder;
    }

    render(categoryKey) {
        const categoryName = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1).slice(0, -1);
        
        const formContent = `
            <div class="custom-utility-form" style="display: none;">
                ${RenderUtils.renderFormGroup({
                    label: 'Name:',
                    inputId: `custom-utility-name-${categoryKey}`,
                    inputHtml: `<input type="text" id="custom-utility-name-${categoryKey}" class="custom-utility-input" placeholder="Enter ${categoryName.toLowerCase()} name" maxlength="50">`
                })}
                
                ${RenderUtils.renderFormGroup({
                    label: 'Description:',
                    inputId: `custom-utility-description-${categoryKey}`,
                    inputHtml: `<textarea id="custom-utility-description-${categoryKey}" class="custom-utility-input" rows="3" placeholder="Describe the ${categoryName.toLowerCase()}'s effects" maxlength="300"></textarea>`
                })}
                
                ${RenderUtils.renderFormGroup({
                    label: 'Point Cost:',
                    inputId: `custom-utility-cost-${categoryKey}`,
                    inputHtml: `<input type="number" id="custom-utility-cost-${categoryKey}" class="custom-utility-input" placeholder="Enter cost" min="1" max="50" value="5">`
                })}
                
                <div class="form-actions">
                    ${RenderUtils.renderButton({
                        text: `Create Custom ${categoryName}`,
                        variant: 'primary',
                        size: 'small',
                        dataAttributes: { action: 'create-custom-utility', 'category-key': categoryKey },
                        id: `create-custom-utility-btn-${categoryKey}`
                    })}
                    ${RenderUtils.renderButton({
                        text: 'Cancel',
                        variant: 'secondary',
                        size: 'small',
                        dataAttributes: { action: 'cancel-custom-utility', 'category-key': categoryKey }
                    })}
                </div>
            </div>
            
            <div class="card-action">
                ${RenderUtils.renderButton({
                    text: `Create Custom ${categoryName}`,
                    variant: 'primary',
                    size: 'small',
                    dataAttributes: { action: 'show-custom-utility-form', 'category-key': categoryKey }
                })}
            </div>
        `;

        return RenderUtils.renderCard({
            title: `Create Custom ${categoryName}`,
            description: `Design your own custom ${categoryName.toLowerCase()} ability.`,
            additionalContent: formContent,
            clickable: false,
            disabled: false,
            dataAttributes: { 'category-key': categoryKey }
        }, { cardClass: `custom-utility-card ${categoryKey.slice(0, -1)}-card` });
    }

    showForm(categoryKey) {
        const form = document.querySelector(`[data-category-key="${categoryKey}"] .custom-utility-form`);
        const createButton = document.querySelector(`[data-category-key="${categoryKey}"] .card-action`);
        
        if (form) {
            form.style.display = 'block';
        }
        if (createButton) {
            createButton.style.display = 'none';
        }
    }

    cancelForm(categoryKey) {
        const form = document.querySelector(`[data-category-key="${categoryKey}"] .custom-utility-form`);
        const createButton = document.querySelector(`[data-category-key="${categoryKey}"] .card-action`);
        
        if (form) {
            form.style.display = 'none';
            const nameInput = document.getElementById(`custom-utility-name-${categoryKey}`);
            const descInput = document.getElementById(`custom-utility-description-${categoryKey}`);
            const costInput = document.getElementById(`custom-utility-cost-${categoryKey}`);
            
            if (nameInput) nameInput.value = '';
            if (descInput) descInput.value = '';
            if (costInput) costInput.value = '5';
        }
        if (createButton) {
            createButton.style.display = 'block';
        }
    }

    getFormData(categoryKey) {
        const nameInput = document.getElementById(`custom-utility-name-${categoryKey}`);
        const descriptionInput = document.getElementById(`custom-utility-description-${categoryKey}`);
        const costInput = document.getElementById(`custom-utility-cost-${categoryKey}`);

        if (!nameInput || !descriptionInput || !costInput) {
            throw new Error('Custom utility form not found');
        }

        return {
            name: nameInput.value.trim(),
            description: descriptionInput.value.trim(),
            cost: Number(costInput.value),
            category: categoryKey
        };
    }
}