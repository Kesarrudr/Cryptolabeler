import { TOTAL_DECEMIALS, Worker_JWT_SECTET } from "..";
import { prisma } from "../prisma.client/client";
import { SubmitTaskSchema } from "../types/type";
import asyncHandler from "../utils/async.handler";
import jwt from "jsonwebtoken";

const TOTAL_SELECTION = 100;

const WorkerSignin = asyncHandler(async (req, res) => {
  try {
    const address = "this_is_my_second_address";

    const existingUser = await prisma.worker.findFirst({
      where: {
        address: address,
      },
    });

    if (existingUser) {
      const token = jwt.sign(
        {
          workerId: existingUser.id,
        },
        Worker_JWT_SECTET,
      );

      res.status(200).json({
        token,
      });
    } else {
      const newUser = await prisma.worker.create({
        data: {
          address: address,
          pending_amount: 0 * TOTAL_DECEMIALS,
          locket_amount: 0 * TOTAL_DECEMIALS,
        },
      });
      const token = jwt.sign(
        {
          workerId: newUser.id,
        },
        Worker_JWT_SECTET,
      );

      res.status(200).json({
        token,
      });
    }
  } catch (error) {
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

    const address = worker?.address;

    const txId = "kjf;alskjfd";

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
          signature: txId,
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
