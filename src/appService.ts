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

function min(arr: any[]) {
    if (!arr.length) return null;
    let minValue = +arr[0];
    for (let item of arr) {
        if (+item < minValue) minValue = +item;
    }
    return minValue;
}

function max(arr: any[]) {
    if (!arr.length) return null;
    var maxValue = +arr[0];
    for (var item of arr) {
        if (+item > maxValue) maxValue = +item;
    }
    return maxValue;
}

function normalize(min: number, max: number) {
    var delta = max - min;
    return function (val: number) {
        return (val - min) / delta;
    };
}

export function formatData(dataRows: Array<any>) {
    let linkList = [];
    let finalData = [];
    let linkId = 0;
    let iter = 0;

    let formattedX = [];
    let formattedY = [];
    let formattedZ = [];

    // Algorithm defines first Node Level as 0 or sometimes as 1
    const firstNodeLevel = +dataRows[0].NodeLevel;

    // Normalize X coordinates
    const xPositions = dataRows.map((el) => el.x);
    const xMax = max(xPositions);
    const xMin = min(xPositions);
    formattedX = xPositions.map(normalize(xMin, xMax));

    // Set range -1 < x < 2
    formattedX = formattedX.map(el => (el * 3) - 1)

    // Normalize Y coordinates
    const yPositions = dataRows.map((el) => el.y);
    const yMax = max(yPositions);
    const yMin = min(yPositions);
    formattedY = yPositions.map(normalize(yMin, yMax));

    // Set range -1.5 < y < 1.5
    formattedY = formattedY.map(el => (el * 3) - 1.5)

    // Normalize Z coordinates
    const zPositions = dataRows.map((el) => el.z);
    const zMax = max(zPositions);
    const zMin = min(zPositions);
    formattedZ = zPositions.map(normalize(zMin, zMax));
    
    // Set range 0 < z < 3
    formattedZ = formattedZ.map(el => el * 3)

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
        nodeObj.PositionX = formattedX[iter];
        nodeObj.PositionY = formattedY[iter];
        nodeObj.PositionZ = formattedZ[iter];

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
            
            case firstNodeLevel + 4:
                nodeObj.Size = '13';
                nodeObj.Color = 'F44336';
                break;

            case firstNodeLevel + 5:
                nodeObj.Size = '12.5';
                nodeObj.Color = 'CB36F4';
                break;

            case firstNodeLevel + 6:
                nodeObj.Size = '12';
                nodeObj.Color = 'F4A836';
                break;

            case firstNodeLevel + 7:
                nodeObj.Size = '11.5';
                nodeObj.Color = '36F4B2';
                break;

            case firstNodeLevel + 8:
                nodeObj.Size = '11';
                nodeObj.Color = '3639F4';
                break;

            case firstNodeLevel + 9:
                nodeObj.Size = '10.5';
                nodeObj.Color = 'F436B2';
                break;

            default:
                nodeObj.Size = '10';
                nodeObj.Color = 'C1f436';
                break;
        }

        finalData.push(nodeObj);
        iter += 1;
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
            Color: 'D7D7D7',
            Opacity: 1,
            Shape: 'Solid',
            Size: 3,
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
