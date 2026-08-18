// Game Boy input / event wiring (depends on window.GB from menu.js)
(function () {
    const GB = window.GB;
    if (!GB || !GB.ready) {
        return;
    }

    const {
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
        projectDetailData,
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
        closeImageOverlay
    } = GB;

    startButtons.forEach((button) => {
        button.addEventListener('click', () => {
            showMainMenu();
        });
    });

    menuItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            setMainMode();
            setSelectedItem(index, false);
            runPrimaryAction();
        });

        item.addEventListener('mouseenter', () => {
            if (!GB.hasStarted || GB.interactionMode !== 'main') {
                return;
            }

            setSelectedItem(index, false);
        });
    });

    if (projectList instanceof HTMLElement) {
        projectList.addEventListener('click', (e) => {
            const target = e.target;
            if (!(target instanceof HTMLElement)) {
                return;
            }

            const button = target.closest('.gb-project-list-item');
            if (!(button instanceof HTMLButtonElement)) {
                return;
            }

            const index = Number.parseInt(button.dataset.projectIndex || '0', 10);
            if (!Number.isNaN(index)) {
                setProjectSelection(index, false);
            }
        });
    }

    if (backButton instanceof HTMLButtonElement) {
        backButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            runBackAction();
        });
    }

    if (videoBackButton instanceof HTMLButtonElement) {
        videoBackButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            runBackAction();
        });
    }

    document.querySelectorAll('[data-panel-back]').forEach((button) => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            runBackAction();
        });
    });

    function handlePreviewClick() {
        if (!GB.hasStarted) {
            return;
        }

        if (GB.interactionMode === 'video-focus') {
            openActiveWebsite();
            return;
        }

        if (GB.interactionMode !== 'project-list') {
            return;
        }

        const projects = projectDetailData[GB.currentProjectSystem] || [];
        const activeProject = projects[GB.currentProjectIndex];
        if (!activeProject) {
            return;
        }

        if (activeProject.mediaType === 'video') {
            enterVideoFocusMode(activeProject);
            return;
        }

        if (activeProject.actionType === 'website' && typeof activeProject.websiteUrl === 'string') {
            window.open(activeProject.websiteUrl, '_blank', 'noopener,noreferrer');
            return;
        }

        if (activeProject.actionType === 'image') {
            openImageOverlay(activeProject);
        }
    }

    if (previewImage instanceof HTMLImageElement) {
        previewImage.addEventListener('click', handlePreviewClick);
    }

    if (previewVideo instanceof HTMLVideoElement) {
        previewVideo.addEventListener('click', handlePreviewClick);
    }

    if (previewPrevButton instanceof HTMLButtonElement) {
        previewPrevButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            cyclePreviewFrame(-1);
        });
    }

    if (previewNextButton instanceof HTMLButtonElement) {
        previewNextButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            cyclePreviewFrame(1);
        });
    }

    if (imageOverlay instanceof HTMLElement) {
        imageOverlay.addEventListener('click', () => {
            closeImageOverlay();
        });
    }

    dpadButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (!GB.hasStarted) {
                return;
            }

            const dir = button.dataset.dir;

            if (dir === 'up') {
                if (GB.interactionMode === 'project-list') {
                    setProjectSelection(GB.currentProjectIndex - 1, true);
                } else if (GB.interactionMode === 'main') {
                    setSelectedItem(GB.selectedIndex - 1, true);
                } else if (GB.interactionMode === 'focus') {
                    focusPanelInteractive(-1);
                } else {
                    return;
                }
            }

            if (dir === 'down') {
                if (GB.interactionMode === 'project-list') {
                    setProjectSelection(GB.currentProjectIndex + 1, true);
                } else if (GB.interactionMode === 'main') {
                    setSelectedItem(GB.selectedIndex + 1, true);
                } else if (GB.interactionMode === 'focus') {
                    focusPanelInteractive(1);
                } else {
                    return;
                }
            }

            if (dir === 'right') {
                if (!cyclePreviewFrame(1)) {
                    runPrimaryAction();
                }
            }

            if (dir === 'left') {
                if (!cyclePreviewFrame(-1)) {
                    runBackAction();
                }
            }
        });
    });

    dpadButtons.forEach((button) => {
        const dir = button.dataset.dir;

        button.addEventListener('pointerdown', () => {
            setDpadPressState(dir, true);
        });

        button.addEventListener('pointerup', () => {
            setDpadPressState(dir, false);
        });

        button.addEventListener('pointercancel', () => {
            setDpadPressState(dir, false);
        });

        button.addEventListener('pointerleave', () => {
            setDpadPressState(dir, false);
        });
    });

    actionButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;
            if (action === 'a') {
                runPrimaryAction();
            }

            if (action === 'b') {
                runBackAction();
            }
        });
    });

    systemButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;
            if (action === 'start') {
                if (GB.hasStarted) {
                    showHomeScreen();
                } else {
                    showMainMenu();
                }
            }

            if (action === 'contact') {
                goToContact();
            }
        });
    });

    toggleButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const paletteKey = button.dataset.palette || '';
            const shouldEnable = !button.classList.contains('is-on');
            setPaletteMode(shouldEnable ? paletteKey : null);
        });

        button.addEventListener('focus', () => {
            if (GB.interactionMode === 'focus') {
                setPanelInteractiveSelection(button, false);
            }
        });
    });

    document.querySelectorAll('.gb-social-box').forEach((link) => {
        link.addEventListener('focus', () => {
            if (GB.interactionMode === 'focus') {
                setPanelInteractiveSelection(link, false);
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (GB.hasStarted && e.key === 'ArrowUp') {
            e.preventDefault();
            if (GB.interactionMode === 'project-list') {
                setProjectSelection(GB.currentProjectIndex - 1, true);
            } else if (GB.interactionMode === 'main') {
                setSelectedItem(GB.selectedIndex - 1, true);
            } else if (GB.interactionMode === 'focus') {
                focusPanelInteractive(-1);
            }
        }

        if (GB.hasStarted && e.key === 'ArrowDown') {
            e.preventDefault();
            if (GB.interactionMode === 'project-list') {
                setProjectSelection(GB.currentProjectIndex + 1, true);
            } else if (GB.interactionMode === 'main') {
                setSelectedItem(GB.selectedIndex + 1, true);
            } else if (GB.interactionMode === 'focus') {
                focusPanelInteractive(1);
            }
        }

        if (GB.hasStarted && e.key === 'ArrowRight') {
            e.preventDefault();
            if (!cyclePreviewFrame(1)) {
                runPrimaryAction();
            }
        }

        if (GB.hasStarted && e.key === 'ArrowLeft') {
            e.preventDefault();
            if (!cyclePreviewFrame(-1)) {
                runBackAction();
            }
        }

        const dir = keyToDir[e.key];
        if (dir && !keyHeld[e.key]) {
            keyHeld[e.key] = true;
            setDpadPressState(dir, true);
        }

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            runPrimaryAction();
        }

        if (e.key.toLowerCase() === 'a') {
            e.preventDefault();
            runPrimaryAction();
        }

        if (e.key === 'Escape' || e.key.toLowerCase() === 'b') {
            e.preventDefault();
            runBackAction();
        }

        if (e.key.toLowerCase() === 'c') {
            e.preventDefault();
            goToContact();
        }
    });

    document.addEventListener('keyup', (e) => {
        const dir = keyToDir[e.key];
        if (dir) {
            keyHeld[e.key] = false;
            setDpadPressState(dir, false);
        }
    });

    GB.boot();
})();
