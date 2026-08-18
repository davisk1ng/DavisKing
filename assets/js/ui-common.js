const navToggle = document.getElementById('navToggle');
const navigation = document.getElementById('navigation');
const backgroundColors = ['#3fa9f6', '#f05a25', '#1f2937'];

if (navToggle && navigation) {
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
}
