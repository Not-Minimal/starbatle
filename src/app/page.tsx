"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PuzzleType = {
  [key: string]: {
    regions: number[][];
  };
};

const PUZZLES: PuzzleType = {
  "2932088": {
    regions: [
      [0, 0, 0, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 6, 6, 1, 3, 3, 3],
      [0, 0, 6, 6, 6, 1, 1, 3, 4],
      [6, 6, 6, 6, 6, 1, 1, 5, 4],
      [5, 5, 5, 6, 6, 6, 5, 5, 4],
      [5, 5, 5, 6, 6, 6, 5, 4, 4],
      [7, 5, 6, 6, 6, 4, 4, 4, 4],
      [7, 7, 7, 8, 8, 8, 4, 4, 4],
      [7, 7, 7, 7, 4, 4, 4, 4, 4]
    ]
  }
};

const Home = () => {
  const [selectedPuzzle, setSelectedPuzzle] = useState<keyof typeof PUZZLES>("2932088");
  const [board, setBoard] = useState<boolean[][]>(Array(9).fill(null).map(() => Array(9).fill(false)));
  const [solving, setSolving] = useState(false);
  const [starCount, setStarCount] = useState(2);
  const [progress, setProgress] = useState(0);

  const hasWall = (row: number, col: number, direction: string): boolean => {
    if (row === 0 && direction === 'top') return true;
    if (row === 8 && direction === 'bottom') return true;
    if (col === 0 && direction === 'left') return true;
    if (col === 8 && direction === 'right') return true;

    if (!PUZZLES[selectedPuzzle]) return false;
    const regions = PUZZLES[selectedPuzzle].regions;
    const currentRegion = regions[row][col];

    switch (direction) {
      case 'top':
        return row > 0 && regions[row - 1][col] !== currentRegion;
      case 'right':
        return col < 8 && regions[row][col + 1] !== currentRegion;
      case 'bottom':
        return row < 8 && regions[row + 1][col] !== currentRegion;
      case 'left':
        return col > 0 && regions[row][col - 1] !== currentRegion;
      default:
        return false;
    }
  };

  const countStarsInRow = (board: boolean[][], row: number): number => {
    return board[row].filter(cell => cell).length;
  };

  const countStarsInColumn = (board: boolean[][], col: number): number => {
    return board.map(row => row[col]).filter(cell => cell).length;
  };

  const countAdjacentStars = (board: boolean[][], row: number, col: number): number => {
    const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    let count = 0;
    for (const [dx, dy] of directions) {
      const newRow = row + dx;
      const newCol = col + dy;
      if (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
        if (board[newRow][newCol]) count++;
      }
    }
    return count;
  };

  const isValidPosition = (board: boolean[][], row: number, col: number): boolean => {
    if (board[row][col]) return true;

    if (countStarsInRow(board, row) >= starCount) return false;
    if (countStarsInColumn(board, col) >= starCount) return false;
    if (countAdjacentStars(board, row, col) > 0) return false;

    return true;
  };

  const checkRegion = (board: boolean[][], regions: number[][], regionId: number): boolean => {
    let count = 0;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (regions[i][j] === regionId && board[i][j]) {
          count++;
        }
      }
    }
    return count === starCount;
  };

  const isBoardValid = (board: boolean[][]): boolean => {
    const regions = PUZZLES[selectedPuzzle].regions;
    const regionCounts = new Array(9).fill(0);

    for (let i = 0; i < 9; i++) {
      let rowCount = 0;
      let colCount = 0;

      for (let j = 0; j < 9; j++) {
        if (board[i][j]) {
          rowCount++;
          regionCounts[regions[i][j]]++;
          if (countAdjacentStars(board, i, j) > 0) return false;
        }

        if (board[j][i]) colCount++;
      }

      if (rowCount !== starCount || colCount !== starCount) return false;
    }

    return regionCounts.every(count => count === starCount);
  };

  const solve = async (currentBoard: boolean[][], row = 0, col = 0): Promise<boolean> => {
    if (row >= 9) {
      return isBoardValid(currentBoard);
    }

    const nextRow = col === 8 ? row + 1 : row;
    const nextCol = col === 8 ? 0 : col + 1;

    if (countStarsInRow(currentBoard, row) > starCount ||
      countStarsInColumn(currentBoard, col) > starCount) {
      return false;
    }

    setProgress(Math.floor((row * 9 + col) / 81 * 100));

    if (await new Promise(resolve => setTimeout(() => resolve(solve(currentBoard, nextRow, nextCol)), 0))) {
      return true;
    }

    if (isValidPosition(currentBoard, row, col)) {
      currentBoard[row][col] = true;
      if (await new Promise(resolve => setTimeout(() => resolve(solve(currentBoard, nextRow, nextCol)), 0))) {
        return true;
      }
      currentBoard[row][col] = false;
    }

    return false;
  };

  const handleSolve = async () => {
    setSolving(true);
    setProgress(0);
    try {
      const newBoard = board.map(row => [...row]);

      // Verificar si el tablero actual ya es una solución válida
      if (isBoardValid(newBoard)) {
        setProgress(100);
        alert("¡El tablero ya está resuelto correctamente!");
        setSolving(false);
        return;
      }

      // Si no es una solución válida, intentar resolver
      const solved = await solve(newBoard);
      if (solved) {
        setBoard(newBoard);
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

  const handleCellClick = (row: number, col: number): void => {
    if (!solving) {
      const newBoard = board.map(r => [...r]);
      if (board[row][col] || isValidPosition(newBoard, row, col)) {
        newBoard[row][col] = !newBoard[row][col];
        setBoard(newBoard);

        // Verifica si el tablero actual es válido después de cada cambio
        if (isBoardValid(newBoard)) {
          setProgress(100);
          alert("¡Felicidades! Has resuelto el puzzle.");
          setSolving(false);
        }
      }
    }
  };

  const handleReset = () => {
    setBoard(Array(9).fill(null).map(() => Array(9).fill(false)));
    setProgress(0);
  };

  const handleStarCountChange = (value: string) => {
    setStarCount(parseInt(value));
    handleReset();
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Star Battle Puzzle ({starCount}★)</CardTitle>
        <div className="flex gap-4 flex-wrap">
          <Select
            value={selectedPuzzle.toString()}
            onValueChange={(value: string) => {
              setSelectedPuzzle(value as keyof typeof PUZZLES);
              handleReset();
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select puzzle" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(PUZZLES).map(id => (
                <SelectItem key={id} value={id}>Puzzle {id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={starCount.toString()} onValueChange={handleStarCountChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select star count" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Star</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSolve} disabled={solving}>
            {solving ? 'Solving...' : 'Solve'}
          </Button>
          <Button onClick={handleReset} variant="outline">
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-9 gap-0 p-4 bg-gray-200 relative">
          <div className="absolute inset-0 border-2 border-black"></div>
          {board.map((row, i) =>
            row.map((cell, j) => {
              const region = PUZZLES[selectedPuzzle].regions[i][j];
              return (
                <div
                  key={`${i}-${j}`}
                  className="relative"
                >
                  <button
                    onClick={() => handleCellClick(i, j)}
                    className={`
                      w-12 h-12 flex items-center justify-center
                      bg-white transition-colors
                      ${cell ? 'text-yellow-600 text-2xl font-bold' : ''}
                      hover:bg-gray-50
                    `}
                    disabled={solving}
                  >
                    {cell && '★'}
                  </button>
                  {hasWall(i, j, 'top') && <div className="absolute top-0 left-0 right-0 h-0.5 bg-black" />}
                  {hasWall(i, j, 'right') && <div className="absolute top-0 right-0 bottom-0 w-0.5 bg-black" />}
                  {hasWall(i, j, 'bottom') && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />}
                  {hasWall(i, j, 'left') && <div className="absolute top-0 left-0 bottom-0 w-0.5 bg-black" />}
                </div>
              );
            })
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
            <p className="text-sm text-center mt-1">Buscando solución... {progress}%</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Home;