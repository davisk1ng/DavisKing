// Rotating hero image set for index page
const heroImages = [
    { src: 'assets/images/finalcap1.gif', link: 'projects/bottlecap.html', alt: 'Bottlecap Project' },
    { src: 'assets/images/Collage-Poster-1.jpg', link: 'projects/chicfila.html', alt: 'Chicfila Poster 1' },
    { src: 'assets/images/Collage Poster 2.jpg', link: 'projects/chicfila.html', alt: 'Chicfila Poster 2' },
    { src: 'assets/images/Collage Poster 3.jpg', link: 'projects/chicfila.html', alt: 'Chicfila Poster 3' },
    { src: 'assets/images/toypackage.jpg', link: 'projects/toy.html', alt: 'Toy Package' },
    { src: 'assets/images/Toy and package 2.jpg', link: 'projects/toy.html', alt: 'Toy Package 2' },
    { src: 'assets/images/sunset.jpg', link: 'projects/hotsauce.html', alt: 'Hotsauce Sunset' },
    { src: 'assets/images/burnedit.jpg', link: 'projects/hotsauce.html', alt: 'Hotsauce Burned It' }
];
let heroIndex = 0;
const heroImg = document.getElementById('hero-image');
const heroLink = document.getElementById('hero-image-link');
if (heroImg && heroLink) {
    setInterval(() => {
        heroIndex = (heroIndex + 1) % heroImages.length;
        heroImg.style.opacity = 0;
        setTimeout(() => {
            heroImg.src = heroImages[heroIndex].src;
            heroImg.alt = heroImages[heroIndex].alt;
            heroLink.href = heroImages[heroIndex].link;
            heroImg.style.opacity = 1;
        }, 600);
    }, 3500);
}
/* filepath: c:\Users\TheRe\Downloads\DavisKing\DavisKing\script.js */
const navToggle = document.getElementById('navToggle');
const navigation = document.getElementById('navigation');

const backgroundColors = ['#3fa9f6', '#f05a25', '#1f2937']; // blue, red, black

navToggle.addEventListener('click', () => {
    const isOpening = !navigation.classList.contains('active');
    
    if (isOpening) {
        const randomColor = backgroundColors[Math.floor(Math.random() * backgroundColors.length)];
        navigation.style.backgroundColor = randomColor;
        navigation.style.setProperty('--nav-hover-color', 'rgba(255, 255, 255, 0.2)');
    }
    
    navigation.classList.toggle('active');
    navToggle.classList.toggle('open');
});

/* Image Lightbox Functionality */
const lightbox = document.getElementById('imageLightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxClose = document.querySelector('.lightbox-close');
const lightboxPrev = document.querySelector('.lightbox-prev');
const lightboxNext = document.querySelector('.lightbox-next');
const clickableImages = document.querySelectorAll('.clickable-image');

let currentImageIndex = 0;
let imageSet = [];

// Populate image set
function populateImageSet() {
    imageSet = Array.from(clickableImages).map(img => ({
        src: img.src,
        alt: img.alt
    }));
}

populateImageSet();

// Open lightbox when image is clicked
clickableImages.forEach(img => {
    img.addEventListener('click', (e) => {
        currentImageIndex = parseInt(e.target.dataset.imageIndex);
        showLightbox();
    });
});

// Show lightbox
function showLightbox() {
    lightboxImage.src = imageSet[currentImageIndex].src;
    lightboxImage.alt = imageSet[currentImageIndex].alt;
    lightbox.classList.add('active');
    updateNavButtons();
    document.body.style.overflow = 'hidden';
}

// Hide lightbox
function hideLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Update navigation button visibility
function updateNavButtons() {
    if (imageSet.length <= 1) {
        lightboxPrev.classList.add('hidden');
        lightboxNext.classList.add('hidden');
    } else {
        lightboxPrev.classList.remove('hidden');
        lightboxNext.classList.remove('hidden');
    }
}

// Navigate to next image
function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % imageSet.length;
    showLightbox();
}

// Navigate to previous image
function prevImage() {
    currentImageIndex = (currentImageIndex - 1 + imageSet.length) % imageSet.length;
    showLightbox();
}

// Event listeners
lightboxClose.addEventListener('click', hideLightbox);
lightboxNext.addEventListener('click', nextImage);
lightboxPrev.addEventListener('click', prevImage);

// Close on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        hideLightbox();
    } else if (e.key === 'ArrowRight' && lightbox.classList.contains('active')) {
        nextImage();
    } else if (e.key === 'ArrowLeft' && lightbox.classList.contains('active')) {
        prevImage();
    }
});

// Close lightbox when clicking outside the image
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
        hideLightbox();
    }
});

// Hero tab switching (Home / About)
const heroTabs = document.querySelectorAll('.hero-tab');
const homePanel = document.querySelector('[data-panel="home"]');
const aboutPanel = document.querySelector('[data-panel="about"]');

function setActiveTab(name) {
    heroTabs.forEach(btn => {
        const isActive = btn.dataset.tab === name;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    if (name === 'about') {
        if (homePanel) homePanel.setAttribute('aria-hidden', 'true');
        if (aboutPanel) { aboutPanel.classList.add('active'); aboutPanel.removeAttribute('aria-hidden'); }
    } else {
        if (homePanel) homePanel.removeAttribute('aria-hidden');
        if (aboutPanel) { aboutPanel.classList.remove('active'); aboutPanel.setAttribute('aria-hidden', 'true'); }
    }
}

heroTabs.forEach(btn => {
    btn.addEventListener('click', () => {
        setActiveTab(btn.dataset.tab);
    });
});

// Initialize state (ensure home visible)
setActiveTab('home');