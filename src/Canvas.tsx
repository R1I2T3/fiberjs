import React, { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";

interface CanvasElements {
  clipPathId: string;
  type: string;
  url?: string;
  left: number;
  top: number;
  text?: string;
  fontSize?: number;
  fill?: string;
  clipPath?: string;
  radius?: number;
  scalex: number;
  scaley: number;
  angle: number;
}
const CanvasEditor: React.FC = () => {
  const canvasRef = useRef<fabric.Canvas | null>();
  const [canvasElements, setCanvasElements] = useState<CanvasElements[] | []>(
    localStorage.getItem("canvasElements")
      ? JSON.parse(localStorage.getItem("canvasElements")!)
      : []
  );
  const [text, setText] = useState("Editable Text");

  // Initialize the canvas and add elements
  useEffect(() => {
    const canvas = new fabric.Canvas("canvas", {
      width: 500,
      height: 500,
      backgroundColor: "#f3f3f3",
      selection: true,
    });

    canvasRef.current = canvas;

    // Load image using HTMLImageElement
    const loadImage = (url: string): Promise<fabric.Image> => {
      return new Promise((resolve, reject) => {
        const imgElement = new Image();
        imgElement.src = url;
        imgElement.onload = () => {
          const fabricImg = new fabric.Image(imgElement);
          resolve(fabricImg);
        };
        imgElement.onerror = (error) => {
          reject(new Error("Image failed to load"));
        };
      });
    };

    const addElements = async () => {
      try {
        // Add image element and apply clip-path
        canvasElements.forEach((canvasElement) => {
          if (canvasElement.type === "image") {
            loadImage(canvasElement.url!).then((fabricImg) => {
              fabricImg.set({
                clipPathId: canvasElement.clipPathId,
                left: canvasElement.left,
                top: canvasElement.top,
                scaleX: canvasElement.scalex,
                scaleY: canvasElement.scaley,
                angle: canvasElement.angle,
              });
              canvas.add(fabricImg);
            });
          } else if (canvasElement.type === "text") {
            const text = new fabric.Textbox(canvasElement.text!, {
              clipPathId: canvasElement.clipPathId,
              left: canvasElement.left,
              top: canvasElement.top,
              fontSize: canvasElement.fontSize,
              fill: canvasElement.fill,
              editable: true,
              scaleX: 1,
              scaleY: 1,
              angle: canvasElement.angle,
            });
            canvas.add(text);
          } else if (canvasElement.type === "circle") {
            const circle = new fabric.Circle({
              clipPathId: canvasElement.clipPathId,
              left: canvasElement.left,
              top: canvasElement.top,
              radius: canvasElement.radius,
              fill: canvasElement.fill,
              scaleX: canvasElement?.scalex || 1,
              scaleY: canvasElement?.scaley || 1,
              angle: canvasElement?.angle || 0,
            });
            canvas.add(circle);
          } else if (canvasElement.type === "rectangle") {
            const rectangle = new fabric.Rect({
              clipPathId: canvasElement?.clipPathId,
              left: canvasElement?.left || 10,
              top: canvasElement?.top || 10,
              scaleX: canvasElement?.scalex || 1,
              scaleY: canvasElement?.scaley || 1,
              fill: canvasElement?.fill,
              angle: canvasElement?.angle || 0,
              height: 100,
              width: 100,
            });
            canvas.add(rectangle);
          }
        });

        const customShape = new fabric.Polygon(
          [
            { x: 0, y: 0 },
            { x: 50, y: 50 },
            { x: 100, y: 0 },
          ],
          {
            left: canvasElements[2].left,
            top: canvasElements[2].top,
            fill: canvasElements[2].fill,
            selectable: true,
          }
        );

        // Apply custom clip-path mask
        const clipPath = new fabric.Polygon(
          [
            { x: 0, y: 0 },
            { x: 50, y: 100 },
            { x: 100, y: 100 },
          ],
          {
            fill: "transparent",
            selectable: false,
          }
        );

        customShape.set({ clipPath, clipPathId: crypto.randomUUID() });
        canvas.add(customShape);

        canvas.renderAll();
      } catch (error) {
        console.error(error);
      }
    };
    canvas.on("selection:created", handleObjectChange);
    canvas.on("selection:updated", handleObjectChange);
    canvas.on("selection:cleared", handleObjectChange);
    canvas.on("object:modified", handleObjectChange);
    canvas.on("object:resizing", handleObjectChange);
    canvas.on("object:rotating", handleObjectChange);
    addElements();
    return () => {
      canvas.off("selection:created", handleObjectChange);
      canvas.off("selection:updated", handleObjectChange);
      canvas.off("selection:cleared", handleObjectChange);
      canvas.off("object:modified", handleObjectChange);
      canvas.off("object:resizing", handleObjectChange);
      canvas.off("object:rotating", handleObjectChange);
      canvas.dispose();
    };
  }, []);
  const addRandomShape = () => {
    const randomShapeType = Math.random() > 0.5 ? "circle" : "rectangle"; // Randomly choose between circle or rectangle

    let shape: fabric.Object;

    if (randomShapeType === "circle") {
      const circleValue = {
        clipPathId: crypto.randomUUID(),
        type: "circle",
        radius: 50,
        left: Math.random() * 400, // Random position within the canvas
        top: Math.random() * 400,
        fill: getRandomColor(),
        angle: 0,
        scalex: 1,
        scaley: 1,
      };
      const currentCanvasElements = [...canvasElements, circleValue];
      setCanvasElements(currentCanvasElements);
      shape = new fabric.Circle(circleValue);
      localStorage.setItem(
        "canvasElements",
        JSON.stringify(currentCanvasElements)
      );
    } else {
      const rectangleValue = {
        clipPathId: crypto.randomUUID(),
        type: "rectangle",
        width: 100,
        height: 100,
        left: Math.random() * 400, // Random position within the canvas
        top: Math.random() * 400,
        fill: getRandomColor(),
        scalex: 1,
        scaley: 1,
        angle: 0,
      };
      const currentCanvasElements = [...canvasElements, rectangleValue];
      setCanvasElements(currentCanvasElements);
      shape = new fabric.Rect(rectangleValue);
      localStorage.setItem(
        "canvasElements",
        JSON.stringify(currentCanvasElements)
      );
    }

    // Add the shape to the canvas
    canvasRef.current?.add(shape);
    canvasRef.current?.renderAll();
  };
  // Helper function to generate a random color
  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };
  // Handle text change from the input box
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
  };
  const handleObjectChange = useCallback(() => {
    const activeObj = canvasRef.current?.getActiveObject();
    if (!activeObj || !activeObj.clipPathId) return;
    console.log(activeObj);
    setCanvasElements((prevElements) => {
      // Use functional update to ensure we're working with the most recent state
      const updatedElements = prevElements.map((canvasElement) =>
        canvasElement.clipPathId === activeObj.clipPathId
          ? {
              ...canvasElement,
              angle: activeObj.angle ?? canvasElement.angle,
              top: activeObj.top ?? canvasElement.top,
              left: activeObj.left ?? canvasElement.left,
              scalex: activeObj.scaleX ?? canvasElement.scalex,
              scaley: activeObj.scaleY ?? canvasElement.scaley,
            }
          : canvasElement
      );

      // Only update localStorage if there are actual changes
      if (JSON.stringify(updatedElements) !== JSON.stringify(prevElements)) {
        localStorage.setItem("canvasElements", JSON.stringify(updatedElements));
      }

      return updatedElements;
    });
  }, []);
  return (
    <div className="flex flex-col items-center">
      <h1 className="text-xl font-bold mb-4">Fabric.js Canvas Editor</h1>

      {/* Input for editable text */}
      <button
        onClick={addRandomShape}
        className="mb-4 p-2 bg-blue-500 text-white rounded"
      >
        Add Random Shape
      </button>
      <input
        type="text"
        value={text}
        onChange={handleTextChange}
        className="mb-4 p-2 border rounded"
        placeholder="Edit text"
      />

      <canvas id="canvas" className="border border-gray-400"></canvas>
    </div>
  );
};

export default CanvasEditor;
