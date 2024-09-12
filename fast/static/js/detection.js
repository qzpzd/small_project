document.getElementById('uploadForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const fileInput = document.getElementById('fileInput');
    const modelInput = document.getElementById('modelInput');

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('model', modelInput.files[0]);
    console.log(formData)
    try {
        const response = await fetch('/contact/detect', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        document.getElementById('outputImage').src = `data:image/jpeg;base64,${data.image}`;
    } catch (error) {
        let errorMessage = 'An error occurred during detection.';
        if (error instanceof FetchError && error.response) {
            const responseJson = await error.response.json();
            errorMessage = responseJson.detail || errorMessage;
        }
        console.error(errorMessage);
        alert(errorMessage);
    }
});

class FetchError extends Error {
    constructor(response) {
        super(`${response.status} ${response.statusText}`);
        this.response = response;
    }
}