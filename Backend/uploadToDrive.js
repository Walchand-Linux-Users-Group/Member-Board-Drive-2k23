import { google } from 'googleapis';
import stream from 'stream';
import moment from 'moment';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const uploadToDrive = async (userName, category, file) => {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.SERVICE_ACCOUNT),
            scopes: SCOPES,
        });
        const driveService = await google.drive({ version: 'v3', auth });

        const bufferStream = new stream.PassThrough();
        bufferStream.end(file.buffer);

        const date = moment().format('HH-mm-ss_D-M-YYYY');

        var data = null;

        if (category == 'Photo') {
            const extension = file.originalname.slice(-4);
            const fileName = date + '_' + userName + `-${category}${extension}`;
            data = await driveService.files.create({
                resource: {
                    name: fileName,
                    parents: [process.env.PHOTO_FOLDER_ID],
                    fields: 'webViewLink',
                },
                media: {
                    mimeType: file.mimeType,
                    body: bufferStream,
                },
                fields: 'id,name, webViewLink',
            });
            console.log('Photo Uploaded Successfully');
        }
        else {
            const fileName = date + '_' + userName + `-${category}.pdf`;
            data = await driveService.files.create({
                resource: {
                    name: fileName,
                    parents: [process.env.RESUME_FOLDER_ID],
                    fields: 'webViewLink',
                },
                media: {
                    mimeType: file.mimeType,
                    body: bufferStream,
                },
                fields: 'id,name, webViewLink',
            });

            console.log('Resume Uploaded Successfully');
        }

        // try {
        //     if (fs.existsSync(KEYFILEPATH)) {
        //         fs.unlink(KEYFILEPATH, (err) => {
        //             if (err) {
        //                 console.error('Error deleting file:', err);
        //                 return;
        //             }
        //         });
        //     }
        // } catch (error) { }




        return { status: data.status, link: data.data.webViewLink };
    } catch (error) {
        console.log(error);
        return { status: 500, link: '' };
    }
};

export default uploadToDrive;