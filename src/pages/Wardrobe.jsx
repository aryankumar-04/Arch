import { useState, useEffect } from 'react';
import { useWardrobeStore } from '../store';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import { SearchIcon, PlusIcon, TrashIcon } from '../components/common/Icons';
import { useDebounce } from '../utils/useDebounce';

const Wardrobe = () => {
  const {
    items, outfits, fetchWardrobe, addItem, deleteItem,
    incrementWear, toggleFavorite, addOutfit, wearOutfit, deleteOutfit
  } = useWardrobeStore();

  const [activeTab, setActiveTab] = useState('ITEMS'); // 'ITEMS' | 'OUTFITS'
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [seasonFilter, setSeasonFilter] = useState('All Seasons');

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isOutfitModalOpen, setIsOutfitModalOpen] = useState(false);

  // Form states
  const [itemForm, setItemForm] = useState({
    name: '',
    type: 'Tops',
    season: 'All Seasons',
    color: '#2563EB',
    imageUrl: '',
    isFavorite: false,
    wearCount: 0,
    notes: ''
  });

  const [outfitForm, setOutfitForm] = useState({
    name: '',
    occasion: 'Casual',
    season: 'All Seasons',
    topId: '',
    bottomId: '',
    shoesId: '',
    outerwearId: '',
    accessoryId: '',
    notes: ''
  });

  useEffect(() => {
    fetchWardrobe();
  }, [fetchWardrobe]);

  // Handle Item Submit
  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim()) return;

    await addItem(itemForm);
    setIsItemModalOpen(false);
    setItemForm({
      name: '',
      type: 'Tops',
      season: 'All Seasons',
      color: '#2563EB',
      imageUrl: '',
      isFavorite: false,
      wearCount: 0,
      notes: ''
    });
  };

  // Handle Outfit Submit
  const handleOutfitSubmit = async (e) => {
    e.preventDefault();
    if (!outfitForm.name.trim()) return;

    await addOutfit(outfitForm);
    setIsOutfitModalOpen(false);
    setOutfitForm({
      name: '',
      occasion: 'Casual',
      season: 'All Seasons',
      topId: '',
      bottomId: '',
      shoesId: '',
      outerwearId: '',
      accessoryId: '',
      notes: ''
    });
  };

  // Metrics
  const totalItems = items.length;
  const favoritesCount = items.filter(i => i.isFavorite).length;
  const outfitsCount = outfits.length;

  // Calculate Most Worn Item or Outfit
  const sortedItems = [...items].sort((a, b) => (b.wearCount || 0) - (a.wearCount || 0));
  const mostWorn = sortedItems.length > 0 && sortedItems[0].wearCount > 0
    ? `${sortedItems[0].name} (${sortedItems[0].wearCount}x)`
    : '—';

  // Filtered Items (debounced)
  const filteredItems = items.filter(item => {
    const matchesType = typeFilter === 'All Types' ? true : item.type === typeFilter;
    const matchesSeason = seasonFilter === 'All Seasons' ? true : item.season === seasonFilter || item.season === 'All Seasons';
    const query = debouncedSearchQuery.toLowerCase().trim();
    const matchesSearch = !query || item.name.toLowerCase().includes(query) || (item.notes && item.notes.toLowerCase().includes(query));

    return matchesType && matchesSeason && matchesSearch;
  });

  // Filtered Outfits (debounced)
  const filteredOutfits = outfits.filter(outfit => {
    const matchesSeason = seasonFilter === 'All Seasons' ? true : outfit.season === seasonFilter || outfit.season === 'All Seasons';
    const query = debouncedSearchQuery.toLowerCase().trim();
    const matchesSearch = !query || outfit.name.toLowerCase().includes(query) || outfit.occasion.toLowerCase().includes(query);

    return matchesSeason && matchesSearch;
  });


  const getItemCategoryEmoji = (type) => {
    switch (type) {
      case 'Tops': return '👕';
      case 'Bottoms': return '👖';
      case 'Shoes': return '👟';
      case 'Outerwear': return '🧥';
      case 'Accessories': return '🕶️';
      default: return '👔';
    }
  };

  return (
    <div>
      {/* Header matching screenshot */}
      <div className="page-header">
        <h1>👔 WARDROBE</h1>
        <div className="flex gap-12">
          <button className="btn btn-primary" onClick={() => setIsItemModalOpen(true)}>
            <PlusIcon size={16} /> ADD ITEM
          </button>
          <button className="btn btn-ghost" onClick={() => setIsOutfitModalOpen(true)}>
            <PlusIcon size={16} /> CREATE OUTFIT
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid-4 mb-24">
        <StatCard
          value={totalItems}
          label="TOTAL ITEMS"
          bg="#FFFFFF"
          color="var(--text)"
        />
        <StatCard
          value={favoritesCount}
          label="FAVORITES"
          bg="#FFFFFF"
          color="var(--text)"
        />
        <StatCard
          value={outfitsCount}
          label="OUTFITS"
          bg="#FFFFFF"
          color="var(--text)"
        />
        <StatCard
          value={mostWorn}
          label="MOST WORN"
          bg="#FFFFFF"
          color="var(--text)"
        />
      </div>

      {/* View Switcher Tabs (ITEMS vs OUTFITS) */}
      <div className="mb-16 flex gap-12">
        <button
          className={`btn ${activeTab === 'ITEMS' ? 'btn-yellow' : 'btn-ghost'}`}
          onClick={() => setActiveTab('ITEMS')}
        >
          ITEMS
        </button>
        <button
          className={`btn ${activeTab === 'OUTFITS' ? 'btn-yellow' : 'btn-ghost'}`}
          onClick={() => setActiveTab('OUTFITS')}
        >
          OUTFITS
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-16 mb-24" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="topbar-search" style={{ maxWidth: '240px' }}>
          <SearchIcon size={16} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {activeTab === 'ITEMS' && (
          <select
            className="form-select"
            style={{ width: 'auto', padding: '8px 32px 8px 12px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All Types">All Types</option>
            <option value="Tops">Tops</option>
            <option value="Bottoms">Bottoms</option>
            <option value="Shoes">Shoes</option>
            <option value="Outerwear">Outerwear</option>
            <option value="Accessories">Accessories</option>
          </select>
        )}

        <select
          className="form-select"
          style={{ width: 'auto', padding: '8px 32px 8px 12px' }}
          value={seasonFilter}
          onChange={(e) => setSeasonFilter(e.target.value)}
        >
          <option value="All Seasons">All Seasons</option>
          <option value="Spring">Spring</option>
          <option value="Summer">Summer</option>
          <option value="Fall">Fall</option>
          <option value="Winter">Winter</option>
        </select>
      </div>

      {/* Main Display: ITEMS Tab */}
      {activeTab === 'ITEMS' && (
        filteredItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👔</div>
            <p>NO CLOTHING ITEMS YET</p>
          </div>
        ) : (
          <div className="dash-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Image / Thumbnail Container */}
                <div
                  style={{
                    width: '100%',
                    height: '180px',
                    background: item.color ? `${item.color}15` : 'var(--bg4)',
                    border: 'var(--bw) solid var(--border)',
                    marginBottom: '14px',
                    position: 'relative',
                    display: 'grid',
                    placeItems: 'center',
                    overflow: 'hidden'
                  }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ fontSize: '3.5rem' }}>{getItemCategoryEmoji(item.type)}</div>
                  )}

                  {/* Favorite Heart Badge */}
                  <button
                    type="button"
                    onClick={() => toggleFavorite(item.id)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'var(--bg2)',
                      border: 'var(--bw) solid var(--border)',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      boxShadow: '2px 2px 0px var(--border)'
                    }}
                    title="Favorite"
                  >
                    {item.isFavorite ? '❤️' : '🤍'}
                  </button>

                  <span
                    className="badge badge-blue"
                    style={{ position: 'absolute', bottom: '8px', left: '8px' }}
                  >
                    {item.type}
                  </span>
                </div>

                {/* Item Details */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px' }}>
                    {item.name}
                  </h3>
                  <div className="flex flex-between align-center mb-8">
                    <span className="badge badge-yellow" style={{ fontSize: '0.7rem' }}>
                      🍂 {item.season}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                      Worn: <strong style={{ color: 'var(--accent)' }}>{item.wearCount || 0}x</strong>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-between align-center mt-12" style={{ borderTop: 'var(--bw) solid var(--border)', paddingTop: '12px' }}>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => incrementWear(item.id)}
                  >
                    +1 WEAR
                  </button>
                  <button
                    className="btn-icon"
                    style={{ color: 'var(--red)' }}
                    onClick={() => deleteItem(item.id)}
                    title="Delete item"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Main Display: OUTFITS Tab */}
      {activeTab === 'OUTFITS' && (
        filteredOutfits.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👔</div>
            <p>NO OUTFITS YET</p>
          </div>
        ) : (
          <div className="dash-grid">
            {filteredOutfits.map(outfit => {
              const top = items.find(i => i.id === outfit.topId);
              const bottom = items.find(i => i.id === outfit.bottomId);
              const shoes = items.find(i => i.id === outfit.shoesId);
              const outerwear = items.find(i => i.id === outfit.outerwearId);

              return (
                <div key={outfit.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="flex flex-between align-center mb-12" style={{ borderBottom: 'var(--bw) solid var(--border)', paddingBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase' }}>
                      {outfit.name}
                    </h3>
                    <span className="badge badge-purple">{outfit.occasion}</span>
                  </div>

                  {/* Combination items summary */}
                  <div className="mb-16" style={{ background: 'var(--bg)', padding: '12px', border: 'var(--bw) solid var(--border)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                      👕 Top: {top ? top.name : '—'}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                      👖 Bottom: {bottom ? bottom.name : '—'}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                      👟 Shoes: {shoes ? shoes.name : '—'}
                    </div>
                    {outerwear && (
                      <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                        🧥 Outerwear: {outerwear.name}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-between align-center mt-auto">
                    <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                      Worn: <strong style={{ color: 'var(--accent)' }}>{outfit.wearCount || 0}x</strong>
                    </span>
                    <div className="flex gap-8">
                      <button
                        className="btn btn-sm btn-yellow"
                        onClick={() => wearOutfit(outfit.id)}
                      >
                        WEAR TODAY
                      </button>
                      <button
                        className="btn-icon"
                        style={{ color: 'var(--red)' }}
                        onClick={() => deleteOutfit(outfit.id)}
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Floating Action Button */}
      <button
        className="fab-btn"
        onClick={() => activeTab === 'ITEMS' ? setIsItemModalOpen(true) : setIsOutfitModalOpen(true)}
        title={activeTab === 'ITEMS' ? 'Add Item' : 'Create Outfit'}
      >
        <PlusIcon size={24} />
      </button>

      {/* Add Item Modal */}
      <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title="➕ ADD CLOTHING ITEM">
        <form onSubmit={handleItemSubmit}>
          <div className="form-group">
            <label>ITEM NAME</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Black Denim Jacket, White Oxford Shirt..."
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>CATEGORY / TYPE</label>
              <select
                className="form-select"
                value={itemForm.type}
                onChange={(e) => setItemForm({ ...itemForm, type: e.target.value })}
              >
                <option value="Tops">Tops</option>
                <option value="Bottoms">Bottoms</option>
                <option value="Shoes">Shoes</option>
                <option value="Outerwear">Outerwear</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <div className="form-group">
              <label>SEASON</label>
              <select
                className="form-select"
                value={itemForm.season}
                onChange={(e) => setItemForm({ ...itemForm, season: e.target.value })}
              >
                <option value="All Seasons">All Seasons</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
                <option value="Fall">Fall</option>
                <option value="Winter">Winter</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>IMAGE URL (OPTIONAL)</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://..."
              value={itemForm.imageUrl}
              onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={itemForm.isFavorite}
                onChange={(e) => setItemForm({ ...itemForm, isFavorite: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>MARK AS FAVORITE ❤️</span>
            </label>
          </div>

          <div className="flex flex-between mt-24">
            <button type="button" className="btn btn-ghost" onClick={() => setIsItemModalOpen(false)}>
              CANCEL
            </button>
            <button type="submit" className="btn btn-primary">
              SAVE ITEM
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Outfit Modal */}
      <Modal isOpen={isOutfitModalOpen} onClose={() => setIsOutfitModalOpen(false)} title="👔 CREATE OUTFIT COMBINATION">
        <form onSubmit={handleOutfitSubmit}>
          <div className="form-group">
            <label>OUTFIT NAME</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Summer Beach Party, Office Casual..."
              value={outfitForm.name}
              onChange={(e) => setOutfitForm({ ...outfitForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>OCCASION</label>
              <select
                className="form-select"
                value={outfitForm.occasion}
                onChange={(e) => setOutfitForm({ ...outfitForm, occasion: e.target.value })}
              >
                <option value="Casual">Casual</option>
                <option value="Formal">Formal</option>
                <option value="Work / College">Work / College</option>
                <option value="Gym / Sports">Gym / Sports</option>
                <option value="Date Night">Date Night</option>
                <option value="Party">Party</option>
              </select>
            </div>

            <div className="form-group">
              <label>SEASON</label>
              <select
                className="form-select"
                value={outfitForm.season}
                onChange={(e) => setOutfitForm({ ...outfitForm, season: e.target.value })}
              >
                <option value="All Seasons">All Seasons</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
                <option value="Fall">Fall</option>
                <option value="Winter">Winter</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>SELECT TOP</label>
            <select
              className="form-select"
              value={outfitForm.topId}
              onChange={(e) => setOutfitForm({ ...outfitForm, topId: e.target.value })}
            >
              <option value="">-- Choose Top --</option>
              {items.filter(i => i.type === 'Tops').map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>SELECT BOTTOM</label>
            <select
              className="form-select"
              value={outfitForm.bottomId}
              onChange={(e) => setOutfitForm({ ...outfitForm, bottomId: e.target.value })}
            >
              <option value="">-- Choose Bottom --</option>
              {items.filter(i => i.type === 'Bottoms').map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>SELECT SHOES</label>
            <select
              className="form-select"
              value={outfitForm.shoesId}
              onChange={(e) => setOutfitForm({ ...outfitForm, shoesId: e.target.value })}
            >
              <option value="">-- Choose Shoes --</option>
              {items.filter(i => i.type === 'Shoes').map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>SELECT OUTERWEAR (OPTIONAL)</label>
            <select
              className="form-select"
              value={outfitForm.outerwearId}
              onChange={(e) => setOutfitForm({ ...outfitForm, outerwearId: e.target.value })}
            >
              <option value="">-- None --</option>
              {items.filter(i => i.type === 'Outerwear').map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-between mt-24">
            <button type="button" className="btn btn-ghost" onClick={() => setIsOutfitModalOpen(false)}>
              CANCEL
            </button>
            <button type="submit" className="btn btn-primary">
              SAVE OUTFIT
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Wardrobe;
