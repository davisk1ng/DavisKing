// Game Boy menu controller
const gbRoot = document.querySelector('.gameboy-home');

if (gbRoot) {
    const homeScreen = document.querySelector('.gb-home-menu');
    const menuScreen = document.querySelector('.gb-main-menu');
    const menuColumn = document.querySelector('.gb-menu-column');
    const contentColumn = document.querySelector('.gb-content-column');
    const previewCard = document.querySelector('.gb-preview-card');
    const previewImage = document.querySelector('.gb-preview-image');
    const previewVideo = document.querySelector('.gb-preview-video');
    const previewFrameControls = document.getElementById('gbPreviewFrameControls');
    const previewPrevButton = document.getElementById('gbPreviewPrev');
    const previewNextButton = document.getElementById('gbPreviewNext');
    const actionHint = document.getElementById('gbActionHint');
    const videoBackButton = document.getElementById('gbVideoBack');
    const systemCorner = document.getElementById('gbSystemCorner');
    const imageOverlay = document.getElementById('gbImageOverlay');
    const imageOverlayContent = document.getElementById('gbImageOverlayContent');
    const menuItems = Array.from(document.querySelectorAll('.gb-menu-item'));
    const projectList = document.querySelector('.gb-project-list');
    const backButton = document.getElementById('gbBackButton');
    const panels = Array.from(document.querySelectorAll('.gb-panel'));
    const startButtons = Array.from(document.querySelectorAll('[data-start-menu]'));
    const dpadRoot = document.querySelector('.gb-dpad');
    const dpadButtons = Array.from(document.querySelectorAll('.gb-dpad-hit'));
    const actionButtons = Array.from(document.querySelectorAll('.gb-action'));
    const systemButtons = Array.from(document.querySelectorAll('.gb-system'));
    const toggleButtons = Array.from(document.querySelectorAll('.gb-toggle'));

    let selectedIndex = Math.max(0, menuItems.findIndex((item) => item.classList.contains('is-selected')));
    let hasStarted = menuScreen ? menuScreen.classList.contains('is-active') : false;
    let interactionMode = 'main'; // main, project-list, focus, video-focus
    let currentProjectSystem = 'portfolio';
    let currentProjectIndex = 0;
    let isOverlayOpen = false;
    let previewRotationIndex = 0;
    let systemPreviewRotationTimer = null;
    let systemPreviewIndex = 0;
    let panelTransitionTimer = null;
    let descriptionScrollTimer = null;
    let descriptionScrollRaf = null;
    let activePanel = panels.find((panel) => panel.classList.contains('is-active')) || null;

    const cardTransitionTimers = new WeakMap();
    const panelTransitionClasses = ['is-exit-left', 'is-exit-right', 'is-enter-from-left', 'is-enter-from-right'];

    const projectDetailData = window.GB_PROJECT_DATA;


    function getProjectPreviewFrames(project) {
        if (Array.isArray(project.previewFrames) && project.previewFrames.length) {
            return project.previewFrames;
        }
        return [project.preview];
    }

    function getProjectOverlayFrames(project) {
        if (Array.isArray(project.overlayFrames) && project.overlayFrames.length) {
            return project.overlayFrames;
        }

        if (Array.isArray(project.previewFrames) && project.previewFrames.length) {
            return project.previewFrames;
        }

        return [project.preview];
    }

    function setSystemCornerText(systemName) {
        if (!(systemCorner instanceof HTMLElement)) {
            return;
        }

        if (interactionMode === 'main') {
            systemCorner.textContent = '//Davis King';
            systemCorner.classList.add('is-visible');
            systemCorner.setAttribute('aria-hidden', 'false');
        } else if (interactionMode === 'project-list') {
            systemCorner.textContent = systemName === 'portfolio' ? '//portfolio' : `//${systemName}`;
            systemCorner.classList.add('is-visible');
            systemCorner.setAttribute('aria-hidden', 'false');
        } else {
            systemCorner.textContent = '';
            systemCorner.classList.remove('is-visible');
            systemCorner.setAttribute('aria-hidden', 'true');
        }
    }

    function updateActionHint(project = null) {
        if (!(actionHint instanceof HTMLElement)) {
            return;
        }

        let message = '';

        if (interactionMode === 'video-focus') {
            message = 'Press A/Tap to visit';
        } else if (interactionMode === 'project-list' && project && project.mediaType === 'video') {
            message = 'Press A/Tap to expand';
        }

        actionHint.textContent = message;
        actionHint.classList.toggle('is-visible', Boolean(message));
        actionHint.setAttribute('aria-hidden', message ? 'false' : 'true');
    }

    function pausePreviewVideo() {
        if (previewVideo instanceof HTMLVideoElement) {
            previewVideo.pause();
        }
    }

    function setProjectPreview(project) {
        if (!project) {
            return;
        }

        const isVideo = project.mediaType === 'video';

        if (previewImage instanceof HTMLImageElement) {
            previewImage.hidden = isVideo;
        }

        if (previewVideo instanceof HTMLVideoElement) {
            previewVideo.hidden = !isVideo;

            if (isVideo) {
                pausePreviewVideo();
                previewVideo.src = project.preview.src;
                previewVideo.setAttribute('aria-label', project.preview.alt || project.name);
                previewVideo.play().catch(() => {});
            } else {
                pausePreviewVideo();
                previewVideo.removeAttribute('src');
                previewVideo.load();
            }
        }

        if (!isVideo && previewImage instanceof HTMLImageElement) {
            const frames = getProjectPreviewFrames(project);
            previewRotationIndex = 0;
            previewImage.src = frames[0].src;
            previewImage.alt = frames[0].alt;
            updatePreviewFrameControls(frames.length > 1);
        } else {
            updatePreviewFrameControls(false);
        }

        if (previewCard instanceof HTMLElement) {
            previewCard.classList.toggle('is-video-preview', isVideo);
            previewCard.classList.toggle('is-website-preview', project.actionType === 'website');
        }

        updateActionHint(project);
    }

    function updatePreviewFrameControls(showControls) {
        if (!(previewFrameControls instanceof HTMLElement)) {
            return;
        }

        const canShow = showControls && interactionMode === 'project-list';
        previewFrameControls.classList.toggle('is-visible', canShow);
        previewFrameControls.setAttribute('aria-hidden', canShow ? 'false' : 'true');
    }

    function cyclePreviewFrame(step) {
        if (interactionMode !== 'project-list' || !(previewImage instanceof HTMLImageElement)) {
            return false;
        }

        const projects = projectDetailData[currentProjectSystem] || [];
        const activeProject = projects[currentProjectIndex];
        if (!activeProject) {
            return false;
        }

        const frames = getProjectPreviewFrames(activeProject);
        if (frames.length <= 1) {
            return false;
        }

        previewRotationIndex = (previewRotationIndex + step + frames.length) % frames.length;
        previewImage.src = frames[previewRotationIndex].src;
        previewImage.alt = frames[previewRotationIndex].alt;
        return true;
    }

    function openImageOverlay(project) {
        if (!(imageOverlay instanceof HTMLElement) || !(imageOverlayContent instanceof HTMLElement)) {
            return;
        }

        const frames = getProjectOverlayFrames(project);
        imageOverlayContent.innerHTML = '';
        imageOverlayContent.classList.toggle('is-single', frames.length === 1);

        frames.forEach((frame) => {
            const img = document.createElement('img');
            img.className = 'gb-image-overlay-image';
            img.src = frame.src;
            img.alt = frame.alt;
            imageOverlayContent.appendChild(img);
        });

        imageOverlay.classList.add('is-open');
        imageOverlay.setAttribute('aria-hidden', 'false');
        isOverlayOpen = true;
    }

    function closeImageOverlay() {
        if (!(imageOverlay instanceof HTMLElement) || !(imageOverlayContent instanceof HTMLElement)) {
            return;
        }

        imageOverlay.classList.remove('is-open');
        imageOverlay.setAttribute('aria-hidden', 'true');
        imageOverlayContent.innerHTML = '';
        isOverlayOpen = false;
    }

    const dpadClassByDir = {
        up: 'is-up-pressed',
        right: 'is-right-pressed',
        down: 'is-down-pressed',
        left: 'is-left-pressed'
    };

    const keyToDir = {
        ArrowUp: 'up',
        ArrowRight: 'right',
        ArrowDown: 'down',
        ArrowLeft: 'left'
    };

    const keyHeld = {
        ArrowUp: false,
        ArrowRight: false,
        ArrowDown: false,
        ArrowLeft: false
    };

    const paletteClassByKey = {
        'graphic-designer': 'palette-graphic-designer',
        'website-builder': 'palette-website-builder',
        'artist-3d': 'palette-artist-3d'
    };

    const paletteClasses = Object.values(paletteClassByKey);

    function setPaletteMode(paletteKey = null) {
        document.body.classList.remove(...paletteClasses);

        toggleButtons.forEach((button) => {
            const isSelected = paletteKey !== null && button.dataset.palette === paletteKey;
            button.classList.toggle('is-on', isSelected);
            button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        });

        if (!paletteKey) {
            return;
        }

        const nextClass = paletteClassByKey[paletteKey];
        if (nextClass) {
            document.body.classList.add(nextClass);
        }
    }

    function setPreviewVisibility(hasPreview) {
        if (previewCard instanceof HTMLElement) {
            previewCard.classList.toggle('is-hidden', !hasPreview);
        }

        if (contentColumn instanceof HTMLElement) {
            contentColumn.classList.toggle('no-preview', !hasPreview);
        }
    }

    function stopSystemPreviewRotation() {
        if (systemPreviewRotationTimer !== null) {
            window.clearInterval(systemPreviewRotationTimer);
            systemPreviewRotationTimer = null;
        }
    }

    function startSystemPreviewRotation(systemName) {
        stopSystemPreviewRotation();

        if (interactionMode !== 'main') {
            return;
        }

        const projects = projectDetailData[systemName] || [];
        if (projects.length <= 1) {
            return;
        }

        systemPreviewIndex = 0;
        systemPreviewRotationTimer = window.setInterval(() => {
            if (interactionMode !== 'main') {
                stopSystemPreviewRotation();
                return;
            }

            const activeItem = menuItems[selectedIndex];
            if (!activeItem || activeItem.dataset.menu !== systemName) {
                stopSystemPreviewRotation();
                return;
            }

            systemPreviewIndex = (systemPreviewIndex + 1) % projects.length;
            setProjectPreview(projects[systemPreviewIndex]);
        }, 1300);
    }

    function getActivePanelInteractiveItems() {
        const activePanel = panels.find((panel) => panel.classList.contains('is-active'));
        if (!activePanel) {
            return [];
        }

        return Array.from(activePanel.querySelectorAll('a, button'));
    }

    function clearPanelInteractiveSelection() {
        panels.forEach((panel) => {
            panel.querySelectorAll('a, button').forEach((item) => {
                item.classList.remove('is-dpad-selected');
            });
        });
    }

    function setPanelInteractiveSelection(target, focusTarget = true) {
        if (!(target instanceof HTMLElement)) {
            return false;
        }

        clearPanelInteractiveSelection();
        target.classList.add('is-dpad-selected');

        if (focusTarget) {
            target.focus();
        }

        return true;
    }

    function focusFirstPanelInteractive() {
        if (interactionMode !== 'focus') {
            return false;
        }

        const items = getActivePanelInteractiveItems();
        if (!items.length) {
            return false;
        }

        return setPanelInteractiveSelection(items[0], true);
    }

    function focusPanelInteractive(step) {
        if (interactionMode !== 'focus') {
            return false;
        }

        const items = getActivePanelInteractiveItems();
        if (!items.length) {
            return false;
        }

        let index = items.findIndex((item) => item.classList.contains('is-dpad-selected'));
        if (index < 0) {
            index = items.findIndex((item) => item === document.activeElement);
        }

        if (index < 0) {
            index = step > 0 ? -1 : 0;
        }

        const nextIndex = (index + step + items.length) % items.length;
        return setPanelInteractiveSelection(items[nextIndex], true);
    }

    function activateFocusedPanelInteractive() {
        if (interactionMode !== 'focus') {
            return false;
        }

        const items = getActivePanelInteractiveItems();
        if (!items.length) {
            return false;
        }

        const selected = items.find((item) => item.classList.contains('is-dpad-selected'));
        const current = document.activeElement;
        const target = items.includes(current) ? current : items[0];
        const elementToActivate = selected || target;

        if (elementToActivate instanceof HTMLElement) {
            setPanelInteractiveSelection(elementToActivate, true);
            elementToActivate.click();
            return true;
        }

        return false;
    }

    function clearInteractionModeClasses() {
        if (!(menuScreen instanceof HTMLElement)) {
            return;
        }

        menuScreen.classList.remove(
            'is-panel-focus',
            'is-project-list-mode',
            'is-video-focus',
            'is-video-wide',
            'is-video-tall'
        );
        menuScreen.style.removeProperty('--gb-video-aspect');
    }

    function setMainMode() {
        interactionMode = 'main';
        clearInteractionModeClasses();
        clearPanelInteractiveSelection();
        setSystemCornerText(currentProjectSystem);
        updatePreviewFrameControls(false);
        stopSystemPreviewRotation();
        stopDescriptionAutoScroll();
        updateActionHint(null);
        panels.forEach((panel) => {
            panel.scrollTop = 0;
        });
    }

    function applyVideoFocusAspect() {
        if (!(menuScreen instanceof HTMLElement) || !(previewVideo instanceof HTMLVideoElement)) {
            return;
        }

        const width = previewVideo.videoWidth || 16;
        const height = previewVideo.videoHeight || 9;
        const isWide = width >= height;

        menuScreen.classList.toggle('is-video-wide', isWide);
        menuScreen.classList.toggle('is-video-tall', !isWide);
        menuScreen.style.setProperty('--gb-video-aspect', `${width} / ${height}`);
    }

    function enterVideoFocusMode(project) {
        if (!project || project.mediaType !== 'video') {
            return;
        }

        interactionMode = 'video-focus';
        stopSystemPreviewRotation();
        updatePreviewFrameControls(false);

        if (menuScreen instanceof HTMLElement) {
            menuScreen.classList.remove('is-panel-focus');
            menuScreen.classList.add('is-project-list-mode', 'is-video-focus');
        }

        setProjectPreview(project);
        applyVideoFocusAspect();

        if (previewVideo instanceof HTMLVideoElement) {
            if (previewVideo.readyState >= 1) {
                applyVideoFocusAspect();
            } else {
                previewVideo.addEventListener('loadedmetadata', applyVideoFocusAspect, { once: true });
            }
        }

        setSystemCornerText(currentProjectSystem);
        animateCardTransition(menuColumn, 'left');
        animateCardTransition(previewCard, 'right');
        updateActionHint(project);

        const panel = panels.find((item) => item.dataset.panel === currentProjectSystem);
        if (panel instanceof HTMLElement) {
            animateCardTransition(panel, 'right');
            window.requestAnimationFrame(() => {
                startDescriptionAutoScroll(panel);
            });
        }
    }

    function exitVideoFocusMode() {
        interactionMode = 'project-list';

        if (menuScreen instanceof HTMLElement) {
            menuScreen.classList.remove('is-video-focus', 'is-video-wide', 'is-video-tall');
            menuScreen.style.removeProperty('--gb-video-aspect');
            menuScreen.classList.add('is-project-list-mode');
        }

        setSystemCornerText(currentProjectSystem);
        setProjectSelection(currentProjectIndex, true);
        animateCardTransition(menuColumn, 'left');
        animateCardTransition(previewCard, 'right');
    }

    function openActiveWebsite() {
        const projects = projectDetailData[currentProjectSystem] || [];
        const activeProject = projects[currentProjectIndex];
        if (activeProject && typeof activeProject.websiteUrl === 'string') {
            window.open(activeProject.websiteUrl, '_blank', 'noopener,noreferrer');
            return true;
        }
        return false;
    }

    function animateCardTransition(card, side) {
        if (!(card instanceof HTMLElement)) {
            return;
        }

        const existingTimers = cardTransitionTimers.get(card);
        if (existingTimers) {
            if (existingTimers.exitTimer !== null) {
                window.clearTimeout(existingTimers.exitTimer);
            }
            if (existingTimers.enterTimer !== null) {
                window.clearTimeout(existingTimers.enterTimer);
            }
        }

        const exitClass = side === 'left' ? 'is-exit-left' : 'is-exit-right';
        const enterClass = side === 'left' ? 'is-enter-from-left' : 'is-enter-from-right';

        card.classList.remove('is-exit-left', 'is-exit-right', 'is-enter-from-left', 'is-enter-from-right');
        card.classList.add(exitClass);

        const timers = {
            exitTimer: null,
            enterTimer: null
        };

        timers.exitTimer = window.setTimeout(() => {
            card.classList.remove(exitClass);
            card.classList.add(enterClass);

            timers.enterTimer = window.setTimeout(() => {
                card.classList.remove(enterClass);
                cardTransitionTimers.delete(card);
            }, 210);
        }, 190);

        cardTransitionTimers.set(card, timers);
    }

    function cancelPanelTransition() {
        if (panelTransitionTimer !== null) {
            window.clearTimeout(panelTransitionTimer);
            panelTransitionTimer = null;
        }

        panels.forEach((panel) => {
            panel.classList.remove(...panelTransitionClasses);
            if (panel !== activePanel) {
                panel.classList.remove('is-active');
            }
        });

        if (activePanel instanceof HTMLElement && !activePanel.classList.contains('is-active')) {
            activePanel.classList.add('is-active');
        }
    }

    function clearDpadPressStates() {
        if (!dpadRoot) {
            return;
        }

        Object.values(dpadClassByDir).forEach((stateClass) => {
            dpadRoot.classList.remove(stateClass);
        });
    }

    function setDpadPressState(dir, pressed) {
        if (!dpadRoot) {
            return;
        }

        const stateClass = dpadClassByDir[dir];
        if (!stateClass) {
            return;
        }

        if (pressed) {
            clearDpadPressStates();
            dpadRoot.classList.add(stateClass);
        } else {
            dpadRoot.classList.remove(stateClass);
        }
    }

    function setActivePanel(panelName, instant = false) {
        const nextPanel = panels.find((panel) => panel.dataset.panel === panelName);
        if (!nextPanel) {
            return;
        }

        if (activePanel === nextPanel && !instant) {
            return;
        }

        cancelPanelTransition();

        if (!activePanel || instant) {
            panels.forEach((panel) => panel.classList.remove('is-active'));
            nextPanel.classList.add('is-active');
            activePanel = nextPanel;
            return;
        }

        const currentPanel = activePanel;
        activePanel = nextPanel;

        const exitClass = 'is-exit-right';
        const enterClass = 'is-enter-from-right';

        currentPanel.classList.remove(...panelTransitionClasses);
        nextPanel.classList.remove(...panelTransitionClasses);

        currentPanel.classList.add(exitClass);
        nextPanel.classList.add('is-active', enterClass);

        panelTransitionTimer = window.setTimeout(() => {
            currentPanel.classList.remove('is-active', exitClass);
            nextPanel.classList.remove(enterClass);
            panelTransitionTimer = null;
        }, 220);

        if (previewCard instanceof HTMLElement && !previewCard.classList.contains('is-hidden')) {
            animateCardTransition(previewCard, 'right');
        }
    }

    function renderProjectList(systemName) {
        if (!(projectList instanceof HTMLElement)) {
            return;
        }

        const projects = projectDetailData[systemName] || [];
        projectList.innerHTML = projects
            .map((project, index) => `<li><button class="gb-project-list-item${index === currentProjectIndex ? ' is-selected' : ''}" type="button" data-project-index="${index}">${project.name}</button></li>`)
            .join('');
    }

    function stopDescriptionAutoScroll() {
        if (descriptionScrollTimer !== null) {
            window.clearTimeout(descriptionScrollTimer);
            descriptionScrollTimer = null;
        }

        if (descriptionScrollRaf !== null) {
            window.cancelAnimationFrame(descriptionScrollRaf);
            descriptionScrollRaf = null;
        }
    }

    function startDescriptionAutoScroll(panel) {
        stopDescriptionAutoScroll();

        if (!(panel instanceof HTMLElement)) {
            return;
        }

        panel.scrollTop = 0;

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        descriptionScrollTimer = window.setTimeout(() => {
            descriptionScrollTimer = null;

            const maxScroll = panel.scrollHeight - panel.clientHeight;
            if (maxScroll <= 1) {
                return;
            }

            // Slow readable crawl: ~28ms per pixel, minimum 3.5s
            const duration = Math.max(3500, maxScroll * 28);
            const startTime = performance.now();
            const startTop = panel.scrollTop;

            const step = (now) => {
                const progress = Math.min(1, (now - startTime) / duration);
                panel.scrollTop = startTop + (maxScroll - startTop) * progress;

                if (progress < 1) {
                    descriptionScrollRaf = window.requestAnimationFrame(step);
                } else {
                    descriptionScrollRaf = null;
                }
            };

            descriptionScrollRaf = window.requestAnimationFrame(step);
        }, 3000);
    }

    function setProjectSelection(index, focusItem = false) {
        const projects = projectDetailData[currentProjectSystem] || [];
        if (!projects.length) {
            return;
        }

        currentProjectIndex = (index + projects.length) % projects.length;

        const buttons = Array.from(document.querySelectorAll('.gb-project-list-item'));
        buttons.forEach((button, buttonIndex) => {
            const isSelected = buttonIndex === currentProjectIndex;
            button.classList.toggle('is-selected', isSelected);
            if (isSelected && focusItem) {
                button.focus();
            }
        });

        const activeProject = projects[currentProjectIndex];
        const targetIndex = menuItems.findIndex((item) => item.dataset.menu === currentProjectSystem);
        if (targetIndex >= 0) {
            selectedIndex = targetIndex;
            menuItems.forEach((item, itemIndex) => {
                item.classList.toggle('is-selected', itemIndex === targetIndex);
            });
        }

        setPreviewVisibility(true);
        setActivePanel(currentProjectSystem, false);

        animateCardTransition(previewCard, 'right');
        setProjectPreview(activeProject);

        const panel = panels.find((item) => item.dataset.panel === currentProjectSystem);
        if (panel) {
            const title = panel.querySelector('.gb-description-title');
            const text = panel.querySelector('.gb-description-text');
            const descriptionCard = panel.querySelector('.gb-description-card');

            if (descriptionCard instanceof HTMLElement) {
                animateCardTransition(descriptionCard, 'right');
            }

            if (title instanceof HTMLElement) {
                title.textContent = activeProject.name;
            }
            if (text instanceof HTMLElement) {
                text.textContent = activeProject.description;
            }

            // Wait a frame so layout reflects the new description height.
            window.requestAnimationFrame(() => {
                startDescriptionAutoScroll(panel);
            });
        }
    }

    function enterProjectListMode(systemName) {
        interactionMode = 'project-list';
        clearInteractionModeClasses();
        stopSystemPreviewRotation();

        if (menuScreen instanceof HTMLElement) {
            menuScreen.classList.add('is-project-list-mode');
        }

        currentProjectSystem = systemName;
        currentProjectIndex = 0;
        setSystemCornerText(systemName);
        renderProjectList(systemName);
        setProjectSelection(0, true);
        animateCardTransition(menuColumn, 'left');
    }

    function enterPanelFocusMode() {
        interactionMode = 'focus';
        clearInteractionModeClasses();
        stopSystemPreviewRotation();

        if (menuScreen instanceof HTMLElement) {
            menuScreen.classList.add('is-panel-focus');
        }

        setSystemCornerText(currentProjectSystem);

        animateCardTransition(menuColumn, 'left');
        focusFirstPanelInteractive();
    }

    function showHomeScreen() {
        hasStarted = false;
        closeImageOverlay();
        stopSystemPreviewRotation();
        stopDescriptionAutoScroll();
        pausePreviewVideo();
        setMainMode();

        if (homeScreen instanceof HTMLElement) {
            homeScreen.classList.add('is-active');
        }
            if (menuScreen instanceof HTMLElement) {
                menuScreen.classList.remove('is-active');
                menuScreen.setAttribute('aria-hidden', 'true');
                menuScreen.classList.remove(
                    'is-panel-focus',
                    'is-project-list-mode',
                    'is-video-focus',
                    'is-video-wide',
                    'is-video-tall'
                );
                menuScreen.style.removeProperty('--gb-video-aspect');
            }
    }

    function showMainMenu() {
        hasStarted = true;
        if (homeScreen instanceof HTMLElement) {
            homeScreen.classList.remove('is-active');
        }
        if (menuScreen instanceof HTMLElement) {
            menuScreen.classList.add('is-active');
            menuScreen.setAttribute('aria-hidden', 'false');
        }
        setMainMode();
        setSelectedItem(selectedIndex, true, true);
    }

    function setSelectedItem(index, focusItem = false, instant = false) {
        if (!menuItems.length) {
            return;
        }

        selectedIndex = (index + menuItems.length) % menuItems.length;
        menuItems.forEach((item, itemIndex) => {
            item.classList.toggle('is-selected', itemIndex === selectedIndex);
            if (itemIndex === selectedIndex) {
                const panelName = item.dataset.menu;
                const projects = projectDetailData[panelName] || [];
                const hasPreview = (panelName === 'portfolio' || panelName === 'side-projects') && projects.length > 0;
                setPreviewVisibility(hasPreview);
                if (!hasPreview && isOverlayOpen) {
                    closeImageOverlay();
                }
                if (!hasPreview) {
                    updatePreviewFrameControls(false);
                    stopSystemPreviewRotation();
                }

                if (hasPreview) {
                    currentProjectSystem = panelName;
                    currentProjectIndex = 0;
                    const firstProject = projects[0];
                    if (firstProject) {
                        setProjectPreview(firstProject);
                        if (interactionMode === 'main') {
                            startSystemPreviewRotation(panelName);
                        }
                    }
                } else {
                    pausePreviewVideo();
                }

                setActivePanel(panelName, instant);
                if (focusItem) {
                    item.focus();
                }
            }
        });
    }

    function runPrimaryAction() {
        if (!hasStarted) {
            showMainMenu();
            return;
        }

        const activeItem = menuItems[selectedIndex];
        if (!activeItem) {
            return;
        }

        const panelName = activeItem.dataset.menu;
        const projectsSystem = panelName === 'portfolio' || panelName === 'side-projects';

        if (interactionMode === 'project-list') {
            const projects = projectDetailData[currentProjectSystem] || [];
            const activeProject = projects[currentProjectIndex];
            if (activeProject) {
                if (activeProject.mediaType === 'video') {
                    enterVideoFocusMode(activeProject);
                } else if (activeProject.actionType === 'website' && typeof activeProject.websiteUrl === 'string') {
                    window.open(activeProject.websiteUrl, '_blank', 'noopener,noreferrer');
                } else {
                    openImageOverlay(activeProject);
                }
            }
            return;
        }

        if (interactionMode === 'video-focus') {
            openActiveWebsite();
            return;
        }

        if (interactionMode === 'main' && projectsSystem) {
            const projects = projectDetailData[panelName] || [];
            if (projects.length > 0) {
                enterProjectListMode(panelName);
            }
            return;
        }

        if (interactionMode === 'main' && (panelName === 'customizer' || panelName === 'socials')) {
            enterPanelFocusMode();
            return;
        }

        if (interactionMode === 'focus') {
            activateFocusedPanelInteractive();
            return;
        }

        setActivePanel(panelName, true);
        const targetPanel = document.querySelector(`.gb-panel[data-panel="${panelName}"]`);
        const firstInteractive = targetPanel ? targetPanel.querySelector('a, button') : null;
        if (firstInteractive) {
            firstInteractive.focus();
        }
    }

    function runBackAction() {
        if (!hasStarted) {
            return;
        }

        if (isOverlayOpen) {
            closeImageOverlay();
            return;
        }

        if (interactionMode === 'video-focus') {
            exitVideoFocusMode();
            return;
        }

        if (interactionMode === 'project-list' || interactionMode === 'focus') {
            setMainMode();
            setSelectedItem(selectedIndex, false, true);
            animateCardTransition(menuColumn, 'left');
            animateCardTransition(previewCard, 'right');
            const activePanelEl = panels.find((panel) => panel.classList.contains('is-active'));
            if (activePanelEl) {
                animateCardTransition(activePanelEl, 'right');
            }
            menuItems[selectedIndex].focus();
            return;
        }

        const activeElement = document.activeElement;
        const inPanel = activeElement && activeElement.closest('.gb-panel');
        if (inPanel) {
            menuItems[selectedIndex].focus();
        }
    }

    function goToContact() {
        window.location.href = 'contact.html';
    }


    window.GB = {
        ready: true,
        get hasStarted() { return hasStarted; },
        get interactionMode() { return interactionMode; },
        get selectedIndex() { return selectedIndex; },
        get currentProjectIndex() { return currentProjectIndex; },
        get currentProjectSystem() { return currentProjectSystem; },
        projectDetailData,
        startButtons,
        menuItems,
        projectList,
        backButton,
        videoBackButton,
        previewImage,
        previewVideo,
        previewPrevButton,
        previewNextButton,
        imageOverlay,
        dpadButtons,
        actionButtons,
        systemButtons,
        toggleButtons,
        menuColumn,
        previewCard,
        panels,
        keyToDir,
        keyHeld,
        showMainMenu,
        showHomeScreen,
        setMainMode,
        setSelectedItem,
        setProjectSelection,
        runPrimaryAction,
        runBackAction,
        cyclePreviewFrame,
        setDpadPressState,
        setPaletteMode,
        setPanelInteractiveSelection,
        focusPanelInteractive,
        goToContact,
        openActiveWebsite,
        enterVideoFocusMode,
        openImageOverlay,
        closeImageOverlay,
        setSystemCornerText,
        boot() {
            setPaletteMode(null);
            if (hasStarted) {
                showMainMenu();
            } else {
                showHomeScreen();
            }
            setSystemCornerText(currentProjectSystem);
        }
    };
}
