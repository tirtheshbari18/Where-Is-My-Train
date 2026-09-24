import React from 'react';
import { Link } from 'react-router-dom';
import { Train, Shield, ExternalLink, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 mt-16 pb-20 lg:pb-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                <Train className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">
                WHERE IS MY TRAIN
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Independent, modern Indian Railway train information and live tracking platform. Built for Indian travelers with clean architecture and transparent data sourcing.
            </p>
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Gateway Engine Operational</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Quick Tracking</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/train/20901" className="hover:text-amber-400 transition">
                  Vande Bharat Express (20901)
                </Link>
              </li>
              <li>
                <Link to="/train/12951" className="hover:text-amber-400 transition">
                  Mumbai Rajdhani (12951)
                </Link>
              </li>
              <li>
                <Link to="/train/22436" className="hover:text-amber-400 transition">
                  NDLS-BSB Vande Bharat (22436)
                </Link>
              </li>
              <li>
                <Link to="/live" className="hover:text-amber-400 transition">
                  Live Running Status
                </Link>
              </li>
              <li>
                <Link to="/live-station" className="hover:text-amber-400 transition">
                  Station Live Boards
                </Link>
              </li>
            </ul>
          </div>

          {/* Railway Information */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Services</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/trains-between" className="hover:text-amber-400 transition">
                  Trains Between Stations
                </Link>
              </li>
              <li>
                <Link to="/pnr" className="hover:text-amber-400 transition">
                  PNR Status Gateway
                </Link>
              </li>
              <li>
                <Link to="/alerts" className="hover:text-amber-400 transition">
                  Cancelled & Diverted Trains
                </Link>
              </li>
              <li>
                <Link to="/favourites" className="hover:text-amber-400 transition">
                  Saved Favourites
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-amber-400 transition flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Provider Admin</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Data Transparency & Disclaimer */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm mb-2">Transparency & Ethics</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              This application operates strictly via legitimate Railway Data Providers, official NTES/CRIS feeds, and open data gateways. No proprietary APIs or assets from Google Where Is My Train or m-Indicator are copied.
            </p>
            <div className="pt-2">
              <a
                href="https://www.indianrail.gov.in"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-slate-300 hover:text-amber-400 transition text-[11px]"
              >
                <span>Official Indian Railways Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© 2026 Where Is My Train. Original Indian Railway tracking platform.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Built with precision for travelers</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>across India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
