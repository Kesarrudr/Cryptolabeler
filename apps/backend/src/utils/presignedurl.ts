import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { string } from "zod";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

// Create the config obj with credentials
// Always use environment variables or config files
// Don't hardcode your keys into code
const config = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY ?? "",
    secretAccessKey: process.env.AWS_SECRET_KEY ?? "",
  },
  region: "ap-south-1",
};
// Instantiate a new s3 client
const client = new S3Client(config);

async function getSignedFileUrl(userId: string) {
  // Instantiate the GetObject command,
  // a.k.a. specific the bucket and key
  const command = new PutObjectCommand({
    Bucket: "cryptolabler",
    Key: `user/${userId}/${Math.random()}.jpeg`,
    ContentType: "img/jpeg",
  });
  //TODO: a better way to get the presigned url and the the key so that the image can be accessed with the id
  // await the signed URL and return it
  // console.log(
  //   "this is the call that get the url",
  //   await getSignedUrl(client, command, {
  //     expiresIn: 3600,
  //   }),
  // );
  // return await getSignedUrl(client, command, {
  //   expiresIn: 3600,
  // });
  return await createPresignedPost(client, {
    Bucket: "cryptolabler",
    Key: `user_data/${userId}/${Math.random()}/image.jpeg`,
    Conditions: [["content-length-range", 0, 5 * 1024 * 1024]],
    Expires: 3600,
  });
}

export default getSignedFileUrl;
