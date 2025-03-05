window.addEventListener('load', () => {
    // Target position and rotation vectors for smooth transition
    const targetPosition = new THREE.Vector3();
    const targetRotation = new THREE.Euler();

    // Set up scene, camera, and renderer
    const scene = new THREE.Scene();
    const sceneContainer = document.getElementById('threejs-container');
    let containerWidth = sceneContainer.clientWidth;
    let containerHeight = sceneContainer.clientHeight;

    const camera = new THREE.PerspectiveCamera(
        50, // Field of view
        containerWidth / containerHeight, // Aspect ratio from container
        10, // Near clipping plane
        10000 // Far clipping plane
    );

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        logarithmicDepthBuffer: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0xffffff, 1);
    renderer.setSize(containerWidth, containerHeight);
    camera.aspect = containerWidth / containerHeight;
    camera.updateProjectionMatrix();
    sceneContainer.appendChild(renderer.domElement);

    // Define camera positions with a targetScale property
    const cameraPositions = [
        {
            position: { x: 0, y: 109, z: -1673 },
            rotation: { x: -0.74, y: 0, z: 0 },
            targetScale: 10000000000
        },
        {
            position: { x: 0, y: 137.5, z: -1393 },
            rotation: { x: -0.68, y: 0, z: 0 },
            targetScale: 9999999900
        },
        {
            position: { x: 0, y: 332.5, z: -515 },
            rotation: { x: -0.52, y: 0, z: 0 },
            targetScale: 3981071
        },
        {
            position: { x: 0, y: 860.48, z: 900.7 },
            rotation: { x: -0.47, y: 0, z: 0 },
            targetScale: 1e5
        }
    ];

    let scaleWidth = cameraPositions[0].targetScale;
    let nowMesh; // Declare nowMesh in the global scope

    // Global variables
    const DATA_COLOR = 0xff0000; // Red color
    let scrollVelocity = 0;
    let scrollOffset = 0;
    let isTransitioning = false;
    const transitionSpeed = 0.02;
    let userInteracting = false;
    let isDragging = false;
    let targetScaleWidth = scaleWidth;
    const initialPosition = cameraPositions[0];
    camera.position.set(
        initialPosition.position.x,
        initialPosition.position.y,
        initialPosition.position.z
    );
    camera.rotation.set(
        initialPosition.rotation.x,
        initialPosition.rotation.y,
        initialPosition.rotation.z
    );

    // Add a light source
    const light = new THREE.PointLight(0xffffff, 1, 1000);
    light.position.set(50, 50, 50);
    scene.add(light);

    // Linear scale values
    const linearScaleValues = {
        '1K': 1e3,
        '10K': 1e4,
        '100K': 1e5,
        '1M': 1e6,
        '10M': 1e7,
        '100M': 1e8,
        '1B': 1e9,
        '10B': 1e10,
        '100B': 1e11,
        '1T': 1e12
    };

    
    let isDarkMode = false;

function toggleDarkMode() {
    isDarkMode = !isDarkMode;

    // Toggle renderer background
    renderer.setClearColor(isDarkMode ? 0x000000 : 0xffffff, 1);

    // Toggle non-red object colors
    scene.traverse((object) => {
        if (object.isMesh && object.material && object.material.color) {
            // Skip objects that started red
            if (object.userData?.originalColor === 0xff0000) return;

            const currentHex = object.material.color.getHex();
            // Black ↔ White
            if (currentHex === 0x000000 || currentHex === 0xffffff) {
                object.material.color.set(currentHex === 0x000000 ? 0xffffff : 0x000000);
            }
            // Gray ↔ Lighter Gray
            if (currentHex === 0x808080 || currentHex === 0xaaaaaa) {
                object.material.color.set(currentHex === 0x808080 ? 0xaaaaaa : 0x808080);
            }
        }
    });

    // Toggle a CSS class on the body element
    document.body.classList.toggle('dark-mode', isDarkMode);
     // Toggle icon class
     const fullscreenIcon = document.getElementById('fullscreen-icon');
     fullscreenIcon.classList.toggle('dark-mode', isDarkMode);
}

// Use the existing HTML button
const darkModeBtn = document.getElementById('dark-mode-btn');
darkModeBtn.addEventListener('click', toggleDarkMode);



    // Scale slider and label
    const scaleSlider = document.getElementById('scale-slider');
    const scaleValueLabel = document.getElementById('scale-value');

    scaleSlider.addEventListener('input', function () {
        const exponent = parseFloat(scaleSlider.value);
        scaleWidth = Math.pow(10, exponent);
        const maxScale = 1e13;
        const minScale = 1;
        scaleWidth = clamp(scaleWidth, minScale, maxScale);
        scaleValueLabel.textContent = exponent.toFixed(1);
        updateSceneWithScaleWidth(scaleWidth);
    });

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function mapToLinearScale(value) {
        if (typeof value !== 'string') {
            value = value.toString();
        }
        if (value === '∞') {
            return 1000;
        }
        const parsedValue = parseFloat(value.replace(/,/g, '')) || 0;
        const minLinear = 1;
        const maxLinear = 1e12;
        const clampedValue = clamp(parsedValue, minLinear, maxLinear);
        const length = scaleWidth * (clampedValue - minLinear) / (maxLinear - minLinear);
        const maxLength = 1e6;
        return clamp(length, 0, maxLength);
    }

    const DATA_LINE_THICKNESS = 0.75;
    const textMeshes = [];
    const planeMeshes = [];
    const redLines = [];
    const blueLines = [];
    const verticalRedLines = [];
    const verticalBlueLines = [];
    let entries = [];
    let centralLine;

    // Load font and create text meshes and data visualization
    const loader = new THREE.FontLoader();

fetch('data.json')
.then(response => response.json())
.then(data => {
    loader.load('fonts/Cosmica.json', function (font) {
        // Generate a complete list of years from the data range
        const years = data.Sheet1.map(entry => parseInt(entry.DATE)).filter(year => !isNaN(year));
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        const allYears = Array.from({length: maxYear - minYear + 1}, (_, i) => (minYear + i).toString());
        
        // Track which years we've already created text for
        const yearTextCreated = {};
        
        // Track how many data entries we've seen for each year (for offset calculation)
        const yearDataCount = {};
        
        // Get all data entries first, then add dummy entries for years without data
        const dataEntries = data.Sheet1.slice(); // Clone data
        
        // Add dummy entries for years that don't have data
        allYears.forEach(year => {
            if (!dataEntries.some(entry => entry.DATE === year)) {
                dataEntries.push({ DATE: year });
            }
        });
        
        // Sort entries by year
        dataEntries.sort((a, b) => parseInt(a.DATE) - parseInt(b.DATE));
        
        // Store for reference
        entries = dataEntries;
        
        // Process each entry
        entries.forEach((entry) => {
            const yearNum = parseInt(entry.DATE);
            const isDummy = Object.keys(entry).length === 1;
            
            // Skip dummy entries that aren't decades
            if (isDummy && yearNum % 10 !== 0) return;
            
            // Calculate offset for data visualization if this is a duplicate
            let offset = 0;
            let duplicateOffset = 5;
            if (!isDummy) {
                if (!yearDataCount[yearNum]) {
                    yearDataCount[yearNum] = 0;
                }
                offset = yearDataCount[yearNum] * duplicateOffset; // Offset by 5 units for each duplicate
                yearDataCount[yearNum]++;
            }
            
            // Create text only once per year
            if (!yearTextCreated[yearNum]) {
                const textSize = isDummy ? 10 : 5;
                const textGeometry = new THREE.TextGeometry(entry.DATE.toString(), {
                    font: font,
                    size: textSize,
                    height: 0.1,
                    curveSegments: 12,
                });
                textGeometry.computeBoundingBox();
                const xOffset = -textGeometry.boundingBox.min.x;
                textGeometry.translate(xOffset, 0, 0);

                const material = new THREE.MeshBasicMaterial({ color: isDummy ? 0x000000 : 0xff0000, side: THREE.DoubleSide });
                const textMesh = new THREE.Mesh(textGeometry, material);

                const yPosition = -10;
                const zPosition = -((maxYear - yearNum) * 10);
                textMesh.position.set(0, yPosition, zPosition);
                textMesh.rotation.x = -Math.PI / 2;
                textMesh.userData = { isYear: true, originalColor: isDummy ? 0x000000 : 0xff0000 };
                textMesh.name = `Year_${entry.DATE}`;
                scene.add(textMesh);
                textMeshes.push(textMesh);

                // Draw horizontal line marker (shared across all entries for this year)
                const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
                const lineGeometry = new THREE.BoxGeometry(2000, 0.25, 0.25);
                const line = new THREE.Mesh(lineGeometry, lineMaterial);
                line.position.set(0, yPosition, zPosition);
                scene.add(line);
                
                yearTextCreated[yearNum] = true;
            }

            // Only add data visualization for non-dummy entries
            if (!isDummy) {
                const yPosition = -10;
                const zPosition = -((maxYear - yearNum) * 10);
                
                // Create an invisible plane for interaction (with offset)
                const planeGeometry = new THREE.PlaneGeometry(20, 10);
                const planeMaterial = new THREE.MeshBasicMaterial({ opacity: 0, transparent: true, side: THREE.DoubleSide });
                const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
                planeMesh.position.set(0, yPosition, zPosition + offset);                planeMesh.rotation.x = -Math.PI / 2;
                planeMesh.userData = { entry, originalColor: DATA_COLOR };
                scene.add(planeMesh);
                planeMeshes.push(planeMesh);

                // Data-specific graphics with offset
                if (entry["PAST AGE OF EARTH"]) {
                    const pastAge = entry["PAST AGE OF EARTH"];
                    if (pastAge === '∞') {
                        const sphereGeometry = new THREE.SphereGeometry(2.5, 32, 32);
                        const sphereMaterial = new THREE.MeshBasicMaterial({ color: DATA_COLOR });
                        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                        sphere.position.set(offset, yPosition, zPosition); // Apply offset
                        sphere.userData = { entry, originalColor: DATA_COLOR };
                        scene.add(sphere);
                        planeMeshes.push(sphere);
                        
                        // Name text with offset
                        const nameText = entry["NAME"] ? entry["NAME"].toUpperCase() : "UNKNOWN";
                        const nameGeometry = new THREE.TextGeometry(nameText, {
                            font: font,
                            size: 3,
                            height: 0.1,
                            curveSegments: 12,
                        });
                        nameGeometry.computeBoundingBox();
                        const nameMaterial = new THREE.MeshBasicMaterial({ color: DATA_COLOR });
                        const nameMesh = new THREE.Mesh(nameGeometry, nameMaterial);
                        const nameYOffset = yPosition + 10;
                        nameMesh.position.set(offset, nameYOffset, zPosition); // Apply offset
                        nameMesh.rotation.x = 0;
                        nameMesh.userData.isLabel = true;
                        scene.add(nameMesh);
                    } else {
                        // Red line with offset
                        const lineLength = mapToLinearScale(pastAge);
                        const redLineMaterial = new THREE.MeshBasicMaterial({ color: DATA_COLOR });
                        const redLineGeometry = new THREE.BoxGeometry(lineLength, DATA_LINE_THICKNESS, DATA_LINE_THICKNESS);
                        const redLine = new THREE.Mesh(redLineGeometry, redLineMaterial);
                        redLine.position.set(-lineLength / 2, yPosition, zPosition + offset);
                        redLine.userData = { entry, originalColor: DATA_COLOR, offset: offset };
                        scene.add(redLine);
                        redLines.push(redLine);
                        
                        // Vertical line with offset
                        const verticalRedLineHeight = 20;
                        const verticalRedLineGeometry = new THREE.BoxGeometry(DATA_LINE_THICKNESS, verticalRedLineHeight, DATA_LINE_THICKNESS);
                        const verticalRedLine = new THREE.Mesh(verticalRedLineGeometry, new THREE.MeshBasicMaterial({ color: DATA_COLOR }));
                        verticalRedLine.position.set(-lineLength + DATA_LINE_THICKNESS / 2 - 0.5,
                            yPosition + verticalRedLineHeight / 2,
                            zPosition + offset);// Apply offset
                        verticalRedLine.userData = { entry, originalColor: DATA_COLOR, offset: offset };
                        scene.add(verticalRedLine);
                        verticalRedLines.push(verticalRedLine);
                        
                        // Label with offset
                        const nameText = entry["NAME"] ? entry["NAME"].toUpperCase() : "UNKNOWN";
                        const textString = `${nameText}\n${pastAge}`;
                        const labelGeometry = new THREE.TextGeometry(textString, {
                            font: font,
                            size: 3,
                            height: 0.1,
                            curveSegments: 12,
                        });
                        labelGeometry.computeBoundingBox();
                        const labelMaterial = new THREE.MeshBasicMaterial({ color: DATA_COLOR });
                        const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
                        const padding = 2;
                        const xOffset = offset - lineLength + padding;
                        const yOffset = yPosition + verticalRedLineHeight / 2;
                        labelMesh.position.set(xOffset, yOffset, zPosition + offset);
                        labelMesh.rotation.x = 0;
                        labelMesh.userData.isLabel = true;
                        scene.add(labelMesh);
                        redLine.userData.label = labelMesh;
                    }
                }

                if (entry["FUTURE HABITABILITY ON EARTH"]) {
                    // Apply the same offset pattern to future habitability visualization
                    // (Code similar to above but for the blue lines)
                    const futureHabitability = entry["FUTURE HABITABILITY ON EARTH"];
                    if (futureHabitability === '∞') {
                        const sphereGeometry = new THREE.SphereGeometry(2.5, 32, 32);
                        const sphereMaterial = new THREE.MeshBasicMaterial({ color: DATA_COLOR });
                        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                        sphere.position.set(offset, yPosition, zPosition); // Apply offset
                        sphere.userData = { entry, originalColor: DATA_COLOR };
                        scene.add(sphere);
                        planeMeshes.push(sphere);
                    } else {
                        const lineLength = Math.abs(mapToLinearScale(futureHabitability));
                        const blueLineMaterial = new THREE.MeshBasicMaterial({ color: DATA_COLOR });
                        const blueLineGeometry = new THREE.BoxGeometry(lineLength, DATA_LINE_THICKNESS, DATA_LINE_THICKNESS);
                        const blueLine = new THREE.Mesh(blueLineGeometry, blueLineMaterial);
                        blueLine.position.set(lineLength / 2, yPosition, zPosition + offset);
                        blueLine.userData = { entry, originalColor: DATA_COLOR, offset: offset };
                        scene.add(blueLine);
                        blueLines.push(blueLine);
                        
                        // Vertical blue line with offset
                        const verticalBlueLineHeight = 20;
                        const verticalBlueLineGeometry = new THREE.BoxGeometry(DATA_LINE_THICKNESS, verticalBlueLineHeight, DATA_LINE_THICKNESS);
                        const verticalBlueLine = new THREE.Mesh(verticalBlueLineGeometry, new THREE.MeshBasicMaterial({ color: DATA_COLOR }));
                        verticalBlueLine.position.set(
                            lineLength - DATA_LINE_THICKNESS / 2 + 0.5,
                            yPosition + verticalBlueLineHeight / 2,
                            zPosition + offset);
                            
                            // Apply offset
                        verticalBlueLine.userData = { entry, originalColor: DATA_COLOR, offset: offset };                        scene.add(verticalBlueLine);
                        verticalBlueLines.push(verticalBlueLine);
                        
                        // Label with offset
                        const nameText = entry["NAME"] ? entry["NAME"].toUpperCase() : "UNKNOWN";
                        const textString = `${nameText}\n${futureHabitability}`;
                        const labelGeometry = new THREE.TextGeometry(textString, {
                            font: font,
                            size: 3,
                            height: 0.1,
                            curveSegments: 12,
                        });
                        labelGeometry.computeBoundingBox();
                        const labelMaterial = new THREE.MeshBasicMaterial({ color: DATA_COLOR });
                        const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
                        const xOffset = offset + lineLength + 5;
                        const yOffset = yPosition + verticalBlueLineHeight / 2;
                        labelMesh.position.set(xOffset, yOffset, zPosition + offset);                        labelMesh.rotation.x = 0;
                        labelMesh.userData.isLabel = true;
                        scene.add(labelMesh);
                        blueLine.userData.label = labelMesh;
                    }
                }
            }
        });

        addCentralVerticalLine();
        nowMesh = addNowText(font); // Assign to the global variable instead of creating a new const        updateSceneWithScaleWidth(scaleWidth); // Add this line to apply initial scaling

       
// Then replace the animate function mosdification with:
const originalAnimate = animate;
animate = function() {
    // No need to update NOW text position every frame
    // as it's fixed to the timeline, not to the camera
    
    // Call the original animation function
    originalAnimate();
};
    });
});

    function addCentralVerticalLine() {
        if (textMeshes.length === 0) {
            console.error('No text meshes available to calculate the central vertical line.');
            return;
        }
        const thickness = 0.5;
        const firstTextPosition = textMeshes[0].position;
        const lastTextPosition = textMeshes[textMeshes.length - 1].position;
        const length = Math.abs(lastTextPosition.z - firstTextPosition.z) + 100;
        const rectangleGeometry = new THREE.BoxGeometry(thickness, 0.1, length);
        const rectangleMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const rectangle = new THREE.Mesh(rectangleGeometry, rectangleMaterial);
        const midZ = (firstTextPosition.z + lastTextPosition.z) / 2;
        rectangle.position.set(0, firstTextPosition.y, midZ);
        scene.add(rectangle);
    }

    function addNowText(font) {
        // Create the "NOW" text
        const textGeometry = new THREE.TextGeometry("NOW", {
            font: font,
            size: 100, // Larger size for visibility
            height: 0.1,
            curveSegments: 12,
        });
        
        // Compute bounding box to help with right-justification
        textGeometry.computeBoundingBox();
        
        // Right-justify the text (move it left by its width)
        const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
        textGeometry.translate(-textWidth, 0, 0);
        
        // Create the text mesh with black material
        const material = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
        const nowMesh = new THREE.Mesh(textGeometry, material);
        
        // Set rotation to match year numbers (flat on ground)
        nowMesh.rotation.x = -Math.PI / 2;
        
        // Position near the central vertical line
        const yPosition = -10; // Same y-position as the years
        nowMesh.position.set(-5, yPosition, 0); // Fixed position along the central line
        
        // Add to scene
        scene.add(nowMesh);
        
        // Store reference to update position
        return nowMesh;
    }
    
    // Then replace the animate function modification with:
// Update the animate function
const originalAnimate = animate;
animate = function() {
    // Position NOW text relative to camera on z-axis but fixed to the central line
    if (nowMesh) {
        // Calculate where the camera is looking on the z-axis
        // For our purposes, we want to find a point along the timeline (z-axis)
        // that's visible to the camera
        
        // Use camera position and rotation to find a good z-position
        let targetZ;
        
        // For camera positions with negative z (looking forward into negative z)
        if (camera.position.z < 0) {
            // Position text ahead of camera
            targetZ = camera.position.z - 200;
        } 
        // For camera positions with positive z (looking backward into positive z)
        else {
            // Position text ahead of camera in the positive direction
            targetZ = camera.position.z + 200;
        }
        
        // Keep fixed x,y position but update z position to remain visible
        nowMesh.position.set(-5, -10, targetZ);
        
        // Use a small scale to make sure it's visible but not overwhelming
        const scaleFactor = 0.2;
        nowMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
    
    // Call the original animation function
    originalAnimate();
};

    function addLinearGridLines() {
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
        const linearValues = Object.values(linearScaleValues);
        const firstYearPosition = textMeshes[0]?.position;
        const lastYearPosition = textMeshes[textMeshes.length - 1]?.position;
        if (!firstYearPosition || !lastYearPosition) return;
        const lineHeight = Math.abs(lastYearPosition.z - firstYearPosition.z) + 100;
        linearValues.forEach(value => {
            const xPosition = mapToLinearScale(value);
            const leftLineGeometry = new THREE.BoxGeometry(0.1, 0.1, lineHeight);
            const leftLine = new THREE.Mesh(leftLineGeometry, lineMaterial);
            leftLine.position.set(-xPosition, firstYearPosition.y, (firstYearPosition.z + lastYearPosition.z) / 2);
            scene.add(leftLine);
            const rightLineGeometry = new THREE.BoxGeometry(0.1, 0.1, lineHeight);
            const rightLine = new THREE.Mesh(rightLineGeometry, lineMaterial);
            rightLine.position.set(xPosition, firstYearPosition.y, (firstYearPosition.z + lastYearPosition.z) / 2);
            scene.add(rightLine);
        });
    }

    function generateLogarithmicScale(container, reverse = false) {
        const logValues = ['1K', '10K', '100K', '1M', '10M', '100M', '1B', '10B', '100B', '1T'];
        const values = reverse ? logValues.reverse() : logValues;
        values.forEach(value => {
            const label = document.createElement('div');
            label.classList.add('log-label');
            label.textContent = value;
            container.appendChild(label);
        });
    }

    generateLogarithmicScale(document.querySelector('.log-scale-left'), true);
    generateLogarithmicScale(document.querySelector('.log-scale-right'));

    const xRotationSlider = document.getElementById('x-rotation-slider');
    xRotationSlider.addEventListener('input', function () {
        camera.rotation.x = parseFloat(xRotationSlider.value);
    });

    const toggleVerticalLinesCheckbox = document.getElementById('toggle-vertical-lines');
    toggleVerticalLinesCheckbox.addEventListener('change', function () {
        const showVertical = toggleVerticalLinesCheckbox.checked;
        verticalRedLines.forEach(line => { line.visible = showVertical; });
        verticalBlueLines.forEach(line => { line.visible = showVertical; });
        redLines.forEach(line => { line.visible = true; });
        blueLines.forEach(line => { line.visible = true; });
    });

    const tooltip = document.getElementById('tooltip');
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let highlightedObjects = [];

    function onMouseMove(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([...planeMeshes, ...redLines, ...blueLines, ...verticalRedLines, ...verticalBlueLines], false);
        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            if (highlightedObjects.length > 0 && !highlightedObjects.includes(intersectedObject)) {
                resetHighlightedObjects();
            }
            if (intersectedObject.userData.textMesh) {
                intersectedObject.userData.textMesh.material.color.set(0xff0000);
                tooltip.innerHTML = `<span class="bold">${intersectedObject.userData.textMesh.name}</span>`;
                highlightedObjects.push(intersectedObject.userData.textMesh);
            } else if (intersectedObject.userData.entry) {
                const entry = intersectedObject.userData.entry;
                highlightLines(entry);
                tooltip.innerHTML = formatEntryData(entry);
            }
            tooltip.style.opacity = 1;
            tooltip.style.left = `${event.clientX + 10}px`;
            tooltip.style.top = `${event.clientY + 10}px`;
            document.body.style.cursor = 'pointer';
        } else {
            if (highlightedObjects.length > 0) {
                resetHighlightedObjects();
            }
            tooltip.style.opacity = 0;
            document.body.style.cursor = 'default';
        }
    }

    function formatEntryData(entry) {
        const keysToInclude = {
            "FUTURE HABITABILITY ON EARTH": "Future Earth Habitability",
            "EXPLANATION TYPE": "Explanation Type",
            "KILL MECHANISM": "Kill Mechanism",
            "SOURCE": "Source",
            "PAST AGE OF EARTH": "Past Age of Earth"
        };
        const name = entry["NAME"] ? `<span class="bold">${entry["NAME"]}</span>` : "";
        const date = entry["DATE"] ? `, ${entry["DATE"]}` : "";
        const nameAndDate = name || date ? `${name}${date}` : "";
        const otherData = Object.entries(entry)
            .filter(([key]) => key !== "NAME" && key !== "DATE")
            .map(([key, value]) => keysToInclude[key] ? `<span class="underline">${keysToInclude[key]}</span>: ${value}` : value)
            .join('<br>');
        return nameAndDate ? `${nameAndDate}<br>${otherData}` : otherData;
    }

    renderer.domElement.addEventListener('mousemove', onMouseMove, false);

    function highlightLines(entry) {
        // Choose highlight color based on dark mode
        const highlightColor = isDarkMode ? 0xffffff : 0x000000;
        const associatedLines = [];
    
        const highlightAndCollect = (linesArray) => {
            linesArray.forEach(line => {
                if (line.userData.entry === entry) {
                    line.material.color.set(highlightColor);
                    associatedLines.push(line);
                }
            });
        };
    
        highlightAndCollect(redLines);
        highlightAndCollect(verticalRedLines);
        highlightAndCollect(blueLines);
        highlightAndCollect(verticalBlueLines);
        highlightAndCollect(planeMeshes);
    
        highlightedObjects = highlightedObjects.concat(associatedLines);
    }

    function resetHighlightedObjects() {
        highlightedObjects.forEach(object => {
            object.material.color.set(object.userData.originalColor);
        });
        highlightedObjects = [];
    }

    renderer.domElement.addEventListener('mousemove', onMouseMove, false);

    let isScrolling = false;
    let touchStartY = 0;
    let previousMousePosition = { x: 0, y: 0 };

    renderer.domElement.addEventListener('wheel', (event) => {
        event.preventDefault();
        scrollVelocity += event.deltaY * 0.005;
        userInteracting = true;
        stopTransition();
    });

    renderer.domElement.addEventListener('touchstart', (event) => {
        touchStartY = event.touches[0].clientY;
        isScrolling = true;
        userInteracting = true;
        stopTransition();
    });

    renderer.domElement.addEventListener('touchmove', (event) => {
        if (isScrolling) {
            const touchEndY = event.touches[0].clientY;
            const deltaY = touchStartY - touchEndY;
            scrollVelocity += deltaY * 0.005;
            touchStartY = touchEndY;
        }
    });

    renderer.domElement.addEventListener('touchend', () => {
        isScrolling = false;
    });

    function stopTransition() {
        if (isTransitioning) {
            camera.position.copy(targetPosition);
            camera.rotation.copy(targetRotation);
            isTransitioning = false;
            basePositionZ = targetPosition.z;
            scrollOffset = 0;
        }
        userInteracting = true;
    }

    renderer.domElement.addEventListener('mousedown', function (event) {
        isDragging = true;
        userInteracting = true;
        stopTransition();
        previousMousePosition = { x: event.clientX, y: event.clientY };
    });

    renderer.domElement.addEventListener('mousemove', function (event) {
        if (isDragging) {
            const deltaX = event.clientX - previousMousePosition.x;
            const deltaY = event.clientY - previousMousePosition.y;
            camera.position.x -= deltaX * 0.5;
            camera.position.y += deltaY * 0.5;
            previousMousePosition = { x: event.clientX, y: event.clientY };
        }
    });

    renderer.domElement.addEventListener('mouseup', function () {
        isDragging = false;
        userInteracting = false;
    });

    const fullscreenIcon = document.getElementById('fullscreen-icon');
    let isFullScreen = false;
    fullscreenIcon.addEventListener('click', toggleFullScreen);

    function toggleFullScreen() {
        isFullScreen = !isFullScreen;
        if (isFullScreen) {
            enterFullScreen();
        } else {
            exitFullScreen();
        }
    }

    function enterFullScreen() {
        document.body.classList.add('fullscreen');
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        fullscreenIcon.src = 'assets/close.png';
    }

    function exitFullScreen() {
        document.body.classList.remove('fullscreen');
        containerWidth = sceneContainer.clientWidth;
        containerHeight = sceneContainer.clientHeight;
        renderer.setSize(containerWidth, containerHeight);
        camera.aspect = containerWidth / containerHeight;
        camera.updateProjectionMatrix();
        fullscreenIcon.src = 'assets/fullscreen.png';
    }

    const controlsContainer = document.querySelector('.controls-container');
    let controlsVisible = false;
    window.addEventListener('keydown', (event) => {
        if (event.key === 'c' || event.key === 'C') {
            controlsVisible = !controlsVisible;
            controlsContainer.style.display = controlsVisible ? 'flex' : 'none';
        }
    });

    document.getElementById('position1-btn').addEventListener('click', () => switchCameraPosition(0));
    document.getElementById('position2-btn').addEventListener('click', () => switchCameraPosition(1));
    document.getElementById('position3-btn').addEventListener('click', () => switchCameraPosition(2));
    document.getElementById('position4-btn').addEventListener('click', () => switchCameraPosition(3));

    function switchCameraPosition(positionIndex) {
        const target = cameraPositions[positionIndex];
        targetPosition.set(target.position.x, target.position.y, target.position.z);
        targetRotation.set(target.rotation.x, target.rotation.y, target.rotation.z);
        isTransitioning = true;
        userInteracting = false;
        scrollVelocity = 0;
        basePositionZ = target.position.z;
        targetScaleWidth = target.targetScale;
    }

    let currentCameraIndex = 0;
    let basePositionZ = camera.position.z;

    function animate() {
        requestAnimationFrame(animate);
        if (userInteracting && !isTransitioning) {
            scrollOffset += scrollVelocity;
            camera.position.z = basePositionZ + scrollOffset;
            scrollVelocity *= 0.95;
        } else if (isTransitioning) {
            camera.position.lerp(targetPosition, transitionSpeed);
            camera.rotation.x += (targetRotation.x - camera.rotation.x) * transitionSpeed;
            camera.rotation.y += (targetRotation.y - camera.rotation.y) * transitionSpeed;
            camera.rotation.z += (targetRotation.z - camera.rotation.z) * transitionSpeed;
            scaleWidth += (targetScaleWidth - scaleWidth) * transitionSpeed;
            updateSceneWithScaleWidth(scaleWidth);
            const positionTolerance = 0.1;
            const rotationTolerance = 0.001;
            const scaleTolerance = 0.01;
            if (
                camera.position.distanceTo(targetPosition) < positionTolerance &&
                Math.abs(camera.rotation.x - targetRotation.x) < rotationTolerance &&
                Math.abs(camera.rotation.y - targetRotation.y) < rotationTolerance &&
                Math.abs(camera.rotation.z - targetRotation.z) < rotationTolerance &&
                Math.abs(scaleWidth - targetScaleWidth) < scaleTolerance
            ) {
                isTransitioning = false;
                basePositionZ = targetPosition.z;
                scrollOffset = 0;
            }
        }
        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', function () {
        if (!isFullScreen) {
            containerWidth = sceneContainer.clientWidth;
            containerHeight = sceneContainer.clientHeight;
            renderer.setSize(containerWidth, containerHeight);
            camera.aspect = containerWidth / containerHeight;
            camera.updateProjectionMatrix();
        } else {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }
    });

    window.addEventListener('keydown', function (event) {
        if (event.key === 'l' || event.key === 'L') {
            logCameraData();
        }
    });

    function logCameraData() {
        console.log(`Camera Position: x=${camera.position.x}, y=${camera.position.y}, z=${camera.position.z}`);
        console.log(`Camera Rotation: x=${camera.rotation.x}, y=${camera.rotation.y}, z=${camera.rotation.z}`);
        console.log(`Scale Width: ${scaleWidth}`);
    }

    window.addEventListener('keydown', function (event) {
        if (event.key === 'c' || event.key === 'C') {
            currentCameraIndex = (currentCameraIndex + 1) % cameraPositions.length;
            switchCameraPosition(currentCameraIndex);
        }
    });

    loadEssay();

    function loadEssay() {
        fetch('essay.txt')
            .then(response => response.text())
            .then(text => {
                const contentDiv = document.getElementById('essay-content');
                if (!contentDiv) {
                    console.error('Essay content div not found.');
                    return;
                }
                const sections = text.split(/\[Position (\d+)\]/g);
                const essaySections = [];
                for (let i = 1; i < sections.length; i += 2) {
                    const positionIndex = parseInt(sections[i], 10);
                    const sectionText = sections[i + 1].trim();
                    if (sectionText) {
                        essaySections.push({ positionIndex, sectionText });
                    }
                }
                console.log('Parsed essay sections:', essaySections);
                essaySections.forEach(section => {
                    const sectionDiv = document.createElement('div');
                    sectionDiv.classList.add('essay-section');
                    sectionDiv.setAttribute('data-position', section.positionIndex);
                    sectionDiv.innerHTML = section.sectionText;
                    contentDiv.appendChild(sectionDiv);
                });
                console.log('Essay content loaded successfully');
                setupScrollLogging();
            })
            .catch(error => {
                console.error('Error loading essay:', error);
            });
    }

    function setupScrollLogging() {
        const sections = document.querySelectorAll('.essay-section');
        console.log('Found sections:', sections.length);
        if (sections.length === 0) {
            console.error('No sections found.');
            return;
        }
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0
        };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const positionIndex = entry.target.getAttribute('data-position');
                console.log(`Entry for position ${positionIndex}: isIntersecting=${entry.isIntersecting}`);
                if (entry.isIntersecting) {
                    console.log(`Currently viewing section with position: ${positionIndex}`);
                    switchCameraPosition(parseInt(positionIndex, 10));
                }
            });
        }, options);
        sections.forEach(section => {
            observer.observe(section);
        });
    }

    function updateSceneWithScaleWidth(scaleWidth) {
        // Debug info
        console.log(`Updating scene with scale: ${scaleWidth}, red lines: ${redLines.length}, blue lines: ${blueLines.length}`);
        
        redLines.forEach((line) => {
            const entry = line.userData.entry;
            const offset = line.userData.offset || 0;
            const pastAge = entry["PAST AGE OF EARTH"];
            if (pastAge !== "∞") {
                const lineLength = mapToLinearScale(pastAge);
                line.scale.x = lineLength / line.geometry.parameters.width;
                line.position.x = -lineLength / 2; // No offset on X axis
                // Z position remains unchanged with offset already applied
                const label = line.userData.label;
                if (label) {
                    const padding = 2;
                    const xOffset = -lineLength + padding; // No offset on X
                    const yOffset = line.position.y + 10;
                    label.position.x = xOffset;
                    label.position.y = yOffset;
                    // Z position was already set with offset during creation
                }
            }
        });
        
        blueLines.forEach((line) => {
            const entry = line.userData.entry;
            const futureHabitability = entry["FUTURE HABITABILITY ON EARTH"];
            if (futureHabitability !== "∞") {
                const lineLength = Math.abs(mapToLinearScale(futureHabitability));
                line.scale.x = lineLength / line.geometry.parameters.width;
                line.position.x = lineLength / 2; // Remove offset from X axis
                const label = line.userData.label;
                if (label) {
                    const padding = 5;
                    const xOffset = lineLength + padding; // Remove offset from X
                    const yOffset = line.position.y + 10;
                    label.position.x = xOffset;
                    // Z position was already set with offset during creation
                }
            }
        });
        
        verticalRedLines.forEach((line) => {
            const entry = line.userData.entry;
            const pastAge = entry["PAST AGE OF EARTH"];
            if (pastAge !== "∞") {
                const lineLength = mapToLinearScale(pastAge);
                line.position.x = -lineLength; // Remove offset from X axis
                // Z position remains unchanged with offset already applied
            }
        });
        
        verticalBlueLines.forEach((line) => {
            const entry = line.userData.entry;
            const futureHabitability = entry["FUTURE HABITABILITY ON EARTH"];
            if (futureHabitability !== "∞") {
                const lineLength = Math.abs(mapToLinearScale(futureHabitability));
                line.position.x = lineLength; // Remove offset from X axis
                // Z position remains unchanged with offset already applied
            }
        });
        
        renderer.render(scene, camera);
    }
});