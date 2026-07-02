document.addEventListener("DOMContentLoaded", () => {
  // Load uploaded meal metadata from session storage
  const uploadedMealImg = document.getElementById("uploaded-meal-img");
  const mealWeightValue = document.getElementById("meal-weight-value");
  const mealResolutionValue = document.getElementById("meal-resolution-value");
  const mealSizeValue = document.getElementById("meal-size-value");
  const mealFileName = document.getElementById("meal-file-name");

  const storedImage = sessionStorage.getItem("uploadedImage");
  const storedWeight = sessionStorage.getItem("mealWeight");
  const storedFileName = sessionStorage.getItem("mealFileName");
  const storedImageSize = sessionStorage.getItem("mealImageSize");
  const storedResolution = sessionStorage.getItem("mealResolution");
  const analysisType = sessionStorage.getItem("analysisType") || 'nutrition';

  if (storedImage && uploadedMealImg) {
    uploadedMealImg.src = storedImage;
  }
  if (storedWeight && mealWeightValue) {
    mealWeightValue.textContent = storedWeight;
  }
  if (storedFileName && mealFileName) {
    mealFileName.textContent = storedFileName;
  }
  if (storedImageSize && mealSizeValue) {
    mealSizeValue.textContent = storedImageSize;
  }
  if (storedResolution && mealResolutionValue) {
    mealResolutionValue.textContent = storedResolution;
  }

  // Display image in scanner view
  const scannerFoodImage = document.getElementById("scanner-food-image");
  if (storedImage && scannerFoodImage) {
    scannerFoodImage.src = storedImage;
  }

  // Pipeline and progress bar elements
  const pipelineSteps = Array.from(document.querySelectorAll(".pipeline-step"));
  const progressBarFill = document.getElementById("progress-bar-fill");
  const progressPercent = document.getElementById("progress-percent");
  const remainingTimeEl = document.getElementById("remaining-seconds");

  const TOTAL_STEPS = pipelineSteps.length;
  const TOTAL_DURATION = 6000;
  const stepDuration = TOTAL_DURATION / TOTAL_STEPS;

  let currentStep = 0;
  let animationStarted = false;
  let remainingInterval = null;

  // Update step visual state
  function setStepState(stepEl, state) {
    stepEl.classList.remove("completed", "active", "pending");

    if (state === "completed") {
      stepEl.classList.add("completed");
    } else if (state === "active") {
      stepEl.classList.add("active");
    } else {
      stepEl.classList.add("pending");
    }

    const bar = stepEl.querySelector(".step-bar");
    if (bar) {
      bar.classList.remove("filled", "loading");
      if (state === "completed") bar.classList.add("filled");
      if (state === "active") bar.classList.add("loading");
    }

    const icon = stepEl.querySelector(".step-icon i");
    if (icon) {
      icon.classList.remove("fa-check", "fa-spinner", "spinner", "fa-hourglass");
      if (state === "completed") {
        icon.className = "fa-solid fa-check";
      } else if (state === "active") {
        icon.className = "fa-solid fa-spinner spinner";
      } else {
        icon.className = "fa-regular fa-hourglass";
      }
    }

    const statusText = stepEl.querySelector(".step-status");
    if (statusText) {
      statusText.classList.remove("completed-text", "active-text");
      if (state === "completed") statusText.classList.add("completed-text");
      if (state === "active") statusText.classList.add("active-text");
    }
  }

  // Initialize pipeline steps
  pipelineSteps.forEach((step, index) => {
    if (index === 0) {
      setStepState(step, "completed");
    } else {
      setStepState(step, "pending");
    }
  });

  function activateFirstStep() {
    if (pipelineSteps.length > 1) {
      setStepState(pipelineSteps[1], "active");
    }
  }

  // Run synchronized pipeline and progress bar animation
  function startSynchronizedAnimation() {
    if (animationStarted) return;
    animationStarted = true;

    let progress = 0;
    let remainingTime = Math.ceil(TOTAL_DURATION / 1000);

    if (remainingTimeEl) {
      remainingTimeEl.textContent = `${remainingTime} Seconds`;
    }

    if (remainingInterval) clearInterval(remainingInterval);
    remainingInterval = setInterval(() => {
      remainingTime--;
      if (remainingTimeEl) {
        remainingTimeEl.textContent = `${Math.max(remainingTime, 0)} Seconds`;
      }
      if (remainingTime <= 1) {
        clearInterval(remainingInterval);
        remainingInterval = null;
      }
    }, 1000);

    activateFirstStep();

    const interval = setInterval(() => {
      progress += 800;
      const percent = Math.min(Math.floor((progress / TOTAL_DURATION) * 100), 100);

      if (progressBarFill) progressBarFill.style.width = percent + "%";
      if (progressPercent) progressPercent.textContent = percent + "%";

      const stepIndex = Math.min(Math.floor(progress / stepDuration), TOTAL_STEPS - 1);

      if (stepIndex > currentStep) {
        setStepState(pipelineSteps[currentStep], "completed");
        currentStep = stepIndex;
        if (currentStep < TOTAL_STEPS) {
          setStepState(pipelineSteps[currentStep], "active");
        }
      }

      if (progress >= TOTAL_DURATION) {
        clearInterval(interval);
        setStepState(pipelineSteps[TOTAL_STEPS - 1], "completed");

        if (remainingInterval) {
          clearInterval(remainingInterval);
          remainingInterval = null;
        }
        if (remainingTimeEl) {
          remainingTimeEl.textContent = "0 Seconds";
        }

        setTimeout(() => {
          window.location.href = "/results/";
        }, 600);
      }
    }, 800);
  }

  // Send image data to backend API for analysis
  function sendImageForAnalysis() {
    const imageData = sessionStorage.getItem('uploadedImage');
    const weight = sessionStorage.getItem('mealWeight') || '100';
    const analysisType = sessionStorage.getItem('analysisType') || 'nutrition';

    if (!imageData) {
      console.error('No image found!');
      setTimeout(() => {
        window.location.href = "/upload/";
      }, 1000);
      return;
    }

    function dataURLtoBlob(dataURL) {
      const arr = dataURL.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    }

    function getCookie(name) {
      let cookieValue = null;
      if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
          }
        }
      }
      return cookieValue;
    }

    const blob = dataURLtoBlob(imageData);
    const formData = new FormData();
    formData.append('image', blob, 'meal.jpg');
    formData.append('weight', weight);
    formData.append('type', analysisType);

    console.log('Sending image for analysis... Type:', analysisType);

    fetch('/api/analyze/', {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCookie('csrftoken'),
      },
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => {
          throw err;
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('✅ Analysis result:', data);

      sessionStorage.setItem('foodName', data.food_name);
      sessionStorage.setItem('foodConfidence', data.food_confidence);
      sessionStorage.setItem('isFoodConfidence', data.is_food_confidence || 0);
      sessionStorage.setItem('analysisType', analysisType);

      const nutritionData = {
        calories: data.calories || 0,
        protein: data.protein || 0,
        carbohydrates: data.carbohydrates || 0,
        fats: data.fats || 0,
        fiber: data.fiber || 0,
        sugars: data.sugars || 0,
        sodium: data.sodium || 0
      };
      sessionStorage.setItem('nutritionData', JSON.stringify(nutritionData));
      console.log('✅ Saved nutritionData:', nutritionData);

      if (data.ingredients && data.ingredients.length > 0) {
        sessionStorage.setItem('ingredientsList', JSON.stringify(data.ingredients));
        console.log('✅ Saved ingredients:', data.ingredients);
      } else {
        const fallbackIngredients = ['Ingredients not available from server'];
        sessionStorage.setItem('ingredientsList', JSON.stringify(fallbackIngredients));
        console.log('⚠️ Using fallback ingredients');
      }

      sessionStorage.removeItem('isFoodError');
      sessionStorage.removeItem('errorMessage');
      sessionStorage.removeItem('errorDetail');
      sessionStorage.removeItem('errorEmoji');
      sessionStorage.removeItem('errorTip');

      startSynchronizedAnimation();
    })
    .catch(error => {
      console.error('Error during analysis:', error);

      if (error.error === 'no_food_detected' ||
          error.message === 'No food detected in the image' ||
          (error.error && error.error.includes('food'))) {

        sessionStorage.setItem('isFoodError', 'true');
        sessionStorage.setItem('foodConfidence', error.food_confidence || 0);
        sessionStorage.setItem('errorMessage', error.message || '🤔 This doesn\'t look like food!');
        sessionStorage.setItem('errorDetail', error.detail || 'The image you uploaded doesn\'t appear to contain any food.');
        sessionStorage.setItem('errorEmoji', error.emoji || '🍽️');
        sessionStorage.setItem('errorTip', error.tip || 'Try taking a photo from a different angle or with better lighting.');
        sessionStorage.setItem('foodName', 'No Food Detected');
        sessionStorage.setItem('isFoodConfidence', error.food_confidence || 0);

        sessionStorage.removeItem('nutritionData');
        sessionStorage.removeItem('ingredientsList');

        setTimeout(() => {
          window.location.href = "/results/";
        }, 1000);
        return;
      }

      const errorMessage = document.createElement('div');
      errorMessage.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.95);
        color: white;
        padding: 30px 50px;
        border-radius: 15px;
        z-index: 9999;
        font-size: 18px;
        text-align: center;
        box-shadow: 0 0 50px rgba(255, 0, 0, 0.5);
        max-width: 500px;
        backdrop-filter: blur(10px);
      `;
      errorMessage.innerHTML = `
        <div style="font-size: 60px; margin-bottom: 15px;">❌</div>
        <h3 style="margin: 0 0 10px 0; color: #ff6b6b;">خطا در تحلیل</h3>
        <p style="margin: 0 0 20px 0; color: #ddd;">${error.message || 'Unknown error occurred'}</p>
        <button onclick="window.location.href='/upload/'" style="
          background: linear-gradient(135deg, #ff6b6b, #ee5a24);
          color: white;
          border: none;
          padding: 12px 35px;
          border-radius: 25px;
          cursor: pointer;
          font-size: 16px;
          transition: transform 0.3s ease;
          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
        "
        onmouseover="this.style.transform='scale(1.05)'"
        onmouseout="this.style.transform='scale(1)'"
        >
          🔄 تلاش مجدد
        </button>
      `;
      document.body.appendChild(errorMessage);

      setTimeout(() => {
        window.location.href = "/upload/";
      }, 5000);
    });
  }

  // Start the analysis process after delay
  setTimeout(() => {
    sendImageForAnalysis();
  }, 1500);
});