import { Client } from "minio";

const minioClient = new Client({
    endPoint: "play.min.io",
    port: 9000,
    useSSL: true,
    accessKey: "Q3AM3UQ867SPQQA43P2F",
    secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG"
});

minioClient.listBuckets(function (err, buckets) {
    if (err) return console.log(err);
    console.log("buckets :", buckets);
});

// minioClient.makeBucket("qwertyasdf", function (err, exists) {
//     if (err) {
//         return console.log(err);
//     }
//     if (exists) {
//         return console.log("Bucket exists.");
//     }
// });

// minioClient.fGetObject(
//     "qwerty",
//     "a8ba75d4c348014affefef400",
//     "./tmp/photo.png",
//     function (err) {
//         if (err) {
//             return console.log(err);
//         }
//         console.log("success");
//     }
// );
