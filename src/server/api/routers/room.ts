import { Prisma, Reservation } from "@prisma/client";
import { randomUUID } from "crypto";
import {
  addDays,
  addHours,
  differenceInMinutes,
  format,
  max,
  min,
} from "date-fns";
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
            orderBy: {
              endDateTime: "asc",
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

            lastReservationEnd = reservation.endDateTime;
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
      if (differenceInMinutes(input.endDateTime, input.startDateTime) > 120) {
        throw new Error("Las reservaciones no pueden durar más de 2 horas");
      }

      const reservations = await prisma.reservation.findMany({
        where: {
          roomId: input.roomId,
          endDateTime: { gte: new Date() },
          startDateTime: { lte: addHours(new Date(), 12) },
        },
      });
      console.log("RESERVATIONS", reservations);
      if (!checkIfValid(input.startDateTime, input.endDateTime, reservations))
        throw new Error("La reservación se empalma con otra reservación");

      return prisma.reservation.create({
        data: {
          userId: ctx.session.user.id,
          roomId: input.roomId,
          startDateTime: input.startDateTime,
          endDateTime: input.endDateTime,
        },
      });
    }),
  getReservation: protectedProcedure.query(async ({ ctx }) => {
    const rooms = await prisma.room.findMany({
      include: {
        Reservation: {
          where: {
            userId: ctx.session.user.id,
            endDateTime: {
              gte: new Date(),
            },
            startDateTime: {
              lte: addHours(new Date(), 12),
            },
          },
          orderBy: {
            endDateTime: "asc",
          },
        },
      },
    });
    return rooms
      .filter((room) => room.Reservation.length > 0)
      .map((room) => ({
        name: room.name,
        reservation: room.Reservation,
        id: room.id,
      }));
  }),
  removeReservation: protectedProcedure
    .input(z.string())
    .mutation(({ input }) => {
      return prisma.reservation.delete({
        where: {
          id: input,
        },
      });
    }),
  updateReservation: protectedProcedure
    .input(
      z.object({
        reservationId: z.string(),
        startDateTime: z.date(),
        endDateTime: z.date(),
        roomId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const reservations = await prisma.reservation.findMany({
        where: {
          roomId: input.roomId,
          endDateTime: { gte: new Date() },
          startDateTime: { lte: addHours(new Date(), 12) },
        },
      });
      if (!checkIfValid(input.startDateTime, input.endDateTime, reservations))
        throw new Error("La reservación se empalma con otra reservación");

      return prisma.reservation.update({
        where: {
          id: input.reservationId,
        },
        data: {
          startDateTime: input.startDateTime,
          endDateTime: input.endDateTime,
        },
      });
    }),
});

function checkIfValid(
  startDateTime: Date,
  endDateTime: Date,
  reservations: Reservation[]
) {
  endDateTime.setSeconds(0);
  endDateTime.setMilliseconds(0);
  startDateTime.setSeconds(0);
  startDateTime.setMilliseconds(0);
  for (const reservation of reservations) {
    reservation.startDateTime.setSeconds(0);
    reservation.startDateTime.setMilliseconds(0);
    reservation.endDateTime.setSeconds(0);
    reservation.endDateTime.setMilliseconds(0);

    const maxDate = max([reservation.startDateTime, startDateTime]);
    const minDate = min([reservation.endDateTime, endDateTime]);

    if (maxDate <= minDate) return false;
  }
  return true;
}
