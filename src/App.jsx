import React, { useEffect, useState } from "react";
import ePub from "epubjs";
import './App.css';

export default function EpubReader() {
  const [chapters, setChapters] = useState([]);
  const [translatedChapters, setTranslatedChapters] = useState([]);
  const [chapterTitles, setChapterTitles] = useState([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

  useEffect(() => {
    async function loadBook() {
      const book = ePub("https://book-cradle.s3.eu-north-1.amazonaws.com/e2.epub");
      const translatedBook = ePub("https://book-cradle.s3.eu-north-1.amazonaws.com/r2.epub");

      await book.ready;
      await translatedBook.ready;

      const spineItems = book.spine?.items;
      const translatedSpineItems = translatedBook.spine?.items;

      if (!spineItems || !translatedSpineItems) {
        console.error("No chapters found");
        return;
      }

      const englishStart = 2;
      const russianStart = 4;

      const maxLength = Math.min(
        spineItems.length - englishStart,
        translatedSpineItems.length - russianStart
      );

      const allChapters = [];
      const allTranslatedChapters = [];
      const chapterTitlesTemp = [];

      for (let i = englishStart; i < englishStart + maxLength; i++) {
        try {
          const item = spineItems[i];
          const chapterDoc = await book.load(item.href);
          const englishDiv = document.createElement("div");
          englishDiv.appendChild(chapterDoc.documentElement.cloneNode(true));
          const englishParagraphs = Array.from(englishDiv.querySelectorAll("p"))
            .map(p => p.textContent?.trim())
            .filter(Boolean);

          allChapters.push(englishParagraphs);
          chapterTitlesTemp.push(item?.title || `Chapter ${allChapters.length}`);
        } catch (err) {
          console.error(`Failed to load English chapter at index ${i}`, err);
        }
      }

      for (let i = russianStart; i < russianStart + maxLength; i++) {
        try {
          const translatedItem = translatedSpineItems[i];
          const translatedDoc = await translatedBook.load(translatedItem.href);
          const translatedDiv = document.createElement("div");
          translatedDiv.appendChild(translatedDoc.documentElement.cloneNode(true));
          const translatedParagraphs = Array.from(translatedDiv.querySelectorAll("p"))
            .map(p => p.textContent?.trim())
            .filter(Boolean);

          allTranslatedChapters.push(translatedParagraphs);
        } catch (err) {
          console.error(`Failed to load Russian chapter at index ${i}`, err);
        }
      }

      setChapters(allChapters);
      setTranslatedChapters(allTranslatedChapters);
      setChapterTitles(chapterTitlesTemp);
      setCurrentChapterIndex(0);
    }

    loadBook();
  }, []);

  const currentParagraphs = chapters[currentChapterIndex] || [];
  const currentTranslatedParagraphs = translatedChapters[currentChapterIndex] || [];

  const mergedParagraphs = [];
  const maxLength = Math.max(currentParagraphs.length, currentTranslatedParagraphs.length);
  for (let i = 0; i < maxLength; i++) {
    if (currentParagraphs[i]) {
      mergedParagraphs.push(
        <div key={`en-${i}`} style={{ marginBottom: "12px" }}>
          {currentParagraphs[i]}
        </div>
      );
    }
    if (currentTranslatedParagraphs[i]) {
      mergedParagraphs.push(
        <div key={`ru-${i}`} style={{ marginBottom: "24px", color: "#999999" }}>
          {currentTranslatedParagraphs[i]}
        </div>
      );
    }
  }

  return (
    <div className="Main">
      <div className="Sidebar">
        <h3>Chapters</h3>
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {chapterTitles.map((title, index) => (
            <li key={index} style={{ marginBottom: "0.5rem" }}>
              <button
                style={{
                  background: index === currentChapterIndex ? "#ddd" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  fontWeight: index === currentChapterIndex ? "bold" : "normal"
                }}
                onClick={() => {
                  setCurrentChapterIndex(index);
                  window.scrollTo({ top: 0 });
                }}
              >
                {title}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="All">
        <div className="All-Chapter">
          {mergedParagraphs}

          <div className="Navigation" style={{ marginTop: "2rem" }}>
            {currentChapterIndex > 0 && (
              <button
                onClick={() => {
                  setCurrentChapterIndex(i => i - 1);
                  window.scrollTo({ top: 0 });
                }}
              >
                ← Back
              </button>
            )}
            {currentChapterIndex < chapters.length - 1 && (
              <button
                onClick={() => {
                  setCurrentChapterIndex(i => i + 1);
                  window.scrollTo({ top: 0 });
                }}
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
