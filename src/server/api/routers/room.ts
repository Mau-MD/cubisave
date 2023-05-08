import { Prisma } from "@prisma/client";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export type RoomWithReservations = Prisma.RoomGetPayload<{
  include: {
    Reservation: true;
  };
}>;

export const roomRouter = createTRPCRouter({
  getRooms: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.room.findMany({
      include: {
        Reservation: {
          where: {
            startDateTime: {
              gte: new Date(),
            },
          },
        },
      },
    });
  }),
});
