import { GameScore } from "@/types";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

const LOCAL_STORE_KEY = `404-meterverse-game-score`;
const scoresCollection = collection(db, "scores");

const isOnline = () => navigator.onLine;

const saveToLocalStorage = async (score: GameScore) => {
  try {
    console.info("[Scoring] Saving to localStorage:", score);
    // Get existing score from localStorage
    const existingData = localStorage.getItem(LOCAL_STORE_KEY);
    let currentScore: GameScore;
    
    if (existingData) {
      currentScore = JSON.parse(existingData);
      // Accumulate the score
      currentScore.score += score.score;
    } else {
      currentScore = score;
    }
    
    localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(currentScore));
    return true;
  } catch (error) {
    console.error("[Scoring] Error saving to localStorage:", error);
    return false;
  }
};

const syncScore = async () => {
  if (!isOnline()) return;

  try {
    const offlineScore = JSON.parse(
      localStorage.getItem(LOCAL_STORE_KEY) || "null"
    ) as GameScore | null;

    if (offlineScore) {
      await saveToFirebase(offlineScore);
    }

    localStorage.removeItem(LOCAL_STORE_KEY);
  } catch (error) {
    console.error("[Scoring] Error syncing score to Firebase:", error);
  }
};

const saveToFirebase = async (score: GameScore) => {
  try {
    const userDocRef = doc(scoresCollection, score.userId);
    
    const existingDoc = await getDocs(
      query(scoresCollection, where("userId", "==", score.userId), limit(1))
    );
    
    const currentScore = existingDoc.docs[0]?.data()?.score || 0;
    const newScore = currentScore + score.score;
    
    await setDoc(userDocRef, {
      ...score,
      score: newScore
    });
    
    console.log(
      "[Firebase] Score accumulated successfully for user:",
      score.userId,
      "Previous total:",
      currentScore,
      "Increment:",
      score.score,
      "New total:",
      newScore
    );
    return true;
  } catch (error) {
    console.error("[Firebase] Error accumulating score:", error);
    throw error;
  }
};


export const saveScore = async (score: GameScore) => {
  try {
    if (isOnline()) {
      return await saveToFirebase(score);
    } else {
      console.info("[Scoring] Saving to localStorage:", score);
      await saveToLocalStorage(score);
      return true;
    }
  } catch (error) {
    console.error("[Scoring] Error saving score:", error);
    return false;
  }
};

export const getTopScores = async (
  maxResults: number = 10
): Promise<GameScore[]> => {
  try {
    const scoresQuery = query(
      scoresCollection,
      orderBy("score", "desc"),
      limit(maxResults)
    );
    const snapshot = await getDocs(scoresQuery);
    return snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
        } as GameScore)
    );
  } catch (error) {
    console.error("[Scoring] Error fetching top scores:", error);
    return [];
  }
};

export const getUserScores = async (userId: string) => {
  try {
    const q = query(
      scoresCollection,
      where("userId", "==", userId),
      orderBy("score", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("[Scoring] Error fetching user scores:", error);
    return [];
  }
};

if (typeof window !== "undefined") {
  window.addEventListener("online", syncScore);
  window.addEventListener("load", syncScore);
}
