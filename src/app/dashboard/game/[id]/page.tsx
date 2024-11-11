"use client";
import React, { useState, useEffect } from "react";
import { Games } from "../../constants";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

const GamePage = ({ params }: { params: Promise<{ id: string }> }) => {
  const [game, setGame] = useState<{ gameId: number; gameName: string } | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [message, setMessage] = useState("");
  const [output, setOutput] = useState("");
  const [outputColor, setOutputColor] = useState(""); // State for color
  const [sequence, setSequence] = useState<string[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isTraining, setIsTraining] = useState(false);

  // Get toast function from the custom hook
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

  const handlePredict = async () => {
    if (
      inputValue !== "A" &&
      inputValue !== "B" &&
      inputValue !== "a" &&
      inputValue !== "b"
    ) {
      setOutput("Please enter either 'A' or 'B'.");
      setOutputColor(""); // No color needed for this message
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5959/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ last_char: inputValue }),
      });
      const data = await response.json();
      setOutput(data.message);
      setOutputColor(data.color);

      setSequence((prev) => {
        const updatedSequence = [inputValue, ...prev];
        return updatedSequence.slice(0, 10);
      });
      setInputValue("");
    } catch (error) {
      console.error("Error during prediction:", error);
    }
  };

  const handleTrain = async () => {
    setIsTraining(true);

    try {
      const response = await fetch("http://127.0.0.1:5959/api/train", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sequence: message }),
      });
      const data = await response.json();
      console.log("Train response:", data);

      // Show success toast
      toast({
        title: "Connecting completed successfully!",
        description: "The model has been trained with your data.",
      });

      const last10Chars = message.slice(-10);
      setSequence(last10Chars.split("").reverse());
    } catch (error) {
      console.error("Error during training:", error);

      // Show error toast
      toast({
        title: "Training failed!",
        description: "There was an issue with the training process.",
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

    const formData = new FormData();
    formData.append("file", pdfFile);

    try {
      const response = await fetch("http://127.0.0.1:5959/extract_text", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to extract text");
      }

      const data = await response.json();
      setMessage(data.text);
    } catch (error) {
      console.error("Error extracting text:", error);

      // Show error toast for failed extraction
      toast({
        title: "Error extracting text!",
        description: "Failed to extract text from the PDF file.",
        variant: "destructive",
      });
    }
  };

  if (!game) {
    return (
      <div>
        <h1>Loading.....</h1>
        <p>The game you are looking for is loading.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 pr-4">
        <h1 className="text-center bg-secondary mx-auto rounded-md p-2 max-w-lg font-bold text-xl">
          {game.gameName}
        </h1>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative aspect-video rounded-md bg-muted/50 text-3xlflex items-center justify-center">
            <Image
              src="/hui.gif"
              alt="Description of the GIF"
              layout="responsive"
              width={500}
              height={300}
              unoptimized
            />
            <span className="absolute text-yellow-500 bg-black bg-opacity-100 rounded-md p-2 bottom-2 left-2 z-10">
              Sample Video 20-20 Teen Patti
            </span>
          </div>
          <div className="aspect-video rounded-md bg-muted/30 flex items-center justify-center">
            <span
              className="text-3xl font-bold p-4 rounded-md"
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
        <div className="grid gap-4 grid-cols-10 text-center">
          {sequence.map((letter, index) => (
            <span
              key={index}
              className={`rounded-md bg-muted/50 py-2 text-lg font-bold ${
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

        <div className="flex w-full max-w-sm gap-4 justify-center mx-auto space-x-2">
          <Input
            type="text"
            placeholder="Enter Next Character (A/B)"
            value={inputValue}
            maxLength={1}
            onChange={(e) => {
              const newValue = e.target.value.toUpperCase();
              if (newValue.length <= 1) {
                setInputValue(newValue);
              }
            }}
          />
          <Button onClick={handlePredict}>Predict</Button>
        </div>

        <Separator />

        <div className="flex mx-4 gap-4 items-start justify-center">
          <Input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="p-2 border rounded-md"
          />
          <div className="flex flex-col gap-4 items-center justify-center">
            <Button onClick={handleExtractText}>Extract the Data</Button>
          </div>
        </div>

        <div className="flex mx-4 gap-4 items-start justify-center">
          <Textarea
            id="message"
            className="flex-grow p-3 border rounded-md max-w-2xl min-h-[20px]"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              const last10Chars = e.target.value.slice(-10);
              setSequence(last10Chars.split(""));
            }}
            readOnly 
          />

          <div className="flex flex-col gap-4 items-center justify-center">
            <Button onClick={handleTrain} disabled={isTraining}>
              {isTraining ? "Connecting..." : "Connect with Server"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GamePage;
