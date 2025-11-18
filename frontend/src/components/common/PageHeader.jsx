import React from "react";
import BackButton from "./BackButton";

export default function PageHeader({ title, backTo = "/" }) {
  return (
    <div className="flex justify-between items-center mb-4">
      <BackButton to={backTo} />
      <h2 className="font-bold text-xl">{title}</h2>
    </div>
  );
}
