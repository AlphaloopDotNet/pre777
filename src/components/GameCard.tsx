'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface GameCardProps {
  isActive: boolean;
  gameId: string | number;
  imageSrc: string;
  imageAlt: string;
  isComingSoon?: boolean;
}

const GameCard = ({ isActive, gameId, imageSrc, imageAlt, isComingSoon }: GameCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isActive && !isComingSoon) {
    return (
      <div className="aspect-video rounded-md bg-muted/50 overflow-hidden">
        <Link href={`/dashboard/game/${gameId}`}>
          <img
            width={100}
            height={100}
            src={imageSrc}
            alt={imageAlt}
            className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
          />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="aspect-video rounded-md bg-muted/50 overflow-hidden">
        <div 
          onClick={() => !isComingSoon && setIsDialogOpen(true)} 
          className="cursor-pointer relative"
        >
          <img
            width={100}
            height={100}
            src={imageSrc}
            alt={imageAlt}
            className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
          />
          {isComingSoon && (
            <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
              <span className="text-white text-3xl font-bold">Coming Soon...</span>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Active Plan Required
            </DialogTitle>
            <DialogDescription className="pt-4">
              You need an active plan to access this game. Please purchase a plan to continue.
            </DialogDescription>
            <DialogDescription className="pt-4">
              <strong>Click on Purchase Plan to continue OR Contact on : +91-6377448453</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Link href="/payment">
              <Button>Purchase Plan</Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GameCard;