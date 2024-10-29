// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    5000 // Increased far clipping plane to ensure visibility
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0xffffff, 1);
document.body.appendChild(renderer.domElement);

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
        return window.innerWidth / 2; // Arbitrary large value for infinity
    }
    const logValue = Math.log10(parseFloat(value.replace(/,/g, '')));
    const minLog = Math.log10(1e3); // Minimum value on the scale (1K)
    const maxLog = Math.log10(1e12); // Maximum value on the scale (1T)
    const scaleWidth = window.innerWidth / 2; // Width of the scale (50vw)
    return scaleWidth * (logValue - minLog) / (maxLog - minLog);
}

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

                    const yPosition = -(window.innerHeight / 20);
                    const zPosition = -(index * 20);

                    // Position the text mesh at x=0 (right next to the center line)
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

                    // Create a line from the bottom of the text extending infinitely on the horizontal axis
                    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
                    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                        new THREE.Vector3(-1000, yPosition, zPosition),
                        new THREE.Vector3(1000, yPosition, zPosition)
                    ]);
                    const line = new THREE.Line(lineGeometry, lineMaterial);
                    scene.add(line);

                    // Add past age of earth line
                    if (entry["PAST AGE OF EARTH"]) {
                        const pastAge = entry["PAST AGE OF EARTH"];
                        const lineLength = mapToLogScale(pastAge);

                        const redLineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
                        const redLineGeometry = new THREE.BufferGeometry().setFromPoints([
                            new THREE.Vector3(0, yPosition, zPosition),
                            new THREE.Vector3(-lineLength, yPosition, zPosition)
                        ]);
                        const redLine = new THREE.Line(redLineGeometry, redLineMaterial);
                        redLine.userData = { entry, originalColor: 0xff0000 };
                        scene.add(redLine);
                        redLines.push(redLine);

                        // Create vertical red line extending upwards to the text
                        const verticalRedLineGeometry = new THREE.BufferGeometry().setFromPoints([
                            new THREE.Vector3(-lineLength, yPosition, zPosition),
                            new THREE.Vector3(-lineLength, yPosition + Math.abs(textMesh.position.y - yPosition) + 100, zPosition) // +100 for height
                        ]);
                        const verticalRedLine = new THREE.Line(verticalRedLineGeometry, redLineMaterial.clone());
                        verticalRedLine.visible = false; // Initially hidden
                        verticalRedLine.userData = { entry, originalColor: 0xff0000 };
                        scene.add(verticalRedLine);
                        verticalRedLines.push(verticalRedLine);
                    }

                    // Add future habitability of earth line
                    if (entry["FUTURE HABITABILITY ON EARTH"]) {
                        const futureHabitability = entry["FUTURE HABITABILITY ON EARTH"];
                        const lineLength = mapToLogScale(futureHabitability);

                        const blueLineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
                        const blueLineGeometry = new THREE.BufferGeometry().setFromPoints([
                            new THREE.Vector3(0, yPosition, zPosition),
                            new THREE.Vector3(lineLength, yPosition, zPosition)
                        ]);
                        const blueLine = new THREE.Line(blueLineGeometry, blueLineMaterial);
                        blueLine.userData = { entry, originalColor: 0x0000ff };
                        scene.add(blueLine);
                        blueLines.push(blueLine);

                        // Create vertical blue line extending upwards to the text
                        const verticalBlueLineGeometry = new THREE.BufferGeometry().setFromPoints([
                            new THREE.Vector3(lineLength, yPosition, zPosition),
                            new THREE.Vector3(lineLength, yPosition + Math.abs(textMesh.position.y - yPosition) + 100, zPosition) // +100 for height
                        ]);
                        const verticalBlueLine = new THREE.Line(verticalBlueLineGeometry, blueLineMaterial.clone());
                        verticalBlueLine.visible = false; // Initially hidden
                        verticalBlueLine.userData = { entry, originalColor: 0x0000ff };
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

    function addCentralVerticalLine() {
      // Define the thickness of the rectangle
      const thickness = 0.5; // Adjust for the width of the line
  
      // Calculate the length based on the distance between the first and last textMeshes
      const firstTextPosition = textMeshes[0].position;
      const lastTextPosition = textMeshes[textMeshes.length - 1].position;
      const length = Math.abs(lastTextPosition.z - firstTextPosition.z) ; // Add a bit extra to ensure it spans fully
  
      // Create the BoxGeometry for the rectangle
      const rectangleGeometry = new THREE.BoxGeometry(thickness, 0.1, length); // Set Z-axis length for front-to-back orientation
  
      // Create a material and color for the rectangle
      const rectangleMaterial = new THREE.MeshBasicMaterial({ color: 00000 });
  
      // Create the mesh for the rectangle
      const rectangle = new THREE.Mesh(rectangleGeometry, rectangleMaterial);
  
      // Position the rectangle in the middle of the grid, slightly to the left of the text labels
      const midZ = (firstTextPosition.z + lastTextPosition.z) / 2;
      rectangle.position.set(0, firstTextPosition.y, midZ); // Adjust X-position (-5) to align it left of the text if needed
  
      // Add the rectangle to the scene
      scene.add(rectangle);
  }

// Function to add logarithmic grid lines
function addLogarithmicGridLines() {
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff }); // Blue color for grid lines
    const logValues = Object.values(logScaleValues);

    logValues.forEach(value => {
        const xPosition = mapToLogScale(value);

        const firstYearPosition = textMeshes[0].position;
        const lastYearPosition = textMeshes[textMeshes.length - 1].position;

        // Add line on the left side
        const leftLineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-xPosition, firstYearPosition.y, firstYearPosition.z),
            new THREE.Vector3(-xPosition, lastYearPosition.y, lastYearPosition.z)
        ]);
        const leftLine = new THREE.Line(leftLineGeometry, lineMaterial);
        scene.add(leftLine);

        // Add line on the right side
        const rightLineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(xPosition, firstYearPosition.y, firstYearPosition.z),
            new THREE.Vector3(xPosition, lastYearPosition.y, lastYearPosition.z)
        ]);
        const rightLine = new THREE.Line(rightLineGeometry, lineMaterial);
        scene.add(rightLine);
    });
}

// Scroll position handling
let scrollPosition = 0;
let scrollVelocity = 0;
let touchStartY = 0;
let isScrolling = false;

const isMobile = window.matchMedia("(max-width: 767px)").matches;

window.addEventListener('wheel', function (event) {
    scrollVelocity += event.deltaY * 0.005;
});

window.addEventListener('touchstart', function (event) {
    touchStartY = event.touches[0].clientY;
    isScrolling = true;
});

window.addEventListener('touchmove', function (event) {
    if (isScrolling) {
        const touchEndY = event.touches[0].clientY;
        const deltaY = touchStartY - touchEndY;
        scrollVelocity += deltaY * (isMobile ? 0.02 : 0.01);
        touchStartY = touchEndY;
    }
});

window.addEventListener('touchend', function () {
    isScrolling = false;
});

// Function to generate logarithmic scale labels
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
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Handle mouse down event
renderer.domElement.addEventListener('mousedown', function (event) {
    isDragging = true;
    previousMousePosition = { x: event.clientX, y: event.clientY };
});

// Handle mouse move event
renderer.domElement.addEventListener('mousemove', function (event) {
    if (isDragging) {
        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;

        camera.position.x -= deltaX * .5;
        camera.position.y += deltaY * 0.5;

        previousMousePosition = { x: event.clientX, y: event.clientY };
    }
});

// Handle mouse up event
renderer.domElement.addEventListener('mouseup', function () {
    isDragging = false;
});

function animate() {
    requestAnimationFrame(animate);

    // Apply momentum scrolling
    scrollPosition += scrollVelocity;
    scrollVelocity *= isMobile ? 0.93 : 0.95;

    // Move camera along the Z-axis based on scroll
    camera.position.z = 200 + scrollPosition;

    renderer.render(scene, camera);
}

animate();

// Handle window resizing
window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});