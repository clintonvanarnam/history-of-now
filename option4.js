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
        { //0
            position: { x: 0, y: 628.5, z: 349 },
            rotation: { x: -0.68, y: 0, z: 0 },
            targetScale: 3163005
        },
        {  //1
            position: { x: 0, y: 181.5, z: -23482.40 },
            rotation: { x: -0.78, y: 0, z: 0 },
            targetScale: 15852581696
        },
        { //2
            position: { x: 0, y: 90, z: -19734 },
            rotation: { x: -0.6, y: 0, z: 0 },
            targetScale: 100023028502
        },
        { //3
            position: { x: 0, y: 192, z: -17806.3 },
            rotation: { x: -0.57, y: 0, z: 0 },
            targetScale: 12592153234
        },
        { //4
            position: { x: 0, y: 215.49, z: -15707.9 },
            rotation: { x: -0.44, y: 0, z: 0 },
            targetScale: 10002302850
        },
        {
            position: { x: 0, y: 121.5, z: -4912.9 },
            rotation: { x: -0.51, y: 0, z: 0 },
            targetScale: 10002302850
        },
        { //5
            position: { x: 0, y: 121.5, z: -3537.7 },
            rotation: { x: -0.51, y: 0, z: 0 },
            targetScale: 10002302850
        },
        { //6
            position: { x: 0, y: 121.5, z: -2753.8 },
            rotation: { x: -0.51, y: 0, z: 0 },
            targetScale: 10002302850
        },
        { //7
            position: { x: 0, y: 216, z: -2146 },
            rotation: { x: -0.51, y: 0, z: 0 },
            targetScale: 794511156.6
        },
        { //8
            position: { x: 0, y: 216, z: -1832 },
            rotation: { x: -0.51, y: 0, z: 0 },
            targetScale: 794511156.6
        },
        { //9
            position: { x: 0, y: 216, z: -1631 },
            rotation: { x: -0.51, y: 0, z: 0 },
            targetScale: 125921532
        },
        { //10
            position: { x: 0, y: 124, z: -1453 },
            rotation: { x: -0.51, y: 0, z: 0 },
            targetScale: 125921532
        },

        { //11
            position: { x: 0, y: 141, z: -1390 },
            rotation: { x: -0.51, y: 0, z: 0 },
            targetScale: 3163005
        }, 
        { //12
            position: { x: 0, y: 234.9, z: -947 },
            rotation: { x: -0.48, y: 0, z: 0 },
            targetScale: 1000230
        }
    ];

    let scaleWidth = cameraPositions[0].targetScale;

    // Global variables
    const DATA_COLOR = 0xff0000; // Red color
    const COSMOLOGICAL_COLOR = 0x176292; // Cosmological color changed from grey to #176292
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

    


    function toggleDarkMode(isDarkMode) {
        // Change the background color of the renderer
        renderer.setClearColor(isDarkMode ? 0x090909 : 0xffffff, 1);
    
        // Update the scene objects' colors
        scene.traverse((object) => {
            if (object.isMesh && object.material) {
                if (object.material.map) return; // Skip textured objects
                if (object.userData?.originalColor === 0xff0000) return; // Skip red objects
    
                if (object.material.color) {
                    const currentHex = object.material.color.getHex();
                    if (currentHex === 0x000000 || currentHex === 0xffffff) {
                        object.material.color.set(
                            currentHex === 0x000000 ? 0xffffff : 0x000000
                        );
                    }
                }
            }
        });
    
        // Update the body class for dark mode
        document.body.classList.toggle('dark-mode', isDarkMode);
    
        // Update the fullscreen icon if applicable
        const fullscreenIcon = document.getElementById('fullscreen-icon');
        if (fullscreenIcon) {
            fullscreenIcon.classList.toggle('dark-mode', isDarkMode);
        }
    }
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (event) => {
            isDarkMode = event.target.checked; // <-- update the global variable!
            toggleDarkMode(isDarkMode);
        });
    } else {
        console.error('Dark mode toggle not found in the DOM.');
    }
    

    // Scale slider and label
    const scaleSlider = document.getElementById('scale-slider');

    scaleSlider.addEventListener('input', function () {
        const exponent = parseFloat(scaleSlider.value);
        scaleWidth = Math.pow(10, exponent);
        const maxScale = 1e13;
        const minScale = 0.0001; // Updated minimum scale
        scaleWidth = clamp(scaleWidth, minScale, maxScale);
        updateSceneWithScaleWidth(scaleWidth);
    });

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function mapToLinearScale(value, isCosmological = false) {
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

        // Normalize the clamped value to a range between 0 and 1
        const normalizedValue = (clampedValue - minLinear) / (maxLinear - minLinear);

        // Determine the maximum length based on whether it's cosmological data
        const maxLength = isCosmological ? 10000 : 1000; // Adjust these values as needed

        // Scale the normalized value by the appropriate maximum length
        const length = scaleWidth * normalizedValue;
        return clamp(length, 0, maxLength);
    }

    const DATA_LINE_THICKNESS = 0.75;
    const textMeshes = [];
    const hitPlanes = [];
    const labelMeshes = [];
    const planeMeshes = [];
    const redLines = [];
    const blueLines = [];
    const verticalRedLines = [];
    const verticalBlueLines = [];
    const cosmologicalLines = [];
    const verticalCosmologicalLines = [];
    let entries = [];
    let centralLine;

    // Load font and create text meshes and data visualization
    const loader = new THREE.FontLoader();
    let regularFont, lightFont;

    // Load both fonts
    loader.load('fonts/Cosmica.json', function (font) {
        regularFont = font;
        checkFontsLoaded();
    });

    loader.load('fonts/Cosmica-Light.json', function (font) {
        lightFont = font;
        checkFontsLoaded();
    });

    function checkFontsLoaded() {
        if (regularFont && lightFont) {
            fetch('data.json')
                .then(response => response.json())
                .then(data => {
                    processEntries(data);
                });
        }
    }


    let imagesVisible = false;





    function processEntries(data) {
        // Generate a complete list of years from the data range
        const years = data.Sheet1.map(entry => parseInt(entry.DATE)).filter(year => !isNaN(year));
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        const allYears = Array.from({ length: maxYear - minYear + 1 }, (_, i) => (minYear + i).toString());
    
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
                offset = yearDataCount[yearNum] * duplicateOffset;
                yearDataCount[yearNum]++;
            }
    
            // Determine if this is a cosmological entry
            const isCosmological = !isDummy && (
                entry["PAST AGE OF UNIVERSE"] || 
                entry["FUTURE FOR LIFE IN WIDER UNIVERSE"]
            );
    
            // Set the color for both text and labels
            const labelColor = isDummy ? 0x000000 : (isCosmological ? COSMOLOGICAL_COLOR : DATA_COLOR);
    
            // Create text only once per year  
            if (!yearTextCreated[yearNum]) {
                const textSize = isDummy ? 50 : 5;
                const fontToUse = isDummy ? lightFont : regularFont;
    
                const textGeometry = new THREE.TextGeometry(entry.DATE.toString(), {
                    font: fontToUse,
                    size: textSize,
                    height: 0.1,
                    curveSegments: 12,
                });
                textGeometry.computeBoundingBox();
                const xOffsetGeo = -textGeometry.boundingBox.min.x;
                textGeometry.translate(xOffsetGeo, 0, 0);
    
                const yPosition = -10;
                const zPosition = -((maxYear - yearNum) * 10);
                const xPosition = isDummy ? 0 : -18;
    
                const material = new THREE.MeshBasicMaterial({
                    color: labelColor,
                    side: THREE.DoubleSide
                });
                const textMesh = new THREE.Mesh(textGeometry, material);
                textMesh.position.set(xPosition, yPosition, zPosition);
                textMesh.rotation.x = -Math.PI / 2;
                textMesh.userData = {
                    isYear: true,
                    entry: entry,
                    originalColor: labelColor
                };
                textMesh.name = `Year_${entry.DATE}`;
                scene.add(textMesh);
                textMeshes.push(textMesh);
    
                // Optional decade line
                if (isDummy && yearNum % 10 === 0) {
                    const lineMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
                    const lineGeo = new THREE.BoxGeometry(2000, 0.25, 0.25);
                    const line = new THREE.Mesh(lineGeo, lineMat);
                    line.position.set(0, yPosition, zPosition);
                    scene.add(line);
                }
    
                yearTextCreated[yearNum] = true;
            }
    
            // Draw decade year text if it coincides with a data year
            if (!isDummy && yearNum % 10 === 0) {
                const textSize = 50;
                const textGeometry = new THREE.TextGeometry(entry.DATE.toString(), {
                    font: lightFont,
                    size: textSize,
                    height: 0.1,
                    curveSegments: 12,
                });
                textGeometry.computeBoundingBox();
                const xOffset = -textGeometry.boundingBox.min.x;
                textGeometry.translate(xOffset, 0, 0);
    
                const material = new THREE.MeshBasicMaterial({
                    color: 0x000000,
                    side: THREE.DoubleSide
                });
                const textMesh = new THREE.Mesh(textGeometry, material);
                const yPosition = -10;
                const zPosition = -((maxYear - yearNum) * 10);
                textMesh.position.set(0, yPosition, zPosition);
                textMesh.rotation.x = -Math.PI / 2;
                textMesh.userData = {
                    isYear: true,
                    isDecade: true, // <-- Add this line
                    entry: entry,
                    originalColor: 0x000000
                };
                textMesh.name = `Decade_${entry.DATE}`;
                scene.add(textMesh);
                textMeshes.push(textMesh);
    
                const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
                const lineGeometry = new THREE.BoxGeometry(2000, 0.25, 0.25);
                const line = new THREE.Mesh(lineGeometry, lineMaterial);
                line.position.set(0, yPosition, zPosition);
                scene.add(line);
            }

            // Only add data visualization for non-dummy entries
            if (!isDummy) {
                const yPosition = -10;
                const zPosition = -((maxYear - yearNum) * 10);

                // Create an invisible plane for interaction (with offset)
                const planeGeometry = new THREE.PlaneGeometry(20, 10);
                const planeMaterial = new THREE.MeshBasicMaterial({ opacity: 0, transparent: true, side: THREE.DoubleSide });
                const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
                planeMesh.position.set(0, yPosition, zPosition + offset); planeMesh.rotation.x = -Math.PI / 2;
                planeMesh.userData = { entry, originalColor: DATA_COLOR };
                scene.add(planeMesh);
                planeMeshes.push(planeMesh);

                function createImageCaption3D(imagePlane, captionText, font) {
                    const textSize = 1.1;
                    const planeWidth = imagePlane.geometry.parameters.width;
                    const lines = wrapTextByWidth(captionText, font, textSize, planeWidth);

                    // Increase the line spacing
                    const lineSpacing = textSize * 1.8; // Adjust this value to increase the leading

                    // Keep a small offset only on Y
                    const yOffsetStart = imagePlane.position.y - 2; // 1-unit margin
                    const xLeft = imagePlane.position.x - planeWidth / 2; // flush to left

                    let yOffset = yOffsetStart;

                    lines.forEach((lineText) => {
                        const lineGeometry = new THREE.TextGeometry(lineText, {
                            font,
                            size: textSize,
                            height: 0.1,
                            curveSegments: 12
                        });
                        lineGeometry.computeBoundingBox();

                        const textMesh = new THREE.Mesh(
                            lineGeometry,
                            new THREE.MeshBasicMaterial({ color: 0x000000 })
                        );
                        textMesh.userData.isCaption = true; // Mark as caption

                        // Position flush left, but slightly above the bottom
                        textMesh.position.set(xLeft, yOffset, imagePlane.position.z);
                        scene.add(textMesh);
                        textMesh.visible = false;
                        yOffset -= lineSpacing;
                    });
                }

                // Helper function to break a caption into multiple lines
                function wrapTextByWidth(text, font, size, maxWidth) {
                    const words = text.split(/\s+/);
                    const lines = [];
                    let currentLine = words.shift();

                    words.forEach(word => {
                        const testLine = currentLine + ' ' + word;
                        // Measure the testLine’s bounding box
                        const testGeometry = new THREE.TextGeometry(testLine, {
                            font,
                            size,
                            height: 0
                        });
                        testGeometry.computeBoundingBox();
                        const testWidth = testGeometry.boundingBox.max.x - testGeometry.boundingBox.min.x;

                        if (testWidth < maxWidth) {
                            currentLine = testLine;
                        } else {
                            lines.push(currentLine);
                            currentLine = word;
                        }
                    });

                    if (currentLine) lines.push(currentLine);
                    return lines;
                }

                // === show images ===
                if (entry["IMAGE"]) {
                    const textureLoader = new THREE.TextureLoader();
                    textureLoader.load(`assets/photos/${entry["IMAGE"]}`, (texture) => {
                        const aspect = texture.image.width / texture.image.height;
                        const planeHeight = 20;
                        const planeWidth = planeHeight * aspect;
                        const imagePlaneGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                        imagePlaneGeometry.translate(0, planeHeight / 2, 0);

                        const imagePlaneMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
                        const imagePlane = new THREE.Mesh(imagePlaneGeometry, imagePlaneMaterial);
                        imagePlane.userData.isImage = true; // Mark as image

                        // Shift image plane randomly
                        const randomSign = Math.random() < 0.5 ? -1 : 1;
                        const randomDistance = Math.random() * (60 - 30) + 30;
                        imagePlane.position.set(offset + (randomDistance * randomSign), yPosition, zPosition + offset);
                        imagePlane.visible = false;
                        scene.add(imagePlane);

                        // Instead of createImageCaption, call createImageCaption3D
                        if (entry["IMAGE CAPTION"]) {
                            createImageCaption3D(imagePlane, entry["IMAGE CAPTION"], regularFont);
                        }
                    });
                }
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
                        const nameText = entry["NAME"] ? entry["NAME"] : "UNKNOWN";
                        const nameGeometry = new THREE.TextGeometry(nameText, {
                            font: regularFont, // Changed from font to regularFont
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
                        const verticalRedLineHeight = 40;
                        const verticalRedLineGeometry = new THREE.BoxGeometry(DATA_LINE_THICKNESS, verticalRedLineHeight, DATA_LINE_THICKNESS);
                        const verticalRedLine = new THREE.Mesh(verticalRedLineGeometry, new THREE.MeshBasicMaterial({ color: DATA_COLOR }));
                        verticalRedLine.position.set(-lineLength + DATA_LINE_THICKNESS / 2 - 0.5,
                            yPosition + verticalRedLineHeight / 2,
                            zPosition + offset);// Apply offset
                        verticalRedLine.userData = { entry, originalColor: DATA_COLOR, offset: offset };
                        scene.add(verticalRedLine);
                        verticalRedLines.push(verticalRedLine);

                        // Label with offset
                        const nameText = entry["NAME"] ? entry["NAME"] : "UNKNOWN";
                        const textString = `${nameText}\n${pastAge}`;
                        const labelGeometry = new THREE.TextGeometry(textString, {
                            font: regularFont,
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
                        labelMesh.userData = {
                            isLabel: true,
                            entry: entry,
                            originalColor: DATA_COLOR
                                                                        };
                        scene.add(labelMesh);
                        labelMeshes.push(labelMesh);
                        labelMesh.geometry.computeBoundingBox();
                        const worldBBox = new THREE.Box3().setFromObject(labelMesh);


                        
                        // 3) now build your semi‑transparent plane exactly to the text geometry’s local‐bbox
                        labelMesh.geometry.computeBoundingBox();
                        const localBBox = labelMesh.geometry.boundingBox;
                        const size  = localBBox.getSize(new THREE.Vector3());
                        const center = localBBox.getCenter(new THREE.Vector3());
                        
                        // make a PlaneGeometry of that size, _translated_ so its center is at (0,0)
                        const planeGeo = new THREE.PlaneGeometry(size.x, size.y);
                        planeGeo.translate(center.x, center.y, 0);
                        
                        const debugMat = new THREE.MeshBasicMaterial({
                            transparent: true,
                            opacity:     0,
                            side:        THREE.DoubleSide
                          });
                          const hitPlane = new THREE.Mesh( planeGeo, debugMat );
                          labelMesh.add(hitPlane);
                          hitPlanes.push(hitPlane);

                          hitPlane.userData.entry = labelMesh.userData.entry;
                        hitPlane.userData.originalColor = debugMat.color.getHex();
                        
                        // because the geometry is already translated to its own center,
                        // we just need it at (0,0,0) in the text’s local space:
                        hitPlane.position.set(0, 0, 0);
                        hitPlane.rotation.set(0, 0, 0);
                        hitPlane.scale.set(1, 1, 1);
                        
                        // (optionally) push into your planeMeshes if you want to raycast it
                        hitPlanes.push( hitPlane );
                        planeMeshes.push(hitPlane);
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
                        const verticalBlueLineHeight = 40;
                        const verticalBlueLineGeometry = new THREE.BoxGeometry(DATA_LINE_THICKNESS, verticalBlueLineHeight, DATA_LINE_THICKNESS);
                        const verticalBlueLine = new THREE.Mesh(verticalBlueLineGeometry, new THREE.MeshBasicMaterial({ color: DATA_COLOR }));
                        verticalBlueLine.position.set(
                            lineLength - DATA_LINE_THICKNESS / 2 + 0.5,
                            yPosition + verticalBlueLineHeight / 2,
                            zPosition + offset);

                        // Apply offset
                        verticalBlueLine.userData = { entry, originalColor: DATA_COLOR, offset: offset }; scene.add(verticalBlueLine);
                        verticalBlueLines.push(verticalBlueLine);

                        // Label with offset
                        const nameText = entry["NAME"] ? entry["NAME"] : "UNKNOWN";
                        const textString = `${nameText}\n${futureHabitability}`;
                        const labelGeometry = new THREE.TextGeometry(textString, {
                            font: regularFont,
                            size: 3,
                            height: 0.1,
                            curveSegments: 12,
                        });
                        labelGeometry.computeBoundingBox();
                        const labelMaterial = new THREE.MeshBasicMaterial({ color: DATA_COLOR });
                        const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
                        const xOffset = offset + lineLength + 5;
                        const yOffset = yPosition + verticalBlueLineHeight / 2;
                        labelMesh.position.set(xOffset, yOffset, zPosition + offset); labelMesh.rotation.x = 0;
                        labelMesh.userData = {
                            isLabel: true,
                            entry: entry,
                            originalColor: DATA_COLOR // or COSMOLOGICAL_COLOR depending on the label
                        };
                        scene.add(labelMesh);
                        labelMeshes.push(labelMesh);
                        labelMesh.geometry.computeBoundingBox();
                        const worldBBox = new THREE.Box3().setFromObject(labelMesh);


                        
                        // 3) now build your semi‑transparent plane exactly to the text geometry’s local‑bbox
                        labelMesh.geometry.computeBoundingBox();
                        const localBBox = labelMesh.geometry.boundingBox;
                        const size  = localBBox.getSize(new THREE.Vector3());
                        const center = localBBox.getCenter(new THREE.Vector3());
                        
                        // make a PlaneGeometry of that size, _translated_ so its center is at (0,0)
                        const planeGeo = new THREE.PlaneGeometry(size.x, size.y);
                        planeGeo.translate(center.x, center.y, 0);
                        
                        const debugMat = new THREE.MeshBasicMaterial({
                            transparent: true,
                            opacity:     0,
                            side:        THREE.DoubleSide
                          });
                          const hitPlane = new THREE.Mesh( planeGeo, debugMat );
                          labelMesh.add(hitPlane);
                          hitPlanes.push(hitPlane);

                          hitPlane.userData.entry = labelMesh.userData.entry;
                        hitPlane.userData.originalColor = debugMat.color.getHex();
                        
                        // because the geometry is already translated to its own center,
                        // we just need it at (0,0,0) in the text’s local space:
                        hitPlane.position.set(0, 0, 0);
                        hitPlane.rotation.set(0, 0, 0);
                        hitPlane.scale.set(1, 1, 1);
                        
                        // (optionally) push into your planeMeshes if you want to raycast it
                        hitPlanes.push( hitPlane );
                        planeMeshes.push(hitPlane);
                        blueLine.userData.label = labelMesh;
                    }
                }

                if (entry["PAST AGE OF UNIVERSE"]) {
                    const pastAgeUniverse = entry["PAST AGE OF UNIVERSE"];
                    if (pastAgeUniverse === '∞') {
                        const sphereGeometry = new THREE.SphereGeometry(2.5, 32, 32);
                        const sphereMaterial = new THREE.MeshBasicMaterial({ color: COSMOLOGICAL_COLOR });
                        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                        sphere.position.set(offset, yPosition, zPosition); // Apply offset
                        sphere.userData = { entry, originalColor: COSMOLOGICAL_COLOR };
                        scene.add(sphere);
                        planeMeshes.push(sphere);
                    } else {
                        const lineLength = mapToLinearScale(pastAgeUniverse);
                        const cosmologicalLineMaterial = new THREE.MeshBasicMaterial({ color: COSMOLOGICAL_COLOR });
                        const cosmologicalLineGeometry = new THREE.BoxGeometry(lineLength, DATA_LINE_THICKNESS, DATA_LINE_THICKNESS);
                        const cosmologicalLine = new THREE.Mesh(cosmologicalLineGeometry, cosmologicalLineMaterial);
                        cosmologicalLine.position.set(-lineLength / 2, yPosition, zPosition + offset);
                        cosmologicalLine.userData = { entry, originalColor: COSMOLOGICAL_COLOR, offset: offset };
                        scene.add(cosmologicalLine);
                        cosmologicalLines.push(cosmologicalLine);

                        const verticalCosmologicalLineHeight = 40;
                        const verticalCosmologicalLineGeometry = new THREE.BoxGeometry(DATA_LINE_THICKNESS, verticalCosmologicalLineHeight, DATA_LINE_THICKNESS);
                        const verticalCosmologicalLine = new THREE.Mesh(verticalCosmologicalLineGeometry, new THREE.MeshBasicMaterial({ color: COSMOLOGICAL_COLOR }));
                        verticalCosmologicalLine.position.set(
                            -lineLength + DATA_LINE_THICKNESS / 2 - 0.5,
                            yPosition + verticalCosmologicalLineHeight / 2,
                            zPosition + offset
                        );
                        verticalCosmologicalLine.userData = { entry, originalColor: COSMOLOGICAL_COLOR, offset: offset };
                        scene.add(verticalCosmologicalLine);
                        verticalCosmologicalLines.push(verticalCosmologicalLine);

                        const nameText = entry["NAME"] ? entry["NAME"] : "UNKNOWN";
                        const textString = `${nameText}\n${pastAgeUniverse}`;
                        const labelGeometry = new THREE.TextGeometry(textString, {
                            font: regularFont,
                            size: 3,
                            height: 0.1,
                            curveSegments: 12,
                        });
                        labelGeometry.computeBoundingBox();
                        const labelMaterial = new THREE.MeshBasicMaterial({ color: COSMOLOGICAL_COLOR });
                        const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
                        const padding = 2;
                        const xOffset = offset - lineLength + padding;
                        const yOffset = yPosition + verticalCosmologicalLineHeight - 2;
                        labelMesh.position.set(xOffset, yOffset, zPosition + offset);
                        labelMesh.rotation.x = 0;
                        labelMesh.userData = {
                            isLabel: true,
                            entry: entry,
                            originalColor: COSMOLOGICAL_COLOR // <-- FIXED HERE
                        };
                        scene.add(labelMesh);
                        labelMeshes.push(labelMesh);
                        labelMesh.geometry.computeBoundingBox();
                        const worldBBox = new THREE.Box3().setFromObject(labelMesh);


                        
                        // 3) now build your semi‑transparent plane exactly to the text geometry’s local‑bbox
                        labelMesh.geometry.computeBoundingBox();
                        const localBBox = labelMesh.geometry.boundingBox;
                        const size  = localBBox.getSize(new THREE.Vector3());
                        const center = localBBox.getCenter(new THREE.Vector3());
                        
                        // make a PlaneGeometry of that size, _translated_ so its center is at (0,0)
                        const planeGeo = new THREE.PlaneGeometry(size.x, size.y);
                        planeGeo.translate(center.x, center.y, 0);
                        
                        const debugMat = new THREE.MeshBasicMaterial({
                            transparent: true,
                            opacity:     0,
                            side:        THREE.DoubleSide
                          });
                          const hitPlane = new THREE.Mesh( planeGeo, debugMat );
                          labelMesh.add(hitPlane);
                          hitPlanes.push(hitPlane);

                          hitPlane.userData.entry = labelMesh.userData.entry;
                        hitPlane.userData.originalColor = debugMat.color.getHex();
                        
                        // because the geometry is already translated to its own center,
                        // we just need it at (0,0,0) in the text’s local space:
                        hitPlane.position.set(0, 0, 0);
                        hitPlane.rotation.set(0, 0, 0);
                        hitPlane.scale.set(1, 1, 1);
                        
                        // (optionally) push into your planeMeshes if you want to raycast it
                        hitPlanes.push( hitPlane );
                        planeMeshes.push(hitPlane);
                        cosmologicalLine.userData.label = labelMesh;
                    }
                }

                if (entry["FUTURE FOR LIFE IN WIDER UNIVERSE"]) {
                    const futureLifeUniverse = entry["FUTURE FOR LIFE IN WIDER UNIVERSE"];
                    if (futureLifeUniverse === '∞') {
                        const sphereGeometry = new THREE.SphereGeometry(2.5, 32, 32);
                        const sphereMaterial = new THREE.MeshBasicMaterial({ color: COSMOLOGICAL_COLOR });
                        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                        sphere.position.set(offset, yPosition, zPosition); // Apply offset
                        sphere.userData = { entry, originalColor: COSMOLOGICAL_COLOR };
                        scene.add(sphere);
                        planeMeshes.push(sphere);
                    } else {
                        const lineLength = Math.abs(mapToLinearScale(futureLifeUniverse));
                        const cosmologicalLineMaterial = new THREE.MeshBasicMaterial({ color: COSMOLOGICAL_COLOR });
                        const cosmologicalLineGeometry = new THREE.BoxGeometry(lineLength, DATA_LINE_THICKNESS, DATA_LINE_THICKNESS);
                        const cosmologicalLine = new THREE.Mesh(cosmologicalLineGeometry, cosmologicalLineMaterial);
                        cosmologicalLine.position.set(lineLength / 2, yPosition, zPosition + offset);
                        cosmologicalLine.userData = { entry, originalColor: COSMOLOGICAL_COLOR, offset: offset };
                        scene.add(cosmologicalLine);
                        cosmologicalLines.push(cosmologicalLine);

                        const verticalCosmologicalLineHeight = 20;
                        const verticalCosmologicalLineGeometry = new THREE.BoxGeometry(DATA_LINE_THICKNESS, verticalCosmologicalLineHeight, DATA_LINE_THICKNESS);
                        const verticalCosmologicalLine = new THREE.Mesh(verticalCosmologicalLineGeometry, new THREE.MeshBasicMaterial({ color: COSMOLOGICAL_COLOR }));
                        verticalCosmologicalLine.position.set(
                            lineLength - DATA_LINE_THICKNESS / 2 + 0.5,
                            yPosition + verticalCosmologicalLineHeight / 2,
                            zPosition + offset
                        );
                        verticalCosmologicalLine.userData = { entry, originalColor: COSMOLOGICAL_COLOR, offset: offset };
                        scene.add(verticalCosmologicalLine);
                        verticalCosmologicalLines.push(verticalCosmologicalLine);

                        const nameText = entry["NAME"] ? entry["NAME"].toUpperCase() : "UNKNOWN";
                        const textString = `${nameText}\n${futureLifeUniverse}`;
                        const labelGeometry = new THREE.TextGeometry(textString, {
                            font: regularFont,
                            size: 3,
                            height: 0.1,
                            curveSegments: 12,
                        });
                        labelGeometry.computeBoundingBox();
                        const labelMaterial = new THREE.MeshBasicMaterial({ color: COSMOLOGICAL_COLOR });
                        const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
                        const xOffset = offset + lineLength + 5;
                        const yOffset = yPosition + verticalCosmologicalLineHeight / 2;
                        labelMesh.position.set(xOffset, yOffset, zPosition + offset);
                        labelMesh.rotation.x = 0;
                        labelMesh.userData.isLabel = true;
                        labelMesh.userData.originalColor = COSMOLOGICAL_COLOR;
                        scene.add(labelMesh);
                        labelMeshes.push(labelMesh);
                        labelMesh.geometry.computeBoundingBox();
                        const worldBBox = new THREE.Box3().setFromObject(labelMesh);


                        
                        // 3) now build your semi‑transparent plane exactly to the text geometry’s local‑bbox
                        labelMesh.geometry.computeBoundingBox();
                        const localBBox = labelMesh.geometry.boundingBox;
                        const size  = localBBox.getSize(new THREE.Vector3());
                        const center = localBBox.getCenter(new THREE.Vector3());
                        
                        // make a PlaneGeometry of that size, _translated_ so its center is at (0,0)
                        const planeGeo = new THREE.PlaneGeometry(size.x, size.y);
                        planeGeo.translate(center.x, center.y, 0);
                        
                        const debugMat = new THREE.MeshBasicMaterial({
                            transparent: true,
                            opacity:     0,
                            side:        THREE.DoubleSide
                          });
                          const hitPlane = new THREE.Mesh( planeGeo, debugMat );
                          labelMesh.add(hitPlane);
                          hitPlanes.push(hitPlane);

                          hitPlane.userData.entry = labelMesh.userData.entry;
                        hitPlane.userData.originalColor = debugMat.color.getHex();
                        
                        // because the geometry is already translated to its own center,
                        // we just need it at (0,0,0) in the text’s local space:
                        hitPlane.position.set(0, 0, 0);
                        hitPlane.rotation.set(0, 0, 0);
                        hitPlane.scale.set(1, 1, 1);
                        
                        // (optionally) push into your planeMeshes if you want to raycast it
                        hitPlanes.push( hitPlane );
                        planeMeshes.push(hitPlane);
                        cosmologicalLine.userData.label = labelMesh;
                    }
                }
            }
        });

        addCentralVerticalLine();
        updateSceneWithScaleWidth(scaleWidth); // Add this line to apply initial scaling
    }

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


    // Then replace the animate function modification with:
    // Update the animate function
    const originalAnimate = animate;
    animate = function () {
        //     // that's visible to the camera

        //     // Use camera position and rotation to find a good z-position
        //     let targetZ;

        //     // For camera positions with negative z (looking forward into negative z)
        //     if (camera.position.z < 0) {
        //         // Position text ahead of camera
        //         targetZ = camera.position.z - 200;
        //     } 
        //     // For camera positions with positive z (looking backward into positive z)
        //     else {
        //         // Position text ahead of camera in the positive direction
        //         targetZ = camera.position.z + 200;
        //     }

        //     // Keep fixed x,y position but update z position to remain visible
        //     nowMesh.position.set(-5, -10, targetZ);

        //     // Use a small scale to make sure it's visible but not overwhelming
        //     const scaleFactor = 0.2;
        //     nowMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
        // }

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


    const tooltip = document.getElementById('tooltip');
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let highlightedObjects = [];

    function onMouseMove(event) {
        // reset old highlights
        resetHighlightedObjects();
        tooltip.style.opacity = 0;
        document.body.style.cursor = 'default';
    
        // update mouse coords & raycaster
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
    
        // ensure world matrices (so children hitPlanes are in the right place)
        scene.updateMatrixWorld();
    
        // one big list of everything we want to hit-test
        const pickables = [
          ...planeMeshes,
          ...hitPlanes,                   // your debug planes
          ...redLines,  ...verticalRedLines,
          ...blueLines, ...verticalBlueLines,
          ...cosmologicalLines, ...verticalCosmologicalLines,
          ...textMeshes
        ];
    
        // now intersect recursively
        const intersects = raycaster.intersectObjects(pickables, true);

        if (!intersects.length) return;
    
        // first hit
        const hit = intersects[0].object;
        const entry = hit.userData.entry;
        if (!entry) return;
    
        // highlight & show tooltip
        highlightLines(entry);
        tooltip.innerHTML = formatEntryData(entry);
        tooltip.style.opacity = 1;
        tooltip.style.left  = `${event.clientX + 10}px`;
        tooltip.style.top   = `${event.clientY + 10}px`;
        document.body.style.cursor = 'pointer';
    }

    function formatEntryData(entry) {
        const keysToInclude = {
            "PAST AGE OF UNIVERSE": "Past Age of Universe",
            "FUTURE FOR LIFE IN WIDER UNIVERSE": "Future for Life in Universe",
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
            .filter(([key]) => key !== "NAME" && key !== "DATE" && key !== "IMAGE")
            .map(([key, value]) => {
                let displayValue = value;
                const numericVal = parseFloat(value.replace(/,/g, ''));
                if (!isNaN(numericVal) && value !== '∞') {
                    displayValue += " yrs";
                }
                return keysToInclude[key]
                    ? `<span class="underline">${keysToInclude[key]}</span>: ${displayValue}`
                    : displayValue;
            })
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
                // Skip big decade labels
                if (line.userData && line.userData.isDecade) return;
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
        highlightAndCollect(cosmologicalLines);
        highlightAndCollect(verticalCosmologicalLines);
        highlightAndCollect(planeMeshes);
        highlightAndCollect(labelMeshes);

        textMeshes.forEach((text) => {
            // Always skip the big decade labels
            if (text.userData && text.userData.isDecade) return;
        
            // Only highlight if not a decade and both NAME and DATE match
            if (
                text.userData &&
                text.userData.entry &&
                text.userData.entry.NAME &&
                text.userData.entry.DATE &&
                text.userData.entry.NAME === entry.NAME &&
                text.userData.entry.DATE === entry.DATE
            ) {
                text.material.color.set(highlightColor);
                associatedLines.push(text);
            }
        });

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

    const toggleControlsButton = document.getElementById('toggle-controls');
    const controlsContainer = document.querySelector('.controls-container');
    let controlsVisible = false;

    if (toggleControlsButton) {
        console.log('Toggle controls button found');
    } else {
        console.error('Toggle controls button not found');
    }

    if (controlsContainer) {
        console.log('Controls container found');
    } else {
        console.error('Controls container not found');
    }

    toggleControlsButton.addEventListener('click', () => {
        console.log('Toggle controls button clicked');
        controlsVisible = !controlsVisible;
        controlsContainer.style.display = controlsVisible ? 'flex' : 'none';
        console.log(`Controls container display: ${controlsContainer.style.display}`);
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'c' || event.key === 'C') {
            console.log('C key pressed');
            controlsVisible = !controlsVisible;
            controlsContainer.style.display = controlsVisible ? 'flex' : 'none';
            console.log(`Controls container display: ${controlsContainer.style.display}`);
        }
    });


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
    
                essaySections.forEach(section => {
                    const wrapper = document.createElement('div');
                    wrapper.classList.add('essay-section');
                    wrapper.setAttribute('data-position', section.positionIndex);
                    wrapper.id = `position-${section.positionIndex}`;
                    wrapper.innerHTML = section.sectionText; // keep HTML structure
                    contentDiv.appendChild(wrapper);
                });
    
                console.log('Essay content loaded successfully');
                setupScrollLogging();
    
                // Add hoverable footnotes
                setupFootnoteHover();
            })
            .catch(error => {
                console.error('Error loading essay:', error);
            });
    }
    
    // Function to set up hoverable footnotes
    function setupFootnoteHover() {
        const footnotes = document.querySelectorAll('.footnote');
    
        footnotes.forEach((footnote) => {
            footnote.addEventListener('mouseenter', (event) => {
                let tooltip = document.createElement('div');
                tooltip.className = 'footnote-tooltip';
                tooltip.innerHTML = footnote.getAttribute('data-footnote'); // Use innerHTML for HTML content
                document.body.appendChild(tooltip);
    
                const rect = footnote.getBoundingClientRect();
                tooltip.style.left = `${rect.left + window.scrollX}px`;
                tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
                tooltip.style.display = 'block';
            });
    
            footnote.addEventListener('mouseleave', () => {
                const tooltip = document.querySelector('.footnote-tooltip');
                if (tooltip) {
                    tooltip.remove();
                }
            });
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
            rootMargin: '0px 0px -100% 0px', // triggers only when top touches
            threshold: 0
        };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const positionIndex = entry.target.getAttribute('data-position');
                console.log(`Entry for position ${positionIndex}: isIntersecting=${entry.isIntersecting}`);
                if (entry.isIntersecting) {
                    const posIndex = parseInt(positionIndex, 10);
                    console.log(`Currently viewing section with position: ${posIndex}`);
                    if (cameraPositions[posIndex]) {
                        switchCameraPosition(posIndex);
                    } else {
                        console.warn(`No camera position for index: ${posIndex}`);
                    }
                }
            });
        }, options);
        sections.forEach(section => {
            observer.observe(section);
        });
    }

    function updateSceneWithScaleWidth(scaleWidth) {
        // Debug info

        // Update Earth past age lines (red)
        redLines.forEach((line) => {
            const entry = line.userData.entry;
            const offset = line.userData.offset || 0;
            const pastAge = entry["PAST AGE OF EARTH"];
            if (pastAge !== "∞") {
                const lineLength = mapToLinearScale(pastAge);
                line.scale.x = lineLength / line.geometry.parameters.width;
                line.position.x = -lineLength / 2;

                // Update label position
                const label = line.userData.label;
                if (label) {
                    const padding = 2;
                    const xOffset = -lineLength + padding;
                    const yOffset = line.position.y + 40; // Change from 10 to 40
                    label.position.x = xOffset;
                    label.position.y = yOffset;
                }

                // Find and update matching vertical line
                for (let i = 0; i < verticalRedLines.length; i++) {
                    if (verticalRedLines[i].userData.entry === entry) {
                        verticalRedLines[i].position.x = -lineLength;
                        break;
                    }
                }
            }
        });

        // Update Earth future habitability lines (blue)
        blueLines.forEach((line) => {
            const entry = line.userData.entry;
            const futureHabitability = entry["FUTURE HABITABILITY ON EARTH"];
            if (futureHabitability !== "∞") {
                const lineLength = Math.abs(mapToLinearScale(futureHabitability));
                line.scale.x = lineLength / line.geometry.parameters.width;
                line.position.x = lineLength / 2;

                // Update label position
                const label = line.userData.label;
                if (label) {
                    const padding = 5;
                    const xOffset = lineLength + padding;
                    const yOffset = line.position.y + 40; // Change from 10 to 40
                    label.position.x = xOffset;
                    label.position.y = yOffset; // Need to set y position too

                }

                // Find and update matching vertical line
                for (let i = 0; i < verticalBlueLines.length; i++) {
                    if (verticalBlueLines[i].userData.entry === entry) {
                        verticalBlueLines[i].position.x = lineLength;
                        break;
                    }
                }
            }
        });

        // Update cosmological past age lines (purple)
        cosmologicalLines.forEach((line) => {
            const entry = line.userData.entry;

            // Handle past age universe lines
            if (entry["PAST AGE OF UNIVERSE"]) {
                const pastAgeUniverse = entry["PAST AGE OF UNIVERSE"];
                if (pastAgeUniverse !== "∞") {
                    const lineLength = mapToLinearScale(pastAgeUniverse, true);
                    line.scale.x = lineLength / line.geometry.parameters.width;
                    line.position.x = -lineLength / 2;

                    // Update label position
                    const label = line.userData.label;
                    if (label) {
                        const padding = 2;
                        const xOffset = -lineLength + padding;
                        const yOffset = line.position.y + 40; // Change from 10 to 40
                        label.position.x = xOffset;
                        label.position.y = yOffset;
                    }

                    // Find and update matching vertical line
                    for (let i = 0; i < verticalCosmologicalLines.length; i++) {
                        if (verticalCosmologicalLines[i].userData.entry === entry &&
                            entry["PAST AGE OF UNIVERSE"] === pastAgeUniverse) {
                            verticalCosmologicalLines[i].position.x = -lineLength + DATA_LINE_THICKNESS / 2 - 0.5;
                            break;
                        }
                    }
                }
            }

            // Handle future for life in universe lines
            if (entry["FUTURE FOR LIFE IN WIDER UNIVERSE"]) {
                const futureLifeUniverse = entry["FUTURE FOR LIFE IN WIDER UNIVERSE"];
                if (futureLifeUniverse !== "∞") {
                    const lineLength = Math.abs(mapToLinearScale(futureLifeUniverse, true));
                    line.scale.x = lineLength / line.geometry.parameters.width;
                    line.position.x = lineLength / 2;

                    // Update label position
                    const label = line.userData.label;
                    if (label) {
                        const padding = 5;
                        const xOffset = lineLength + padding;
                        const yOffset = line.position.y + 10;
                        label.position.x = xOffset;
                    }

                    // Find and update matching vertical line
                    for (let i = 0; i < verticalCosmologicalLines.length; i++) {
                        if (verticalCosmologicalLines[i].userData.entry === entry &&
                            entry["FUTURE FOR LIFE IN WIDER UNIVERSE"] === futureLifeUniverse) {
                            verticalCosmologicalLines[i].position.x = lineLength - DATA_LINE_THICKNESS / 2 + 0.5;
                            break;
                        }
                    }
                }
            }
        });
        function setupMobileToggle() {
            if (window.innerWidth <= 768) {
              const toggle = document.createElement('button');
              toggle.textContent = 'View Interactive';
              toggle.style.position = 'fixed';
              toggle.style.top = '10px';
              toggle.style.left = '10px';
              toggle.style.zIndex = '9999';
              toggle.style.padding = '10px';
              toggle.style.background = '#000';
              toggle.style.color = '#fff';
              toggle.style.border = 'none';
          
              document.body.appendChild(toggle);
          
              toggle.addEventListener('click', () => {
                const showingEssay = !document.body.classList.contains('view-3d');
                document.body.classList.toggle('view-3d');
                toggle.textContent = showingEssay ? 'View Essay' : 'View Interactive';
          
                // ⬇️ Add this line to fix the canvas/resizing issue
                setTimeout(() => {
                  window.dispatchEvent(new Event('resize'));
                }, 50);
              });
            }
          }

        // Render the updated scene
        renderer.render(scene, camera);
    }
});