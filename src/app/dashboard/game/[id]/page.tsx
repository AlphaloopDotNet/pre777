"use client";
import React, { useState, useEffect } from "react";
import { Games } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const GamePage = ({ params }: { params: Promise<{ id: string }> }) => {
  const [game, setGame] = useState<{ gameId: number; gameName: string } | null>(
    null
  );
  const [inputValue, setInputValue] = useState("");
  const [message, setMessage] = useState("");
  const [output, setOutput] = useState("");
  const [outputColor, setOutputColor] = useState("");
  const [sequence, setSequence] = useState<string[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [selectedValue, setSelectedValue] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    const fetchGame = async () => {
      const resolvedParams = await params;
      const gameId = Number(resolvedParams.id);
      const foundGame = Games.find((item) => item.gameId === gameId);
      setGame(foundGame || null);
    };

    fetchGame();
  }, [params]);

  // Remove the useEffect for handleTrain since we'll call it directly
  const handleChoice = (value: React.SetStateAction<string>) => {
    setSelectedValue(value);
    setOutput("");
  };
  const handlePredict = async () => {
    if (!selectedValue) {
      setOutput("Please select either 'A' or 'B'.");
      setOutputColor("");
      return;
    }

    setIsPredicting(true);

    try {
      const response = await fetch("http://127.0.0.1:5959/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ last_char: selectedValue.toUpperCase() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOutput(data.message);
      setOutputColor(data.color);

      setSequence((prev) => {
        const updatedSequence = [selectedValue.toUpperCase(), ...prev];
        return updatedSequence.slice(0, 10);
      });
      setSelectedValue("");
    } catch (error) {
      console.error("Error during prediction:", error);
      toast({
        title: "Prediction failed!",
        description:
          error instanceof Error
            ? error.message
            : "There was an issue with the prediction .",
        variant: "destructive",
      });
    } finally {
      setIsPredicting(false);
    }
  };
  const processTextForTraining = (text: string) => {
    return text
      .toUpperCase()
      .split("")
      .filter((char) => char === "A" || char === "B")
      .join("");
  };

  const handleTrain = async (textToTrain: string) => {
    setIsTraining(true);

    try {
      const processedSequence = processTextForTraining(textToTrain);

      if (!processedSequence) {
        throw new Error(
          "No valid sequence found (must contain A or B characters)"
        );
      }

      const response = await fetch("http://127.0.0.1:5959/api/train", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ sequence: processedSequence }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Training failed");
      }

      const data = await response.json();
      console.log("Train response:", data);

      toast({
        title: "Connecting completed successfully!",
        description: "The model has been trained with your data.",
      });

      // Update sequence with last 10 valid characters
      const last10ValidChars = processedSequence.slice(-10);
      setSequence(last10ValidChars.split("").reverse());
    } catch (error) {
      console.error("Error during training:", error);
      toast({
        title: "Training failed!",
        description:
          error instanceof Error
            ? error.message
            : "There was an issue with the training process.",
        variant: "destructive",
      });
    } finally {
      setIsTraining(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPdfFile(file);
    }
  };

  const handleExtractText = async () => {
    if (!pdfFile) {
      toast({
        title: "No file selected!",
        description: "Please upload a PDF file first.",
        variant: "destructive",
      });
      return;
    }
    setIsProcessing(true); // Start processing

    const formData = new FormData();
    formData.append("file", pdfFile);

    try {
      const response = await fetch("http://127.0.0.1:5959/extract_text", {
        method: "POST",
        headers: {
          "Access-Control-Allow-Origin": "*", // Add this if your backend supports it
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to extract text");
      }

      const data = await response.json();
      const extractedText = data.text;

      // Process the extracted text
      const processedText = processTextForTraining(extractedText);

      if (!processedText) {
        throw new Error("No valid sequence found in the extracted text");
      }

      setMessage(processedText);

      // Train with the processed text
      await handleTrain(processedText);
    } catch (error) {
      console.error("Error extracting text:", error);
      toast({
        title: "Error extracting text!",
        description:
          error instanceof Error
            ? error.message
            : "Failed to extract text from the PDF file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false); // End processing
    }
  };
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg font-semibold text-primary">Processing Data...</p>
        <p className="text-lg font-semibold text-primary">wait for sec...</p>
      </div>
    </div>
  );
  if (!game) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading game data...</p>
      </div>
    );
  }

  return (
    <>
      {(isProcessing || isTraining) && <LoadingOverlay />}
      <div className="space-y-4 pr-4">
        <h1 className="text-center  mx-auto rounded-md p-2 max-w-lg font-bold text-xl">
          {game.gameName}
        </h1>

        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          {/* Video Section with Image */}
          <div className="relative aspect-video rounded-md bg-muted/50 flex items-center justify-center">
            <Image
              src="/hui.gif"
              alt="Description of the GIF"
              layout="responsive"
              width={500}
              height={300}
              unoptimized
              className="rounded-md"
            />
            <span className="absolute text-sm sm:text-base md:text-lg text-yellow-500 bg-black bg-opacity-75 rounded-md p-2 bottom-2 left-2 z-10">
              Sample Video 20-20 Teen Patti
            </span>
          </div>

          {/* Prediction Section */}
          <div className="aspect-video rounded-md bg-muted/30 flex items-center justify-center p-4">
            <span
              className="text-xl sm:text-2xl md:text-3xl font-bold rounded-md"
              style={{
                color: outputColor,
                backgroundColor: outputColor ? "#00000080" : "", // Dark background if color is set
              }}
            >
              {output || "Waiting for prediction..."}
            </span>
          </div>
        </div>

        {/* Normal Sequence */}
        <div className="grid gap-4 grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 text-center py-4">
          {sequence.map((letter, index) => (
            <span
              key={index}
              className={`rounded-md bg-muted/50 py-2 text-base sm:text-lg font-bold ${
                letter === "A"
                  ? "text-red-500"
                  : letter === "B"
                  ? "text-yellow-500"
                  : ""
              }`}
            >
              {letter}
            </span>
          ))}
        </div>

        <Separator />

        <div className="flex flex-col gap-6 items-center justify-between px-4 py-8 sm:px-6 sm:py-10 lg:flex-row lg:gap-8 lg:mx-16">
          {/* Choice Buttons */}
          <div className="flex flex-col gap-4 items-center justify-center sm:flex-row">
            <Button
              onClick={() => handleChoice("A")}
              variant={selectedValue === "A" ? "default" : "outline"}
              className="px-6 py-2 text-lg sm:text-xl md:px-8 hover:bg-primary transition-colors duration-200"
              disabled={isPredicting}
            >
              A
            </Button>
            <Button
              onClick={() => handleChoice("B")}
              variant={selectedValue === "B" ? "default" : "outline"}
              className="px-6 py-2 text-lg sm:text-xl md:px-8 hover:bg-primary transition-colors duration-200"
              disabled={isPredicting}
            >
              B
            </Button>
            <Button
              onClick={handlePredict}
              className="px-6 py-2 sm:text-lg md:px-8 transition-colors duration-200"
              disabled={isPredicting || !selectedValue}
            >
              {isPredicting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Predicting...
                </>
              ) : (
                "Predict"
              )}
            </Button>
          </div>

          {/* File Input and Extraction Button */}
          <div className="flex flex-col gap-4 items-center justify-center sm:flex-row">
            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="p-2 border rounded-md w-full sm:w-auto"
            />
            <Button
              onClick={handleExtractText}
              disabled={isProcessing || !pdfFile}
              className="w-full sm:w-auto px-6 py-2 transition-colors duration-200"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting with Server...
                </>
              ) : (
                "Extract the Data"
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GamePage;
