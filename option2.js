// option2.js

// Global variables
let scrollVelocity = 0;
let scrollOffset = 0;
let isTransitioning = false;
const transitionSpeed = 0.005;
let userInteracting = false;
let isDragging = false;

// Target position and rotation vectors for smooth transition
const targetPosition = new THREE.Vector3();
const targetRotation = new THREE.Euler();

// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const fullWidth = window.innerWidth;
const fullHeight = window.innerHeight;
let halfWidth = Math.floor(fullWidth / 2); // Initialize halfWidth

// Adjust camera aspect ratio for right half
const camera = new THREE.PerspectiveCamera(
    50,
    halfWidth / fullHeight, // Adjusted aspect ratio for right half
    0.1,
    5000 // Increased far clipping plane to ensure visibility
);

// Define camera positions
const cameraPositions = [
    {
        position: { x: 0, y: 193.5, z: -1899.3 },
        rotation: { x: -1.57, y: 0, z: 0 }
    },
    {
        position: { x: 0, y: 200, z: -1617.8 },
        rotation: { x: -1.21, y: 0, z: 0 }
    },
    {
        position: { x: 0, y: 250, z: -1047.6 },
        rotation: { x: -0.52, y: 0, z: 0 }
    },
    {
        position: { x: 0, y: 860.48, z: 900.7 }, // New Position 4
        rotation: { x: -0.47, y: 0, z: 0 }
    }
];

// Set the initial camera position and rotation to position 1
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

// Create renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0xffffff, 1);

// Append renderer to the appropriate container
const sceneContainer = document.getElementById('threejs-container');
sceneContainer.appendChild(renderer.domElement);

// Set the renderer size to match the right half of the window
renderer.setSize(halfWidth, fullHeight);

// Position the renderer's DOM element (canvas) to the right half
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0px';
renderer.domElement.style.left = `${halfWidth}px`;

// Adjust the camera's aspect ratio
camera.aspect = halfWidth / fullHeight;
camera.updateProjectionMatrix();

// Add a light source
const light = new THREE.PointLight(0xffffff, 1, 1000);
light.position.set(50, 50, 50);
scene.add(light);

// Logarithmic scale values
const logScaleValues = {
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

// Function to map age value to position on the logarithmic scale
function mapToLogScale(value) {
    if (typeof value !== 'string') {
        value = value.toString();
    }
    if (value === '∞') {
        return 1000; // Arbitrary large value in world units
    }
    const logValue = Math.log10(parseFloat(value.replace(/,/g, '')));
    const minLog = Math.log10(1e3); // Minimum value on the scale (1K)
    const maxLog = Math.log10(1e12); // Maximum value on the scale (1T)
    const scaleWidth = 500; // Define a suitable scale width in world units
    return scaleWidth * (logValue - minLog) / (maxLog - minLog);
}

// Global variables for data line thickness and color
const DATA_LINE_THICKNESS = 0.8;
const DATA_LINE_COLOR = 0xff0000; // Red color

// Arrays to store meshes
const textMeshes = [];
const planeMeshes = [];
const redLines = [];
const blueLines = [];
const verticalRedLines = [];
const verticalBlueLines = [];
let entries = [];
let centralLine;

// Load font and create text meshes
const loader = new THREE.FontLoader();
fetch('data.json')
    .then(response => response.json())
    .then(data => {
        loader.load('fonts/Cosmica Trial Regular_Regular.json', function (font) {
            entries = data.Sheet1.reverse();
            entries.forEach((entry, index) => {
                if (entry.DATE) {
                    const year = entry.DATE;
                    const textGeometry = new THREE.TextGeometry(year.toString(), {
                        font: font,
                        size: 5,
                        height: 0.1,
                        curveSegments: 12,
                    });

                    textGeometry.computeBoundingBox();
                    const xOffset = -textGeometry.boundingBox.min.x; // Offset to align left edge to x=0
                    textGeometry.translate(xOffset, 0, 0); // Align left edge to local origin

                    const material = new THREE.MeshBasicMaterial({
                        color: 0x000000,
                        side: THREE.DoubleSide,
                    });
                    const textMesh = new THREE.Mesh(textGeometry, material);

                    const yPosition = -10; // Fixed value in world units
                    const zPosition = -(index * 20);

                    // Position the text mesh at x=0 (center of right half)
                    textMesh.position.set(0, yPosition, zPosition);

                    // Rotate the text mesh 90 degrees on the X-axis
                    textMesh.rotation.x = -1.5;

                    textMesh.userData = { isYear: true, originalColor: 0x000000 };
                    textMesh.name = `Year_${year}`;
                    scene.add(textMesh);
                    textMeshes.push(textMesh);

                    // Get dimensions for plane mesh
                    const width = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
                    const height = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;

                    const planeGeometry = new THREE.PlaneGeometry(width * 1.2, height * 1.2); // Slightly increase the plane size for better hover
                    const planeMaterial = new THREE.MeshBasicMaterial({
                        opacity: 0,
                        transparent: true,
                        side: THREE.DoubleSide,
                    });
                    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);

                    // Position and rotate the plane to match the text mesh
                    planeMesh.position.copy(textMesh.position);
                    planeMesh.rotation.set(textMesh.rotation.x, textMesh.rotation.y, textMesh.rotation.z);
                    planeMesh.userData = { textMesh: textMesh };
                    scene.add(planeMesh);
                    planeMeshes.push(planeMesh);

                    // Create a thin rectangle from the bottom of the text extending horizontally
                    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
                    const lineGeometry = new THREE.BoxGeometry(2000, 0.2, 0.2); // Adjust thickness as needed
                    const line = new THREE.Mesh(lineGeometry, lineMaterial);
                    line.position.set(0, yPosition, zPosition);
                    scene.add(line);

                    // Add past age of earth line
                    if (entry["PAST AGE OF EARTH"]) {
                        const pastAge = entry["PAST AGE OF EARTH"];
                        const lineLength = mapToLogScale(pastAge);

                        const redLineMaterial = new THREE.MeshBasicMaterial({ color: DATA_LINE_COLOR }); // Use global color
                        const redLineGeometry = new THREE.BoxGeometry(lineLength, DATA_LINE_THICKNESS, DATA_LINE_THICKNESS); // Use global thickness
                        const redLine = new THREE.Mesh(redLineGeometry, redLineMaterial);
                        redLine.position.set(-lineLength / 2, yPosition, zPosition);
                        redLine.userData = { entry, originalColor: DATA_LINE_COLOR };
                        scene.add(redLine);
                        redLines.push(redLine);

                        // Create vertical red line extending upwards to the text
                        const verticalRedLineGeometry = new THREE.BoxGeometry(DATA_LINE_THICKNESS, Math.abs(textMesh.position.y - yPosition) + 100, DATA_LINE_THICKNESS); // Use global thickness
                        const verticalRedLine = new THREE.Mesh(verticalRedLineGeometry, redLineMaterial.clone());
                        verticalRedLine.position.set(-lineLength, yPosition + (Math.abs(textMesh.position.y - yPosition) + 100) / 2, zPosition);
                        verticalRedLine.visible = false; // Initially hidden
                        verticalRedLine.userData = { entry, originalColor: DATA_LINE_COLOR };
                        scene.add(verticalRedLine);
                        verticalRedLines.push(verticalRedLine);
                    }

                    // Add future habitability of earth line
                    if (entry["FUTURE HABITABILITY ON EARTH"]) {
                        const futureHabitability = entry["FUTURE HABITABILITY ON EARTH"];
                        const lineLength = mapToLogScale(futureHabitability);

                        const blueLineMaterial = new THREE.MeshBasicMaterial({ color: DATA_LINE_COLOR }); // Use global color
                        const blueLineGeometry = new THREE.BoxGeometry(lineLength, DATA_LINE_THICKNESS, DATA_LINE_THICKNESS); // Use global thickness
                        const blueLine = new THREE.Mesh(blueLineGeometry, blueLineMaterial);
                        blueLine.position.set(lineLength / 2, yPosition, zPosition);
                        blueLine.userData = { entry, originalColor: DATA_LINE_COLOR };
                        scene.add(blueLine);
                        blueLines.push(blueLine);

                        // Create vertical blue line extending upwards to the text
                        const verticalBlueLineGeometry = new THREE.BoxGeometry(DATA_LINE_THICKNESS, Math.abs(textMesh.position.y - yPosition) + 100, DATA_LINE_THICKNESS); // Use global thickness
                        const verticalBlueLine = new THREE.Mesh(verticalBlueLineGeometry, blueLineMaterial.clone());
                        verticalBlueLine.position.set(lineLength, yPosition + (Math.abs(textMesh.position.y - yPosition) + 100) / 2, zPosition);
                        verticalBlueLine.visible = false; // Initially hidden
                        verticalBlueLine.userData = { entry, originalColor: DATA_LINE_COLOR };
                        scene.add(verticalBlueLine);
                        verticalBlueLines.push(verticalBlueLine);
                    }
                }
            });

            // After adding all entries, create the central vertical line
            addCentralVerticalLine();
            // Add grid lines
            addLogarithmicGridLines();
        });
    });

// Function to add central vertical line
function addCentralVerticalLine() {
    if (textMeshes.length === 0) {
        console.error('No text meshes available to calculate the central vertical line.');
        return;
    }

    // Define the thickness of the rectangle
    const thickness = 0.5; // Adjust for the width of the line

    // Calculate the length based on the distance between the first and last textMeshes
    const firstTextPosition = textMeshes[0].position;
    const lastTextPosition = textMeshes[textMeshes.length - 1].position;
    const length = Math.abs(lastTextPosition.z - firstTextPosition.z) + 100; // Add extra to ensure it spans fully

    // Create the BoxGeometry for the rectangle
    const rectangleGeometry = new THREE.BoxGeometry(thickness, 0.1, length); // Set Z-axis length for front-to-back orientation

    // Create a material and color for the rectangle
    const rectangleMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

    // Create the mesh for the rectangle
    const rectangle = new THREE.Mesh(rectangleGeometry, rectangleMaterial);

    // Position the rectangle at x=0
    const midZ = (firstTextPosition.z + lastTextPosition.z) / 2;
    rectangle.position.set(0, firstTextPosition.y, midZ);

    // Add the rectangle to the scene
    scene.add(rectangle);
}

// Function to add logarithmic grid lines
function addLogarithmicGridLines() {
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 }); // Grey color for grid lines
    const logValues = Object.values(logScaleValues);

    logValues.forEach(value => {
        const xPosition = mapToLogScale(value);

        const firstYearPosition = textMeshes[0].position;
        const lastYearPosition = textMeshes[textMeshes.length - 1].position;

        // Add line on the left side
        const leftLineGeometry = new THREE.BoxGeometry(0.1, 0.1, Math.abs(lastYearPosition.z - firstYearPosition.z) + 100); // Adjust thickness as needed
        const leftLine = new THREE.Mesh(leftLineGeometry, lineMaterial);
        leftLine.position.set(-xPosition, firstYearPosition.y, (firstYearPosition.z + lastYearPosition.z) / 2);
        scene.add(leftLine);

        // Add line on the right side
        const rightLineGeometry = new THREE.BoxGeometry(0.1, 0.1, Math.abs(lastYearPosition.z - firstYearPosition.z) + 100); // Adjust thickness as needed
        const rightLine = new THREE.Mesh(rightLineGeometry, lineMaterial);
        rightLine.position.set(xPosition, firstYearPosition.y, (firstYearPosition.z + lastYearPosition.z) / 2);
        scene.add(rightLine);
    });
}

// Generate logarithmic scale labels
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

// Generate the logarithmic scale for both left and right sides
generateLogarithmicScale(document.querySelector('.log-scale-left'), true);
generateLogarithmicScale(document.querySelector('.log-scale-right'));

// Handle camera rotation slider
const xRotationSlider = document.getElementById('x-rotation-slider');
xRotationSlider.addEventListener('input', function () {
    camera.rotation.x = parseFloat(xRotationSlider.value);
});

// Handle vertical lines toggle checkbox
const toggleVerticalLinesCheckbox = document.getElementById('toggle-vertical-lines');
toggleVerticalLinesCheckbox.addEventListener('change', function () {
    const showVertical = toggleVerticalLinesCheckbox.checked;
    // Toggle visibility of horizontal and vertical red lines
    redLines.forEach((line, index) => {
        line.visible = !showVertical;
        verticalRedLines[index].visible = showVertical;
    });
    // Toggle visibility of horizontal and vertical blue lines
    blueLines.forEach((line, index) => {
        line.visible = !showVertical;
        verticalBlueLines[index].visible = showVertical;
    });
});

// Tooltip handling
const tooltip = document.getElementById('tooltip');
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let previousIntersectedObject = null;

function onMouseMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Check intersections with planeMeshes, redLines, blueLines, verticalRedLines, verticalBlueLines
    const intersects = raycaster.intersectObjects([...planeMeshes, ...redLines, ...blueLines, ...verticalRedLines, ...verticalBlueLines], false);

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;

        // If we have a previous object and it's different from the current
        if (previousIntersectedObject && previousIntersectedObject !== intersectedObject) {
            resetObjectColor(previousIntersectedObject);
        }

        // Handle current intersected object
        if (intersectedObject.userData.textMesh) {
            // Hovering over text
            intersectedObject.userData.textMesh.material.color.set(0xff0000);
            tooltip.innerText = intersectedObject.userData.textMesh.name;
        } else {
            // Hovering over a line
            intersectedObject.material.color.set(0x00ff00); // Change line color to green on hover
            tooltip.innerText = `Data: ${JSON.stringify(intersectedObject.userData.entry)}`;
        }

        // Show tooltip
        tooltip.style.opacity = 1;
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY + 10}px`;
        document.body.style.cursor = 'pointer';

        previousIntersectedObject = intersectedObject;
    } else {
        // No intersections
        if (previousIntersectedObject) {
            resetObjectColor(previousIntersectedObject);
            previousIntersectedObject = null;
        }
        tooltip.style.opacity = 0;
        document.body.style.cursor = 'default';
    }
}

function resetObjectColor(object) {
    if (object.userData.textMesh) {
        // Reset text color
        object.userData.textMesh.material.color.set(object.userData.textMesh.userData.originalColor);
    } else {
        // Reset line color
        object.material.color.set(object.userData.originalColor);
    }
}

renderer.domElement.addEventListener('mousemove', onMouseMove, false);

// Variables to track mouse state
let isScrolling = false;
let touchStartY = 0;
let previousMousePosition = { x: 0, y: 0 };

// Event listeners to detect user scroll/touch interactions on the Three.js canvas
renderer.domElement.addEventListener('wheel', (event) => {
    event.preventDefault(); // Prevent default scrolling behavior
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

// Updated `stopTransition` function to ensure correct snapping to target position
function stopTransition() {
    if (isTransitioning) {
        // Directly set the camera to the target position and rotation
        camera.position.copy(targetPosition);
        camera.rotation.copy(targetRotation);
        isTransitioning = false; // Stop the transition
        basePositionZ = targetPosition.z; // Ensure base position aligns with target
        scrollOffset = 0; // Reset scroll offset
    }
    userInteracting = true; // Allow user interaction
}

// Handle mouse down event to start dragging
renderer.domElement.addEventListener('mousedown', function (event) {
    isDragging = true;
    userInteracting = true;
    stopTransition();
    previousMousePosition = { x: event.clientX, y: event.clientY };
});

// Handle mouse move event to update camera position if dragging
renderer.domElement.addEventListener('mousemove', function (event) {
    if (isDragging) {
        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;

        camera.position.x -= deltaX * 0.5;
        camera.position.y += deltaY * 0.5;
        previousMousePosition = { x: event.clientX, y: event.clientY };
    }
});

// Handle mouse up event to stop dragging
renderer.domElement.addEventListener('mouseup', function () {
    isDragging = false;
    userInteracting = false;
});

// Add event listener for the position buttons
document.getElementById('position1-btn').addEventListener('click', () => switchCameraPosition(0));
document.getElementById('position2-btn').addEventListener('click', () => switchCameraPosition(1));
document.getElementById('position3-btn').addEventListener('click', () => switchCameraPosition(2));
document.getElementById('position4-btn').addEventListener('click', () => switchCameraPosition(3));

// Function to switch to target camera position immediately or smoothly
function switchCameraPosition(positionIndex) {
    const target = cameraPositions[positionIndex];
    targetPosition.set(target.position.x, target.position.y, target.position.z);
    targetRotation.set(target.rotation.x, target.rotation.y, target.rotation.z);

    isTransitioning = true; // Start transitioning to the new position
    userInteracting = false; // Prevent scrolling during the transition
    scrollVelocity = 0; // Reset scroll velocity

    // Set the base position to target position when the transition completes
    basePositionZ = target.position.z;
}

// Track the current camera position index
let currentCameraIndex = 0;

// Scroll position handling
let basePositionZ = camera.position.z;

// `animate` function for smooth scrolling and transitioning independently
function animate() {
    requestAnimationFrame(animate);

    if (userInteracting && !isTransitioning) {
        // Smooth scrolling with decay when interacting
        scrollOffset += scrollVelocity;
        camera.position.z = basePositionZ + scrollOffset;
        scrollVelocity *= 0.95; // Gradual decay for smooth scroll
    } else if (isTransitioning) {
        // Transition smoothly to target position and rotation
        camera.position.lerp(targetPosition, transitionSpeed);
        camera.rotation.x += (targetRotation.x - camera.rotation.x) * transitionSpeed;
        camera.rotation.y += (targetRotation.y - camera.rotation.y) * transitionSpeed;
        camera.rotation.z += (targetRotation.z - camera.rotation.z) * transitionSpeed;

        const positionTolerance = 0.1;
        const rotationTolerance = 0.001;

        // Check if the transition is complete
        if (
            camera.position.distanceTo(targetPosition) < positionTolerance &&
            Math.abs(camera.rotation.x - targetRotation.x) < rotationTolerance &&
            Math.abs(camera.rotation.y - targetRotation.y) < rotationTolerance &&
            Math.abs(camera.rotation.z - targetRotation.z) < rotationTolerance
        ) {
            isTransitioning = false;
            basePositionZ = targetPosition.z; // Update the base position after transition
            scrollOffset = 0;
        }
    }

    renderer.render(scene, camera);
}

animate();

// Handle window resizing
window.addEventListener('resize', function () {
    const fullWidth = window.innerWidth;
    const fullHeight = window.innerHeight;
    halfWidth = Math.floor(fullWidth / 2);

    // Update renderer size and position
    renderer.setSize(halfWidth, fullHeight);
    renderer.domElement.style.left = `${halfWidth}px`;

    // Update camera aspect
    camera.aspect = halfWidth / fullHeight;
    camera.updateProjectionMatrix();
});

// Event listener to log camera data on key press (e.g., 'L' key)
window.addEventListener('keydown', function(event) {
    if (event.key === 'l' || event.key === 'L') {
        logCameraData();
    }
});

// Function to log camera data
function logCameraData() {
    console.log(`Camera Position: x=${camera.position.x}, y=${camera.position.y}, z=${camera.position.z}`);
    console.log(`Camera Rotation: x=${camera.rotation.x}, y=${camera.rotation.y}, z=${camera.rotation.z}`);
}

// Add an event listener to switch camera positions with the 'C' key
window.addEventListener('keydown', function(event) {
    if (event.key === 'c' || event.key === 'C') {
        currentCameraIndex = (currentCameraIndex + 1) % cameraPositions.length;
        switchCameraPosition(currentCameraIndex);
    }
});

// Load the essay
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

            // Split the text on [Position X] markers
            const sections = text.split(/\[Position (\d+)\]/g);
            const essaySections = [];

            // Start from index 1 to skip any text before the first [Position X]
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

            // Call setupScrollLogging after content is loaded
            setupScrollLogging();
        })
        .catch(error => {
            console.error('Error loading essay:', error);
        });
}

// Function to set up IntersectionObserver for scroll logging
function setupScrollLogging() {
    const sections = document.querySelectorAll('.essay-section');

    console.log('Found sections:', sections.length);

    if (sections.length === 0) {
        console.error('No sections found.');
        return;
    }

    const options = {
        root: null, // Use the viewport as the root
        rootMargin: '0px',
        threshold: 0 // Trigger when any part of the section is visible
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const positionIndex = entry.target.getAttribute('data-position');
            console.log(`Entry for position ${positionIndex}: isIntersecting=${entry.isIntersecting}, intersectionRatio=${entry.intersectionRatio}`);
            if (entry.isIntersecting) {
                console.log(`Currently viewing section with position: ${positionIndex}`);
                // Optionally, switch camera position here
                switchCameraPosition(parseInt(positionIndex, 10));
            }
        });
    }, options);

    sections.forEach(section => {
        observer.observe(section);
    });
}