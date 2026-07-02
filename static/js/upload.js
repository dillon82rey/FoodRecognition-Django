document.addEventListener("DOMContentLoaded", () => {
    // DOM element references
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadContent = document.getElementById('upload-content');
    const previewCard = document.getElementById("preview-card");
    const previewImgElement = document.getElementById("preview-img-element");
    const detailName = document.getElementById("detail-name");
    const detailSize = document.getElementById("detail-size");
    const detailResolution = document.getElementById("detail-resolution");
    const analyzeBtn = document.getElementById('analyze-btn');
    const weightInput = document.getElementById("meal-weight");
    const weightError = document.getElementById("weight-error");

    // Get analysis type from URL and store in session
    const urlParams = new URLSearchParams(window.location.search);
    const analysisType = urlParams.get('type') || 'nutrition';
    sessionStorage.setItem("analysisType", analysisType);

    let selectedImageData = "";
    let selectedFile = null;
    let selectedResolution = "";

    // Click handler to open file picker
    if (dropZone) {
        dropZone.addEventListener('click', () => fileInput.click());
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
    }

    // Drag and drop event handlers
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        if (dropZone) {
            dropZone.addEventListener(eventName, preventDefaults, false);
        }
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        if (dropZone) {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        }
    });

    ['dragleave', 'drop'].forEach(eventName => {
        if (dropZone) {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        }
    });

    if (dropZone) {
        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            handleFiles(files);
        });
    }

    // File handling function
    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {

                const reader = new FileReader();
                reader.onload = (e) => {
                    if (uploadContent) {
                        uploadContent.innerHTML = `
                            <div class="preview-container">
                                <img src="${e.target.result}" alt="Preview" class="preview-img fade-in">
                                <p class="file-name">${file.name}</p>
                            </div>
                        `;
                    }
                };
                reader.readAsDataURL(file);

                showImagePreview(file);
            }
        }
    }

    // Show preview card with file details
    function showImagePreview(file) {
        if (!file) return;

        if (detailName) detailName.textContent = file.name;
        if (detailSize) detailSize.textContent = (file.size / (1024 * 1024)).toFixed(2) + " MB";

        const reader = new FileReader();
        reader.onload = function (e) {
            if (previewImgElement) {
                previewImgElement.src = e.target.result;
            }
            selectedImageData = e.target.result;

            const tempImg = new Image();
            tempImg.onload = function () {
                if (detailResolution) {
                    detailResolution.textContent = `${tempImg.width} x ${tempImg.height} px`;
                }

                if (previewCard) {
                    previewCard.classList.remove("hidden");
                    previewCard.classList.add("visible");
                }
            };
            tempImg.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Validate weight input
    function validateWeight() {
        if (!weightInput || !weightError) return true;

        const value = weightInput.value.trim();

        if (value === "") {
            weightError.textContent = "";
            return true;
        }

        const num = Number(value);
        if (Number.isNaN(num) || num <= 0) {
            weightError.textContent = "Weight must be greater than zero if specified.";
            return false;
        }

        weightError.textContent = "";
        return true;
    }

    // Weight input event listeners
    if (weightInput) {
        weightInput.addEventListener("input", validateWeight);
        weightInput.addEventListener("blur", validateWeight);
    }

    // Analyze button handler
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', () => {
            const isImageUploaded = previewCard && previewCard.classList.contains('visible');
            const isWeightValid = validateWeight();

            if (!isImageUploaded) {
                analyzeBtn.classList.add('error-shake');
                alert("Please upload a food image first!");
                setTimeout(() => analyzeBtn.classList.remove('error-shake'), 500);
                return;
            }

            if (!isWeightValid) {
                if (weightInput) weightInput.focus();
                return;
            }

            // Store data in session
            sessionStorage.setItem("uploadedImage", selectedImageData);
            const weightValue = weightInput ? weightInput.value.trim() : '';
            sessionStorage.setItem("mealWeight", weightValue);
            sessionStorage.setItem("mealFileName", detailName ? detailName.textContent : 'meal.jpg');
            sessionStorage.setItem("mealImageSize", detailSize ? detailSize.textContent : '0 MB');
            sessionStorage.setItem("mealResolution", detailResolution ? detailResolution.textContent : '0x0');
            sessionStorage.setItem("analysisType", analysisType);

            analyzeBtn.innerHTML = `<span>Processing...</span> <i class="fa-solid fa-spinner fa-spin"></i>`;

            setTimeout(() => {
                window.location.href = "/analyzing/";
            }, 800);
        });
    }
});