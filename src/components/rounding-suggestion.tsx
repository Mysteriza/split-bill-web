"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { getRoundingSuggestion } from "@/app/actions";

type RoundingSuggestionProps = {
  amount: number;
};

export default function RoundingSuggestion({ amount }: RoundingSuggestionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("");

  const handleGetSuggestion = async () => {
    setIsLoading(true);
    setIsOpen(true);
    const result = await getRoundingSuggestion(amount);
    setSuggestion(result);
    setIsLoading(false);
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={handleGetSuggestion}>
        <Sparkles className="mr-2 h-4 w-4" />
        Saran Pembulatan
      </Button>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Saran Pembulatan</AlertDialogTitle>
            <AlertDialogDescription>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3">Memuat saran...</span>
                </div>
              ) : (
                suggestion
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tutup</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
