document.addEventListener('DOMContentLoaded', () => {
    // Check if food error exists in session
    const isFoodError = sessionStorage.getItem('isFoodError') === 'true';

    if (isFoodError) {
        showFoodError();
        return;
    }

    // Retrieve data from session storage
    const data = {
        image: sessionStorage.getItem('uploadedImage'),
        name: sessionStorage.getItem('foodName') || 'Delicious Meal',
        weight: sessionStorage.getItem('mealWeight') || '100',
        fileName: sessionStorage.getItem('mealFileName') || 'upload.jpg',
        size: sessionStorage.getItem('mealImageSize') || '2.45 MB',
        res: sessionStorage.getItem('mealResolution') || '1920x1280',
        confidence: sessionStorage.getItem('foodConfidence') || 0,
        isFoodConfidence: sessionStorage.getItem('isFoodConfidence') || 0,
        nutritionData: sessionStorage.getItem('nutritionData'),
        ingredientsData: sessionStorage.getItem('ingredientsList')
    };

    console.log('=== DEBUG SESSIONSTORAGE ===');
    console.log('foodName:', sessionStorage.getItem('foodName'));
    console.log('nutritionData raw:', sessionStorage.getItem('nutritionData'));
    console.log('ingredientsList raw:', sessionStorage.getItem('ingredientsList'));
    console.log('analysisType:', sessionStorage.getItem('analysisType'));
    console.log('isFoodConfidence:', data.isFoodConfidence);

    // Update DOM elements with meal data
    const mealImage = document.getElementById('mealImage');
    if (mealImage) {
        if (data.image && data.image !== 'null' && data.image !== '') {
            mealImage.src = data.image;
        } else {
            mealImage.src = "{% static 'images/food.png' %}";
            mealImage.alt = "Default food image";
        }
    }

    const foodNameEl = document.getElementById('foodName');
    if (foodNameEl) {
        foodNameEl.innerText = data.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    const fileNameEl = document.getElementById('fileName');
    if (fileNameEl) {
        fileNameEl.innerText = data.fileName;
    }

    const weightDisplay = document.getElementById('mealWeight');
    if (weightDisplay) {
        if (data.weight && data.weight !== '' && data.weight !== 'null') {
            weightDisplay.textContent = `${data.weight} g`;
        } else {
            weightDisplay.textContent = '100 g (default)';
        }
    }

    const imageSizeEl = document.getElementById('imageSize');
    if (imageSizeEl) {
        imageSizeEl.innerText = data.size;
    }

    const resolutionEl = document.getElementById('resolution');
    if (resolutionEl) {
        resolutionEl.innerText = data.res;
    }

    const timestampEl = document.getElementById('timestamp');
    if (timestampEl) {
        timestampEl.innerText = new Date().toLocaleTimeString();
    }

    // Update food confidence circle
    const circle = document.getElementById('confidenceCircle');
    const text = document.getElementById('confidenceText');

    if (circle && text) {
        const circumference = 2 * Math.PI * 50;
        const confidence = parseFloat(data.confidence) || 0;
        const clampedConfidence = Math.min(Math.max(confidence, 0), 100);
        const offset = circumference - (clampedConfidence / 100 * circumference);

        circle.style.strokeDashoffset = offset;
        text.innerText = `${clampedConfidence.toFixed(2)}%`;
    }

    // Update food detection confidence circle
    const isFoodCircle = document.getElementById('isFoodConfidenceCircle');
    const isFoodText = document.getElementById('isFoodConfidenceText');

    if (isFoodCircle && isFoodText) {
        const circumference = 2 * Math.PI * 50;
        const isFoodConf = parseFloat(data.isFoodConfidence) || 0;
        const clamped = Math.min(Math.max(isFoodConf, 0), 100);
        const offset = circumference - (clamped / 100 * circumference);
        isFoodCircle.style.strokeDashoffset = offset;
        isFoodText.innerText = `${clamped.toFixed(2)}%`;
    }

    // Display nutrition data
    if (data.nutritionData) {
        try {
            const nutrition = JSON.parse(data.nutritionData);
            console.log('✅ Parsed Nutrition:', nutrition);

            const nutriVals = document.querySelectorAll('.nutri-val');
            const keys = ['calories', 'protein', 'carbohydrates', 'fats', 'fiber', 'sugars', 'sodium'];

            nutriVals.forEach((el, index) => {
                if (index < keys.length) {
                    const key = keys[index];
                    const value = nutrition[key];
                    if (value !== undefined && value !== null) {
                        el.textContent = value;
                        console.log(`✅ Set ${key} to ${value}`);
                    }
                }
            });

        } catch (e) {
            console.error('Error parsing nutrition data:', e);
        }
    }

    // Display ingredients list
    let ingredientsList = [];

    if (data.ingredientsData && data.ingredientsData !== 'null') {
        try {
            ingredientsList = JSON.parse(data.ingredientsData);
            console.log('✅ Ingredients from ingredientsList:', ingredientsList);
        } catch (e) {
            console.warn('Error parsing ingredientsData:', e);
        }
    }

    if (!ingredientsList || ingredientsList.length === 0) {
        if (data.nutritionData) {
            try {
                const nutrition = JSON.parse(data.nutritionData);
                if (nutrition.ingredients && nutrition.ingredients.length > 0) {
                    ingredientsList = nutrition.ingredients;
                    console.log('✅ Ingredients from nutritionData:', ingredientsList);
                }
            } catch (e) {
                console.warn('Could not extract ingredients from nutritionData');
            }
        }
    }

    if (!ingredientsList || ingredientsList.length === 0) {
        const foodName = data.name || 'Unknown Food';
        ingredientsList = [
            `${foodName} (Main)`,
            'Ingredients not available',
            'Please update the food database'
        ];
        console.log('⚠️ Using fallback ingredients list');
    }

    renderIngredients(ingredientsList);

    // Tab management
    const analysisType = sessionStorage.getItem('analysisType') || 'nutrition';

    const defaultTabId = (analysisType === 'ingredients') ? 'ingredients-content' : 'nutrition-content';
    const defaultButton = document.querySelector(`[data-target="${defaultTabId}"]`);

    if (defaultButton) {
        activateTab(defaultButton, defaultTabId);
    } else {
        const firstTab = document.querySelector('.tab-btn');
        if (firstTab) {
            const firstTarget = firstTab.getAttribute('data-target');
            activateTab(firstTab, firstTarget);
        }
    }

    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', function() {
            const target = this.getAttribute('data-target');

            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

            this.classList.add('active');
            const targetPane = document.getElementById(target);
            if (targetPane) {
                targetPane.classList.add('active');
            }

            if (target === 'nutrition-content') {
                const nutritionStr = sessionStorage.getItem('nutritionData');
                if (nutritionStr) {
                    try {
                        const nutrition = JSON.parse(nutritionStr);
                        const nutriVals = document.querySelectorAll('.nutri-val');
                        const keys = ['calories', 'protein', 'carbohydrates', 'fats', 'fiber', 'sugars', 'sodium'];
                        nutriVals.forEach((el, index) => {
                            if (index < keys.length) {
                                const key = keys[index];
                                if (nutrition[key] !== undefined && nutrition[key] !== null) {
                                    el.textContent = nutrition[key];
                                }
                            }
                        });
                    } catch (e) {
                        console.error('Error updating nutrition display:', e);
                    }
                }
            }

            if (target === 'ingredients-content') {
                const ingredientsStr = sessionStorage.getItem('ingredientsList');
                if (ingredientsStr) {
                    try {
                        const ingredients = JSON.parse(ingredientsStr);
                        renderIngredients(ingredients);
                    } catch (e) {
                        console.error('Error parsing ingredients:', e);
                    }
                }
            }
        });
    });

    const analyzeBtn = document.getElementById('analyzeAgainBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', () => {
            document.body.style.transition = "opacity 0.5s ease";
            document.body.style.opacity = "0";

            setTimeout(() => {
                window.location.href = '/upload/';
            }, 500);
        });
    }
});

// Display food not detected error UI
function showFoodError() {
    const emoji = sessionStorage.getItem('errorEmoji') || '🍽️';
    const message = sessionStorage.getItem('errorMessage') || 'No food detected';
    const detail = sessionStorage.getItem('errorDetail') || '';
    const tip = sessionStorage.getItem('errorTip') || '';
    const confidence = parseFloat(sessionStorage.getItem('foodConfidence')) || 0;

    const radius = 42;
    const circumference = 2 * Math.PI * radius;

    const clampedConfidence = Math.min(Math.max(confidence, 0), 100);
    const offset = circumference - (clampedConfidence / 100 * circumference);

    const errorHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            padding: 40px;
            text-align: center;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            border-radius: 20px;
            margin: 20px;
            position: relative;
            overflow: hidden;
        ">
            <div style="
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle at center, rgba(255, 100, 100, 0.1) 0%, transparent 70%);
                animation: pulseGlow 3s ease-in-out infinite;
            "></div>
            
            <div style="
                font-size: 120px;
                margin-bottom: 20px;
                animation: float 3s ease-in-out infinite;
                position: relative;
                z-index: 1;
            ">
                ${emoji}
            </div>
            
            <h1 style="
                color: #ff6b6b;
                font-size: 36px;
                margin-bottom: 15px;
                position: relative;
                z-index: 1;
            ">
                ${message}
            </h1>
            
            <p style="
                color: #e0e0e0;
                font-size: 18px;
                max-width: 500px;
                margin-bottom: 15px;
                position: relative;
                z-index: 1;
                line-height: 1.6;
            ">
                ${detail}
            </p>
            
            ${tip ? `
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px 25px;
                    border-radius: 10px;
                    margin: 15px 0;
                    max-width: 450px;
                    position: relative;
                    z-index: 1;
                    border-left: 4px solid #ff6b6b;
                ">
                    <p style="
                        color: #ffd93d;
                        font-size: 16px;
                        margin: 0;
                    ">
                        💡 ${tip}
                    </p>
                </div>
            ` : ''}
            
            <div style="
                margin: 20px 0;
                position: relative;
                z-index: 1;
            ">
                <div class="progress-ring" style="
                    position: relative;
                    width: 120px;
                    height: 120px;
                    margin: 0 auto;
                ">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="${radius}" style="
                            fill: none;
                            stroke: rgba(255,255,255,0.1);
                            stroke-width: 8;
                        "/>
                        <circle cx="60" cy="60" r="${radius}" style="
                            fill: none;
                            stroke: #ff6b6b;
                            stroke-width: 8;
                            stroke-linecap: round;
                            transform: rotate(-90deg);
                            transform-origin: 60px 60px;
                            stroke-dasharray: ${circumference};
                            stroke-dashoffset: ${offset};
                            transition: stroke-dashoffset 1.5s ease;
                        "/>
                    </svg>
                    <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        color: white;
                        font-size: 22px;
                        font-weight: bold;
                    ">
                        ${Math.round(clampedConfidence)}%
                    </div>
                </div>
                <p style="
                    color: #888;
                    font-size: 14px;
                    margin-top: 8px;
                ">
                    AI Confidence Score
                </p>
            </div>
            
            <button onclick="window.location.href='/upload/'" style="
                background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                color: white;
                border: none;
                padding: 15px 40px;
                border-radius: 30px;
                font-size: 18px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                z-index: 1;
                margin-top: 10px;
                box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
            "
            onmouseover="this.style.transform='scale(1.05)'"
            onmouseout="this.style.transform='scale(1)'"
            >
                📸 Try Another Image
            </button>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }
        @keyframes pulseGlow {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.1); }
        }
    `;
    document.head.appendChild(style);

    let container = document.querySelector('.results-main');
    if (!container) {
        container = document.querySelector('main') || document.querySelector('.container') || document.body;
    }

    if (!container) {
        container = document.body;
    }

    container.innerHTML = errorHTML;
}

// Helper functions
function activateTab(button, targetId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

    if (button) {
        button.classList.add('active');
    }

    const targetPane = document.getElementById(targetId);
    if (targetPane) {
        targetPane.classList.add('active');
    }

    if (targetId === 'nutrition-content') {
        const nutritionStr = sessionStorage.getItem('nutritionData');
        if (nutritionStr) {
            try {
                const nutrition = JSON.parse(nutritionStr);
                const nutriVals = document.querySelectorAll('.nutri-val');
                const keys = ['calories', 'protein', 'carbohydrates', 'fats', 'fiber', 'sugars', 'sodium'];
                nutriVals.forEach((el, index) => {
                    if (index < keys.length) {
                        const key = keys[index];
                        if (nutrition[key] !== undefined && nutrition[key] !== null) {
                            el.textContent = nutrition[key];
                        }
                    }
                });
            } catch (e) {
                console.error('Error updating nutrition display:', e);
            }
        }
    }

    if (targetId === 'ingredients-content') {
        const ingredientsStr = sessionStorage.getItem('ingredientsList');
        if (ingredientsStr) {
            try {
                const ingredients = JSON.parse(ingredientsStr);
                renderIngredients(ingredients);
            } catch (e) {
                console.error('Error parsing ingredients:', e);
            }
        }
    }
}

function renderIngredients(list) {
    const wrap = document.getElementById("ingredientsList");
    const countEl = document.getElementById("ingredientsCount");

    if (!wrap) {
        console.warn('Ingredients list wrapper not found');
        return;
    }

    wrap.innerHTML = "";

    if (!list || list.length === 0) {
        wrap.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No ingredients found</p>';
        if (countEl) countEl.textContent = '0';
        return;
    }

    if (countEl) {
        countEl.textContent = list.length;
    }

    list.forEach(name => {
        if (name && name.trim() !== '') {
            const pill = document.createElement("div");
            pill.className = "ingredient-pill";
            pill.innerHTML = `
                <span class="ingredient-check"><i class="fas fa-check"></i></span>
                <span class="ingredient-name">${escapeHtml(name.trim())}</span>
            `;
            wrap.appendChild(pill);
        }
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}