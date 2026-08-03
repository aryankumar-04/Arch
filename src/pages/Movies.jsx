import { useState, useEffect, useRef } from 'react';
import { useMovieStore } from '../store';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Skeleton from '../components/common/Skeleton';
import DuplicateErrorBanner from '../components/common/DuplicateErrorBanner';
import { SearchIcon, PlusIcon, TrashIcon, EditIcon } from '../components/common/Icons';
import { fetchMovieFromIMDb, searchMoviesFromIMDb } from '../utils/imdbFetcher';
import { useDebounce } from '../utils/useDebounce';

const Movies = () => {
  const { movies, loading, fetchMovies, addMovie, toggleStatus, updateMovie, deleteMovie } = useMovieStore();

  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'WATCHLIST' | 'WATCHED'
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [duplicateError, setDuplicateError] = useState(null);
  const [isFetchingImdb, setIsFetchingImdb] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLimit, setPageLimit] = useState(24);
  const modalBodyRef = useRef(null);

  useEffect(() => {
    if (duplicateError && modalBodyRef.current) {
      modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [duplicateError]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    year: '',
    genre: '',
    director: '',
    plot: '',
    imdbRating: '',
    userRating: 0,
    status: 'watchlist',
    poster: '',
    notes: ''
  });

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleOpenModal = () => {
    setEditingMovieId(null);
    setDuplicateError(null);
    setFormData({
      title: '',
      year: '',
      genre: '',
      director: '',
      plot: '',
      imdbRating: '',
      userRating: 0,
      status: 'watchlist',
      poster: '',
      notes: ''
    });
    setFetchError('');
    setSearchResults([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (movie) => {
    setEditingMovieId(movie.id);
    setDuplicateError(null);
    setFormData({
      title: movie.title || '',
      year: movie.year || '',
      genre: movie.genre || '',
      director: movie.director || '',
      plot: movie.plot || '',
      imdbRating: movie.imdbRating || '',
      userRating: movie.userRating || 0,
      status: movie.status || 'watchlist',
      poster: movie.poster || '',
      notes: movie.notes || ''
    });
    setFetchError('');
    setSearchResults([]);
    setIsModalOpen(true);
  };

  // Perform search / title lookup
  const handleFetchIMDb = async () => {
    if (!formData.title.trim()) {
      setFetchError('Please enter a movie title first.');
      return;
    }

    setIsFetchingImdb(true);
    setFetchError('');
    setSearchResults([]);

    try {
      // Fetch exact/best match
      const data = await fetchMovieFromIMDb(formData.title);

      if (data && data.title) {
        setFormData(prev => ({
          ...prev,
          title: data.title,
          year: data.year || prev.year,
          genre: data.genre || prev.genre,
          director: data.director || prev.director,
          plot: data.plot || prev.plot,
          imdbRating: data.imdbRating || prev.imdbRating,
          poster: data.poster || prev.poster
        }));
      }

      // Fetch candidates list to show alternative suggestions!
      const candidates = await searchMoviesFromIMDb(formData.title);
      if (candidates && candidates.length > 0) {
        setSearchResults(candidates);
      }
    } catch (err) {
      console.error(err);
      setFetchError('Could not fetch exact match. Searching closest candidates...');
      const candidates = await searchMoviesFromIMDb(formData.title);
      setSearchResults(candidates);
    } finally {
      setIsFetchingImdb(false);
    }
  };

  // FIX: Fetch exact candidate by candidate.imdbID or title!
  const handleSelectCandidate = async (candidate) => {
    setIsFetchingImdb(true);
    try {
      const fullData = await fetchMovieFromIMDb(candidate.title, candidate.imdbID);
      setFormData(prev => ({
        ...prev,
        title: fullData.title || candidate.title,
        year: fullData.year || candidate.year || prev.year,
        genre: fullData.genre || prev.genre,
        director: fullData.director || prev.director,
        plot: fullData.plot || prev.plot,
        imdbRating: fullData.imdbRating || prev.imdbRating,
        poster: fullData.poster || candidate.poster || prev.poster
      }));
      setSearchResults([]);
    } catch (err) {
      console.error('Error selecting candidate:', err);
    } finally {
      setIsFetchingImdb(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setDuplicateError(null);
    setIsSubmitting(true);

    try {
      let res;
      if (editingMovieId) {
        res = await updateMovie(editingMovieId, formData);
      } else {
        res = await addMovie(formData);
      }

      if (res && res.error === 'duplicate') {
        setDuplicateError({
          title: res.title || '⚠️ ALREADY IN YOUR LIST',
          message: res.message,
          _t: Date.now()
        });
        return;
      }

      setIsModalOpen(false);
      setEditingMovieId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const totalCount = movies.length;
  const watchlistCount = movies.filter(m => m.status === 'watchlist').length;
  const watchedCount = movies.filter(m => m.status === 'watched').length;

  // Filtered List (debounced)
  const filteredMovies = movies.filter(movie => {
    const matchesFilter =
      filter === 'ALL' ? true :
      filter === 'WATCHLIST' ? movie.status === 'watchlist' :
      filter === 'WATCHED' ? movie.status === 'watched' : true;

    const query = debouncedSearchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      movie.title.toLowerCase().includes(query) ||
      (movie.genre && movie.genre.toLowerCase().includes(query)) ||
      (movie.director && movie.director.toLowerCase().includes(query));

    return matchesFilter && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1>🎬 MOVIES</h1>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          <PlusIcon size={16} /> ADD MOVIE
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid-3 mb-24">
        <StatCard
          value={totalCount}
          label="TOTAL"
          bg="#FFFFFF"
          color="var(--text)"
        />
        <StatCard
          value={watchlistCount}
          label="WATCHLIST"
          bg="#FFFFFF"
          color="var(--text)"
        />
        <StatCard
          value={watchedCount}
          label="WATCHED"
          bg="#FFFFFF"
          color="var(--text)"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-between gap-16 mb-24" style={{ flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
          <div className="topbar-search" style={{ width: '100%', maxWidth: '320px' }}>
            <SearchIcon size={16} />
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'inline-flex', border: 'var(--bw) solid var(--border)', boxShadow: '3px 3px 0px var(--border)' }}>
          <button
            className={`btn ${filter === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 0, boxShadow: 'none', border: 'none', borderRight: 'var(--bw) solid var(--border)' }}
            onClick={() => setFilter('ALL')}
          >
            ALL
          </button>
          <button
            className={`btn ${filter === 'WATCHLIST' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 0, boxShadow: 'none', border: 'none', borderRight: 'var(--bw) solid var(--border)' }}
            onClick={() => setFilter('WATCHLIST')}
          >
            WATCHLIST
          </button>
          <button
            className={`btn ${filter === 'WATCHED' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 0, boxShadow: 'none', border: 'none' }}
            onClick={() => setFilter('WATCHED')}
          >
            WATCHED
          </button>
        </div>
      </div>

      {/* Movies Grid or Empty State */}
      {loading ? (
        <div className="dash-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Skeleton type="card" height="240px" />
              <Skeleton type="text" width="80%" height="20px" />
              <Skeleton type="text" width="40%" height="14px" />
            </div>
          ))}
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎬</div>
          <p>NO MOVIES FOUND</p>
        </div>
      ) : (
        <>
          <div className="dash-grid">
            {filteredMovies.slice(0, pageLimit).map(movie => (
            <div key={movie.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px' }}>
              {/* Poster Thumbnail */}
              <div
                style={{
                  width: '100%',
                  height: '240px',
                  background: '#0F0F0F',
                  border: 'var(--bw) solid var(--border)',
                  marginBottom: '14px',
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'grid',
                  placeItems: 'center'
                }}
              >
                {movie.poster ? (
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    loading="lazy"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '3rem' }}>🎬</div>
                )}
                {movie.imdbRating && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'var(--yellow)',
                      color: '#000',
                      fontWeight: 900,
                      fontSize: '0.8rem',
                      padding: '4px 8px',
                      border: 'var(--bw) solid var(--border)',
                      boxShadow: '2px 2px 0px var(--border)'
                    }}
                  >
                    ⭐ {movie.imdbRating}
                  </div>
                )}
              </div>

              {/* Title & Details */}
              <div style={{ flex: 1 }}>
                <div className="flex flex-between align-start mb-8">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.2 }}>
                    {movie.title}
                  </h3>
                  {movie.year && (
                    <span className="badge badge-purple" style={{ marginLeft: '8px', flexShrink: 0 }}>
                      {movie.year}
                    </span>
                  )}
                </div>

                {movie.genre && (
                  <div className="text-muted mb-8" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    🏷️ {movie.genre}
                  </div>
                )}

                {movie.director && (
                  <div className="text-muted mb-8" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    🎬 Dir: {movie.director}
                  </div>
                )}

                {movie.plot && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {movie.plot}
                  </p>
                )}

                {/* User Rating Stars */}
                <div className="mb-12 flex align-center gap-8">
                  <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>YOUR RATING:</span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => updateMovie(movie.id, { userRating: star })}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          color: star <= (movie.userRating || 0) ? '#FACC15' : '#D1D5DB'
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-between align-center mt-12" style={{ borderTop: 'var(--bw) solid var(--border)', paddingTop: '12px' }}>
                <div className="flex align-center gap-8">
                  <button
                    className={`btn btn-sm ${movie.status === 'watched' ? 'btn-yellow' : 'btn-ghost'}`}
                    onClick={() => toggleStatus(movie.id)}
                  >
                    {movie.status === 'watched' ? '✓ WATCHED' : '+ WATCHLIST'}
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleOpenEditModal(movie)}
                    title="Edit Movie"
                  >
                    <EditIcon size={16} />
                  </button>
                  <button
                    className="btn-icon"
                    style={{ color: 'var(--red)' }}
                    onClick={() => deleteMovie(movie.id)}
                    title="Delete Movie"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredMovies.length > pageLimit && (
          <div className="flex flex-center mt-24 mb-24">
            <Button
              variant="yellow"
              onClick={() => setPageLimit(prev => prev + 24)}
            >
              LOAD MORE MOVIES ({filteredMovies.length - pageLimit} REMAINING)
            </Button>
          </div>
        )}
        </>
      )}

      {/* Floating Add Button */}
      <button className="fab-btn" onClick={handleOpenModal} title="Add Movie">
        <PlusIcon size={24} />
      </button>

      {/* Add / Edit Movie Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMovieId(null);
          setDuplicateError(null);
        }}
        title={editingMovieId ? "✏️ EDIT MOVIE" : "➕ ADD NEW MOVIE"}
        bodyRef={modalBodyRef}
      >
        <form onSubmit={handleSubmit}>
          {duplicateError && (
            <DuplicateErrorBanner
              title={duplicateError.title}
              message={duplicateError.message}
              onClose={() => setDuplicateError(null)}
            />
          )}
          {/* Title & Fetch Button */}
          <div className="form-group">
            <label>MOVIE TITLE</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1 }}
                placeholder="e.g. Inception, Spider-Man, Interstellar..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <button
                type="button"
                className="btn btn-yellow"
                onClick={handleFetchIMDb}
                disabled={isFetchingImdb}
              >
                {isFetchingImdb ? 'SEARCHING...' : '⚡ SEARCH IMDB'}
              </button>
            </div>
            {fetchError && (
              <p style={{ color: 'var(--red)', fontSize: '0.75rem', fontWeight: 700, marginTop: '4px' }}>
                {fetchError}
              </p>
            )}
          </div>

          {/* Search Candidate Suggestions Cards */}
          {searchResults.length > 0 && (
            <div className="mb-16" style={{ background: 'var(--bg)', padding: '12px', border: 'var(--bw) solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>
                🔍 CLOSEST MATCHES (CLICK TO SELECT EXACT MOVIE):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {searchResults.map((cand, idx) => (
                  <div
                    key={cand.imdbID || idx}
                    onClick={() => handleSelectCandidate(cand)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      background: 'var(--bg2)',
                      border: 'var(--bw) solid var(--border)',
                      cursor: 'pointer',
                      boxShadow: '2px 2px 0px var(--border)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {cand.poster ? (
                      <img src={cand.poster} alt={cand.title} loading="lazy" decoding="async" style={{ width: '32px', height: '48px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                    ) : (
                      <span style={{ fontSize: '1.2rem' }}>🎬</span>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 900 }}>{cand.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text2)', fontWeight: 700 }}>{cand.year}</div>
                    </div>
                    <span className="btn btn-sm btn-yellow" style={{ fontSize: '0.7rem' }}>SELECT THIS</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>STATUS</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="watchlist">Watchlist</option>
                <option value="watched">Watched</option>
              </select>
            </div>

            <div className="form-group">
              <label>RELEASE YEAR</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 2010"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>IMDB RATING</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 8.8"
                value={formData.imdbRating}
                onChange={(e) => setFormData({ ...formData, imdbRating: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>GENRE</label>
              <input
                type="text"
                className="form-input"
                placeholder="Sci-Fi, Action, Thriller..."
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>POSTER IMAGE URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://..."
              value={formData.poster}
              onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
            />
          </div>

          {/* Poster Preview */}
          {formData.poster && (
            <div className="mb-16" style={{ textAlign: 'center' }}>
              <img
                src={formData.poster}
                alt="Poster preview"
                loading="lazy"
                decoding="async"
                style={{ height: '140px', borderRadius: '4px', border: 'var(--bw) solid var(--border)', boxShadow: '3px 3px 0px var(--border)' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}

          <div className="form-group">
            <label>DIRECTOR</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Christopher Nolan"
              value={formData.director}
              onChange={(e) => setFormData({ ...formData, director: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>PLOT / OVERVIEW</label>
            <textarea
              className="form-textarea"
              placeholder="Short plot summary..."
              value={formData.plot}
              onChange={(e) => setFormData({ ...formData, plot: e.target.value })}
            />
          </div>

          <div className="flex flex-between mt-24">
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
              CANCEL
            </button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              loadingText="SAVING..."
            >
              SAVE MOVIE
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Movies;
