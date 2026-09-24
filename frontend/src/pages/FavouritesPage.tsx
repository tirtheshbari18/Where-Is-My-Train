import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Train, MapPin, Trash2, ArrowRight } from 'lucide-react';
import { storage, FavouriteItem } from '../utils/storage.js';

export const FavouritesPage: React.FC = () => {
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);

  useEffect(() => {
    setFavourites(storage.getFavourites());
  }, []);

  const handleRemove = (item: FavouriteItem) => {
    storage.removeFavourite(item.type, item.codeOrNumber);
    setFavourites(storage.getFavourites());
  };

  const trainFavs = favourites.filter((f) => f.type === 'TRAIN');
  const stationFavs = favourites.filter((f) => f.type === 'STATION');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <Heart className="w-7 h-7 text-red-500 fill-red-500" />
          <span>Saved Favourites</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Your bookmarked Indian Railways trains and stations for quick one-tap tracking.
        </p>
      </div>

      {/* Favourite Trains Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Train className="w-5 h-5 text-amber-400" />
          <span>Favourite Trains ({trainFavs.length})</span>
        </h2>

        {trainFavs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trainFavs.map((fav) => (
              <div
                key={fav.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-amber-400 text-base">
                      {fav.codeOrNumber}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                      Running Right Time
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">{fav.title}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">{fav.subtitle}</div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/train/${fav.codeOrNumber}?tab=live`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
                  >
                    <span>Track Live</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleRemove(fav)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-900 transition"
                    title="Remove Favourite"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
            No favourite trains saved yet. Click the heart icon on any train card to add it here.
          </div>
        )}
      </section>

      {/* Favourite Stations Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-400" />
          <span>Favourite Stations ({stationFavs.length})</span>
        </h2>

        {stationFavs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stationFavs.map((fav) => (
              <div
                key={fav.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 group"
              >
                <div>
                  <div className="font-mono font-extrabold text-blue-400 text-base">
                    {fav.codeOrNumber}
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">{fav.title}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">{fav.subtitle}</div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/station/${fav.codeOrNumber}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
                  >
                    <span>Station Board</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleRemove(fav)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-900 transition"
                    title="Remove Favourite"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
            No favourite stations saved yet. Click the heart icon on any station to pin it.
          </div>
        )}
      </section>
    </div>
  );
};
