import axios from 'axios';
import FormData from 'form-data';

const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const PINATA_JWT = process.env.PINATA_JWT;

if (!PINATA_JWT) {
    throw new Error('PINATA_JWT is not defined in environment variables');
}

/**
 * Uploads a file buffer to Pinata IPFS and returns the CID
 * @param {Buffer} buffer - The file buffer
 * @param {string} fileName - The original file name
 * @param {string} mimeType - The MIME type of the file
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<string>} - The IPFS CID
 */
export const uploadFileToIPFS = async (buffer, fileName, mimeType, retries = 2) => {
    try {
        console.log(`Preparing to upload to Pinata: ${fileName}, size: ${buffer.length}, type: ${mimeType}`);

        const formData = new FormData();
        formData.append('file', buffer, {
            filename: fileName,
            contentType: mimeType,
        });

        formData.append('pinataMetadata', JSON.stringify({ name: fileName }));

        const boundary = formData.getBoundary ? formData.getBoundary() : `----NodeFormDataBoundary${Date.now()}`;
        console.log(`Using FormData boundary: ${boundary}`);

        const response = await axios.post(PINATA_API_URL, formData, {
            headers: {
                Authorization: `Bearer ${PINATA_JWT}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 30000,
        });

        if (response.data && response.data.IpfsHash) {
            console.log(`Pinata upload successful for ${fileName}, CID: ${response.data.IpfsHash}`);
            return response.data.IpfsHash;
        } else {
            throw new Error('Pinata response missing IpfsHash');
        }
    } catch (error) {
        console.error(`Pinata upload error for ${fileName} (retries left: ${retries}):`, error.response?.data || error.message);
        if (retries > 0) {
            console.log(`Retrying upload for ${fileName}...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return uploadFileToIPFS(buffer, fileName, mimeType, retries - 1);
        }
        throw new Error(`Failed to upload ${fileName} to Pinata: ${error.response?.data?.error?.details || error.message}`);
    }
};