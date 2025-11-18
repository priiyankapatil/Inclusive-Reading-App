import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ to = "/" }) {
  return (
    <Link to={to} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition">
      <ArrowLeft size={16} /> Back
    </Link>
  );
}
