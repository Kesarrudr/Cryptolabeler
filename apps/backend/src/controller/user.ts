import { prisma } from "../prisma.client/client";
import asyncHandler from "../utils/async.handler";
import jwt from "jsonwebtoken";
import { JWT_SECRET, TOTAL_DECEMIALS } from "..";
import getSignedFileUrl from "../utils/presignedurl";
import { CreateTaskSchema } from "../types/type";
import { Record } from "@prisma/client/runtime/library";

const UserSignin = asyncHandler(async (req, res) => {
  try {
    const address = "0xF0f6f88ff902Df14ee1A633957C4782E394666f5";

    const existingUser = await prisma.user.findFirst({
      where: {
        address: address,
      },
    });

    if (existingUser) {
      const token = jwt.sign(
        {
          userId: existingUser.id,
        },
        JWT_SECRET,
      );

      res.status(200).json({
        token,
      });
    } else {
      const newUser = await prisma.user.create({
        data: {
          address: address,
        },
      });
      const token = jwt.sign(
        {
          userId: newUser.id,
        },
        JWT_SECRET,
      );

      res.status(200).json({
        token,
      });
    }
  } catch (error) {
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
    //parse the string to get the amount and to make sure that the amount is paid
    if (parseData.success) {
      const response = await prisma.$transaction(async (tx) => {
        const task = await tx.task.create({
          data: {
            title: parseData.data.title ?? "This is my title",
            amount: 1 * TOTAL_DECEMIALS,
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
    });
  } catch (error) {
    res.status(500).json({
      message: "Something is wrong with thte TaskDetails Controller",
    });
  }
});
export { UserSignin, PresignedUrl, CreateTask, TaskDetails };
