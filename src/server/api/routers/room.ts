import { Prisma, Reservation } from "@prisma/client";
import { randomUUID } from "crypto";
import { addDays, addHours } from "date-fns";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { prisma } from "~/server/db";

export type RoomWithReservations = Prisma.RoomGetPayload<{
  include: {
    Reservation: true;
  };
}>;

export type RoomWithAvailability = RoomWithReservations & {
  availability: Array<Availability>;
};

export interface Availability {
  startDateTime: Date;
  endDateTime: Date;
  available: boolean;
  id: string;
}

export const roomRouter = createTRPCRouter({
  getRooms: publicProcedure.query(
    async ({ ctx }): Promise<RoomWithAvailability[]> => {
      const roomWithData = await ctx.prisma.room.findMany({
        include: {
          Reservation: {
            where: {
              endDateTime: {
                gte: new Date(),
              },
              startDateTime: {
                lte: addHours(new Date(), 12),
              },
            },
          },
        },
      });

      const roomWithAvailability = roomWithData.map((room) => {
        const availability: Array<Availability> = [];

        console.log(room.Reservation);
        if (room.Reservation.length === 0) {
          availability.push({
            startDateTime: new Date(),
            endDateTime: addHours(new Date(), 12),
            available: true,
            id: randomUUID(),
          });
        } else {
          const globalStartDate = new Date();
          const globalEndDate = addHours(new Date(), 12);
          let lastReservationEnd = new Date();

          for (const [idx, reservation] of room.Reservation.entries()) {
            if (
              idx == 0 &&
              reservation.startDateTime < globalStartDate &&
              reservation.endDateTime > globalStartDate
            ) {
              availability.push({
                startDateTime: globalStartDate,
                endDateTime: reservation.endDateTime,
                available: false,
                id: randomUUID(),
              });
              lastReservationEnd = reservation.endDateTime;
              continue;
            }

            if (reservation.startDateTime > lastReservationEnd) {
              availability.push({
                startDateTime: lastReservationEnd,
                endDateTime: reservation.startDateTime,
                available: true,
                id: randomUUID(),
              });
            }

            availability.push({
              startDateTime: reservation.startDateTime,
              endDateTime: reservation.endDateTime,
              available: false,
              id: randomUUID(),
            });
          }
          if (lastReservationEnd < globalEndDate) {
            availability.push({
              startDateTime: lastReservationEnd,
              endDateTime: globalEndDate,
              available: true,
              id: randomUUID(),
            });
          }
        }
        return { ...room, availability: availability };
      });

      return roomWithAvailability;
    }
  ),
  makeReservation: protectedProcedure
    .input(
      z.object({
        roomId: z.string(),
        startDateTime: z.date(),
        endDateTime: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.reservation.create({
        data: {
          userId: ctx.session.user.id,
          roomId: input.roomId,
          startDateTime: input.startDateTime,
          endDateTime: input.endDateTime,
        },
      });
    }),
});
