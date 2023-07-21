// Dependências externas
import express from "express";
import cors from "cors";
import formidable from "formidable";
import fs from "fs";
import { Client } from "minio";

// Criação do servidor
const app = express();

// Configuração do servidor
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Rotas do servidor
app.get("/", (req, res) => {
    res.status(200).json("Servidor da API de Aplicações rodando!");
});
app.get("/test", (req, res) => {
    for (let key in req.query) {
        try {
            req.query[key] = JSON.parse(req.query[key]);
        } catch (error) {}
    }

    res.status(200).json(req.query);
});

const minioClient = new Client({
    endPoint: "play.min.io",
    port: 9000,
    useSSL: true,
    accessKey: "Q3AM3UQ867SPQQA43P2F",
    secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG"
});
const checkIfBucketExists = () => {
    const bucketName = "qwertyasdf";

    return new Promise((resolve) => {
        minioClient.bucketExists(bucketName, (existsError, exists) => {
            if (existsError) {
                throw new Error("Error checking bucket => ", existsError);
            }

            if (!exists) {
                throw new Error(`Bucket ${bucketName} does not exist`);
            }
            resolve(bucketName);
        });
    });
};

app.get("/upload", (req, res) => {
    res.status(200).send(`
        <form enctype="multipart/form-data" action="/apps" method="POST">
            <input type="text" name="name" />
            <input type="text" name="version" />
            <input type="file" name="icon" />
            <input type="file" name="screenshots" multiple />
            <button type="submit">Enviar</button>
        </form>
    `);
});
app.post("/apps", async (req, res, next) => {
    try {
        const { host } = req.headers;

        const form = formidable({
            maxFieldsSize: 1 * 1024 * 1024,
            multiples: true,
            maxSizefile: 5 * 1024 * 1024,
            minSizefile: 0,
            allowEmptyFiles: true
        });

        const [fields, files] = await form.parse(req);

        for (const inputName in fields) {
            if (fields[inputName].length === 1) {
                fields[inputName] = fields[inputName][0];
            }
        }

        const bucketName = await checkIfBucketExists();

        const bucketFiles = await uploadFilesFromForm(files, bucketName, host);
        req.body = { data: { ...fields, ...bucketFiles } };

        next();
    } catch (error) {
        res.status(500).send(error.message);
    }
});
app.post("/apps", async (req, res) => {
    try {
        const { data } = req.body;

        res.status(200).json({ data });
    } catch (error) {
        res.status(500).send(error.message);
    }
});
const uploadFilesFromForm = async (files, bucketName, hostURL) => {
    try {
        const bucketFiles = {};
        for (const inputName in files) {
            bucketFiles[inputName] = [];
            for (const file of files[inputName]) {
                try {
                    const bucketFile = await putFileInBucket(
                        file,
                        bucketName,
                        hostURL
                    );
                    bucketFiles[inputName].push(bucketFile);
                } catch (error) {
                    console.log(error);
                }
            }

            if (bucketFiles[inputName].length === 1) {
                bucketFiles[inputName] = bucketFiles[inputName][0];
            }
        }

        return bucketFiles;
    } catch (error) {
        throw error;
    }
};
const putFileInBucket = async (file, bucketName, hostURL) => {
    const { newFilename, filepath, originalFilename, mimetype } = file;

    return new Promise((resolve) => {
        const fileStream = fs.createReadStream(filepath);
        fs.stat(filepath, (fsStatError, filestats) => {
            if (fsStatError) {
                throw new Error("Error getting file info => ", fsStatError);
            }

            const objectFilename = `${newFilename} - ${originalFilename}`;
            minioClient.putObject(
                bucketName,
                objectFilename,
                fileStream,
                filestats.size,
                (putObjectError, objectInfo) => {
                    if (putObjectError) {
                        throw new Error(
                            "Error putting object in bucket  => ",
                            putObjectError
                        );
                    }

                    if (objectInfo) {
                        const params = new URLSearchParams({
                            objectFilename,
                            mimetype
                        });

                        const fileURL = `${hostURL}/files?${params}`;

                        resolve(fileURL);
                    }
                }
            );
        });
    });
};

app.get("/files", async (req, res) => {
    try {
        const { query } = req;

        const file = query;

        const bucketName = await checkIfBucketExists();

        const data = await downloadFileFromBucket(file, bucketName);

        res.writeHead(200, { "Content-Type": file.mimetype });
        res.write(data);
        res.end();
    } catch (error) {
        res.status(500).send(error.message);
    }
});
const downloadFileFromBucket = async (file, bucketName) => {
    return new Promise((resolve) => {
        minioClient.getObject(
            bucketName,
            file.objectFilename,
            (getObjectError, dataStream) => {
                if (getObjectError) {
                    throw new Error(
                        "Error getting object in bucket  => ",
                        getObjectError
                    );
                }

                dataStream.on("error", (dataStreamError) => {
                    throw new Error(
                        "Error streaming data  => ",
                        dataStreamError
                    );
                });

                let data;
                dataStream.on("data", (chunk) => {
                    data = !data
                        ? Buffer.from(chunk)
                        : Buffer.concat([data, chunk]);
                });
                dataStream.on("end", () => {
                    resolve(data);
                });
            }
        );
    });
};

app.get("/download", (req, res) => {
    res.status(200).send(`
        <img src="http://localhost:3331/files?objectFilename=08438bf184288927fe6d68201+-+h1.png&mimetype=image%2Fpng" />
        <a href="http://localhost:3331/files?objectFilename=08438bf184288927fe6d68200+-+createApp.json&mimetype=application%2Fjson" target=_blank>JSON</a>
        <a href="http://localhost:3331/files?objectFilename=08438bf184288927fe6d68202+-+User+Manual_Acer_1.0_A_A.pdf&mimetype=application%2Fpdf" target=_blank>PDF</a>
    `);
});

// Host e porta do servidor
const port = 3331;

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
