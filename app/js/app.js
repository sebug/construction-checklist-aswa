const searchParams = new URLSearchParams(location.search);
document.querySelector('#nameOfConstruction').value = searchParams.get('construction');
const d = new Date();
const year = d.getFullYear();
let month = '' + (d.getMonth() + 1);
if (month.length < 2) {
    month = '0' + month;
}
let day = '' + d.getDate();
if (day.length < 2) {
    day = '0' + day;
}
document.querySelector('#date').value = year + '-' + month + '-' + day;
const accessCodeInput = document.querySelector('#accessCode');
const nameOfConstructionInput = document.querySelector('#nameOfConstruction');

const checkAccessCode = async () => {
    const accessCode = accessCodeInput.value;
    const nameOfConstruction = nameOfConstructionInput.value;
    let isValid = false;
    if (!accessCode || !nameOfConstruction) {
        isValid = false;
    } else {
        try {
            const response = await fetch('/api/CheckAccessCodeTrigger', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    construction: nameOfConstruction,
                    accessCode: accessCode
                })
            });
            if (response.status !== 200) {
                return;
            }
            const obj = await response.json();
            isValid = obj.isValid;
        } catch (err) {
            console.log(err);
            isValid = false;
        }
    }
    if (isValid) {
        accessCodeInput.setAttribute('class', 'form-control valid-access-code');
        document.querySelector('.access-code-ok').style.display = 'inline';
        document.querySelector('.construction-details-entry').style.display = 'block';
    } else {
        accessCodeInput.setAttribute('class', 'form-control invalid-access-code');
        document.querySelector('.access-code-ok').style.display = 'none';
        document.querySelector('.construction-details-entry').style.display = 'none';
    }
};
accessCodeInput.addEventListener('change', checkAccessCode);
nameOfConstructionInput.addEventListener('change', checkAccessCode);

// Compress images before upload https://pqina.nl/blog/compress-image-before-upload/#saving-the-compressed-image-back-to-the-file-input
const compressImage = async (file, { quality = 1, type = file.type }) => {
    // Get as image data
    const imageBitmap = await createImageBitmap(file);

    // Draw to canvas
    const canvas = document.createElement('canvas');

    const maxWidth = 400;
    let width = imageBitmap.width;
    let height = imageBitmap.height;
    if (width > maxWidth) {
        height = height * (maxWidth / width);
        width = maxWidth;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    console.log(`Drawing to size ${width}x${height} (from ${imageBitmap.width}x${imageBitmap.height})`);

    // Turn into Blob
    const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, type, quality)
    );

    // Turn Blob into File
    return new File([blob], file.name, {
        type: blob.type,
    });
};

const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
for (const fileInput of fileInputs) {
    fileInput.addEventListener('change', async (e) => {
        // Get the files
        const { files } = e.target;

        // No files selected
        if (!files.length) return;

        // We'll store the files in this data transfer object
        const dataTransfer = new DataTransfer();

        // For every file in the files list
        for (const file of files) {
            // We don't have to compress files that aren't images
            if (!file.type.startsWith('image')) {
                // Ignore this file, but do add it to our result
                dataTransfer.items.add(file);
                continue;
            }

            // We compress the file a bit
            const compressedFile = await compressImage(file, {
                quality: 0.9,
                type: 'image/jpeg',
            });

            // Save back the compressed file instead of the original file
            dataTransfer.items.add(compressedFile);
        }

        // Set value of the file input to our new files list
        e.target.files = dataTransfer.files;
    });
}