import nacl from "tweetnacl";
import { prisma } from "../prisma.client/client";
import { SubmitTaskSchema } from "../types/type";
import asyncHandler from "../utils/async.handler";
import jwt from "jsonwebtoken";
import {
  PublicKey,
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
const bs58 = require("bs58").default;

const lamports = 100000000;
const TOTAL_SELECTION = 100;
const connection = new Connection(
  process.env.RCP_URl ?? "https://api.devnet.solana.com",
);

const WorkerSignin = asyncHandler(async (req, res) => {
  try {
    const { signature, publicKey } = req.body;
    const UT8Signature = new Uint8Array(signature.data);
    const message = new TextEncoder().encode(
      "Sign in with the mechanical turks",
    );

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
    const existingUser = await prisma.worker.findFirst({
      where: {
        address: publicKey,
      },
    });

    if (existingUser) {
      const token = jwt.sign(
        {
          workerId: existingUser.id,
        },
        process.env.Worker_JWT_SECTET as string,
      );

      res.status(200).json({
        token,
        amount: existingUser.pending_amount / lamports,
      });
    } else {
      const newUser = await prisma.worker.create({
        data: {
          address: publicKey,
          pending_amount: 0 * lamports,
          locket_amount: 0 * lamports,
        },
      });
      const token = jwt.sign(
        {
          workerId: newUser.id,
        },
        process.env.Worker_JWT_SECTET as string,
      );

      res.status(200).json({
        token,
        amount: newUser.pending_amount / lamports,
      });
    }
  } catch (error) {
    console.log("error", error);
    res.status(500).json({
      message: "Something is wrong with WorkerSignin Controller",
    });
  }
});

const NextTask = asyncHandler(async (req, res) => {
  try {
    //@ts-ignore
    const workerId = req.workerId;

    const task = await prisma.task.findFirst({
      where: {
        done: false,
        Submissions: {
          none: {
            workerId,
          },
        },
      },
      select: {
        title: true,
        id: true,
        amount: true,
        Options: true,
      },
    });

    if (!task) {
      res.status(411).json({
        message: "NO more task for you to review",
      });
    } else {
      res.status(200).json({
        task,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Something is wrong with the NextTask route",
    });
    console.log(error);
  }
});

const SubmitTask = asyncHandler(async (req, res) => {
  try {
    //@ts-ignore
    const workerId = req.workerId;
    const body = req.body;
    const parseData = SubmitTaskSchema.safeParse(body);

    const task = await prisma.task.findFirst({
      where: {
        done: false,
        Submissions: {
          none: {
            workerId,
          },
        },
      },
      select: {
        Options: true,
        id: true,
        title: true,
        amount: true,
      },
    });
    if (!parseData.success) {
      res.status(411).json({
        message: "Inputs are not correct",
      });
    }

    if (task?.id !== parseData.data?.taskId) {
      return res.status(411).json({
        message: "Incorrect task id",
      });
    }

    if (parseData.success) {
      const amount = Number(task?.amount) / TOTAL_SELECTION;

      const submission = await prisma.$transaction(async (tx) => {
        const submission = await tx.submissions.create({
          data: {
            tasksId: parseData.data?.taskId,
            workerId,
            option_id: parseData.data?.selection,
            amount,
          },
        });
        await tx.worker.update({
          where: {
            id: workerId,
          },
          data: {
            pending_amount: {
              increment: amount,
            },
          },
        });
        return submission;
      });
      const newTask = await prisma.task.findFirst({
        where: {
          done: false,
          Submissions: {
            none: {
              workerId,
            },
          },
        },
        select: {
          id: true,
          title: true,
          amount: true,
          Options: true,
        },
      });
      res.status(200).json({
        nextTask: newTask,
      });
    }
  } catch (error) {
    console.log("error", error);
    res.status(500).json({
      message: "Something is wrong with the SubmitTask Controller",
    });
  }
});

const WorkerBalance = asyncHandler(async (req, res) => {
  try {
    //@ts-ignore
    const workerId = req.workerId;
    const amount = await prisma.worker.findFirst({
      where: {
        id: workerId,
      },
      select: {
        pending_amount: true,
        locket_amount: true,
      },
    });

    res.status(200).json({
      pending_amount: amount?.pending_amount,
      locked_amount: amount?.locket_amount,
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({
      message: "Something is wrong with the Balance workder end point",
    });
  }
});

const Payout = asyncHandler(async (req, res) => {
  try {
    //@ts-ignore
    const workerId = req.workerId;

    const worker = await prisma.worker.findFirst({
      where: {
        id: workerId,
      },
    });

    if (!worker) {
      res.status(403).json({
        message: "User not found",
      });
    }

    const address = worker!.address;

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(process.env.PARENT_WALLET_ADDRESS as string),
        toPubkey: new PublicKey(address),
        lamports: lamports,
      }),
    );
    const keypair = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));
    let signature = "";
    try {
      signature = await sendAndConfirmTransaction(connection, transaction, [
        keypair,
      ]);
      //TODO: make a worker that polls the blockchain to make sure transfer is successfull and upate the database;
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Transaction failed",
      });
    }
    await prisma.$transaction(async (tx) => {
      await tx.worker.update({
        where: {
          id: workerId,
        },
        data: {
          pending_amount: {
            decrement: worker?.pending_amount,
          },
          locket_amount: {
            increment: worker?.pending_amount,
          },
        },
      });
      await tx.payout.create({
        data: {
          workerId: workerId,
          signature: signature,
          amount: worker!.pending_amount,
          status: "Processing",
        },
      });

      //TODO: send the transcation to the block chain
      res.status(200).json({
        message: "Processing Amount",
        amount: worker?.pending_amount,
      });
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({
      message: "Something is wrong with the Payout Controller",
    });
  }
});

export { WorkerSignin, NextTask, SubmitTask, WorkerBalance, Payout };
