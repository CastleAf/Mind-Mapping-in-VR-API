const { GoogleDriveService } = require('./googleDriveService.ts');
const path = require('path');
const fs = require('fs');

export async function sendToGDrive() {

    const driveClientId = process.env.GOOGLE_DRIVE_CLIENT_ID || '';
    const driveClientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || '';
    const driveRedirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || '';
    const driveRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '';

    const googleDriveService = new GoogleDriveService(driveClientId, driveClientSecret, driveRedirectUri, driveRefreshToken);

    const finalPath = path.resolve(__dirname, '../public/spacexpic.jpg');
    const folderName = 'Tese';

    if (!fs.existsSync(finalPath)) {
        throw new Error('File not found!');
    }

    let folder = await googleDriveService.searchFolder(folderName).catch((error) => {
        console.error(error);
        return null;
    });

    if (!folder) {
        folder = await googleDriveService.createFolder(folderName);
    }

    // Sending test image
    await googleDriveService.saveFile('SpaceX', finalPath, 'image/jpg', folder.id).catch((error) => {
        console.error(error);
    });

    // Sending csv file
    await googleDriveService.saveFile('poop', finalPath, 'application/csv', folder.id).catch((error) => {
        console.error(error);
    });
    
    console.info('Files uploaded successfully!');

    // Delete the file on the server
    // fs.unlinkSync(finalPath);
}

export function generatePrompt(inputText: string) {

      return `
      Please create a Mind Map on a .csv file format that will be imported into Noda.io. Each Node Name field should have a maximum of 6 words. Each node level should have a different NodeColour. The Mind Map should summarize the following text:
      "${inputText}"

      The response format should be only an array of objects describing each node, as a json format, without any words or newlines before the array.
      Example output:
      [{"NodeId": "value", "NomeName": "value", "FromNode": "value", "NodeColour": "value"}, {"NodeId": "value", "NomeName": "value", "FromNode": "value", "NodeColour": "value"}]`
}
