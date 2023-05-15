import {
  Card,
  CardBody,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  Image,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  useToast,
} from "@chakra-ui/react";
import { differenceInMinutes, format } from "date-fns";
import { useAtom } from "jotai";
import { ArrowLeftIcon } from "lucide-react";
import { NextPage } from "next";
import Link from "next/link";
import React from "react";
import { selectedRoomAtom } from "~/atoms";
import ReservationModal from "~/components/ReservationModal";
import { api } from "~/utils/api";

const Reservas: NextPage = () => {
  const { data: rooms } = api.room.getReservation.useQuery();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenRev,
    onOpen: onOpenRev,
    onClose: onCloseRev,
  } = useDisclosure();
  const cancelRef = React.useRef<any>();

  const toast = useToast();
  const { room, client } = api.useContext();
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
  return (
    <Container maxW="container.lg" p={10}>
      <Link href="/">
        <Button variant={"outline"} leftIcon={<ArrowLeftIcon />} mb={5}>
          Volver al Mapa
        </Button>
      </Link>
      <Heading>Tus Reservas</Heading>
      {rooms?.length === 0 && <Text>No tienes ninguna reserva...</Text>}
      {rooms?.map((room) => (
        <div key={room.id}>
          <Heading fontSize={"xl"} my={3}>
            {room.name}
          </Heading>
          <Flex flexWrap={"wrap"} gap={2}>
            {room.reservation.map((reservation) => (
              <Card key={reservation.id} w={300}>
                <Image
                  src="https://www.cetys.mx/biblioteca/images/ensenada04.jpg"
                  objectFit={"cover"}
                  w={300}
                  borderTopRadius={4}
                />
                <CardBody>
                  <Text>
                    {format(reservation.startDateTime, "HH:mm")} -{" "}
                    {format(reservation.endDateTime, "HH:mm")}{" "}
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
                        ¿Estás seguro de que quieres borrar esta reserva? No
                        podrás volver a recuperarla.
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
                  roomId={room.id}
                  reservationId={reservation.id}
                />
              </Card>
            ))}
          </Flex>
        </div>
      ))}
    </Container>
  );
};

export default Reservas;
