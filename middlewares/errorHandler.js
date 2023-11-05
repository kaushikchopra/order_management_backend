import { logEvents } from './logEvents.js';
import multer from 'multer';

const errorHandler = (error, req, res, next) => {
    logEvents(`${error.name}: ${error.message}`, 'errLog.txt');
    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                message: "File is too large",
            });
        }

        if (error.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({
                message: "File limit reached",
            });
        }

        if (error.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({
                message: "File must be an image",
            });
        }
    }
    console.error(error.stack)
    res.status(500).send(error.message);
}

export default errorHandler;