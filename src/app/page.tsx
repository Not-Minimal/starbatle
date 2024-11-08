"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const determineStarCount = (size: number): number => {
  if (size >= 5 && size <= 8) return 1;
  if (size >= 9 && size <= 13) return 2;
  if (size === 14) return 3;
  return 0;
};

const createEmptyRegions = (size: number): number[][] => {
  return Array(size)
    .fill(null)
    .map((_, i) =>
      Array(size)
        .fill(null)
        .map((_, j) => i * size + j),
    );
};
const parseInput = (
  text: string,
): { size: number; regions: number[][] } | null => {
  try {
    const lines = text
      .trim()
      .split("\n")
      .map((line) => line.trim());
    console.log("Líneas procesadas:", lines); // Para depuración
    const size = parseInt(lines[0]);

    if (isNaN(size) || size < 5 || size > 14) {
      throw new Error(`Tamaño inválido: ${size}. Debe ser entre 5 y 14`);
    }

    if (lines.length !== size + 1) {
      throw new Error(
        `El archivo debe contener ${size + 1} líneas para un tablero ${size}x${size}`,
      );
    }

    const regions = [];
    for (let i = 1; i <= size; i++) {
      const row = lines[i].split(/\s+/).map(Number);
      console.log(`Fila ${i}:`, row); // Para depuración
      if (row.length !== size || row.some((n) => isNaN(n))) {
        throw new Error(`Formato inválido en la línea ${i}`);
      }
      regions.push(row);
    }

    const uniqueRegions = new Set(regions.flat());
    if (uniqueRegions.size > size) {
      throw new Error(
        `Demasiadas regiones diferentes. Máximo permitido: ${size}`,
      );
    }

    return { size, regions };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error al procesar el archivo: ${error.message}`);
    } else {
      throw new Error(`Error desconocido al procesar el archivo`);
    }
  }
};

const Home = () => {
  const [gridSize, setGridSize] = useState<number>(5);
  const [starCount, setStarCount] = useState<number>(1);
  const [board, setBoard] = useState<boolean[][]>([[]]);
  const [regions, setRegions] = useState<number[][]>([[]]);
  const [solving, setSolving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    handleSizeChange(gridSize);
  }, [gridSize]);

  const handleSizeChange = (newSize: number) => {
    const size = Math.max(5, Math.min(14, newSize));
    const stars = determineStarCount(size);

    if (stars === 0) {
      setError("Tamaño inválido. Debe ser entre 5x5 y 14x14");
      return;
    }

    setError("");
    setGridSize(size);
    setStarCount(stars);
    setBoard(
      Array(size)
        .fill(null)
        .map(() => Array(size).fill(false)),
    );
    setRegions(createEmptyRegions(size));
    setProgress(0);
  };

  const hasWall = (row: number, col: number, direction: string): boolean => {
    if (row === 0 && direction === "top") return true;
    if (row === gridSize - 1 && direction === "bottom") return true;
    if (col === 0 && direction === "left") return true;
    if (col === gridSize - 1 && direction === "right") return true;

    const currentRegion = regions[row]?.[col];

    switch (direction) {
      case "top":
        return regions[row - 1]?.[col] !== currentRegion;
      case "right":
        return regions[row]?.[col + 1] !== currentRegion;
      case "bottom":
        return regions[row + 1]?.[col] !== currentRegion;
      case "left":
        return regions[row]?.[col - 1] !== currentRegion;
      default:
        return false;
    }
  };

  const countStarsInRow = (board: boolean[][], row: number): number => {
    return board[row].filter((cell) => cell).length;
  };

  const countStarsInColumn = (board: boolean[][], col: number): number => {
    return board.map((row) => row[col]).filter((cell) => cell).length;
  };

  const countAdjacentStars = (
    board: boolean[][],
    row: number,
    col: number,
  ): number => {
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];
    let count = 0;
    for (const [dx, dy] of directions) {
      const newRow = row + dx;
      const newCol = col + dy;
      if (
        newRow >= 0 &&
        newRow < gridSize &&
        newCol >= 0 &&
        newCol < gridSize
      ) {
        if (board[newRow][newCol]) count++;
      }
    }
    return count;
  };

  const isValidPosition = (
    board: boolean[][],
    row: number,
    col: number,
  ): boolean => {
    if (board[row][col]) return true;
    if (countStarsInRow(board, row) >= starCount) return false;
    if (countStarsInColumn(board, col) >= starCount) return false;
    if (countAdjacentStars(board, row, col) > 0) return false;
    return true;
  };

  const checkRegion = (
    board: boolean[][],
    regions: number[][],
    regionId: number,
  ): boolean => {
    let count = 0;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (regions[i][j] === regionId && board[i][j]) {
          count++;
        }
      }
    }
    return count === starCount;
  };

  const isBoardValid = (board: boolean[][]): boolean => {
    const regionCounts = new Array(gridSize * gridSize).fill(0);

    for (let i = 0; i < gridSize; i++) {
      let rowCount = 0;
      let colCount = 0;

      for (let j = 0; j < gridSize; j++) {
        if (board[i][j]) {
          rowCount++;
          regionCounts[regions[i][j]]++;
          if (countAdjacentStars(board, i, j) > 0) return false;
        }
        if (board[j][i]) colCount++;
      }

      if (rowCount !== starCount || colCount !== starCount) return false;
    }

    return regionCounts.every((count) => count <= starCount);
  };

  const solve = async (
    currentBoard: boolean[][],
    row = 0,
    col = 0,
  ): Promise<boolean> => {
    if (row >= gridSize) {
      return isBoardValid(currentBoard);
    }

    const nextRow = col === gridSize - 1 ? row + 1 : row;
    const nextCol = col === gridSize - 1 ? 0 : col + 1;

    if (
      countStarsInRow(currentBoard, row) > starCount ||
      countStarsInColumn(currentBoard, col) > starCount
    ) {
      return false;
    }

    // Actualizar el progreso y el tablero visible
    setProgress(
      Math.floor(((row * gridSize + col) / (gridSize * gridSize)) * 100),
    );
    setBoard([...currentBoard.map((row) => [...row])]);

    // Agregar un pequeño delay para poder ver la animación
    await new Promise((resolve) => setTimeout(resolve, 2));

    if (
      await new Promise((resolve) =>
        setTimeout(() => resolve(solve(currentBoard, nextRow, nextCol)), 0),
      )
    ) {
      return true;
    }

    if (isValidPosition(currentBoard, row, col)) {
      currentBoard[row][col] = true;
      // Actualizar el tablero visible cuando se coloca una estrella
      setBoard([...currentBoard.map((row) => [...row])]);

      // Agregar un pequeño delay para ver la colocación de la estrella
      await new Promise((resolve) => setTimeout(resolve, 2));

      if (
        await new Promise((resolve) =>
          setTimeout(() => resolve(solve(currentBoard, nextRow, nextCol)), 0),
        )
      ) {
        return true;
      }

      currentBoard[row][col] = false;
      // Actualizar el tablero visible cuando se quita una estrella
      setBoard([...currentBoard.map((row) => [...row])]);

      // Agregar un pequeño delay para ver la eliminación de la estrella
      await new Promise((resolve) => setTimeout(resolve, 2));
    }

    return false;
  };

  const handleSolve = async () => {
    setSolving(true);
    setProgress(0);

    try {
      if (isBoardValid(board)) {
        setProgress(100);
        alert("¡El tablero ya está resuelto correctamente!");
        setSolving(false);
        return;
      }

      const newBoard = board.map((row) => [...row]);
      const solved = await solve(newBoard);

      if (solved) {
        alert("¡Solución encontrada!");
      } else {
        alert("No se encontró solución para este puzzle");
      }
    } catch (error) {
      console.error("Error al resolver:", error);
      alert("Ocurrió un error al intentar resolver el puzzle");
    } finally {
      setSolving(false);
      setProgress(100);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (!solving) {
      const newBoard = board.map((r) => [...r]);
      if (board[row][col] || isValidPosition(newBoard, row, col)) {
        newBoard[row][col] = !newBoard[row][col];
        setBoard(newBoard);

        const totalStars = newBoard.flat().filter((cell) => cell).length;
        const expectedTotalStars = starCount * gridSize;
        if (totalStars === expectedTotalStars && isBoardValid(newBoard)) {
          setProgress(100);
          alert("¡Felicidades! Has resuelto el puzzle.");
          setSolving(false);
        } else {
          setProgress(Math.floor((totalStars / expectedTotalStars) * 100));
        }
      }
    }
  };

  const handleReset = () => {
    setBoard(
      Array(gridSize)
        .fill(null)
        .map(() => Array(gridSize).fill(false)),
    );
    setProgress(0);
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === "string") {
          console.log("Contenido del archivo:", text); // Para depuración
          try {
            const result = parseInput(text);
            console.log("Resultado de parseInput:", result); // Para depuración
            if (result) {
              setGridSize(result.size);
              setStarCount(determineStarCount(result.size));
              setRegions(result.regions);
              setBoard(
                Array(result.size)
                  .fill(null)
                  .map(() => Array(result.size).fill(false)),
              );
              setProgress(0);
              setError("");
            } else {
              setError("No se pudo procesar el archivo. Verifica el formato.");
            }
          } catch (error) {
            if (error instanceof Error) {
              setError(error.message);
            } else {
              setError("Error desconocido al procesar el archivo");
            }
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Star Battle Puzzle ({starCount}★)</CardTitle>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label>Tamaño del tablero y regiones</Label>
            <div className="flex gap-4">
              <Input
                type="number"
                min="5"
                max="14"
                value={gridSize}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value);
                  if (newValue >= 5 && newValue <= 14) {
                    handleSizeChange(newValue);
                  }
                }}
                className="w-24"
              />
              <Input
                type="file"
                accept=".txt"
                onChange={handleFileInput}
                className="flex-1"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <div className="flex gap-4">
            <Button onClick={handleSolve} disabled={solving}>
              {solving ? "Solving..." : "Solve"}
            </Button>
            <Button onClick={handleReset} variant="outline">
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="grid gap-0 p-4 bg-gray-200 relative"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            width: "fit-content",
          }}
        >
          <div className="absolute inset-0 border-2 border-black"></div>
          {board.map((row, i) =>
            row.map((cell, j) => (
              <div key={`${i}-${j}`} className="relative">
                <button
                  onClick={() => handleCellClick(i, j)}
                  className={`
                    w-12 h-12 flex items-center justify-center
                    bg-white transition-colors
                    ${cell ? "text-yellow-600 text-2xl font-bold" : ""}
                    hover:bg-gray-50
                  `}
                  disabled={solving}
                >
                  {cell && "★"}
                </button>
                {hasWall(i, j, "top") && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-black" />
                )}
                {hasWall(i, j, "right") && (
                  <div className="absolute top-0 right-0 bottom-0 w-0.5 bg-black" />
                )}
                {hasWall(i, j, "bottom") && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
                )}
                {hasWall(i, j, "left") && (
                  <div className="absolute top-0 left-0 bottom-0 w-0.5 bg-black" />
                )}
              </div>
            )),
          )}
        </div>
        {solving && (
          <div className="mt-4">
            <div className="h-2 w-full bg-gray-200 rounded">
              <div
                className="h-full bg-blue-600 rounded transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-center mt-1">
              Buscando solución... {progress}%
            </p>
          </div>
        )}
      </CardContent>
      <div className="p-4 bg-gray-100 border-t border-gray-300">
        <h2 className="text-lg font-semibold">Notas sobre la ejecución del programa</h2>
        <p>
          Este programa es un juego de rompecabezas llamado "Star Battle Puzzle". Actualmente se encuentra en fase beta, lo que significa que puede haber errores y características que aún están en desarrollo.
        </p>
        <h3 className="font-semibold">Instrucciones para ejecutar el programa:</h3>
        <ol className="list-decimal list-inside">
          <li>
            <strong>Tamaño de la cuadrícula:</strong> Al iniciar la aplicación, se te pedirá que ingreses el tamaño de la cuadrícula. Este tamaño debe estar entre 5 y 14. Puedes ingresar el tamaño manualmente en el campo de entrada correspondiente.
          </li>
          <li>
            <strong>Carga del archivo:</strong> Después de establecer el tamaño de la cuadrícula, puedes cargar un archivo de texto que contenga la configuración del rompecabezas. <strong>Importante:</strong> Asegúrate de que el archivo tenga el formato correcto. La primera línea debe contener el tamaño de la cuadrícula, seguido de las líneas que representan las regiones del rompecabezas. Si experimentas problemas al cargar el archivo, intenta primero establecer el tamaño de la cuadrícula y luego cargar el archivo. Esto puede ayudar a evitar errores en la carga de las regiones.
          </li>
          <li>
            <strong>Resolución del rompecabezas:</strong> Una vez que hayas configurado el tamaño y cargado el archivo, puedes hacer clic en el botón "Solve" para intentar resolver el rompecabezas. Si el rompecabezas ya está resuelto, recibirás una notificación.
          </li>
        </ol>
        <p>
          Si encuentras errores al cargar el archivo, verifica que el contenido del archivo sea válido y que no haya líneas en blanco o caracteres inesperados. Agradecemos tu comprensión mientras trabajamos en mejorar la estabilidad y funcionalidad del programa.
        </p>
        <p>¡Diviértete resolviendo el rompecabezas!</p>
      </div>
    </Card>
  );
};

export default Home;
