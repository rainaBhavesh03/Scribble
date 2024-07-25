import { connect } from "@/dbConfig/dbConfig";
import RoomModel from "@/models/Room";
import WordModel from "@/models/Word";
import { NextRequest, NextResponse } from 'next/server';

connect();


function getProgressiveHints(word: string, hints: number = word.length): string[] {
  const hintsArray: string[] = [];
  const charArray: string[] = word.split(""); // Split word into character array

  let revealedChars = new Set<string>(); // Set to store revealed characters

    let allBlanks = "";
  for (let i = 0; i < word.length; i++) {
      allBlanks += "_";
  }
  hintsArray.push(allBlanks);

  for (let i = 0; i < Math.min(hints, word.length); i++) {
    let revealedChar: string;

    // Ensure a random unrevealed character is chosen
    do {
      revealedChar = charArray[Math.floor(Math.random() * charArray.length)];
    } while (revealedChars.has(revealedChar));

    revealedChars.add(revealedChar); // Add revealed character to the set

    let revealedWord = "";
    for (const char of word) {
      revealedWord += revealedChars.has(char) ? char : "_";
    }

    hintsArray.push(revealedWord);
  }

    hintsArray.push(word);

  return hintsArray;
}


export async function POST(request: NextRequest) {
    try {
        const { roomId } = await request.json();
        const room = await RoomModel.findById(roomId);
        const hints = room!.hints;

        // Count total number of documents in the collection
        const count = await WordModel.countDocuments();
        
        // Generate 3 random indices
        const randomIndexes = Array.from({ length: 3 }, () => Math.floor(Math.random() * count));
        
        const randomWords = await WordModel.aggregate([
            { $match: {} }, // Match all documents
            { $skip: randomIndexes[0] }, // Skip first random index
            { $limit: 3 } // Limit to 3 documents
        ]);

        const finalWordsList = randomWords.map((data) => getProgressiveHints(data.word, hints));

        return NextResponse.json({
            choice: finalWordsList,
            success: true
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message, success: false }, { status: 500 });
    }
}


