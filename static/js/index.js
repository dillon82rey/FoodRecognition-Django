document.addEventListener("DOMContentLoaded", () => {
    // Handle currency card clicks with exit animation
    const currencyCards = document.querySelectorAll(".currency-card");

    currencyCards.forEach(card => {
        card.addEventListener("click", function (e) {
            e.preventDefault();

            const targetUrl = this.getAttribute("data-target");

            document.body.classList.add("page-exit-active");

            setTimeout(() => {
                window.location.href = targetUrl;
            }, 350);
        });
    });
});

// Mobile menu toggle functionality
const mobileToggle = document.getElementById('mobileToggle');
const navMenu = document.querySelector('.nav-menu');

mobileToggle.addEventListener('click', () => {
    mobileToggle.classList.toggle('active');
    navMenu.classList.toggle('active');

    if (navMenu.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
});