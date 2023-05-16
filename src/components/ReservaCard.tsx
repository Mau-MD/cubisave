import {
  useDisclosure,
  CardBody,
  Flex,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Image,
  Button,
  Card,
  Text,
  useToast,
} from "@chakra-ui/react";
import { format, differenceInMinutes } from "date-fns";
import React from "react";
import ReservationModal from "./ReservationModal";
import { Reservation } from "@prisma/client";
import { api } from "~/utils/api";
import { useAtom } from "jotai";
import { selectedRoomAtom } from "~/atoms";

interface Props {
  reservation: Reservation;
  roomId: string;
}
const ReservaCard = ({ reservation, roomId }: Props) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenRev,
    onOpen: onOpenRev,
    onClose: onCloseRev,
  } = useDisclosure();

  const { room } = api.useContext();
  const toast = useToast();
  const [_, setSelectedRoom] = useAtom(selectedRoomAtom);

  const { mutate, isLoading } = api.room.removeReservation.useMutation({
    onSuccess: () => {
      onClose();
      room.getRooms.invalidate();
      room.getReservation.invalidate();
      setSelectedRoom("");
      toast({
        status: "success",
        title: "Reserva eliminada ",
        description: "Reserva eliminada con éxito",
      });
    },
    onError: (err) => {
      toast({
        status: "error",
        title: "Error al eliminar reserva",
        description: err.message,
      });
    },
  });
  const cancelRef = React.useRef<any>();
  return (
    <Card key={reservation.id} w={300}>
      <Image
        src="https://www.cetys.mx/biblioteca/images/ensenada04.jpg"
        objectFit={"cover"}
        w={300}
        borderTopRadius={4}
      />
      <CardBody>
        <Text>
          {format(reservation.startDateTime, "hh:mm aaaaa'm'")} -{" "}
          {format(reservation.endDateTime, "hh:mm aaaaa'm'")}{" "}
        </Text>
        <Text fontSize={"sm"} color="gray.600">
          {differenceInMinutes(
            reservation.endDateTime,
            reservation.startDateTime
          )}{" "}
          minutos
        </Text>
        <Flex gap={2} mt={2}>
          <Button colorScheme="blue" onClick={onOpenRev}>
            Editar
          </Button>
          <Button colorScheme="red" onClick={onOpen}>
            Cancelar
          </Button>
        </Flex>
      </CardBody>
      <AlertDialog
        isOpen={isOpen}
        onClose={onClose}
        leastDestructiveRef={cancelRef}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Borrar Reserva
            </AlertDialogHeader>

            <AlertDialogBody>
              ¿Estás seguro de que quieres borrar esta reserva? No podrás volver
              a recuperarla.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancelar
              </Button>
              <Button
                colorScheme="red"
                onClick={() => mutate(reservation.id)}
                ml={3}
                isLoading={isLoading}
              >
                Borrar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      <ReservationModal
        startDateTime={reservation.startDateTime}
        endDateTime={reservation.endDateTime}
        isOpen={isOpenRev}
        onClose={onCloseRev}
        onOpen={onOpenRev}
        roomId={roomId}
        reservationId={reservation.id}
      />
    </Card>
  );
};

export default ReservaCard;
