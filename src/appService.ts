const { GoogleDriveService } = require('./googleDriveService.ts');
const path = require('path');
const fs = require('fs');

export async function sendToGDrive(fileTitle: string, fileData: Array<any>) {
    const fileName = fileTitle + '.csv';

    try {
        fs.writeFileSync(
            path.resolve(__dirname, '../public/' + fileName),
            fileData
        );
        console.log('> Saved ' + fileName + ' locally!');
    } catch (e) {
        console.error(e);
    }

    const driveClientId = process.env.GOOGLE_DRIVE_CLIENT_ID || '';
    const driveClientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || '';
    const driveRedirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || '';
    const driveRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '';

    const googleDriveService = new GoogleDriveService(
        driveClientId,
        driveClientSecret,
        driveRedirectUri,
        driveRefreshToken
    );

    const finalPath = path.resolve(__dirname, '../public/' + fileName);
    const folderName = 'Tese';

    if (!fs.existsSync(finalPath)) {
        throw new Error('File not found!');
    }

    let folder = await googleDriveService
        .searchFolder(folderName)
        .catch((error: any) => {
            throw new Error(error);
        });

    if (!folder) {
        folder = await googleDriveService.createFolder(folderName);
    }

    // Sending csv file
    return await googleDriveService
        .saveFile(fileName, finalPath, 'application/csv', folder.id)
        .then(() => {
            console.info('File uploaded into Google Drive successfully!\n');
        })
        .catch((error: any) => {
            throw new Error(error);
        });
    
}

export function formatData(dataRows: Array<any>) {
    let linkList = [];
    let finalData = [];
    let linkId = 0;

    // Algorithm defines first Node Level as 0 or sometimes as 1
    const firstNodeLevel = +dataRows[0].NodeLevel;

    // Format Node Rows and Create Links
    dataRows.forEach((element: any) => {
        // Populate Link List
        if (+element.FromNode > 0) {
            linkList.push([element.FromNode, element.NodeId]);
        }

        let nodeObj = {
            Uuid: '',
            Title: '',
            Notes: '',
            ImageURL: '',
            PageURL: '',
            Color: '',
            Opacity: 1,
            Shape: 'Ball',
            Size: '',
            PositionX: '',
            PositionY: '',
            PositionZ: '',
            Collapsed: 'No',
            Type: '',
            FromUuid: '',
            ToUuid: '',
        };
        nodeObj.Uuid = element.NodeId;
        nodeObj.Title = element.NodeName;
        nodeObj.PositionX = element.x;
        nodeObj.PositionY = element.y;
        nodeObj.PositionZ = element.z;

        // Assign Size and Colours to Nodes according to Node Level
        switch (+element.NodeLevel) {
            case firstNodeLevel:
                nodeObj.Size = '15';
                nodeObj.Color = 'E91E63';
                nodeObj.Shape = 'Box';
                break;

            case firstNodeLevel + 1:
                nodeObj.Size = '14.5';
                nodeObj.Color = 'FFEB3B';
                break;

            case firstNodeLevel + 2:
                nodeObj.Size = '14';
                nodeObj.Color = '4CAF50';
                break;

            case firstNodeLevel + 3:
                nodeObj.Size = '13.5';
                nodeObj.Color = '00BCD4';
                break;

            default:
                nodeObj.Size = '13';
                nodeObj.Color = 'F44336';
        }

        finalData.push(nodeObj);
    });

    // Starting Id for links
    linkId = finalData.length + 1;

    // Push links into final data
    linkList.forEach((el) => {
        finalData.push({
            Uuid: JSON.stringify(linkId),
            Title: '',
            Notes: '',
            ImageURL: '',
            PageURL: '',
            Color: '171717',
            Opacity: 1,
            Shape: 'Solid',
            Size: 1,
            PositionX: '',
            PositionY: '',
            PositionZ: '',
            Collapsed: '',
            Type: '',
            FromUuid: el[0],
            ToUuid: el[1],
        });

        linkId += 1;
    });

    // Format to CSV
    let fields = Object.keys(finalData[0]);
    let replacer = function (key: any, value: any) {
        return value === null ? '' : value;
    };
    let csvData: any = finalData.map(function (row) {
        return fields
            .map(function (fieldName) {
                return JSON.stringify(row[fieldName], replacer);
            })
            .join(',');
    });
    csvData.unshift(fields.join(',')); // Add header column
    csvData = csvData.join('\r\n');

    return csvData;
}
