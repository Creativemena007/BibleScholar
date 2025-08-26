const axios = require('axios');

class BibleService {
  constructor() {
    this.baseURL = 'https://bible-api.com';
    this.cache = new Map();
  }

  async getVerse(reference) {
    if (this.cache.has(reference)) {
      return this.cache.get(reference);
    }

    try {
      const response = await axios.get(`${this.baseURL}/${encodeURIComponent(reference)}`);
      const verseData = {
        reference: response.data.reference,
        text: response.data.text.trim(),
        translation: response.data.translation_name || 'World English Bible',
        verses: response.data.verses || []
      };
      
      this.cache.set(reference, verseData);
      return verseData;
    } catch (error) {
      console.error(`Error fetching verse ${reference}:`, error.message);
      throw new Error(`Failed to fetch verse: ${reference}`);
    }
  }

  async getChapter(book, chapter) {
    const reference = `${book} ${chapter}`;
    return this.getVerse(reference);
  }

  async getAllBibleBooks() {
    return [
      // Old Testament
      'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
      '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah',
      'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
      'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah',
      'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
      
      // New Testament
      'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
      'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
      '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
      '1 John', '2 John', '3 John', 'Jude', 'Revelation'
    ];
  }

  async searchVerses(query, limit = 10) {
    // This is a basic text search - we'll enhance this with semantic search later
    try {
      const response = await axios.get(`${this.baseURL}/search/${encodeURIComponent(query)}`);
      return response.data.verses?.slice(0, limit) || [];
    } catch (error) {
      console.error(`Error searching verses with query "${query}":`, error.message);
      return [];
    }
  }

  // Method to get multiple random verses for embedding generation
  async getSampleVerses(count = 100) {
    const books = await this.getAllBibleBooks();
    const verses = [];
    
    for (let i = 0; i < count && i < books.length; i++) {
      try {
        // Get first chapter of each book as a sample
        const chapter = await this.getChapter(books[i], 1);
        if (chapter.verses && chapter.verses.length > 0) {
          verses.push(...chapter.verses.slice(0, 3)); // First 3 verses of each chapter
        }
      } catch (error) {
        console.error(`Error fetching sample verses from ${books[i]}:`, error.message);
      }
    }
    
    return verses;
  }
}

module.exports = new BibleService();