import { prisma } from "../prisma.client/client";
import asyncHandler from "../utils/async.handler";
import jwt from "jsonwebtoken";
import getSignedFileUrl from "../utils/presignedurl";
import { CreateTaskSchema } from "../types/type";
import { Record } from "@prisma/client/runtime/library";
import nacl from "tweetnacl";
import { PublicKey, Connection } from "@solana/web3.js";

const connection = new Connection(
  process.env.RPC_URL ?? "https://api.devnet.solana.com",
);

const lamport = 10000_0000;
const UserSignin = asyncHandler(async (req, res) => {
  try {
    const { signature, publicKey } = req.body;
    const signedSignature = "Sign in with the mechanical turks";
    const UT8Signature = new Uint8Array(signature.data);
    const message = new TextEncoder().encode(signedSignature);

    const result = nacl.sign.detached.verify(
      message,
      UT8Signature,
      new PublicKey(publicKey).toBytes(),
    );
    if (!result) {
      res.status(400).json({
        message: "signature can't be verified",
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        address: publicKey,
      },
    });

    if (existingUser) {
      const token = jwt.sign(
        {
          userId: existingUser.id,
        },
        process.env.JWT_SECRET as string,
      );

      res.status(200).json({
        token,
      });
    } else {
      const newUser = await prisma.user.create({
        data: {
          address: publicKey,
        },
      });
      const token = jwt.sign(
        {
          userId: newUser.id,
        },
        process.env.JWT_SECRET as string,
      );

      res.status(200).json({
        token,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Something is wrong with UserSignin Controller",
    });
  }
});

const PresignedUrl = asyncHandler(async (req, res) => {
  try {
    //@ts-ignore
    const { url, fields } = await getSignedFileUrl(req.userId);
    res.status(200).json({
      URL: url,
      fields,
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({
      message: "Something is wrong with with PresignedUrl Controller",
    });
  }
});

const CreateTask = asyncHandler(async (req, res) => {
  try {
    const body = req.body;
    //@ts-ignore
    const userId = req.userId;
    const parseData = CreateTaskSchema.safeParse(body);
    if (!parseData.success) {
      res.status(411).json({
        message: "You have send the wrong input fields",
      });
    }
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    if (parseData.data?.signature) {
      const transaction = await connection.getTransaction(
        parseData.data.signature,
        {
          maxSupportedTransactionVersion: 1,
        },
      );
      if (
        (transaction?.meta?.postBalances[1] ?? 0) -
          (transaction?.meta?.preBalances[1] ?? 0) !==
        lamport
      ) {
        return res.status(411).json({
          message: "Transaction signature/amount incorrect",
        });
      }
      if (
        transaction?.transaction.message.getAccountKeys().get(1)?.toString() !==
        process.env.PARENT_WALLET_ADDRESS
      ) {
        return res.status(411).json({
          message: " and to send Transaction sent to wrong address",
        });
      }

      if (
        transaction?.transaction.message.getAccountKeys().get(0)?.toString() !==
        user?.address
      ) {
        return res.status(411).json({
          message: "Transaction sent to wrong address",
        });
      }
    }

    //parse the string to get the amount and to make sure that the amount is paid
    if (parseData.success) {
      const response = await prisma.$transaction(async (tx) => {
        const task = await tx.task.create({
          data: {
            title: parseData.data.title ?? "This is my title",
            amount: 1 * lamport,
            signature: parseData.data.signature!,
            userId: userId,
          },
        });

        await tx.options.createMany({
          data: parseData.data.options.map((data) => ({
            image_url: data.imageUrl,
            tasksId: task.id,
          })),
        });

        return task;
      });
      res.status(200).json({
        id: response.id,
      });
    }
  } catch (error) {
    console.log("error", error);
    res.status(500).json({
      message: "Something is wrong with the CreateTask Controller",
    });
  }
});

const TaskDetails = asyncHandler(async (req, res) => {
  try {
    const taskId: string = req.query.taskId as string;
    //TODO:
    //@ts-ignore
    const userId = req.userId;
    const task = await prisma.task.findFirst({
      where: {
        userId: userId,
        id: taskId,
      },
      include: {
        Options: true,
      },
    });

    if (!task) {
      res.status(411).json({
        message: "You don't have access to this task",
      });
    }

    const TaskSubmissions = await prisma.submissions.findMany({
      where: {
        tasksId: task?.id,
      },
      include: {
        option: true,
      },
    });

    const result: Record<
      string,
      {
        count: number;
        option: {
          imageUrl: string;
        };
      }
    > = {};

    task?.Options.forEach((option) => {
      result[option.id] = {
        count: 0,
        option: {
          imageUrl: option.image_url,
        },
      };
    });

    TaskSubmissions.forEach((r) => {
      result[r.option_id]!.count++;
    });

    res.status(200).json({
      result,
      taskDetails: task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Something is wrong with thte TaskDetails Controller",
    });
  }
});
export { UserSignin, PresignedUrl, CreateTask, TaskDetails };
