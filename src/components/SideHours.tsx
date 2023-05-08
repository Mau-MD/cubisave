import React, { useCallback } from "react";
import { differenceInMinutes, format } from "date-fns";

export enum SideHoursState {
  AVAILABLE,
  UNAVAILABLE,
  SELECTED,
}
interface Props {
  timeStart: Date;
  timeFinish: Date;
  state: SideHoursState;
  onClick: () => void;
}

const SideHours = ({ timeStart, timeFinish, state, onClick }: Props) => {
  const getCardHeight = useCallback(() => {
    return Math.max(40, differenceInMinutes(timeFinish, timeStart) * 2);
  }, [timeFinish, timeStart]);

  const getBackgroundColor = useCallback(() => {
    if (state === SideHoursState.SELECTED) {
      return "#bfdbfe";
    }
    if (state === SideHoursState.AVAILABLE) {
      return "#86efac";
    }
    if (state === SideHoursState.UNAVAILABLE) {
      return "#fca5a5";
    }
    return "";
  }, [state]);

  const getTextColor = useCallback(() => {
    if (state === SideHoursState.SELECTED) {
      return "#1e40af";
    }
    if (state === SideHoursState.AVAILABLE) {
      return "#166534";
    }
    if (state === SideHoursState.UNAVAILABLE) {
      return "#991b1b";
    }
    return "";
  }, [state]);

  const getText = useCallback(() => {
    if (state === SideHoursState.SELECTED) {
      return "Disponible";
    }
    if (state === SideHoursState.UNAVAILABLE) {
      return "Ocupado";
    }
    if (state === SideHoursState.AVAILABLE) {
      return "Disponible";
    }
    return "";
  }, [state]);

  return (
    <div
      className={
        "outline-offset hover: z-10  flex-col  border-2 border-white px-2 py-[2px]  shadow-lg transition-all"
      }
      onClick={() => state === SideHoursState.AVAILABLE && onClick()}
      style={{
        minHeight: `${getCardHeight()}px`,
        backgroundColor: getBackgroundColor(),
        color: getTextColor(),
        cursor:
          state === SideHoursState.AVAILABLE || SideHoursState.SELECTED
            ? "pointer"
            : "default",
      }}
    >
      <strong>
        {format(timeStart, "hh:mm a")} - {format(timeFinish, "hh:mm a")}{" "}
      </strong>
      {getText()}
    </div>
  );
};

export default SideHours;
