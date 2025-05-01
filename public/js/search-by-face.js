async function loadModels() {
    try {
        console.log('Loading face-api.js models...');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        console.log('Models loaded.');
    } catch (error) {
        console.error('Failed to load models:', error);
    }
}

async function getFaceDescriptor(imageFileOrUrl, isUrl = false) {
    let img;
    if (isUrl) {
        console.log("Using URL image");
        img = await faceapi.fetchImage(imageFileOrUrl);
    } else {
        console.log("Using uploaded image");
        img = await faceapi.bufferToImage(imageFileOrUrl);
    }

    const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (!detection) {
        console.warn('No face detected in:', isUrl ? imageFileOrUrl : 'uploaded image');
        return null;
    }

    return detection.descriptor;
}

async function compareWithDatabase() {
    const img1File = document.getElementById('img1').files[0];
    if (!img1File) {
        alert('Please upload an image first.');
        return;
    }

    const uploadedDescriptor = await getFaceDescriptor(img1File);
    if (!uploadedDescriptor) {
        alert('No face found in uploaded image.');
        return;
    }

    try {
        const response = await fetch('/api/all-images');
        const data = await response.json();

        for (const person of data) {
            const dbDescriptor = await getFaceDescriptor(person.imageUrl, true);
            if (!dbDescriptor) continue;

            const distance = faceapi.euclideanDistance(uploadedDescriptor, dbDescriptor);
            console.log(`Comparing with ${person.name} (${person.collection}): distance = ${distance}`);

            if (distance < 0.6) {
                alert(`✅ Match found: ${person.name} from ${person.collection} Search in it`);
                return;
            }
        }

        alert('❌ No match found.');
    } catch (error) {
        console.error('Error comparing faces:', error);
        alert('Something went wrong while searching.');
    }
}

window.addEventListener('load', async () => {
    await loadModels();

    const searchBtn = document.getElementById('searchByFaceBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', compareWithDatabase);
    }
});
