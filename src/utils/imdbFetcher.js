/**
 * Helper utility to fetch movie details & search closest matches
 * from public movie metadata APIs (OMDb with fallback keys & iTunes API).
 */

const OMDB_KEYS = ['trilogy', 'b78e24c2', '33857ca2', 'b8449c2d', '9f7c03dd', '450702d7', '76722d3b'];

/**
 * Fetches exact movie metadata.
 * Accepts title string OR object/string containing imdbID (e.g., 'tt1877830').
 */
export async function fetchMovieFromIMDb(titleOrQuery, imdbID = null) {
  if (!titleOrQuery && !imdbID) {
    throw new Error('Please enter a movie title.');
  }

  const isImdbId = imdbID || (typeof titleOrQuery === 'string' && /^tt\d+$/i.test(titleOrQuery.trim()));
  const targetId = imdbID || (isImdbId ? titleOrQuery.trim() : null);
  const cleanTitle = titleOrQuery ? titleOrQuery.trim().replace(/[,;:]+/g, ' ') : '';

  // Strategy 1: Try OMDb API keys
  for (const key of OMDB_KEYS) {
    try {
      const url = targetId
        ? `https://www.omdbapi.com/?i=${targetId}&plot=short&apikey=${key}`
        : `https://www.omdbapi.com/?t=${encodeURIComponent(cleanTitle)}&plot=short&apikey=${key}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data && data.Response === 'True') {
        const posterUrl = data.Poster && data.Poster !== 'N/A' ? data.Poster : null;
        return {
          title: data.Title || cleanTitle,
          year: data.Year || '',
          genre: data.Genre || '',
          director: data.Director || '',
          plot: data.Plot && data.Plot !== 'N/A' ? data.Plot : '',
          imdbRating: data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : '7.5',
          poster: posterUrl,
          imdbID: data.imdbID || targetId || null,
          source: 'omdb'
        };
      }
    } catch (err) {
      console.warn(`OMDb key ${key} request failed:`, err);
    }
  }

  // Strategy 2: iTunes Search API Fallback
  try {
    const iTunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanTitle)}&entity=movie&limit=1`);
    const iTunesData = await iTunesRes.json();

    if (iTunesData && iTunesData.results && iTunesData.results.length > 0) {
      const item = iTunesData.results[0];
      const poster = item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : null;
      const year = item.releaseDate ? item.releaseDate.substring(0, 4) : '';

      return {
        title: item.trackName || cleanTitle,
        year: year,
        genre: item.primaryGenreName || '',
        director: item.artistName || '',
        plot: item.longDescription || item.shortDescription || '',
        imdbRating: '7.8',
        poster: poster,
        imdbID: item.trackId ? String(item.trackId) : null,
        source: 'itunes'
      };
    }
  } catch (err) {
    console.warn('iTunes API fallback failed:', err);
  }

  // Strategy 3: Default fallback
  return {
    title: cleanTitle || 'Untitled Movie',
    year: new Date().getFullYear().toString(),
    genre: 'Feature Film',
    director: 'N/A',
    plot: 'No plot summary available.',
    imdbRating: '7.0',
    poster: `https://placehold.co/400x600/101010/FACC15?text=${encodeURIComponent(cleanTitle)}`,
    imdbID: targetId,
    source: 'fallback'
  };
}

/**
 * Searches for closest matching movies when exact title lookup fails or user requests suggestions.
 */
export async function searchMoviesFromIMDb(query) {
  if (!query || !query.trim()) return [];

  const sanitizedQuery = query.trim().replace(/[,;:]+/g, ' ');
  let results = [];

  // Try OMDb search endpoint
  for (const key of OMDB_KEYS) {
    try {
      const response = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(sanitizedQuery)}&type=movie&apikey=${key}`);
      const data = await response.json();

      if (data && data.Response === 'True' && Array.isArray(data.Search)) {
        results = data.Search.map(item => ({
          title: item.Title,
          year: item.Year,
          imdbID: item.imdbID,
          poster: item.Poster && item.Poster !== 'N/A' ? item.Poster : null
        }));
        if (results.length > 0) return results;
      }
    } catch (err) {
      console.warn('OMDb search error:', err);
    }
  }

  // Fallback to iTunes search API for candidates
  try {
    const iTunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(sanitizedQuery)}&entity=movie&limit=6`);
    const iTunesData = await iTunesRes.json();

    if (iTunesData && iTunesData.results) {
      results = iTunesData.results.map(item => ({
        title: item.trackName,
        year: item.releaseDate ? item.releaseDate.substring(0, 4) : '',
        imdbID: item.trackId ? String(item.trackId) : null,
        poster: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '400x400bb') : null
      }));
    }
  } catch (err) {
    console.warn('iTunes search fallback error:', err);
  }

  return results;
}
