


// Target position and rotation vectors for smooth transition
const targetPosition = new THREE.Vector3();
const targetRotation = new THREE.Euler();

// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const fullWidth = window.innerWidth;
const fullHeight = window.innerHeight;
let halfWidth = Math.floor(fullWidth / 2); // Initialize halfWidth

const camera = new THREE.PerspectiveCamera(
    50,                  // Field of view
    halfWidth / fullHeight, // Aspect ratio
    10,                 // Near clipping plane
    10000               // Far clipping plane (increase this to match your scene)
);

// Define camera positions with a targetScale property
const cameraPositions = [
    {
        position: { x: 0, y: 99, z: -1610 },
        rotation: { x: -.74, y: 0, z: 0 },
        targetScale: 1e10 // For example, set scale to 100,000
    },
    {
        position: { x: 0, y: 139.5, z: -1202 },
        rotation: { x: -.68, y: 0, z: 0 },
        targetScale: 1e9 // Set scale to 10,000,000
    },
    {
        position: { x: 0, y: 250, z: -1047.6 },
        rotation: { x: -0.52, y: 0, z: 0 },
        targetScale: 1e7
    },
    {
        position: { x: 0, y: 860.48, z: 900.7 },
        rotation: { x: -0.47, y: 0, z: 0 },
        targetScale: 1e5
    }
];
// Initialize scaleWidth with the targetScale of the initial camera position
let scaleWidth = cameraPositions[0].targetScale;

// Global variables
const DATA_COLOR = 0xff0000; // Red color
let scrollVelocity = 0;
let scrollOffset = 0;
let isTransitioning = false;
const transitionSpeed = 0.02;
let userInteracting = false;
let isDragging = false;
let targetScaleWidth = scaleWidth; // Add this line
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
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    logarithmicDepthBuffer: true // Enable logarithmic depth buffer
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0xffffff, 1);

// Append renderer to the appropriate container
const sceneContainer = document.getElementById('threejs-container');
sceneContainer.appendChild(renderer.domElement);

// Set the renderer size to match the right half of the window
renderer.setSize(halfWidth, fullHeight);

// Position the renderer's DOM element (canvas) to the left half
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0px';
renderer.domElement.style.left = '0px';

// Adjust the camera's aspect ratio
camera.aspect = halfWidth / fullHeight;
camera.updateProjectionMatrix();

// Add a light source
const light = new THREE.PointLight(0xffffff, 1, 1000);
light.position.set(50, 50, 50);
scene.add(light);

// Define linear scale values
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

// Update scaleWidth and label on slider input
const scaleSlider = document.getElementById('scale-slider');
const scaleValueLabel = document.getElementById('scale-value');

scaleSlider.addEventListener('input', function () {
    const exponent = parseFloat(scaleSlider.value); // Get the slider value as a float
    scaleWidth = Math.pow(10, exponent);

    // Clamp scaleWidth to prevent rendering issues
    const maxScale = 1e10; // Adjust based on your scene's requirements
    const minScale = 1;   // Minimum scale width
    scaleWidth = clamp(scaleWidth, minScale, maxScale);

    scaleValueLabel.textContent = exponent.toFixed(1); // Update the label to show the current exponent


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
        return 1000; // Arbitrary large value in world units
    }

    const parsedValue = parseFloat(value.replace(/,/g, '')) || 0; // Default to 0 if parsing fails
    const minLinear = 1; // Minimum value (1)
    const maxLinear = 1e12; // Maximum value (1T)

    // Clamp the parsed value to avoid precision issues
    const clampedValue = clamp(parsedValue, minLinear, maxLinear);

    // Compute length, then clamp it to avoid extremely large lengths
    const length = scaleWidth * (clampedValue - minLinear) / (maxLinear - minLinear);
    const maxLength = 1e6; // Adjust based on your scene's size
    return clamp(length, 0, maxLength);
}


function updateSceneWithScaleWidth(scaleWidth) {

    // Recalculate line lengths and positions
    redLines.forEach((line, index) => {
        const entry = line.userData.entry;
        const pastAge = entry["PAST AGE OF EARTH"];

        if (pastAge !== "∞") {
            const lineLength = mapToLinearScale(pastAge);
            line.scale.x = lineLength / line.geometry.parameters.width; // Adjust scale based on new length
            line.position.x = -lineLength / 2; // Update position to keep centered

            // Update the corresponding label position
            const label = line.userData.label;
            if (label) {
                const padding = 2; // Adjust padding as needed
                const xOffset = -lineLength + padding; // Position to the right of the vertical line
                const yOffset = line.position.y + 10; // Adjust yOffset as needed
                label.position.set(xOffset, yOffset, line.position.z);
            }
        }
    });

    blueLines.forEach((line, index) => {
        const entry = line.userData.entry;
        const futureAge = entry["FUTURE HABITABILITY ON EARTH"];

        if (futureAge !== "∞") {
            const lineLength = Math.abs(mapToLinearScale(futureAge));
            line.scale.x = lineLength / line.geometry.parameters.width; // Adjust scale based on new length
            line.position.x = lineLength / 2; // Update position to keep centered

            // Update the corresponding label position
            const label = line.userData.label;
            if (label) {
                const padding = 5; // Adjust padding as needed
                const xOffset = lineLength + padding; // Position to the right of the vertical line
                const yOffset = line.position.y + 10; // Adjust yOffset as needed
                label.position.set(xOffset, yOffset, line.position.z);
            }
        }
    });

    // Update vertical lines
    verticalRedLines.forEach((line, index) => {
        const entry = line.userData.entry;
        const pastAge = entry["PAST AGE OF EARTH"];
        if (pastAge !== "∞") {
            const lineLength = mapToLinearScale(pastAge);
            line.position.x = -lineLength; // Update position
        }
    });

    verticalBlueLines.forEach((line, index) => {
        const entry = line.userData.entry;
        const futureAge = entry["FUTURE HABITABILITY ON EARTH"];
        if (futureAge !== "∞") {
            const lineLength = Math.abs(mapToLinearScale(futureAge));
            line.position.x = lineLength; // Update position
        }
    });

    // Re-render the scene
    renderer.render(scene, camera);
}

// Global variables for data line thickness and color
const DATA_LINE_THICKNESS = .75;

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
        loader.load('fonts/Cosmica.json', function (font) {
            // Extract and reverse the years directly from the dataset
            entries = data.Sheet1
                .filter(entry => entry.DATE) // Ensure the DATE field exists
                .reverse(); // Reverse the order of entries

// Iterate over each entry and create text meshes
entries.forEach((entry, index) => {
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
    const zPosition = -(index * 20); // Position each year sequentially

    // Position the text mesh at x=0 (center of the right half)
    textMesh.position.set(0, yPosition, zPosition);

    // Rotate the text mesh 90 degrees on the X-axis
    textMesh.rotation.x = -Math.PI / 2; // Rotate 90 degrees in radians

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
    const lineGeometry = new THREE.BoxGeometry(2000, .5, .5); // Adjust thickness as needed
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.set(0, yPosition, zPosition);
    scene.add(line);

// Add past age of earth line if data exists
if (entry["PAST AGE OF EARTH"]) {
    const pastAge = entry["PAST AGE OF EARTH"];
    if (pastAge === '∞') {
        // Add a sphere for infinity value
        const sphereGeometry = new THREE.SphereGeometry(2.5, 32, 32); // Adjust size as needed (half the size)
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: DATA_COLOR });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(0, yPosition, zPosition); // Position on the central vertical line
        sphere.userData = { entry, originalColor: DATA_COLOR };
        scene.add(sphere);
        planeMeshes.push(sphere); // Add sphere to planeMeshes for hover detection
    } else {
        const lineLength = mapToLinearScale(pastAge);

        const redLineMaterial = new THREE.MeshBasicMaterial({ color: DATA_COLOR }); 
        const redLineGeometry = new THREE.BoxGeometry(lineLength, DATA_LINE_THICKNESS, DATA_LINE_THICKNESS);
        const redLine = new THREE.Mesh(redLineGeometry, redLineMaterial);
        redLine.position.set(-lineLength / 200, yPosition, zPosition);
        redLine.userData = { entry, originalColor: DATA_COLOR };
        scene.add(redLine);
        redLines.push(redLine);

        // Set the desired height for the vertical red line
        const verticalRedLineHeight = 20; // Adjust this value as needed

        const verticalRedLineGeometry = new THREE.BoxGeometry(
            DATA_LINE_THICKNESS,
            verticalRedLineHeight,
            DATA_LINE_THICKNESS
        );
        const verticalRedLine = new THREE.Mesh(verticalRedLineGeometry, new THREE.MeshBasicMaterial({ color: DATA_COLOR }));
        
        verticalRedLine.position.set(
            -lineLength + DATA_LINE_THICKNESS / 2 - 0.5, // Adjust to overlap slightly
            yPosition + verticalRedLineHeight / 2,
            zPosition
        );
        verticalRedLine.userData = { entry, originalColor: DATA_COLOR };
        scene.add(verticalRedLine);
        verticalRedLines.push(verticalRedLine);

        // Add text label next to vertical red line
        const name = entry["NAME"] || "Unknown"; // Get the name or default to "Unknown"
        const textString = `${name}\n${pastAge}`; // Combine name and past age with a newline

        // Create text geometry for the label
        const labelGeometry = new THREE.TextGeometry(textString, {
            font: font,          // Ensure 'font' is loaded and accessible
            size: 3,             // Adjust size as needed
            height: 0.1,
            curveSegments: 12,
        });

        // Compute bounding box for alignment
        labelGeometry.computeBoundingBox();
        const labelMaterial = new THREE.MeshBasicMaterial({ color: DATA_COLOR });

        // Create the label mesh
        const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);

        // Calculate offsets to position the label next to the vertical line
        const padding = 2; // Adjust padding as needed
        const xOffset = -lineLength + padding; // Position to the right of the vertical line
        const yOffset = yPosition + verticalRedLineHeight / 2; // Align vertically with the vertical line

        // Position the label mesh
        labelMesh.position.set(
            xOffset,
            yOffset,
            zPosition
        );

        // Rotate the label to face upwards (align with other text in the scene)
        labelMesh.rotation.x = 0; // Rotate 90 degrees in radians

        // Mark the mesh as a label for potential future reference
        labelMesh.userData.isLabel = true;

        // Add the label mesh to the scene
        scene.add(labelMesh);

        // Associate the label with the line
        redLine.userData.label = labelMesh;
    }
}
    
// Add future habitability of earth line if data exists
if (entry["FUTURE HABITABILITY ON EARTH"]) {
    const futureHabitability = entry["FUTURE HABITABILITY ON EARTH"];
    if (futureHabitability === '∞') {
        // Add a sphere for infinity value
        const sphereGeometry = new THREE.SphereGeometry(2.5, 32, 32); // Adjust size as needed (half the size)
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: DATA_COLOR });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(0, yPosition, zPosition); // Position on the central vertical line
        sphere.userData = { entry, originalColor: DATA_COLOR };
        scene.add(sphere);
        planeMeshes.push(sphere);
    } else {
        // Ensure positive length for future habitability
        const lineLength = Math.abs(mapToLinearScale(futureHabitability));

        const blueLineMaterial = new THREE.MeshBasicMaterial({ color: DATA_COLOR });
        const blueLineGeometry = new THREE.BoxGeometry(lineLength, DATA_LINE_THICKNESS, DATA_LINE_THICKNESS);
        const blueLine = new THREE.Mesh(blueLineGeometry, blueLineMaterial);

        blueLine.position.set(lineLength / 2, yPosition, zPosition); // Start at the center, extend forward
        blueLine.userData = { entry, originalColor: DATA_COLOR };
        scene.add(blueLine);
        blueLines.push(blueLine);

        // Add a vertical blue line
        const verticalBlueLineHeight = 20;
        const verticalBlueLineGeometry = new THREE.BoxGeometry(
            DATA_LINE_THICKNESS,
            verticalBlueLineHeight,
            DATA_LINE_THICKNESS
        );
        const verticalBlueLine = new THREE.Mesh(verticalBlueLineGeometry, new THREE.MeshBasicMaterial({ color: DATA_COLOR }));
        verticalBlueLine.position.set(
            lineLength - DATA_LINE_THICKNESS / 2 + 0.5, // Adjust to overlap slightly
            yPosition + verticalBlueLineHeight / 2,
            zPosition
        );
        verticalBlueLine.userData = { entry, originalColor: DATA_COLOR };
        scene.add(verticalBlueLine);
        verticalBlueLines.push(verticalBlueLine);

        // Add a label for the future habitability line
        const name = entry["NAME"] || "Unknown";
        const textString = `${name}\n${futureHabitability}`;

        const labelGeometry = new THREE.TextGeometry(textString, {
            font: font,
            size: 3,
            height: 0.1,
            curveSegments: 12,
        });
        labelGeometry.computeBoundingBox();
        const labelMaterial = new THREE.MeshBasicMaterial({ color: DATA_COLOR });
        const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);

        const xOffset = lineLength + 5; // Add padding to position the label
        const yOffset = yPosition + verticalBlueLineHeight / 2;

        labelMesh.position.set(xOffset, yOffset, zPosition);
        labelMesh.rotation.x = 0; 
        labelMesh.userData.isLabel = true;

        scene.add(labelMesh);

        // Associate the label with the line
        blueLine.userData.label = labelMesh;
    }
}
});

// After adding all entries, create the central vertical line
addCentralVerticalLine();
// Add grid lines
addLinearGridLines();

        });
    });


// Function to add central vertical line
function addCentralVerticalLine() {
    if (textMeshes.length === 0) {
        console.error('No text meshes available to calculate the central vertical line.');
        return;
    }

    // Define the thickness of the rectangle
    const thickness = 1; // Adjust for the width of the line

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

// Function to add grid lines
function addLinearGridLines() {
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 }); // Grey color for grid lines
    const linearValues = Object.values(linearScaleValues);

    linearValues.forEach(value => {
        const xPosition = mapToLinearScale(value);

        const firstYearPosition = textMeshes[0].position;
        const lastYearPosition = textMeshes[textMeshes.length - 1].position;

        // Add line on the left side
        const leftLineGeometry = new THREE.BoxGeometry(0.1, 0.1, Math.abs(lastYearPosition.z - firstYearPosition.z) + 100);
        const leftLine = new THREE.Mesh(leftLineGeometry, lineMaterial);
        leftLine.position.set(-xPosition, firstYearPosition.y, (firstYearPosition.z + lastYearPosition.z) / 2);
        scene.add(leftLine);

        // Add line on the right side
        const rightLineGeometry = new THREE.BoxGeometry(0.1, 0.1, Math.abs(lastYearPosition.z - firstYearPosition.z) + 100);
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
    // Toggle visibility of vertical red lines
    verticalRedLines.forEach((line) => {
        line.visible = showVertical;
    });
    // Toggle visibility of vertical blue lines
    verticalBlueLines.forEach((line) => {
        line.visible = showVertical;
    });
    // Keep horizontal lines always visible
    redLines.forEach((line) => {
        line.visible = true;
    });
    blueLines.forEach((line) => {
        line.visible = true;
    });
});

// Tooltip handling
const tooltip = document.getElementById('tooltip');
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let previousIntersectedObject = null;

let highlightedObjects = [];
function onMouseMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Check intersections
    const intersects = raycaster.intersectObjects([...planeMeshes, ...redLines, ...blueLines, ...verticalRedLines, ...verticalBlueLines], false);

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;

        // Reset previously highlighted objects if they are different from the current
        if (highlightedObjects.length > 0 && !highlightedObjects.includes(intersectedObject)) {
            resetHighlightedObjects();
        }

        // Handle current intersected object
        if (intersectedObject.userData.textMesh) {
            // Hovering over text
            intersectedObject.userData.textMesh.material.color.set(0xff0000);
            tooltip.innerText = intersectedObject.userData.textMesh.name;
            highlightedObjects.push(intersectedObject.userData.textMesh);
        } else if (intersectedObject.userData.entry) {
            // Hovering over a line or sphere
            const entry = intersectedObject.userData.entry;

            // Find and highlight all lines or spheres associated with this entry
            highlightLines(entry);

            // Update the tooltip
            tooltip.innerText = `Data: ${JSON.stringify(entry)}`;
        }

        // Show tooltip
        tooltip.style.opacity = 1;
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY + 10}px`;
        document.body.style.cursor = 'pointer';
    } else {
        // No intersections
        if (highlightedObjects.length > 0) {
            resetHighlightedObjects();
        }
        tooltip.style.opacity = 0;
        document.body.style.cursor = 'default';
    }
}

function highlightLines(entry) {
    const associatedLines = [];

    const highlightAndCollect = (linesArray) => {
        linesArray.forEach(line => {
            if (line.userData.entry === entry) {
                line.material.color.set(0x00ff00);
                associatedLines.push(line);
            }
        });
    };

    highlightAndCollect(redLines);
    highlightAndCollect(verticalRedLines);
    highlightAndCollect(blueLines);
    highlightAndCollect(verticalBlueLines);
    highlightAndCollect(planeMeshes); // Include spheres in the highlight logic

    highlightedObjects = highlightedObjects.concat(associatedLines);
}

function resetHighlightedObjects() {
    highlightedObjects.forEach(object => {
        object.material.color.set(object.userData.originalColor);
    });
    highlightedObjects = [];
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

// Variable to track full-screen state
let isFullScreen = false;

// Add event listener for the toggle button
document.getElementById('toggle-fullscreen-btn').addEventListener('click', toggleFullScreen);

function toggleFullScreen() {
    isFullScreen = !isFullScreen;

    if (isFullScreen) {
        // Enter full-screen mode
        enterFullScreen();
    } else {
        // Exit full-screen mode
        exitFullScreen();
    }
}

function enterFullScreen() {
    // Adjust CSS classes
    document.body.classList.add('fullscreen');

    // Update renderer size and position
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.left = '0px';

    // Update camera aspect
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

function exitFullScreen() {
    // Adjust CSS classes
    document.body.classList.remove('fullscreen');

    // Calculate halfWidth again
    const fullWidth = window.innerWidth;
    const fullHeight = window.innerHeight;
    halfWidth = Math.floor(fullWidth / 2);

    // Update renderer size and position
    renderer.setSize(halfWidth, fullHeight);
    renderer.domElement.style.left = `${halfWidth}px`;

    // Update camera aspect
    camera.aspect = halfWidth / fullHeight;
    camera.updateProjectionMatrix();
}

// Add event listener for the position buttons
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

    // Set the target scale width based on the chosen camera position
    targetScaleWidth = target.targetScale;
}

// Track the current camera position index
let currentCameraIndex = 0;

// Scroll position handling
let basePositionZ = camera.position.z;

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

        // Interpolate the scale width
        scaleWidth += (targetScaleWidth - scaleWidth) * transitionSpeed;

        // Update the scene with the new scale width
        updateSceneWithScaleWidth(scaleWidth);

        const positionTolerance = 0.1;
        const rotationTolerance = 0.001;
        const scaleTolerance = 0.01;

        // Check if the transition is complete
        if (
            camera.position.distanceTo(targetPosition) < positionTolerance &&
            Math.abs(camera.rotation.x - targetRotation.x) < rotationTolerance &&
            Math.abs(camera.rotation.y - targetRotation.y) < rotationTolerance &&
            Math.abs(camera.rotation.z - targetRotation.z) < rotationTolerance &&
            Math.abs(scaleWidth - targetScaleWidth) < scaleTolerance
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

function logCameraData() {
    console.log(`Camera Position: x=${camera.position.x}, y=${camera.position.y}, z=${camera.position.z}`);
    console.log(`Camera Rotation: x=${camera.rotation.x}, y=${camera.rotation.y}, z=${camera.rotation.z}`);
    console.log(`Scale Width: ${scaleWidth}`);
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

