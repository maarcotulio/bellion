"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type DeleteCreatureButtonProps = {
  readonly creatureId: string;
};

export function DeleteCreatureButton({ creatureId }: DeleteCreatureButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm("Delete this creature?");

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/creatures/${creatureId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Creature could not be deleted.");
      }

      router.push("/library");
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Button type="button" variant="ghost" onClick={handleDelete} disabled={isDeleting}>
      <Trash2 aria-hidden="true" />
      {isDeleting ? "Deleting" : "Delete"}
    </Button>
  );
}
