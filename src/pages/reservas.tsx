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
import ReservaCard from "~/components/ReservaCard";
import ReservationModal from "~/components/ReservationModal";
import { api } from "~/utils/api";

const Reservas: NextPage = () => {
  const { data: rooms } = api.room.getReservation.useQuery();

  const toast = useToast();
  const { room, client } = api.useContext();
  const [_, setSelectedRoom] = useAtom(selectedRoomAtom);

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
              <ReservaCard reservation={reservation} roomId={room.id} />
            ))}
          </Flex>
        </div>
      ))}
    </Container>
  );
};

export default Reservas;
